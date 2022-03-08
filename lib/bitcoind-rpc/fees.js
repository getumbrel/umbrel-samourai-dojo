/*!
 * lib/bitcoind-rpc/fees.js
 * Copyright © 2019 – Katana Cryptographic Ltd. All Rights Reserved.
 */

import errors from '../errors.js'
import Logger from '../logger.js'
import network from '../bitcoin/network.js'
import keysFile from '../../keys/index.js'
import { createRpcClient, waitForBitcoindRpcApi } from './rpc-client.js'
import latestBlock from './latest-block.js'

const keys = keysFile[network.key]

/**
 * A singleton providing information about network fees
 */
class Fees {

    constructor() {
        this.block = -1
        this.targets = [2, 4, 6, 12, 24]
        this.fees = {
            2: 0,
            4: 0,
            6: 0,
            12: 0,
            24: 0
        }
        this.feeType = keys.bitcoind.feeType

        this.rpcClient = createRpcClient()

        waitForBitcoindRpcApi().then(() => {
            this.refresh()
        })
    }

    /**
     * Refresh and return the current fees
     * @returns {Promise<object>}
     */
    async getFees() {
        try {
            if (latestBlock.height > this.block)
                await this.refresh()

            return this.fees

        } catch {
            throw errors.generic.GEN
        }
    }

    /**
     * Refresh the current fees
     * @returns {Promise<void>}
     */
    async refresh() {
        try {
            const requests = this.targets.map((target) => {
                return { method: 'estimatesmartfee', params: { conf_target: target, estimate_mode: this.feeType }, id: target }
            })
            const responses = await this.rpcClient.batch(requests)

            for (const fee of responses) {
                this.fees[fee.id] = (fee.result.errors && fee.result.errors.length > 0) ? 0 : Math.round(fee.result.feerate * 1e5)
            }
        } catch (error) {
            Logger.error(error, 'Bitcoind RPC : Fees.refresh()')
        }
        this.block = latestBlock.height
    }

}

export default new Fees()
