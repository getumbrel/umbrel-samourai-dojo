/*!
 * lib/bitcoind_rpc/rpc-client.js
 * Copyright © 2019 – Katana Cryptographic Ltd. All Rights Reserved.
 */


import {RPCClient} from 'rpc-bitcoin';

import network from '../bitcoin/network.js'
import keysFile from '../../keys/index.js'
import util from '../util.js'
import Logger from '../logger.js'

const keys = keysFile[network.key]

/**
 * @typedef {import('rpc-bitcoin').RPCIniOptions} RPCIniOptions
 */

/**
 * Wrapper for bitcoind rpc client
 * @param {RPCIniOptions} options
 */
export const createRpcClient = (options = {}) => {
    return new RPCClient({
        url: `http://${keys.bitcoind.rpc.host}`,
        port: keys.bitcoind.rpc.port,
        user: keys.bitcoind.rpc.user,
        pass: keys.bitcoind.rpc.pass,
        timeout: 2 * 60 * 1000, // 2 minutes
        ...options
    })
}

/**
 * Check if an error returned by bitcoin-rpc-client
 * is a connection error.
 * @param {string} err - error message
 * @returns {boolean} returns true if message related to a connection error
 */
export const isConnectionError = (err) => {
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
export const waitForBitcoindRpcApi = async () => {
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
