/*!
 * lib/bitcoin/hd-accounts-helper.js
 * Copyright © 2019 – Katana Cryptographic Ltd. All Rights Reserved.
 */
'use strict'

const LRU = require('lru-cache')
const workerPool = require('workerpool')
const bitcoin = require('bitcoinjs-lib')
const bs58check = require('bs58check')
const bs58 = require('bs58')
const errors = require('../errors')
const Logger = require('../logger')
const network = require('./network')
const activeNet = network.network
const keys = require('../../keys/')[network.key]
const addrHelper = require('./addresses-helper')

const MAX_SAFE_INT_32 = Math.pow(2, 31) - 1;

/**
 * A singleton providing HD Accounts helper functions
 */
class HDAccountsHelper {

  /**
   * Constructor
   */
  constructor() {
    // HD accounts types
    this.BIP44  = 0
    this.BIP49  = 1
    this.BIP84  = 2
    this.LOCKED = 1<<7

    // known HD accounts
    this.RICOCHET_ACCT = MAX_SAFE_INT_32;
    this.POSTMIX_ACCT = MAX_SAFE_INT_32 - 1;
    this.PREMIX_ACCT = MAX_SAFE_INT_32 - 2;
    this.BADBANK_ACCT = MAX_SAFE_INT_32 - 3;

    // Magic numbers
    this.MAGIC_XPUB = 0x0488b21e
    this.MAGIC_TPUB = 0x043587cf
    this.MAGIC_YPUB = 0x049d7cb2
    this.MAGIC_UPUB = 0x044a5262
    this.MAGIC_ZPUB = 0x04b24746
    this.MAGIC_VPUB = 0x045f1cf6

    // HD accounts cache
    this.nodes = new LRU({
      // Maximum number of nodes to store in cache
      max: 1000,
      // Function used to compute length of item
      length: (n, key) => 1,
      // Maximum age for items in the cache. Items do not expire
      maxAge: Infinity
    })

    // Default = external addresses derivation deactivated
    this.externalDerivationActivated = false
    this.derivationPool = null
  }

  /**
   * Activate external derivation of addresses
   * (provides improved performances)
   */
  activateExternalDerivation() {
    // Pool of child processes used for derivation of addresses
    const poolKeys = keys.addrDerivationPool

    this.derivationPool = workerPool.pool(
      `${__dirname}/parallel-address-derivation.js`,
      {
        maxWorkers: poolKeys.maxNbChildren,
        minWorkers: poolKeys.minNbChildren,
        workerType: 'thread'
      }
    )
    this.externalDerivationActivated = true
    Logger.info(`Created ${poolKeys.minNbChildren} worker threads for addresses derivation (max = ${poolKeys.maxNbChildren})`)
  }

  /**
   * Check if a string encodes a xpub/tpub
   * @param {string} xpub - extended public key to be checked
   * @returns {boolean} returns true if xpub encodes a xpub/tpub, false otherwise
   */
  isXpub(xpub) {
    return (xpub.indexOf('xpub') === 0) || (xpub.indexOf('tpub') === 0)
  }

  /**
   * Check if a string encodes a ypub/upub
   * @param {string} xpub - extended public key to be checked
   * @returns {boolean} returns true if xpub encodes a ypub/upub, false otherwise
   */
  isYpub(xpub) {
    return (xpub.indexOf('ypub') === 0) || (xpub.indexOf('upub') === 0)
  }

  /**
   * Check if a string encodes a zpub/vpub
   * @param {string} xpub - extended public key to be checked
   * @returns {boolean} returns true if xpub encodes a zpub/vpub, false otherwise
   */
  isZpub(xpub) {
    return (xpub.indexOf('zpub') === 0) || (xpub.indexOf('vpub') === 0)
  }

