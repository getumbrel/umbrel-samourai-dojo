/*!
 * lib/bitcoin/network.js
 * Copyright © 2019 – Katana Cryptographic Ltd. All Rights Reserved.
 */
'use strict'

const bitcoin = require('bitcoinjs-lib')
const keys = require('../../keys/')


/**
 * A set of keywords encoding for mainnet
 */
const MAINNET_KEY = [
  'bitcoin'
]

/**
 * A set of keywords encoding for testnet
 */
const TESTNET_KEY = [
  'testnet',
  'testing',
  'test'
]


/**
 * A singleton determining which network to run: bitcoin or testnet
 */
class Network {

  /**
   * Constructor
   */
  constructor() {
    // Check if mainnet config is detected in index.js
    for (let kw of MAINNET_KEY) {
      if (kw in keys) {
        this.key = 'bitcoin'
        this.network = bitcoin.networks.bitcoin
        return
      }
    }
    // Check if testnet config is detected in index.js
    for (let kw of TESTNET_KEY) {
      if (kw in keys) {
        this.key = 'testnet'
        this.network = bitcoin.networks.testnet
        return
      }
    }
  }

}

module.exports = new Network()
