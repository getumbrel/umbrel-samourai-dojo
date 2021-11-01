/*!
 * scripts/createfirstblocks.js
 * Copyright © 2019 – Katana Cryptographic Ltd. All Rights Reserved.
 */


import Logger from '../lib/logger.js'
import util from '../lib/util.js'
import db from '../lib/db/mysql-db-wrapper.js'
import network from '../lib/bitcoin/network.js'
import { createRpcClient } from '../lib/bitcoind-rpc/rpc-client.js'
import keysFile from '../keys/index.js'

const keys = keysFile[network.key]


/**
 * Script inserting first blocks into the database
 * (without a scan of transactions)
 */

// RPC Client requests data from bitcoind
let client = createRpcClient()

// Database id of the previous block
let prevID = null;


async function processBlock(height) {
  Logger.info('Start processing block ' + height)

  const blockHash = await client.getblockhash({ height })

  if (blockHash) {
    const header = await client.getblockheader({ blockhash: blockHash, verbose: true })

    if (header) {
      const dbBlock = {
        blockHeight: header.height,
        blockHash: header.hash,
        blockTime: header.time,
        blockParent: prevID
      }

      prevID = await db.addBlock(dbBlock)
      Logger.info('Successfully processed block ' + height)

    } else {
      Logger.error(null, 'Unable to retrieve header of block ' + height)
      return Promise.reject()
    }

  } else {
    Logger.error(null, 'Unable to find hash of block ' + height)
    return Promise.reject()
  }
}


async function run(heights) {
  return util.seriesCall(heights, processBlock)
}


/**
 * Launch the script
 */

// Retrieves command line arguments
if (process.argv.length < 3) {
  Logger.error(null, 'Missing arguments. Command = node create-first-blocks.js <number_of_blocks>')
  return
}

// Create list of integers from 0 to index passed as parameter (included)
const n = parseInt(process.argv[2])
const heights = Array.from(Array(n).keys())

Logger.info('Start processing')

const startupTimeout = setTimeout(async function() {
  return run(heights).then(() => {
    Logger.info('Processing completed')
  })
}, 1500)
