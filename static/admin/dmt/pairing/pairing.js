const screenPairingScript = {

    initPage: () => {},

    preparePage: () => {
        screenPairingScript.displayQRPairing()
    },

    loadPairingPayloads: () => {
        let result = {
            'api': null,
            'explorer': null
        }

        lib_msg.displayMessage('Loading pairing payloads...')

        return Promise.allSettled([lib_api.getPairingInfo(), lib_api.getExplorerPairingInfo()])
            .then(([apiInfo, explorerInfo]) => {
                if (apiInfo.status === 'fulfilled') {
                    result.api = apiInfo.value
                    result.api.pairing.url = `${window.location.protocol}//${window.location.host}${conf.api.baseUri}`
                }

                if (explorerInfo.status === 'fulfilled') {
                    result.explorer = explorerInfo.value
                }

                lib_msg.cleanMessagesUi()
                return result
            })
            .catch((error) => {
                lib_errors.processError(error)
                return result
            })
    },

    displayQRPairing: () => {
        screenPairingScript.loadPairingPayloads().then(
            (result) => {
                if (result) {
                    if (result.api) {
                        const textJson = JSON.stringify(result.api, null, 4)
                        document.querySelector('#qr-pairing').innerHTML = '' // clear qrcode first

                        const pairingQrcode = new QRCode({ content: textJson, join: true, height: 256, width: 256 }).svg()
                        document.querySelector('#qr-pairing').innerHTML = pairingQrcode
                    }
                    if (result.explorer && result.explorer.pairing.url) {
                        const textJson = JSON.stringify(result.explorer, null, 4)
                        document.querySelector('#qr-explorer-pairing').innerHTML = '' // clear qrcode first

                        const pairingExplorerQrcode = new QRCode({ content: textJson, join: true, height: 256, width: 256 }).svg()

                        document.querySelector('#qr-explorer-pairing').innerHTML = pairingExplorerQrcode
                    } else {
                        document.querySelector('#qr-label').classList.remove('halfwidth')
                        document.querySelector('#qr-label').classList.add('fullwidth')
                        document.querySelector('#qr-container').classList.remove('halfwidth')
                        document.querySelector('#qr-container').classList.add('fullwidth')
                        document.querySelector('#qr-explorer-label').setAttribute('hidden', '')
                        document.querySelector('#qr-explorer-container').setAttribute('hidden', '')
                    }
                }
            }
        )
    }

}

screenScripts.set('#screen-pairing', screenPairingScript)