  /**
   * Translates
   *  - a xpub/ypub/zpub into a xpub
   *  - a tpub/upub/vpub into a tpub
   * @param {string} xpub - extended public key to be translated
   * @returns {boolean} returns the translated extended public key
   */
  xlatXPUB(xpub) {
    const decoded = bs58check.decode(xpub)
    const ver = decoded.readInt32BE()

    if (
      ver !== this.MAGIC_XPUB
      && ver !== this.MAGIC_TPUB
      && ver !== this.MAGIC_YPUB
      && ver !== this.MAGIC_UPUB
      && ver !== this.MAGIC_ZPUB
      && ver !== this.MAGIC_VPUB
    ) {
      Logger.error(null, 'HdAccountsHelper : xlatXPUB() : Incorrect format')
      throw errors.xpub.INVALID
    }

    let xlatVer = 0
    switch(ver) {
      case this.MAGIC_XPUB:
         return xpub
      break
      case this.MAGIC_YPUB:
         xlatVer = this.MAGIC_XPUB
      break
      case this.MAGIC_ZPUB:
         xlatVer = this.MAGIC_XPUB
      break
      case this.MAGIC_TPUB:
         return xpub
      break
      case this.MAGIC_UPUB:
         xlatVer = this.MAGIC_TPUB
      break
      case this.MAGIC_VPUB:
         xlatVer = this.MAGIC_TPUB
      break
    }

    let b = Buffer.alloc(4)
    b.writeInt32BE(xlatVer)

    decoded.writeInt32BE(xlatVer, 0)

    const checksum = bitcoin.crypto.hash256(decoded).slice(0, 4)
    const xlatXpub = Buffer.alloc(decoded.length + checksum.length)

    decoded.copy(xlatXpub, 0, 0, decoded.length)

    checksum.copy(xlatXpub, xlatXpub.length - 4, 0, checksum.length)

    const encoded = bs58.encode(xlatXpub)
    return encoded
  }

  /**
   * Classify the hd account type retrieved from db
   * @param {number} v - HD Account type (db encoding)
   * @returns {object} object storing the type and lock status of the hd account
   */
  classify(v) {
    const ret = {
      type: null,
      locked: false,
    }

    let p = v

    if (p >= this.LOCKED) {
      ret.locked = true
      p -= this.LOCKED
    }

    switch (p) {
      case this.BIP44:
      case this.BIP49:
      case this.BIP84:
        ret.type = p
        break
    }

    return ret
  }

  /**
   * Encode hd account type and lock status in db format
   * @param {number} type - HD Account type (db encoding)
   * @param {boolean} locked - lock status of the hd account
   * @returns {number}
   */
  makeType(type, locked) {
    let p =
      (type >= this.LOCKED)
      ? type - this.LOCKED
      : type

    locked = !!locked

    if (locked)
      p += this.LOCKED

    return p
  }

  /**
   * Return a string representation of the hd account type
   * @param {number} v - HD Account type (db encoding)
   * @returns {string}
   */
  typeString(v) {
    const info = this.classify(v)

    const prefix = info.locked ? 'LOCKED ' : ''

    let suffix = ''

    switch (info.type) {
      case this.BIP44:
        suffix = 'BIP44'
        break
      case this.BIP49:
        suffix = 'BIP49'
        break
      case this.BIP84:
        suffix = 'BIP84'
        break
      default:
        suffix = 'UNKNOWN'
        break
    }

    return prefix + suffix
  }

  /**
   * Checks if a hd account is a valid bip32
   * @param {string} xpub - hd account
   * @returns {boolean} returns true if hd account is valid, false otherwise
   */
  isValid(xpub) {
    if (this.nodes.has(xpub))
      return true

    try {
      if (!(this.isXpub(xpub) || this.isYpub(xpub) || this.isZpub(xpub))) {
        throw errors.xpub.INVALID
      }

      // Translate the xpub
      const xlatedXpub = this.xlatXPUB(xpub)

      // Parse input as an HD Node. Throws if invalid
      const node = bitcoin.bip32.fromBase58(xlatedXpub, activeNet)

      // Check and see if this is a private key
      if (!node.isNeutered())
        throw errors.xpub.PRIVKEY

      // Store the external and internal chain nodes in the proper indices.
      // Store the parent node as well, at index 2.
      this.nodes.set(xpub, [node.derive(0), node.derive(1), node])
      return true

    } catch(e) {
      if (e === errors.xpub.PRIVKEY) throw e
      return false
    }
  }

  /**
   * Get the hd node associated to an hd account
   * @param {string} xpub - hd account
   * @returns {[bitcoin.bip32.BIP32Interface, bitcoin.bip32.BIP32Interface, bitcoin.bip32.BIP32Interface]}
   */
  getNode(xpub) {
    if (this.isValid(xpub))
      return this.nodes.get(xpub)
    else
      return null
  }

