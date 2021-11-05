/*!
 * pushtx/index.js
 * Copyright © 2019 – Katana Cryptographic Ltd. All Rights Reserved.
 */

import Logger from '../lib/logger.js'
import db from '../lib/db/mysql-db-wrapper.js'
import { waitForBitcoindRpcApi } from '../lib/bitcoind-rpc/rpc-client.js'
import network from '../lib/bitcoin/network.js'
import keysFile from '../keys/index.js'
import HttpServer from '../lib/http-server/http-server.js'
import PushTxRestApi from './pushtx-rest-api.js'
import pushTxProcessor from './pushtx-processor.js'

const keys = keysFile[network.key]

try {
    /**
     * PushTx API
     */
    Logger.info(`PushTx : Process ID: ${process.pid}`)
    Logger.info('PushTx : Preparing the pushTx API')

    // Wait for Bitcoind RPC API
    // being ready to process requests
    await waitForBitcoindRpcApi()

    // Initialize the db wrapper
    const dbConfig = {
        connectionLimit: keys.db.connectionLimitPushTxApi,
        acquireTimeout: keys.db.acquireTimeout,
        host: keys.db.host,
        user: keys.db.user,
        password: keys.db.pass,
        database: keys.db.database
    }

    db.connect(dbConfig)

    // Initialize notification sockets of singleton pushTxProcessor
    pushTxProcessor.initNotifications({
        uriSocket: `tcp://127.0.0.1:${keys.ports.notifpushtx}`
    })

    // Initialize the http server
    const host = keys.apiBind
    const port = keys.ports.pushtx
    const httpServer = new HttpServer(port, host)

    // Initialize the PushTx rest api
    new PushTxRestApi(httpServer)

    // Start the http server
    httpServer.start()

} catch (error) {
    console.error(error)
    process.exit(1)
}
