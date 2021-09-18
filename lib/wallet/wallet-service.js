/*!
 * lib/wallet/wallet-service.js
 * Copyright © 2019 – Katana Cryptographic Ltd. All Rights Reserved.
 */
'use strict'

const util = require('../util')
const Logger = require('../logger')
const db = require('../db/mysql-db-wrapper')
const hdaService = require('../bitcoin/hd-accounts-service')
const hdaHelper = require('../bitcoin/hd-accounts-helper')
const network = require('../bitcoin/network')
const activeNet = network.network
const keys = require('../../keys')[network.key]
const WalletInfo = require('./wallet-info')


/**
 * A singleton providing a wallets service
 */
class WalletService {

  /**
   * Constructor
   */
  constructor() {}

  /**
   * Get full wallet information
   * @param {object} active - mapping of active entities
   * @param {object} legacy - mapping of new legacy addresses
   * @param {object} bip49 - mapping of new bip49 addresses
   * @param {object} bip84 - mapping of new bip84 addresses
   * @param {object} pubkeys - mapping of new pubkeys/addresses
   * @returns {Promise}
   */
  async getFullWalletInfo(active, legacy, bip49, bip84, pubkeys) {
    // Check parameters
    const validParams = this._checkEntities(active, legacy, bip49, bip84, pubkeys)

    if (!validParams) {
      const info = new WalletInfo()
      const ret = this._formatGetFullWalletInfoResult(info)
      return Promise.resolve(ret)
    }

    // Merge all entities into active mapping
    active = this._mergeEntities(active, legacy, bip49, bip84, pubkeys)

    // Initialize a WalletInfo object
    const walletInfo = new WalletInfo(active)

    try {
      await Promise.all([

        // Add the new xpubs
        util.parallelCall(legacy.xpubs, this._newBIP44),
        util.parallelCall(bip49.xpubs, this._newBIP49),
        util.parallelCall(bip84.xpubs, this._newBIP84),
        // Add the new addresses
        db.addAddresses(legacy.addrs),
        db.addAddresses(bip49.addrs),
        db.addAddresses(bip84.addrs),
        db.addAddresses(pubkeys.addrs),
      ])

      // Ensure hd accounts and addresses exist
      await Promise.all([
        walletInfo.ensureHdAccounts(),
        walletInfo.ensureAddresses(),
      ])

      // Force import of addresses associated to paynyms
      // if dojo relies on a local index
      if (keys.indexer.active !== 'third_party_explorer')
        await this._forceEnsureAddressesForActivePubkeys(active)

      // Filter the addresses
      await walletInfo.filterAddresses()

      // Load wallet information
      await Promise.all([
        // Load the hd accounts,
        walletInfo.loadHdAccountsInfo(),
        // Load the utxos
        walletInfo.loadUtxos(),
        // Load the addresses
        walletInfo.loadAddressesInfo(),
        // Load the most recent transactions
        walletInfo.loadTransactions(0, null, true),
        // Load feerates
        walletInfo.loadFeesInfo(),
      ])

      // Postprocessing
      await Promise.all([
        walletInfo.postProcessAddresses(),
        walletInfo.postProcessHdAccounts(),
      ])

      // Format the result
      return this._formatGetFullWalletInfoResult(walletInfo)

    } catch(e) {
      Logger.error(e, 'WalletService.getWalletInfo()')
      return Promise.reject({status:'error', error:'internal server error'})
    }
  }