  /**
   * Derives an address for an hd account
   * @param {number} chain - chain to be derived
   *    must have a value on [0,1] for BIP44/BIP49/BIP84 derivation
   * @param {bitcoin.bip32.BIP32Interface} chainNode - Parent bip32 used for derivation
   * @param {number} index - index to be derived
   * @param {number} type - type of derivation
   * @returns {Promise<object>} returns an object {address: '...', chain: <int>, index: <int>, address: string }
   */
  async deriveAddress(chain, chainNode, index, type) {
    // Derive M/chain/index
    const indexNode = chainNode.derive(index)

    const addr = {
      chain: chain,
      index: index,
    }

    switch (type) {
      case this.BIP44:
        addr.address = addrHelper.p2pkhAddress(indexNode.publicKey)
        break
      case this.BIP49:
        addr.address = addrHelper.p2wpkhP2shAddress(indexNode.publicKey)
        break
      case this.BIP84:
        addr.address = addrHelper.p2wpkhAddress(indexNode.publicKey)
        break
    }

    return addr
  }

  /**
   * Derives addresses for an hd account
   * @param {string} xpub - hd account to be derived
   * @param {number} chain - chain to be derived
   *    must have a value on [0,1] for BIP44/BIP49/BIP84 derivation
   * @param {number[]} indices - array of indices to be derived
   * @param {number} type - type of derivation
   * @returns {Promise<{ chain: number, index: number, publicKey: Buffer, address: string }[]>} array of address objects
   */
  async deriveAddresses(xpub, chain, indices, type) {
    const ret = []

    try {
      const node = this.getNode(xpub)

      if (node === null)
        throw errors.xpub.INVALID

      if (chain > 1 || chain < 0)
        throw errors.xpub.CHAIN

      if (typeof type == 'undefined')
        type = this.makeType(this.BIP44, false)

      const info = this.classify(type)

      // Node at M/chain
      const chainNode = node[chain]

      // Optimization: if number of addresses beyond a given treshold
      // derivation is done in a child process
      if (
        !this.externalDerivationActivated
        || indices.length <= keys.addrDerivationPool.thresholdParallelDerivation
      ) {
        // Few addresses to be derived or external derivation deactivated
        // Let's do it here
        const promises = indices.map(index => {
          return this.deriveAddress(chain, chainNode, index, info.type)
        })

        // Generate additional change address types for postmix account
        if (this.isPostmixAcct(node) && chain === 1) {
          indices.forEach((index) => {
            promises.push(this.deriveAddress(chain, chainNode, index, this.BIP44))
            promises.push(this.deriveAddress(chain, chainNode, index, this.BIP49))
          })
        }

        const addresses = await Promise.all(promises)

        return addresses;

      } else {
        // Many addresses to be derived
        // Let's do it in a child process
        return new Promise(async (resolve, reject) => {
          try {
            const data = {
              xpub: this.xlatXPUB(xpub),
              chain: chain,
              indices: indices,
              type: info.type,
              isPostmixChange: this.isPostmixAcct(node) && chain === 1
            }

            const msg = await this.derivationPool.exec('deriveAddresses', [data])

            if (msg.status === 'ok') {
              resolve(msg.addresses)
            } else {
              Logger.error(null, 'HdAccountsHelper : A problem was met during parallel addresses derivation')
              reject()
            }

          } catch(e) {
            Logger.error(null, 'HdAccountsHelper : A problem was met during parallel addresses derivation')
            reject(e)
          }
        })
      }

    } catch(e) {
      return Promise.reject(e)
    }
  }

  /**
   * @description Detect postmix account
   * @param {[bitcoin.bip32.BIP32Interface, bitcoin.bip32.BIP32Interface, bitcoin.bip32.BIP32Interface]} node - array of BIP32 node interfaces
   * @returns {boolean}
   */
  isPostmixAcct(node) {
    const index = node[2].index
    const threshold = Math.pow(2,31)
    const hardened = (index >= threshold)
    const account = hardened ? (index - threshold) : index

    return account === this.POSTMIX_ACCT
  }

}

module.exports = new HDAccountsHelper()
