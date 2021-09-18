/*!
 * lib/remote-importer/local-rest-indexer-wrapper.js
 * Copyright © 2019 – Katana Cryptographic Ltd. All Rights Reserved.
 */
'use strict'

const axios = require('axios')
const bitcoin = require('bitcoinjs-lib')
const Logger = require('../logger')
const util = require('../util')
const network = require('../bitcoin/network')
const activeNet = network.network
const keys = require('../../keys')[network.key]
const Wrapper = require('./wrapper')


/**
 * Wrapper for a local indexer
 * providing a REST API
 */
class LocalRestIndexerWrapper extends Wrapper {

  /**
   * Constructor
   * @constructor
   * @param {string} url
   */
  constructor(url) {
    super(url, null)
  }

  /**
   * Send a GET request to the API
   * @param {string} route
   * @returns {Promise}
   */
  async _get(route) {
    const params = {
      url: `${this.base}${route}`,
      method: 'GET',
      responseType: 'json',
      timeout: 15000,
      headers: {
        'User-Agent': 'Dojo'
      }
    }

    const result = await axios(params)
    return result.data
  }

  /**
   * Translate a bitcoin address into a script hash
   * (@see https://electrumx.readthedocs.io/en/latest/protocol-basics.html#script-hashes)
   * @param {string} address - bitcoin address
   * @returns {string} returns the script hash associated to the address
   */
  _getScriptHash(address) {
    const bScriptPubKey = bitcoin.address.toOutputScript(address, activeNet)
    const bScriptHash = bitcoin.crypto.sha256(bScriptPubKey)
    return bScriptHash.reverse().toString('hex')
  }

  /**
   * Retrieve information for a given address
   * @param {string} address - bitcoin address
   * @param {boolean} filterAddr - True if an upper bound should be used
   *     for #transactions associated to the address, False otherwise
   * @returns {Promise} returns an object
   *  { address: <bitcoin_address>, txids: <txids>, ntx: <total_nb_txs>}
   */
  async getAddress(address, filterAddr) {
    const ret = {
      address: address,
      ntx: 0,
      txids: []
    }

    const scriptHash = this._getScriptHash(address)
    const uri = `/blockchain/scripthash/${scriptHash}/history`
    const results = await this._get(uri)

    for (let r of results) {
      ret.txids.push(r.tx_hash)
      ret.ntx++
    }

    if (filterAddr && ret.ntx > keys.addrFilterThreshold) {
      Logger.info(`Importer : Import of ${address} rejected (too many transactions - ${ret.ntx})`)
      return {
        address: address,
        ntx: 0,
        txids: []
      }
    }

    return ret
  }

  /**
   * Retrieve information for a given list of addresses
   * @param {string} addresses - array of bitcoin addresses
   * @param {boolean} filterAddr - True if an upper bound should be used
   *     for #transactions associated to the address, False otherwise
   * @returns {Promise} returns an array of objects
   *  { address: <bitcoin_address>, txids: <txids>, ntx: <total_nb_txs>}
   */
  async getAddresses(addresses, filterAddr) {
    const ret = {}
    const scriptHash2Address = {}
    const scriptHashes = []

    for (let a of addresses) {
      const scriptHash = this._getScriptHash(a)
      scriptHashes.push(scriptHash)
      scriptHash2Address[scriptHash] = a
    }

    const sScriptHashes = scriptHashes.join(',')
    const uri = `/blockchain/scripthashes/history?scripthashes=${sScriptHashes}`
    const results = await this._get(uri)

    for (let r of results) {
      const a = scriptHash2Address[r.script_hash]
      ret[a] = {
        address: a,
        ntx: r.txids.length,
        txids: r.txids
      }
    }

    const aRet = Object.values(ret)

    for (let i in aRet) {
      if (filterAddr && aRet[i].ntx > keys.addrFilterThreshold) {
        Logger.info(`Importer : Import of ${aRet[i].address} rejected (too many transactions - ${aRet[i].ntx})`)
        aRet.splice(i, 1)
      }
    }

    return aRet
  }

  /**
   * Retrieve the height of the chaintip for the remote source
   * @returns {Promise} returns an object
   *    {chainTipHeight: <chaintip_height>}
   */
  async getChainTipHeight() {
    let chainTipHeight = null
    const result = await this._get(`/blocks/tip`)
    if (result != null && result['height'] != null)
      chainTipHeight = parseInt(result['height'])
    return {'chainTipHeight': chainTipHeight}
  }

}

module.exports = LocalRestIndexerWrapper
