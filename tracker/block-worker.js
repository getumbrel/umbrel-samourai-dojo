/*!
 * tracker/block-worker.js
 * Copyright © 2019 – Katana Cryptographic Ltd. All Rights Reserved.
 */


import { isMainThread, parentPort } from 'worker_threads'

import network from '../lib/bitcoin/network.js'
import keysFile from '../keys/index.js'
import db from '../lib/db/mysql-db-wrapper.js'
import { createRpcClient } from '../lib/bitcoind-rpc/rpc-client.js'
import Block from './block.js'

const keys = keysFile[network.key]

/**
 * STATUS
 */
export const IDLE = 0

export const INITIALIZED = 1

export const OUTPUTS_PROCESSED = 2

export const INPUTS_PROCESSED = 3

export const TXS_CONFIRMED = 4

/**
 * OPS
 */
export const OP_INIT = 0

export const OP_PROCESS_OUTPUTS = 1

export const OP_PROCESS_INPUTS = 2

export const OP_CONFIRM = 3

export const OP_RESET = 4


/**
 * Process message received by the worker
 * @param {object} msg - message received by the worker
 */
async function processMessage(msg) {
    let res = null
    let success = true

    try {
        switch (msg.op) {
        case OP_INIT:
            if (status !== IDLE)
                throw 'Operation not allowed'
            res = await initBlock(msg.header)
            break
        case OP_PROCESS_OUTPUTS:
            if (status !== INITIALIZED)
                throw 'Operation not allowed'
            res = await processOutputs()
            break
        case OP_PROCESS_INPUTS:
            if (status !== OUTPUTS_PROCESSED)
                throw 'Operation not allowed'
            res = await processInputs()
            break
        case OP_CONFIRM:
            if (status !== INPUTS_PROCESSED)
                throw 'Operation not allowed'
            res = await confirmTransactions(msg.blockId)
            break
        case OP_RESET:
            res = await reset()
            break
        default:
            throw 'Invalid Operation'
        }
    } catch (error) {
        success = false
        res = error
    } finally {
        parentPort.postMessage({
            'op': msg.op,
            'status': success,
            'res': res
        })
    }
}

/**
 * Initialize the block
 * @param {object} header - block header
 */
async function initBlock(header) {
    status = INITIALIZED
    const hex = await rpcClient.getblock({ blockhash: header.hash, verbosity: 0 })
    block = new Block(hex, header)
    return true
}

/**
 * Process the transactions outputs
 */
async function processOutputs() {
    status = OUTPUTS_PROCESSED
    txsForBroadcast = await block.processOutputs()
    return true
}

/**
 * Process the transactions inputs
 */
async function processInputs() {
    status = INPUTS_PROCESSED
    const txs = await block.processInputs()
    txsForBroadcast = [...txsForBroadcast, ...txs]
    return true
}

/**
 * Confirm the transactions
 * @param {number} blockId - id of the block in db
 */
async function confirmTransactions(blockId) {
    status = TXS_CONFIRMED
    const aTxsForBroadcast = [...new Set(txsForBroadcast)]
    await block.confirmTransactions(aTxsForBroadcast, blockId)
    return aTxsForBroadcast
}

/**
 * Reset
 */
function reset() {
    status = IDLE
    block = null
    txsForBroadcast = []
    return true
}


/**
 * MAIN
 */
const rpcClient = createRpcClient()
let block = null
let txsForBroadcast = []
let status = IDLE

if (!isMainThread) {
    db.connect({
        connectionLimit: keys.db.connectionLimitTracker,
        acquireTimeout: keys.db.acquireTimeout,
        host: keys.db.host,
        user: keys.db.user,
        password: keys.db.pass,
        database: keys.db.database
    })

    reset()
    parentPort.on('message', processMessage)
}