  /**
   * Get wallet information
   * @deprecated
   * @param {object} active - mapping of active entities
   * @param {object} legacy - mapping of new legacy addresses
   * @param {object} bip49 - mapping of new bip49 addresses
   * @param {object} bip84 - mapping of new bip84 addresses
   * @param {object} pubkeys - mapping of new pubkeys/addresses
   * @returns {Promise}
   */
  async getWalletInfo(active, legacy, bip49, bip84, pubkeys) {
    // Check parameters
    const validParams = this._checkEntities(active, legacy, bip49, bip84, pubkeys)

    if (!validParams) {
      const info = new WalletInfo()
      const ret = this._formatGetWalletInfoResult(info)
      return Promise.resolve(ret)
    }

    // Merge all entities into active mapping
    active = this._mergeEntities(active, legacy, bip49, bip84, pubkeys)

    // Initialize a WalletInfo object
    const walletInfo = new WalletInfo(active)

    try {
      // Add the new xpubs
      await util.seriesCall(legacy.xpubs, this._newBIP44)
      await util.seriesCall(bip49.xpubs, this._newBIP49)
      await util.seriesCall(bip84.xpubs, this._newBIP84)
      // Load hd accounts info
      await walletInfo.ensureHdAccounts()
      await walletInfo.loadHdAccountsInfo()
      // Add the new addresses
      await db.addAddresses(legacy.addrs)
      await db.addAddresses(bip49.addrs)
      await db.addAddresses(bip84.addrs)
      await db.addAddresses(pubkeys.addrs)
      // Ensure addresses exist
      await walletInfo.ensureAddresses()
      // Force import of addresses associated to paynyms
      // if dojo relies on a local index
      if (keys.indexer.active !== 'third_party_explorer')
        await this._forceEnsureAddressesForActivePubkeys(active)
      // Filter the address and load them
      await walletInfo.filterAddresses()
      await walletInfo.loadAddressesInfo()
      // Load the most recent transactions
      await walletInfo.loadTransactions(0, null, true)
      // Postprocessing
      await walletInfo.postProcessAddresses()
      await walletInfo.postProcessHdAccounts()
      // Format the result
      return this._formatGetWalletInfoResult(walletInfo)

    } catch(e) {
      Logger.error(e, 'WalletService.getWalletInfo()')
      return Promise.reject({status:'error', error:'internal server error'})
    }
  }

  /**
   * Prepares the result to be returned by getFullWalletInfo()
   * @param {WalletInfo} info
   * @returns {object}
   */
  _formatGetFullWalletInfoResult(info) {
    let ret = info.toPojo()

    delete ret['n_tx']

    ret.addresses = ret.addresses.map(x => {
      delete x['derivation']
      delete x['created']
      return x
    })

    return ret
  }

  /**
   * Prepares the result to be returned by getWalletInfo()
   * @deprecated
   * @param {WalletInfo} info
   * @returns {object}
   */
  _formatGetWalletInfoResult(info) {
    let ret = info.toPojo()

    delete ret['n_tx']
    delete ret['unspent_outputs']
    delete ret['info']['fees']

    ret.addresses = ret.addresses.map(x => {
      delete x['derivation']
      delete x['created']
      return x
    })

    return ret
  }

  /**
   * Get wallet unspent outputs
   * @deprecated
   * @param {object} active - mapping of active entities
   * @param {object} legacy - mapping of new legacy addresses
   * @param {object} bip49 - mapping of new bip49 addresses
   * @param {object} bip84 - mapping of new bip84 addresses
   * @param {object} pubkeys - mapping of new pubkeys/addresses
   * @returns {Promise}
   */
  async getWalletUtxos(active, legacy, bip49, bip84, pubkeys) {
    const ret = {
      unspent_outputs: []
    }

    // Check parameters
    const validParams = this._checkEntities(active, legacy, bip49, bip84, pubkeys)
    if (!validParams)
      return Promise.resolve(ret)

    // Merge all entities into active mapping
    active = this._mergeEntities(active, legacy, bip49, bip84, pubkeys)

    // Initialize a WalletInfo object
    const walletInfo = new WalletInfo(active)

    try {
      // Add the new xpubs
      await util.seriesCall(legacy.xpubs, this._newBIP44)
      await util.seriesCall(bip49.xpubs, this._newBIP49)
      await util.seriesCall(bip84.xpubs, this._newBIP84)
      // Ensure hd accounts exist
      await walletInfo.ensureHdAccounts()
      // Add the new addresses
      await db.addAddresses(legacy.addrs)
      await db.addAddresses(bip49.addrs)
      await db.addAddresses(bip84.addrs)
      await db.addAddresses(pubkeys.addrs)
      // Ensure addresses exist
      await walletInfo.ensureAddresses()
      // Force import of addresses associated to paynyms
      // if dojo relies on a local index
      if (keys.indexer.active !== 'third_party_explorer')
        await this._forceEnsureAddressesForActivePubkeys(active)
      // Filter the addresses
      await walletInfo.filterAddresses()
      // Load the utxos
      await walletInfo.loadUtxos()
      // Postprocessing
      await walletInfo.postProcessAddresses()
      await walletInfo.postProcessHdAccounts()
      // Format the result
      ret.unspent_outputs = walletInfo.unspentOutputs
      return ret

    } catch(e) {
      Logger.error(e, 'WalletService.getWalletUtxos()')
      return Promise.reject({status: 'error', error: 'internal server error'})
    }
  }

