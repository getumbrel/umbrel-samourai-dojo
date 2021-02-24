/*!
 * lib/remote-importer/oxt-wrapper.js
 * Copyright © 2019 – Katana Cryptographic Ltd. All Rights Reserved.
 */
'use strict'

const axios = require('axios')
const Logger = require('../logger')
const network = require('../bitcoin/network')
const keys = require('../../keys')[network.key]
const Wrapper = require('./wrapper')


/**
 * Wrapper for the oxt.me block explorer APIs
 */
class OxtWrapper extends Wrapper {

  /**
   * Constructor
   */
  constructor(url) {
    super(url, keys.indexer.socks5Proxy)
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

    // Sets socks proxy agent if required
    if (keys.indexer.socks5Proxy != null) {
      params['httpAgent'] = this.socksProxyAgent
      params['httpsAgent'] = this.socksProxyAgent
    }

    const result = await axios(params)
    return result.data
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
    // Try to retrieve more txs than the 1000 managed by the backend
    const uri = `/addresses/${address}/txids?count=${keys.addrFilterThreshold + 1}`
    const result = await this._get(uri)

    const ret = {
      address: address,
      ntx: result.count,
      txids: []
    }

    // Check if we should filter this address
    if (filterAddr && ret.ntx > keys.addrFilterThreshold) {
      Logger.info(`Importer : Import of ${ret.address} rejected (too many transactions - ${ret.ntx})`)
      return ret
    }

    ret.txids = result.data.map(t => t.txid)
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
    const ret = []

    // Send a batch request for all the addresses
    // For each address, try to retrieve more txs than the 1000 managed by the backend
    const strAddr = addresses.join(',')
    const uri = `/addresses/multi/txids?count=${keys.addrFilterThreshold + 1}&addresses=${strAddr}`
    const results = await this._get(uri)

    for (let r of results.data) {
      const retAddr = {
        address: r.address,
        ntx: r.txids.length,
        txids: []
      }

      // Check if we should filter this address
      if (filterAddr && retAddr.ntx > keys.addrFilterThreshold) {
        Logger.info(`Importer : Import of ${retAddr.address} rejected (too many transactions - ${retAddr.ntx})`)
      } else {
        retAddr.txids = r.txids
      }

      ret.push(retAddr)
    }

    return ret
  }

  /**
   * Retrieve the height of the chaintip for the remote source
   * @returns {Promise} returns an object
   *    {chainTipHeight: <chaintip_height>}
   */
  async getChainTipHeight() {
    let chainTipHeight = null
    const result = await this._get(`/lastblock`)
    if (result != null && result['data'].length == 1)
      chainTipHeight = parseInt(result['data'][0]['height'])
    return {'chainTipHeight': chainTipHeight}
  }

}

module.exports = OxtWrapper
