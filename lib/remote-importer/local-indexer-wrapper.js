/*!
 * lib/remote-importer/local-indexer-wrapper.js
 * Copyright © 2019 – Katana Cryptographic Ltd. All Rights Reserved.
 */


import bitcoin from 'bitcoinjs-lib'

import Logger from '../logger.js'
import network from '../bitcoin/network.js'
import keysFile from '../../keys/index.js'
import RpcClient from '../indexer-rpc/rpc-client.js'
import Wrapper from './wrapper.js'

const keys = keysFile[network.key]
const activeNet = network.network

/**
 * Wrapper for a local indexer
 * Currently supports indexers
 * providing a RPC API compliant
 * with a subset of the electrum protocol
 */
class LocalIndexerWrapper extends Wrapper {

    constructor() {
        super(null, null)
        // RPC client
        this.client = new RpcClient()
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
        const returnValue = {
            address: address,
            ntx: 0,
            txids: []
        }

        const scriptHash = this._getScriptHash(address)

        const results = await this.client.sendRequest(
            LocalIndexerWrapper.GET_HISTORY_RPC_CMD,
            scriptHash
        )

        for (let r of results.response) {
            returnValue.txids.push(r.tx_hash)
            returnValue.ntx++
        }

        if (filterAddr && returnValue.ntx > keys.addrFilterThreshold) {
            Logger.info(`Importer : Import of ${address} rejected (too many transactions - ${returnValue.ntx})`)
            return {
                address: address,
                ntx: 0,
                txids: []
            }
        }

        return returnValue
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
        const returnValue = {}

        // Build an array of script hashes
        const scriptHashes = addresses.map(a => this._getScriptHash(a))

        // Build an array of commands
        const commands = scriptHashes.map((scriptHash, index) => {
            return {
                method: LocalIndexerWrapper.GET_HISTORY_RPC_CMD,
                params: [scriptHash],
                id: addresses[index]
            }
        })

        // Send the requests
        const results = (keys.indexer.localIndexer.batchRequests === 'active')
            ? await this.client.sendBatch(commands)
            : await this.client.sendRequests(commands)

        for (let r of results) {
            const addr = r.id
            const txids = r.response.map(t => t.tx_hash)

            returnValue[addr] = {
                address: addr,
                ntx: txids.length,
                txids: txids
            }
        }

        const aReturnValue = Object.values(returnValue)

        for (let index in aReturnValue) {
            if (filterAddr && aReturnValue[index].ntx > keys.addrFilterThreshold) {
                Logger.info(`Importer : Import of ${aReturnValue[index].address} rejected (too many transactions - ${aReturnValue[index].ntx})`)
                aReturnValue.splice(index, 1)
            }
        }

        return aReturnValue
    }

    /**
     * Retrieve the height of the chaintip for the remote source
     * @returns {Promise} returns an object
     *    {chainTipHeight: <chaintip_height>}
     */
    async getChainTipHeight() {
        let chainTipHeight = null
        const result = await this.client.sendRequest(LocalIndexerWrapper.HEADERS_SUBSCRIBE_RPC_CMD)

        if (result != null && result.response != null && result.response.height != null)
            chainTipHeight = Number.parseInt(result.response.height, 10)
        return { 'chainTipHeight': chainTipHeight }
    }
}

/**
 * Get history RPC command (Electrum protocol)
 */
LocalIndexerWrapper.GET_HISTORY_RPC_CMD = 'blockchain.scripthash.get_history'
/**
 * Get history RPC command (Electrum protocol)
 */
LocalIndexerWrapper.HEADERS_SUBSCRIBE_RPC_CMD = 'blockchain.headers.subscribe'


export default LocalIndexerWrapper