  /**
   * Get a subset of wallet transactions
   * @param {object} entities - mapping of active entities
   * @param {number} page - page of transactions to be returned
   * @param {number} count - number of transactions returned per page
   * @returns {Promise}
   */
  async getWalletTransactions(entities, page, count) {
    const ret = {
      n_tx: 0,
      page: page,
      n_tx_page: count,
      txs: []
    }

    // Check parameters
    if (entities.xpubs.length === 0 && entities.addrs.length === 0)
      return ret

    // Initialize a WalletInfo object
    const walletInfo = new WalletInfo(entities)

    try {
      // Filter the addresses
      await walletInfo.filterAddresses()

      await Promise.all([
        // Load the number of transactions
        walletInfo.loadNbTransactions(),
        // Load the requested page of transactions
        walletInfo.loadTransactions(page, count, false),
      ])

      // Postprocessing
      await walletInfo.postProcessAddresses()
      await walletInfo.postProcessHdAccounts()

      // Format the result
      ret.n_tx = walletInfo.nTx
      ret.txs = walletInfo.txs
      return ret

    } catch(e) {
      Logger.error(e, 'WalletService.getWalletTransactions()')
      return Promise.reject({status:'error', error:'internal server error'})
    }
  }

  /**
   * Force addresses derived from an active pubkey to be stored in database
   * @param {object} active - mapping of active entities
   * @returns {Promise}
   */
  async _forceEnsureAddressesForActivePubkeys(active) {
    const filteredAddrs = []
    for (let i in active.addrs) {
      if (active.pubkeys[i]) {
        filteredAddrs.push(active.addrs[i])
      }
    }
    return db.addAddresses(filteredAddrs)
  }

  /**
   * Check entities
   * @param {object} active - mapping of active entities
   * @param {object} legacy - mapping of new legacy addresses
   * @param {object} bip49 - mapping of new bip49 addresses
   * @param {object} bip84 - mapping of new bip84 addresses
   * @param {object} pubkeys - mapping of new pubkeys/addresses
   * @returns {boolean} return true if conditions are met, false otherwise
   */
  _checkEntities(active, legacy, bip49, bip84, pubkeys) {
    const allEmpty = active.xpubs.length === 0
      && active.addrs.length === 0
      && legacy.xpubs.length === 0
      && legacy.addrs.length === 0
      && pubkeys.addrs.length === 0
      && bip49.xpubs.length === 0
      && bip84.xpubs.length === 0

    return !allEmpty
  }

  /**
   * Merge all entities into active mapping
   * @param {object} active - mapping of active entities
   * @param {object} legacy - mapping of new legacy entities
   * @param {object} bip49 - mapping of new bip49 entities
   * @param {object} bip84 - mapping of new bip84 entities
   * @param {object} pubkeys - mapping of new pubkeys
   */
  _mergeEntities(active, legacy, bip49, bip84, pubkeys) {
    // Put all xpub into active.xpubs
    active.xpubs = active.xpubs.concat(legacy.xpubs, bip49.xpubs, bip84.xpubs)

    // Put addresses and pubkeys into active
    // but avoid duplicates
    for (let source of [legacy, pubkeys]) {
      for (let idxSource in source.addrs) {
        const addr = source.addrs[idxSource]
        const pubkey = source.pubkeys[idxSource]
        const idxActive = active.addrs.indexOf(addr)

        if (idxActive === -1) {
          active.addrs.push(addr)
          active.pubkeys.push(pubkey)
        } else if (pubkey) {
          active.pubkeys[idxActive] = pubkey
        }
      }
    }

    return active
  }

  /**
   * Create a new BIP44 hd account into the database
   * @param {string} xpub
   * @returns {Promise}
   */
  async _newBIP44(xpub) {
    return hdaService.createHdAccount(xpub, hdaHelper.BIP44)
  }

  /**
   * Create a new BIP49 hd account into the database
   * @param {string} xpub
   * @returns {Promise}
   */
  async _newBIP49(xpub) {
    return hdaService.createHdAccount(xpub, hdaHelper.BIP49)
  }

  /**
   * Create a new BIP84 hd account into the database
   * @param {string} xpub
   * @returns {Promise}
   */
  async _newBIP84(xpub) {
    return hdaService.createHdAccount(xpub, hdaHelper.BIP84)
  }

}

module.exports = new WalletService()
