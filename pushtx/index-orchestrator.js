/*!
 * pushtx/index-orchestrator.js
 * Copyright © 2019 – Katana Cryptographic Ltd. All Rights Reserved.
 */

import Logger from '../lib/logger.js'
import db from '../lib/db/mysql-db-wrapper.js'
import { waitForBitcoindRpcApi } from '../lib/bitcoind-rpc/rpc-client.js'
import network from '../lib/bitcoin/network.js'
import keysFile from '../keys/index.js'
import Orchestrator from './orchestrator.js'
import pushTxProcessor from './pushtx-processor.js'

const keys = keysFile[network.key]

try {
    /**
     * PushTx Orchestrator
     */
    Logger.info(`Orchestrator : Process ID: ${process.pid}`)
    Logger.info('Orchestrator : Preparing the pushTx Orchestrator')

    // Wait for Bitcoind RPC API
    // being ready to process requests
    await waitForBitcoindRpcApi()

    // Initialize the db wrapper
    const dbConfig = {
        connectionLimit: keys.db.connectionLimitPushTxOrchestrator,
        acquireTimeout: keys.db.acquireTimeout,
        host: keys.db.host,
        user: keys.db.user,
        password: keys.db.pass,
        database: keys.db.database
    }

    db.connect(dbConfig)

    // Initialize notification sockets of singleton pushTxProcessor
    pushTxProcessor.initNotifications({
        uriSocket: `tcp://127.0.0.1:${keys.ports.orchestrator}`
    })

    // Initialize and start the orchestrator
    const orchestrator = new Orchestrator()
    orchestrator.start()

} catch (error) {
    console.error(error)
    process.exit(1)
}
