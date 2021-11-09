const screenBlocksRescanScript = {

    initPage: () => {
        // Sets the event handlers
        document.querySelector('#btn-rescan-go').addEventListener('click', () => {
            screenBlocksRescanScript.processRescan()
        })
        document.querySelector('#blocks-rescan').addEventListener('keyup', (evt) => {
            if (evt.key === 'Enter') {
                screenBlocksRescanScript.processRescan()
            }
        })
    },

    preparePage: () => {
        document.querySelector('#rescan-from-height').focus()
    },

    processRescan: () => {
        lib_msg.displayMessage('Processing...')

        let fromHeight = document.querySelector('#rescan-from-height').value
        let toHeight = document.querySelector('#rescan-to-height').value
        fromHeight = Number.parseInt(fromHeight, 10)
        toHeight = (toHeight) ? Number.parseInt(toHeight, 10) : fromHeight

        lib_api.getBlocksRescan(fromHeight, toHeight).then(result => {
            if (!result)
                return
            const fromHeightRes = result.fromHeight
            const toHeightRes = result.toHeight
            const msg = `successfully rescanned blocks between height ${fromHeightRes} and height ${toHeightRes}`
            lib_msg.displayInfo(msg)
        }).catch(error => {
            lib_errors.processError(error)
        }).then(() => {
            document.querySelector('#rescan-from-height').value = ''
            document.querySelector('#rescan-to-height').value = ''
        })
    },

}

screenScripts.set('#screen-blocks-rescan', screenBlocksRescanScript)
