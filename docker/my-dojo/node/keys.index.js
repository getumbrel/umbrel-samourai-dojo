/*!
 * keys/index-example.js
 * Copyright (c) 2016-2018, Samourai Wallet (CC BY-NC-ND 4.0 License).
 */
import fs from 'fs'


// Retrieve active bitcoin network from conf files
const bitcoinNetwork = (process.env.COMMON_BTC_NETWORK === 'testnet')
    ? 'testnet'
    : 'bitcoin'

// Retrieve explorer config from conf files
let explorerActive = 'oxt'
let explorerUrl = 'https://oxt.me'
let explorerPassword = ''
if (process.env.EXPLORER_INSTALL === 'on') {
    try {
        explorerUrl = fs.readFileSync('/var/lib/tor/hsv3explorer/hostname', 'utf8').replace('\n', '')
        explorerPassword = process.env.EXPLORER_KEY
        explorerActive = 'btc_rpc_explorer'
        // eslint-disable-next-line no-empty
    } catch {}
}


/**
 * Desired structure of /keys/index.js, which is ignored in the repository.
 */
export default {
    /*
     * Mainnet parameters
     */
    [bitcoinNetwork]: {
        /*
         * Dojo version
         */
        dojoVersion: process.env.DOJO_VERSION_TAG,
        /*
         * Bitcoind
         */
        bitcoind: {
            // RPC API
            rpc: {
                // Login
                user: process.env.BITCOIND_RPC_USER,
                // Password
                pass: process.env.BITCOIND_RPC_PASSWORD,
                // IP address
                host: process.env.BITCOIND_IP,
                // TCP port
                port: Number.parseInt(process.env.BITCOIND_RPC_PORT, 10)
            },
            // ZMQ Tx notifications
            zmqTx: `tcp://${process.env.BITCOIND_IP}:${process.env.BITCOIND_ZMQ_RAWTXS}`,
            // ZMQ Block notifications
            zmqBlk: `tcp://${process.env.BITCOIND_IP}:${process.env.BITCOIND_ZMQ_BLK_HASH}`,
            // Fee type (estimatesmartfee)
            feeType: process.env.NODE_FEE_TYPE
        },
        /*
         * MySQL database
         */
        db: {
            // User
            user: process.env.MYSQL_USER,
            // Password
            pass: process.env.MYSQL_PASSWORD,
            // IP address
            host: process.env.NET_DOJO_MYSQL_IPV4,
            // TCP port
            port: 3306,
            // Db name
            database: process.env.MYSQL_DATABASE,
            // Timeout
            acquireTimeout: 15000,
            // Max number of concurrent connections
            // for each module
            connectionLimitApi: 50,
            connectionLimitTracker: 10,
            connectionLimitPushTxApi: 5,
            connectionLimitPushTxOrchestrator: 5
        },
        /*
         * IP address used to expose the API ports
         */
        apiBind: '0.0.0.0',
        /*
         * TCP Ports
         */
        ports: {
            // Port used by the API
            account: 8080,
            // Port used by the pushtx API
            pushtx: 8081,
            // Port used by the tracker API
            trackerApi: 8082,
            // Port used by the tracker for its notifications
            tracker: 5555,
            // Port used by pushtx for its notifications
            notifpushtx: 5556,
            // Port used by the pushtx orchestrator for its notifications
            orchestrator: 5557
        },
        /*
         * Authenticated access to the APIs (account & pushtx)
         */
        auth: {
            // Name of the authentication strategy used
            // Available values:
            //    null          : No authentication
            //    'localApiKey' : authentication with a shared local api key
            activeStrategy: 'localApiKey',
            // Flag indicating if authenticated access is mandatory
            // (useful for launch, othewise should be true)
            // @todo Set to true !!!
            mandatory: true,
            // List of available authentication strategies
            strategies: {
                // Authentication with a shared local api key
                localApiKey: {
                    // List of API keys (alphanumeric characters)
                    apiKeys: [process.env.NODE_API_KEY],
                    // Admin key (alphanumeric characters)
                    adminKey: process.env.NODE_ADMIN_KEY,
                    // DO NOT MODIFY
                    configurator: 'localapikey-strategy-configurator'
                }
            },
            // Configuration of Json Web Tokens
            // used for the management of authorizations
            jwt: {
                // Secret passphrase used by the server to sign the jwt
                // (alphanumeric characters)
                secret: process.env.NODE_JWT_SECRET,
                accessToken: {
                    // Number of seconds after which the jwt expires
                    expires: Number.parseInt(process.env.NODE_JWT_ACCESS_EXPIRES, 10)
                },
                refreshToken: {
                    // Number of seconds after which the jwt expires
                    expires: Number.parseInt(process.env.NODE_JWT_REFRESH_EXPIRES, 10)
                }
            }
        },
        /*
         * Prefixes used by the API
         * for /support and /status endpoints
         */
        prefixes: {
            // Prefix for /support endpoint
            support: process.env.NODE_PREFIX_SUPPORT,
            // Prefix for /status endpoint
            status: process.env.NODE_PREFIX_STATUS,
            // Prefix for pushtx /status endpoint
            statusPushtx: process.env.NODE_PREFIX_STATUS_PUSHTX
        },
        /*
         * Gaps used for derivation of keys
         */
        gap: {
            // Gap for derivation of external addresses
            external: Number.parseInt(process.env.NODE_GAP_EXTERNAL, 10),
            // Gap for derivation of internal (change) addresses
            internal: Number.parseInt(process.env.NODE_GAP_INTERNAL, 10)
        },
        /*
         * Multiaddr endpoint
         */
        multiaddr: {
            // Number of transactions returned by the endpoint
            transactions: 50
        },
        /*
         * Indexer or third party service
         * used for fast scan of addresses
         */
        indexer: {
            // Active indexer
            // Values: local_bitcoind | local_indexer | third_party_explorer
            active: process.env.NODE_ACTIVE_INDEXER,
            // Local indexer
            localIndexer: {
                // IP address or hostname of the local indexer
                host: process.env.INDEXER_IP,
                // Port
                port: Number.parseInt(process.env.INDEXER_RPC_PORT, 10),
                // Support of batch requests by the local indexer
                // Values: active | inactive
                batchRequests: process.env.INDEXER_BATCH_SUPPORT,
                // Protocol for communication (TCP or TLS)
                protocol: process.env.INDEXER_PROTOCOL
            },
            // Use a SOCKS5 proxy for all communications with external services
            // Values: null if no socks5 proxy used, otherwise the url of the socks5 proxy
            socks5Proxy: `socks5h://${process.env.NET_DOJO_TOR_IPV4}:${process.env.TOR_SOCKS_PORT}`,
            // OXT (mainnet)
            oxt: process.env.NODE_URL_OXT_API,
            // Esplora (testnet)
            esplora: process.env.NODE_URL_ESPLORA_API,
        },
        /*
         * Explorer recommended by this Dojo
         */
        explorer: {
            // Active explorer
            // Values: oxt | btc_rpc_explorer
            active: explorerActive,
            // URI of the explorer
            uri: explorerUrl,
            // Password (value required for btc_rpc_explorer)
            password: explorerPassword
        },
        /*
         * Max number of transactions per address
         * accepted during fast scan
         */
        addrFilterThreshold: Number.parseInt(process.env.NODE_ADDR_FILTER_THRESHOLD, 10),
        /*
         * Pool of child processes
         * for parallel derivation of addresses
         * Be careful with these parameters ;)
         */
        addrDerivationPool: {
            // Min number of child processes always running
            minNbChildren: Number.parseInt(process.env.NODE_ADDR_DERIVATION_MIN_CHILD, 10),
            // Max number of child processes allowed
            maxNbChildren: Number.parseInt(process.env.NODE_ADDR_DERIVATION_MAX_CHILD, 10),
            // Max duration
            acquireTimeoutMillis: 60000,
            // Parallel derivation threshold
            // (use parallel derivation if number of addresses to be derived
            //  is greater than thresholdParalleDerivation)
            thresholdParallelDerivation: Number.parseInt(process.env.NODE_ADDR_DERIVATION_THRESHOLD, 10),
        },
        /*
         * PushTx - Scheduler
         */
        txsScheduler: {
            // Max number of transactions allowed in a single script
            maxNbEntries: Number.parseInt(process.env.NODE_TXS_SCHED_MAX_ENTRIES, 10),
            // Max number of blocks allowed in the future
            maxDeltaHeight: Number.parseInt(process.env.NODE_TXS_SCHED_MAX_DELTA_HEIGHT, 10)
        },
        /*
         * Tracker
         */
        tracker: {
            // Processing of mempool (periodicity in ms)
            mempoolProcessPeriod: Number.parseInt(process.env.NODE_TRACKER_MEMPOOL_PERIOD, 10),
            // Processing of unconfirmed transactions (periodicity in ms)
            unconfirmedTxsProcessPeriod: Number.parseInt(process.env.NODE_TRACKER_UNCONF_TXS_PERIOD, 10)
        }
    }

}
