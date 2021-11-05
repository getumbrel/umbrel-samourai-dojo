/*!
 * accounts/index-cluster.js
 * Copyright © 2019 – Katana Cryptographic Ltd. All Rights Reserved.
 */


import os from 'os'
import cluster from 'cluster'

import Logger from '../lib/logger.js'

/**
 * Launch a cluster of Samourai API
 */
const nbCPUS = os.cpus()

if (cluster.isMaster) {
    // eslint-disable-next-line unicorn/no-array-for-each
    nbCPUS.forEach(() => {
        cluster.fork()
    })

    cluster.on('listening', (worker) => {
        Logger.info(`API : Cluster ${worker.process.pid} connected`)
    })

    cluster.on('disconnect', (worker) => {
        Logger.info(`API : Cluster ${worker.process.pid} disconnected`)
    })

    cluster.on('exit', (worker) => {
        Logger.info(`API : Cluster ${worker.process.pid} is dead`)
        // Ensuring a new cluster will start if an old one dies
        cluster.fork()
    })
} else {
    await import('./index.js')
}
