/*!
 * accounts/wallet-rest-api.js
 * Copyright © 2019 – Katana Cryptographic Ltd. All Rights Reserved.
 */


// eslint-disable-next-line import/no-unresolved
import { urlencoded } from 'milliparsec'

import Logger from '../lib/logger.js'
import errors from '../lib/errors.js'
import walletService from '../lib/wallet/wallet-service.js'
import authMgr from '../lib/auth/authorizations-manager.js'
import HttpServer from '../lib/http-server/http-server.js'
import apiHelper from './api-helper.js'
import hdaService from '../lib/bitcoin/hd-accounts-service.js'

const debugApi = process.argv.includes('api-debug')

/**
 * Wallet API endpoints
 */
class WalletRestApi {

    /**
     * Constructor
     * @param {HttpServer} httpServer - HTTP server
     */
    constructor(httpServer) {
        this.httpServer = httpServer

        // Establish routes
        const urlencodedParser = urlencoded()

        this.httpServer.app.get(
            '/wallet',
            authMgr.checkAuthentication.bind(authMgr),
            apiHelper.validateEntitiesParams.bind(apiHelper),
            this.getWallet.bind(this),
        )

        this.httpServer.app.post(
            '/wallet',
            urlencodedParser,
            authMgr.checkAuthentication.bind(authMgr),
            apiHelper.validateEntitiesParams.bind(apiHelper),
            this.postWallet.bind(this),
        )
    }

    /**
     * Handle wallet GET request
     * @param {object} req - http request object
     * @param {object} res - http response object
     */
    async getWallet(req, res) {
        try {
            // Check request params
            if (!apiHelper.checkEntitiesParams(req.query))
                return HttpServer.sendError(res, errors.multiaddr.NOACT)

            // Parse params
            const entities = apiHelper.parseEntitiesParams(req.query)

            if (req.query.importPostmixLikeTypeChange) {
                await hdaService.importPostmixLikeTypeChange(entities.active.xpubs)
            }

            const result = await walletService.getFullWalletInfo(
                entities.active,
                entities.legacy,
                entities.bip49,
                entities.bip84,
                entities.pubkey
            )

            const returnValue = JSON.stringify(result, null, 2)
            HttpServer.sendRawData(res, returnValue)

        } catch (error) {
            HttpServer.sendError(res, error)

        } finally {
            if (debugApi) {
                const stringParameters =
                    `${req.query.active ? req.query.active : ''} \
                     ${req.query.new ? req.query.new : ''} \
                     ${req.query.pubkey ? req.query.pubkey : ''} \
                     ${req.query.bip49 ? req.query.bip49 : ''} \
                     ${req.query.bip84 ? req.query.bip84 : ''}`

                Logger.info(`API : Completed GET /wallet ${stringParameters}`)
            }
        }
    }

    /**
     * Handle wallet POST request
     * @param {object} req - http request object
     * @param {object} res - http response object
     */
    async postWallet(req, res) {
        try {
            // Check request params
            if (!apiHelper.checkEntitiesParams(req.body))
                return HttpServer.sendError(res, errors.multiaddr.NOACT)

            // Parse params
            const entities = apiHelper.parseEntitiesParams(req.body)

            if (req.body.importPostmixLikeTypeChange) {
                await hdaService.importPostmixLikeTypeChange(entities.active.xpubs)
            }

            const result = await walletService.getFullWalletInfo(
                entities.active,
                entities.legacy,
                entities.bip49,
                entities.bip84,
                entities.pubkey
            )

            HttpServer.sendOkDataOnly(res, result)

        } catch (error) {
            HttpServer.sendError(res, error)

        } finally {
            if (debugApi) {
                const stringParameters =
                    `${req.body.active ? req.body.active : ''} \
                     ${req.body.new ? req.body.new : ''} \
                     ${req.body.pubkey ? req.body.pubkey : ''} \
                     ${req.body.bip49 ? req.body.bip49 : ''} \
                     ${req.body.bip84 ? req.body.bip84 : ''}`

                Logger.info(`API : Completed POST /wallet ${stringParameters}`)
            }
        }
    }

}

export default WalletRestApi
