/*!
 * lib/remote-importer/sources-testnet.js
 * Copyright © 2019 – Katana Cryptographic Ltd. All Rights Reserved.
 */
'use strict'

const network = require('../bitcoin/network')
const util = require('../util')
const Logger = require('../logger')
const keys = require('../../keys')[network.key]
const Sources = require('./sources')
const BitcoindWrapper = require('./bitcoind-wrapper')
const LocalIndexerWrapper = require('./local-indexer-wrapper')
const LocalRestIndexerWrapper = require('./local-rest-indexer-wrapper')
const EsploraWrapper = require('./esplora-wrapper')


/**
 * Remote data sources for testnet
 */
class SourcesTestnet extends Sources {

  /**
   * Constructor
   */
  constructor() {
    super()
    this._initSource()
  }

  /**
   * Initialize the external data source
   */
  _initSource() {
    if (keys.indexer.active == 'local_bitcoind') {
      // If local bitcoind option is activated
      // we'll use the local node as our unique source
      this.source = new BitcoindWrapper()
      Logger.info('Importer : Activated Bitcoind as the data source for imports')
    } else if (keys.indexer.active == 'local_indexer') {
      // If local indexer option is activated
      // we'll use the local indexer as our unique source
      this.source = new LocalIndexerWrapper()
      Logger.info('Importer : Activated local indexer as the data source for imports')
    } else if (keys.indexer.active == 'local_rest_indexer') {
      // If local rest indexer option is activated
      // we'll use the local indexer as our unique source
      const uri = `http://${keys.indexer.localIndexer.host}:${keys.indexer.localIndexer.port}`
      this.source = new LocalRestIndexerWrapper(uri)
      Logger.info('Importer : Activated local indexer (REST API) as the data source for imports')
    } else {
      // Otherwise, we'll use the rest api provided by Esplora
      this.source = new EsploraWrapper(keys.indexer.esplora)
      Logger.info('Importer : Activated Esplora API as the data source for imports')
    }
  }

}

module.exports = SourcesTestnet
