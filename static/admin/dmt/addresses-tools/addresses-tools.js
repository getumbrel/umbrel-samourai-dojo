const screenAddressesToolsScript = {

    explorerInfo: null,
    currentAddress: null,

    initPage: () => {
        screenAddressesToolsScript.getExplorerInfo()
        // Sets the event handlers
        document.querySelector('#btn-address-search-go').addEventListener('click', () => {
            screenAddressesToolsScript.searchAddress()
        })
        document.querySelector('#btn-address-details-reset').addEventListener('click', () => {
            screenAddressesToolsScript.showSearchForm()
        })
        document.querySelector('#btn-address-details-rescan').addEventListener('click', () => {
            screenAddressesToolsScript.showRescanForm()
        })
        document.querySelector('#btn-address-rescan-go').addEventListener('click', () => {
            screenAddressesToolsScript.rescanAddress()
        })
        document.querySelector('#btn-address-rescan-cancel').addEventListener('click', () => {
            screenAddressesToolsScript.hideRescanForm()
        })
        document.querySelector('#btn-address-import-go').addEventListener('click', () => {
            screenAddressesToolsScript.importAddress()
        })
        document.querySelector('#btn-address-import-cancel').addEventListener('click', () => {
            screenAddressesToolsScript.showSearchForm()
        })
        document.querySelector('#addresses-tool').addEventListener('keyup', (evt) => {
            if (evt.key === 'Enter') {
                screenAddressesToolsScript.searchAddress()
            }
        })
    },

    preparePage: () => {
        screenAddressesToolsScript.hideRescanForm()
        screenAddressesToolsScript.showSearchForm()
        document.querySelector('#address').focus()
    },

    getExplorerInfo: () => {
        lib_api.getExplorerPairingInfo().then(explorerInfo => {
            screenAddressesToolsScript.explorerInfo = explorerInfo
        }).catch(error => {
            lib_errors.processError(error)
        })
    },

    searchAddress: () => {
        lib_msg.displayMessage('Search in progress...')
        const address = document.querySelector('#address').value
        screenAddressesToolsScript.currentAddress = address
        return screenAddressesToolsScript._searchAddress(address).then(() => {
            lib_msg.cleanMessagesUi()
        })
    },

    _searchAddress: (address) => lib_api.getAddressInfo(address).then(addressInfo => {
        if (addressInfo && addressInfo.tracked) {
            screenAddressesToolsScript.setAddressDetails(addressInfo)
            screenAddressesToolsScript.showAddressDetails()
            const jsonData = { 'active': address }
            return lib_api.getWallet(jsonData).then(walletInfo => {
                // Display the txs
                const { txs, unspent_outputs } = walletInfo
                for (let tx of txs)
                    screenAddressesToolsScript.setTxDetails(tx)
                // Display the UTXOs
                const utxos = unspent_outputs.sort((a, b) => {
                    return a.confirmations - b.confirmations
                })
                document.querySelector('#addr-nb-utxos').textContent = utxos.length
                for (let utxo of utxos)
                    screenAddressesToolsScript.setUtxoDetails(utxo)
            })
        } else {
            lib_msg.displayErrors('address not found')
            screenAddressesToolsScript.showImportForm(false)
        }
    }).catch(error => {
        lib_errors.processError(error)
        throw error
    }),

    importAddress: () => {
        lib_msg.displayMessage('Processing address import. Please wait...')
        const jsonData = { 'active': screenAddressesToolsScript.currentAddress }
        return lib_api.getWallet(jsonData)
            .then(() => {
                screenAddressesToolsScript._searchAddress(screenAddressesToolsScript.currentAddress).then(() => {
                    lib_msg.displayInfo('Import complete')
                })
            }).catch(error => {
                lib_errors.processError(error)
            })
    },

    rescanAddress: () => {
        lib_msg.displayMessage('Processing address rescan. Please wait...')
        return lib_api.getAddressRescan(screenAddressesToolsScript.currentAddress)
            .then(() => {
                screenAddressesToolsScript.hideRescanForm()
                screenAddressesToolsScript._searchAddress(screenAddressesToolsScript.currentAddress).then(() => {
                    lib_msg.displayInfo('Rescan complete')
                })
            }).catch(error => {
                lib_errors.processError(error)
            })
    },

    setAddressDetails: addressInfo => {
        for (const elem of document.querySelectorAll('tr.tx-row')) {
            elem.remove()
        }
        for (const elem of document.querySelectorAll('tr.utxo-row')) {
            elem.remove()
        }

        document.querySelector('#addr-value').textContent = screenAddressesToolsScript.currentAddress
        document.querySelector('#addr-nb-txs').textContent = addressInfo.n_tx
        document.querySelector('#addr-nb-utxos').textContent = '-'

        const balance = Number.parseInt(addressInfo.balance, 10) / 100000000
        document.querySelector('#addr-balance').textContent = `${balance} BTC`

        const addrType = (addressInfo.type === 'hd') ? 'Derived from an XPUB' : 'Loose address'
        document.querySelector('#addr-type').textContent = addrType

        if (addressInfo.segwit) {
            document.querySelector('#addr-segwit').innerHTML = '&#10003;'
            document.querySelector('#addr-segwit').style.color = '#76d776'
        } else {
            document.querySelector('#addr-segwit').textContent = '-'
            document.querySelector('#addr-segwit').style.color = '#f77c7c'
        }

        if (addressInfo.type === 'hd') {
            document.querySelector('#addr-xpub').textContent = addressInfo.xpub
            document.querySelector('#addr-deriv-path').textContent = addressInfo.path
            document.querySelector('#addresses-tool-details-row2').removeAttribute('hidden')
        } else {
            document.querySelector('#addresses-tool-details-row2').setAttribute('hidden', '')
        }
    },

    setTxDetails: (tx) => {
        const txid = tx.hash
        const txidDisplay = `${txid.slice(0, 50)}...`
        const amount = Number.parseInt(tx.result, 10) / 100000000
        const amountLabel = amount < 0 ? amount : `+${amount}`
        const amountStyle = amount < 0 ? 'amount-sent' : 'amount-received'
        const date = lib_fmt.unixTsToLocaleString(tx.time)
        const txUrl = lib_cmn.getExplorerTxUrl(txid, screenAddressesToolsScript.explorerInfo)

        const newRow = `<tr class="tx-row"><td colspan="2">&nbsp;</td></tr>
      <tr class="tx-row">
        <td class="table-label" colspan="2">
          <a href="${txUrl}" target="_blank">${txidDisplay}</a>
        </td>
      </tr>
      <tr class="tx-row">
        <td class="table-label">Amount</td>
        <td class="table-value ${amountStyle}">${amountLabel} BTC</td>
      </tr>
      <tr class="tx-row">
        <td class="table-label">Block height</td>
        <td class="table-value">${tx.block_height}</td>
      </tr>
      <tr class="tx-row">
        <td class="table-label">Date</td>
        <td class="table-value">${date}</td>
      </tr>`

        document.querySelector('#addr-table-list-txs tr:last-child').insertAdjacentHTML('afterend', newRow)
    },

    setUtxoDetails: utxo => {
        const txid = utxo.tx_hash
        const txidVout = `${txid.slice(0, 50)}...:${utxo.tx_output_n}`
        const amount = Number.parseInt(utxo.value, 10) / 100000000
        const txUrl = lib_cmn.getExplorerTxUrl(txid, screenAddressesToolsScript.explorerInfo)

        const newRow = `<tr class="utxo-row"><td colspan="2">&nbsp;</td></tr>
      <tr class="utxo-row">
        <td class="table-label" colspan="2">
          <a href="${txUrl}" target="_blank">${txidVout}</a>
        </td>
      </tr>
      <tr class="utxo-row">
        <td class="table-label">Amount</td>
        <td class="table-value">${amount} BTC</td>
      </tr>
      <tr class="utxo-row">
        <td class="table-label">Address</td>
        <td class="table-value">${utxo.addr}</td>
      </tr>
      <tr class="utxo-row">
        <td class="table-label">Confirmations</td>
        <td class="table-value">${utxo.confirmations}</td>
      </tr>`

        document.querySelector('#addr-table-list-utxos tr:last-child').insertAdjacentHTML('afterend', newRow)
    },

    showSearchForm: () => {
        document.querySelector('#addresses-tool-details').setAttribute('hidden', '')
        document.querySelector('#addresses-tool-import').setAttribute('hidden', '')
        document.querySelector('#address').value = ''
        document.querySelector('#addresses-tool-search-form').removeAttribute('hidden')
        lib_msg.cleanMessagesUi()
    },

    showImportForm: () => {
        document.querySelector('#addresses-tool-search-form').setAttribute('hidden', '')
        document.querySelector('#addresses-tool-details').setAttribute('hidden', '')
        document.querySelector('#import-address').textContent = screenAddressesToolsScript.currentAddress
        document.querySelector('#addresses-tool-import').removeAttribute('hidden')
    },

    showAddressDetails: () => {
        document.querySelector('#addresses-tool-search-form').setAttribute('hidden', '')
        document.querySelector('#addresses-tool-import').setAttribute('hidden', '')
        document.querySelector('#addresses-tool-details').removeAttribute('hidden')
    },

    showRescanForm: () => {
        document.querySelector('#addresses-tool-actions').setAttribute('hidden', '')
        document.querySelector('#addresses-rescans-actions').removeAttribute('hidden')
        lib_msg.cleanMessagesUi()
    },

    hideRescanForm: () => {
        document.querySelector('#addresses-rescans-actions').setAttribute('hidden', '')
        document.querySelector('#addresses-tool-actions').removeAttribute('hidden')
    },
}

screenScripts.set('#screen-addresses-tools', screenAddressesToolsScript)
