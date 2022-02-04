/*!
 * lib/indexer_rpc/rpc-client.js
 * Copyright © 2019 – Katana Cryptographic Ltd. All Rights Reserved.
 */


import { Socket } from 'net'

import network from '../bitcoin/network.js'
import keysFile from '../../keys/index.js'
import util from '../util.js'
import Logger from '../logger.js'

const keys = keysFile[network.key]


/**
 * RPC client for an indexer
 * following the Electrum protocol
 */
class RpcClient {

    constructor() {
        this._opts = {
            host: keys.indexer.localIndexer.host,
            port: keys.indexer.localIndexer.port,
            timeout: 60000
        }
    }

    /**
     * Set an option
     * @param {string} key
     * @param {*} value
     * @return {RpcClient}
     */
    set(key, value) {
        this._opts[key] = value
        return this
    }

    /**
     * Get an option
     * @param {string} key
     * @return {*}
     */
    get(key) {
        return this._opts[key]
    }

    /**
     * Check if an error returned by the wrapper
     * is a connection error.
     * @param {string} error - error message
     * @returns {boolean} returns true if message related to a connection error
     */
    static isConnectionError(error) {
        if (typeof error !== 'string')
            return false

        const isTimeoutError = (error.includes('connect ETIMEDOUT'))
        const isConnRejected = (error.includes('Connection Rejected'))

        return (isTimeoutError || isConnRejected)
    }

    /**
     * Check if the rpc api is ready to process requests
     * @returns {Promise}
     */
    static async waitForIndexerRpcApi(options) {
        let client = new RpcClient(options)

        try {
            await client.sendRequest('server.version', 'dojo', ['1.0', '1.4'])
        } catch {
            client = null
            Logger.info('Indexer RPC : API is still unreachable. New attempt in 20s.')
            return util.delay(20000).then(() => {
                return RpcClient.waitForIndexerRpcApi()
            })
        }
    }

    /**
     * Send multiple requests (batch mode)
     * @param {Object[]} batch - array of objects {method: ..., params: ...}
     * @return {Promise<object[]>}
     */
    async sendBatch(batch) {
        const batchList = util.splitList(batch, 100)

        const responses = await util.seriesCall(batchList, (requests) => {
            return this._call(requests, true)
        })

        return responses.flat()
    }

    /**
     * Send multiple requests (flood mode)
     * @param {Object[]} batch - array of objects {method: ..., params: ...}
     * @return {Promise<object[]>}
     */
    async sendRequests(batch) {
        const batchList = util.splitList(batch, 100)

        const responses = await util.seriesCall(batchList, (requests) => {
            return this._call(requests, false)
        })

        return responses.flat()
    }

    /**
     * Send a request
     * @param {string} method - called method
     * @param {string | number | boolean} params
     * @return {Promise<object>}
     */
    async sendRequest(method, ...params) {
        const batch = [{ method: method, params: params }]
        const ret = await this._call(batch, false)
        return ret[0]
    }

    /**
     * Send requests (internal method)
     * @param {Object[]} data - array of objects {method: ..., params: ...}
     * @param {boolean=} batched - batch requests
     * @returns {Promise<object[]>}
     */
    async _call(data, batched) {
        return new Promise((resolve, reject) => {
            let methodId = 0
            let requests = []
            let responses = []
            let response = ''

            const requestErrorMessage = `Indexer JSON-RPC: host=${this._opts.host} port=${this._opts.port}:`

            // Prepare an array of requests
            requests = data.map(request => {
                return JSON.stringify({
                    jsonrpc: '2.0',
                    method: request.method,
                    params: request.params || [],
                    id: request.id || methodId++
                })
            })

            // If batch mode
            // send a single batched request
            if (batched)
                requests = [`[${requests.join(',')}]`]

            // Initialize the connection
            const conn = Socket()
            conn.setTimeout(this._opts.timeout)
            conn.setEncoding('utf8')
            conn.setKeepAlive(true, 0)
            conn.setNoDelay(true)

            conn.on('connect', () => {
                // Send the requests
                for (let request of requests)
                    conn.write(`${request}\n`)
            })

            conn.on('timeout', () => {
                const e = new Error('ETIMEDOUT')
                e.errorno = 'ETIMEDOUT'
                e.code = 'ETIMEDOUT'
                e.connect = false
                conn.emit('error', e)
            })

            conn.on('data', chunk => {
                // Process the received chunk char by char
                for (let c of chunk) {
                    response += c
                    // Detect the end of a response
                    if (c === '\n') {
                        try {
                            // Parse the response
                            let parsed = JSON.parse(response)
                            if (parsed.error)
                                throw new Error(JSON.stringify(parsed.error))
                            // Add the parsed reponse to the array of responses
                            if (batched) {
                                responses = parsed.map(p => {
                                    return { id: p.id, response: p.result }
                                })
                            } else {
                                responses.push({ id: parsed.id, response: parsed.result })
                            }
                            // Reset the response
                            response = ''
                            // If all responses have been received
                            // close the connection
                            if (responses.length === data.length)
                                conn.end()
                        } catch (error) {
                            reject(
                                new Error(`${requestErrorMessage} Error Parsing JSON: ${error.message}, data: ${response}`)
                            )
                        }
                    }
                }
            })

            conn.on('end', () => {
                // Connection closed
                // we can return the responses
                resolve(responses)
            })

            conn.on('error', e => {
                reject(new Error(`${requestErrorMessage} Request error: ${e}`))
            })

            // Connect to the RPC API
            conn.connect({
                host: this._opts.host,
                port: this._opts.port
            })

        })
    }

}

export default RpcClient
