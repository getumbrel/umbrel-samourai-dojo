/*!
 * pushtx/index-orchestrator.js
 * Copyright © 2019 – Katana Cryptographic Ltd. All Rights Reserved.
 */
(async () => {

  'use strict'

  const Logger = require('../lib/logger')
  const db = require('../lib/db/mysql-db-wrapper')
  const { waitForBitcoindRpcApi } = require('../lib/bitcoind-rpc/rpc-client')
  const network = require('../lib/bitcoin/network')
  const keys = require('../keys')[network.key]
  const Orchestrator = require('./orchestrator')
  const pushTxProcessor = require('./pushtx-processor')


  /**
   * PushTx Orchestrator
   */
  Logger.info('Orchestrator : Process ID: ' + process.pid)
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

})().catch(err => {
  console.error(err)
  process.exit(1)
})
