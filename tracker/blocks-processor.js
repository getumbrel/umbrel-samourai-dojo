/*!
 * tracker/blocks-processor.js
 * Copyright © 2019 – Katana Cryptographic Ltd. All Rights Reserved.
 */

import { fileURLToPath } from 'url'
import path from 'path'
import os from 'os'
import { Sema } from 'async-sema'
import { Worker } from 'worker_threads'

import Logger from '../lib/logger.js'
import util from '../lib/util.js'
import db from '../lib/db/mysql-db-wrapper.js'
import * as blockWorker from './block-worker.js'


let notifSock = null
let blockWorkers = []
let headersChunk = []
let txsForBroadcast = []
let t0 = null
let currentOp = null
let nbTasksEnqueued = 0
let nbTasksCompleted = 0

// Semaphor protecting the processBloks() method
const _processBlocksSemaphor = new Sema(1)

// Number of worker threads processing the blocks in parallel
export const nbWorkers = os.cpus().length //- 1


/**
 * Initialize the processor
 * @param {object} aNotifSock - ZMQ socket used for notifications
 */
export function init(aNotifSock) {
    notifSock = aNotifSock
    const __filename = fileURLToPath(import.meta.url)
    const __dirname = path.dirname(__filename)

    for (let index = 0; index < nbWorkers; index++) {
        const worker = new Worker(
            `${__dirname}/block-worker.js`,
            { workerData: null }
        )
        worker.on('error', processWorkerError)
        worker.on('message', processWorkerMessage)
        blockWorkers.push(worker)
    }
}

/**
 * Process a chunk of block headers
 * @param {object[]} chunk - array of block headers
 */
export async function processChunk(chunk) {
    // Acquire the semaphor (wait for previous chunk)
    await _processBlocksSemaphor.acquire()

    t0 = Date.now()
    const sBlockRange = `${chunk[0].height}-${chunk[chunk.length - 1].height}`
    Logger.info(`Tracker : Beginning to process blocks ${sBlockRange}`)

    // Process the chunk
    chunk.sort((a, b) => a.height - b.height)
    headersChunk = chunk
    txsForBroadcast = []
    processTask(blockWorker.OP_INIT)
}

/**
 * Process an error returned by a worker thread
 * @param {object} e - error
 */
async function processWorkerError(e) {
    return processWorkerMessage({
        'op': currentOp,
        'status': false,
        'res': e
    })
}

/**
 * Process a message returned by a worker thread
 * @param {object} msg - message sent by the worker thread
 */
async function processWorkerMessage(msg) {
    nbTasksCompleted++

    if (!msg.status) {
        Logger.error(msg.res, 'Tracker : processWorkerMessage()')
    } else if (msg.op === blockWorker.OP_CONFIRM) {
        txsForBroadcast = [...txsForBroadcast, ...msg.res]
    }

    if (nbTasksCompleted === nbTasksEnqueued) {
        switch (msg.op) {
        case blockWorker.OP_INIT:
            // Process the transaction outputs
            processTask(blockWorker.OP_PROCESS_OUTPUTS)
            break
        case blockWorker.OP_PROCESS_OUTPUTS:
            // Process the transaction inputs
            processTask(blockWorker.OP_PROCESS_INPUTS)
            break
        case blockWorker.OP_PROCESS_INPUTS:
            // Store the blocks in db and get their id
            const blockIds = await util.seriesCall(headersChunk, async header => {
                return registerBlock(header)
            })
            // Confirm the transactions
            processTask(blockWorker.OP_CONFIRM, blockIds)
            break
        case blockWorker.OP_CONFIRM:
            // Notify new transactions and blocks
            await Promise.all([
                util.parallelCall(txsForBroadcast, async tx => {
                    notifyTx(tx)
                }),
                util.parallelCall(headersChunk, async header => {
                    notifyBlock(header)
                })
            ])
            // Process complete. Reset the workers
            processTask(blockWorker.OP_RESET)
            break
        case blockWorker.OP_RESET:
            const dt = ((Date.now() - t0) / 1000).toFixed(1)
            const per = ((Date.now() - t0) / headersChunk.length).toFixed(0)
            const sBlockRange = `${headersChunk[0].height}-${headersChunk[headersChunk.length - 1].height}`
            Logger.info(`Tracker : Finished processing blocks ${sBlockRange}, ${dt}s, ${per}ms/block`)
            // Release the semaphor
            await _processBlocksSemaphor.release()
            break
        }
    }
}

/**
 * Execute an operation processing a block
 * @param {number} op - operation
 * @param {*} args
 */
function processTask(op, args) {
    currentOp = op
    nbTasksEnqueued = 0
    nbTasksCompleted = 0

    switch (op) {
    case blockWorker.OP_INIT:
        for (const [index, element] of headersChunk.entries()) {
            blockWorkers[index].postMessage({
                'op': op,
                'header': element
            })
            nbTasksEnqueued++
        }
        break
    case blockWorker.OP_PROCESS_OUTPUTS:
    case blockWorker.OP_PROCESS_INPUTS:
    case blockWorker.OP_RESET:
        for (let index = 0; index < headersChunk.length; index++) {
            blockWorkers[index].postMessage({ 'op': op })
            nbTasksEnqueued++
        }
        break
    case blockWorker.OP_CONFIRM:
        for (let index = 0; index < headersChunk.length; index++) {
            blockWorkers[index].postMessage({
                'op': op,
                'blockId': args[index]
            })
            nbTasksEnqueued++
        }
        break
    default:
        Logger.error(null, 'Tracker : processTask() : Unknown operation')
    }
}

/**
 * Notify a new transaction
 * @param {object} tx - bitcoin transaction
 */
function notifyTx(tx) {
    // Real-time client updates for this transaction.
    // Any address input or output present in transaction
    // is a potential client to notify.
    if (notifSock)
        notifSock.send(['transaction', JSON.stringify(tx)])
}

/**
 * Notify a new block
 * @param {string} header - block header
 */
function notifyBlock(header) {
    // Notify clients of the block
    if (notifSock)
        notifSock.send(['block', JSON.stringify(header)])
}

/**
 * Store a block in db
 * @param {object} header - block header
 * @returns {Promise<number>} returns the id of the block
 */
async function registerBlock(header) {
    const previousBlock = await db.getBlockByHash(header.previousblockhash)
    const previousID = (previousBlock && previousBlock.blockID) ? previousBlock.blockID : null

    const blockId = await db.addBlock({
        blockHeight: header.height,
        blockHash: header.hash,
        blockTime: header.time,
        blockParent: previousID
    })

    Logger.info(`Tracker :  Added block ${header.height} (id=${blockId})`)
    return blockId
}
