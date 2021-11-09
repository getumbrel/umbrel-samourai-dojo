// eslint-disable-next-line no-unused-vars
const lib_cmn = {

    // Go to default page
    goToDefaultPage: () => {
        const { baseUri } = conf.adminTool
        sessionStorage.setItem('activeTab', '#link-status')
        window.location = `${baseUri}/dmt/`
    },

    // Go to home page
    goToHomePage: () => {
        sessionStorage.setItem('activeTab', null)
        window.location = `${conf.adminTool.baseUri}/`
    },

    // Get Transaction url on selected explorer
    getExplorerTxUrl: (txid, explorerInfo) => {
        if (explorerInfo == null)
            return null
        else if (explorerInfo.pairing.type === 'explorer.oxt')
            return `${explorerInfo.pairing.url}/transaction/${txid}`
        else if (explorerInfo.pairing.type === 'explorer.btc_rpc_explorer')
            return `http://${explorerInfo.pairing.url}/tx/${txid}`
        else
            return null
    },

    // Loads html snippets
    includeHTML: async (cb) => {
        const includes = document.querySelectorAll('[data-include-html]')

        const promises = []

        for (const include of includes) {
            const file = include.getAttribute('data-include-html')

            if (file) {
                promises.push(fetch(file)
                    .then((response) => {
                        if (response.ok) {
                            return response.text()
                        }

                        throw new Error('Received invalid response')
                    })
                    .then((fileContents) => {
                        include.innerHTML = fileContents
                        include.removeAttribute('data-include-html')
                        return lib_cmn.includeJs(include)
                    }))
            }
        }

        await Promise.all(promises)
        if (cb) cb()
    },

    // Loads js snippets
    includeJs: async (element) => {
        const includes = element.querySelectorAll('script[data-include-js]')
        const promises = []

        for (const include of includes) {
            const file = include.getAttribute('data-include-js')

            if (file) {
                promises.push(fetch(file)
                    .then((response) => {
                        if (response.ok) {
                            return response.text()
                        }

                        throw new Error('Received invalid response')
                    })
                    .then((fileContents) => {
                        const newElement = document.createElement('script')
                        newElement.textContent = fileContents

                        if (include.parentNode) {
                            include.parentNode.insertBefore(newElement, include.nextSibling)
                            include.remove()
                        }
                    }))
            }
        }

        return await Promise.all(promises)
    },

    pad10: (v) => (v < 10) ? `0${v}` : `${v}`,

    pad100: (v) => {
        if (v < 10) return `00${v}`
        if (v < 100) return `0${v}`
        return `${v}`
    },

    timePeriod: (period, milliseconds) => {
        milliseconds = Boolean(milliseconds)

        const whole = Math.floor(period)
        const ms = 1000 * (period - whole)
        const s = whole % 60
        const m = (whole >= 60) ? Math.floor(whole / 60) % 60 : 0
        const h = (whole >= 3600) ? Math.floor(whole / 3600) % 24 : 0
        const d = (whole >= 86400) ? Math.floor(whole / 86400) : 0

        const parts = [lib_cmn.pad10(h), lib_cmn.pad10(m), lib_cmn.pad10(s)]

        if (d > 0)
            parts.splice(0, 0, lib_cmn.pad100(d))

        const str = parts.join(':')

        return milliseconds ? `${str}.${lib_cmn.pad100(ms)}` : str
    }

}
