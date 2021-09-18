/*!
 * lib/bitcoind_rpc/rpc-client.js
 * Copyright © 2019 – Katana Cryptographic Ltd. All Rights Reserved.
 */
'use strict'

const {RPCClient} = require('rpc-bitcoin');
const network = require('../bitcoin/network')
const keys = require('../../keys')[network.key]
const util = require('../util')
const Logger = require('../logger')


/**
 * Wrapper for bitcoind rpc client
 */
const createRpcClient = (options = {}) => {
    return new RPCClient({
        url: `http://${keys.bitcoind.rpc.host}`,
        port: keys.bitcoind.rpc.port,
        user: keys.bitcoind.rpc.user,
        pass: keys.bitcoind.rpc.pass,
        ...options
    })
}

/**
 * Check if an error returned by bitcoin-rpc-client
 * is a connection error.
 * @param {string} err - error message
 * @returns {boolean} returns true if message related to a connection error
 */
const isConnectionError = (err) => {
    if (typeof err !== 'string')
        return false

    const isTimeoutError = (err.indexOf('connect ETIMEDOUT') !== -1)
    const isConnRejected = (err.indexOf('Connection Rejected') !== -1)

    return (isTimeoutError || isConnRejected)
}

/**
 * Check if the rpc api is ready to process requests
 * @returns {Promise}
 */
const waitForBitcoindRpcApi = async () => {
    let client = createRpcClient()

    try {
        await client.getblockchaininfo()
    } catch (e) {
        client = null
        Logger.info('Bitcoind RPC : API is still unreachable. New attempt in 20s.')
        return util.delay(20000).then(() => {
            return waitForBitcoindRpcApi()
        })
    }
}

module.exports = {
    createRpcClient,
    isConnectionError,
    waitForBitcoindRpcApi
}
