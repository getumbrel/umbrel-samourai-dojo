const screenXpubsToolsScript = {

    explorerInfo: null,
    currentXpub: null,
    isReimport: false,
    rescanStatusTimerId: null,

    initPage: () => {
        screenXpubsToolsScript.getExplorerInfo()
        // Sets the event handlers
        document.querySelector('#btn-xpub-search-go').addEventListener('click', () => {
            screenXpubsToolsScript.searchXpub()
        })
        document.querySelector('#btn-xpub-details-reset').addEventListener('click', () => {
            screenXpubsToolsScript.showSearchForm()
        })
        document.querySelector('#btn-xpub-details-rescan').addEventListener('click', () => {
            screenXpubsToolsScript.showRescanForm()
        })
        document.querySelector('#btn-xpub-details-delete').addEventListener('click', () => {
            screenXpubsToolsScript.showDeletionForm()
        })
        document.querySelector('#btn-xpub-details-export').addEventListener('click', () => {
            screenXpubsToolsScript.showExportForm()
        })
        document.querySelector('#btn-xpub-rescan-go').addEventListener('click', () => {
            screenXpubsToolsScript.rescanXpub()
        })
        document.querySelector('#btn-xpub-rescan-cancel').addEventListener('click', () => {
            screenXpubsToolsScript.hideRescanForm()
        })
        document.querySelector('#btn-xpub-delete-go').addEventListener('click', () => {
            screenXpubsToolsScript.deleteXpub()
        })
        document.querySelector('#btn-xpub-delete-cancel').addEventListener('click', () => {
            screenXpubsToolsScript.hideDeletionForm()
        })
        document.querySelector('#btn-xpub-export-go').addEventListener('click', () => {
            screenXpubsToolsScript.exportXpubHistory()
        })
        document.querySelector('#btn-xpub-export-cancel').addEventListener('click', () => {
            screenXpubsToolsScript.hideExportForm()
        })
        document.querySelector('#btn-xpub-import-go').addEventListener('click', () => {
            screenXpubsToolsScript.importXpub()
        })
        document.querySelector('#btn-xpub-details-retype').addEventListener('click', () => {
            screenXpubsToolsScript.showImportForm(true)
        })
        document.querySelector('#btn-xpub-import-cancel').addEventListener('click', () => {
            screenXpubsToolsScript.hideImportForm(screenXpubsToolsScript.isReimport)
        })
        document.querySelector('#xpubs-tool').addEventListener( 'keyup', (evt) => {
            if (evt.key === 'Enter') {
                screenXpubsToolsScript.searchXpub()
            }
        })
    },

    preparePage: () => {
        // Disable custom lookahead if data source is a third party explorer
        const isTPE = sessionStorage.getItem('indexerType') === 'third_party_explorer'
        const isLRI = sessionStorage.getItem('indexerType') === 'local_rest_indexer'
        const disableLookahead = isTPE || isLRI
        document.querySelector('#rescan-lookahead').disabled = disableLookahead

        screenXpubsToolsScript.hideRescanForm()
        screenXpubsToolsScript.hideDeletionForm()
        screenXpubsToolsScript.hideExportForm()
        screenXpubsToolsScript.showSearchForm()
        document.querySelector('#xpub').focus()
    },

    getExplorerInfo: () => {
        lib_api.getExplorerPairingInfo().then(explorerInfo => {
            screenXpubsToolsScript.explorerInfo = explorerInfo
        }).catch(error => {
            lib_errors.processError(error)
        })
    },

    searchXpub: () => {
        lib_msg.displayMessage('Search in progress...')
        const xpub = document.querySelector('#xpub').value
        screenXpubsToolsScript.currentXpub = xpub
        return screenXpubsToolsScript._searchXpub(xpub).then(() => {
            lib_msg.cleanMessagesUi()
        })
    },

    _searchXpub: xpub => lib_api.getXpubInfo(xpub).then(xpubInfo => {
        if (xpubInfo && xpubInfo.tracked) {
            screenXpubsToolsScript.setXpubDetails(xpubInfo)
            screenXpubsToolsScript.showXpubDetails()
            const jsonData = { 'active': xpub }
            return lib_api.getWallet(jsonData).then(walletInfo => {
                // Display the txs
                const { txs, unspent_outputs } = walletInfo
                for (let tx of txs)
                    screenXpubsToolsScript.setTxDetails(tx)
                // Display the UTXOs
                const utxos = unspent_outputs.sort((a, b) => {
                    return a.confirmations - b.confirmations
                })
                document.querySelector('#xpub-nb-utxos').textContent = utxos.length
                for (let utxo of utxos)
                    screenXpubsToolsScript.setUtxoDetails(utxo)
            })
        } else {
            lib_msg.displayErrors('xpub not found')
            screenXpubsToolsScript.showImportForm(false)
        }
    }).catch(error => {
        lib_errors.processError(error)
        throw error
    }),

    importXpub: () => {
        lib_msg.displayMessage('Processing xpub import. Please wait...')

        const jsonData = {
            'xpub': screenXpubsToolsScript.currentXpub,
            'type': 'restore',
            'force': true
        }

        const derivType = document.querySelector('#import-deriv-type').value
        if (derivType === 'bip49' || derivType === 'bip84') {
            jsonData.segwit = derivType
        } else if (derivType === 'auto') {
            if (screenXpubsToolsScript.currentXpub.startsWith('ypub') || screenXpubsToolsScript.currentXpub.startsWith('upub'))
                jsonData.segwit = 'bip49'
            else if (screenXpubsToolsScript.currentXpub.startsWith('zpub') || screenXpubsToolsScript.currentXpub.startsWith('vpub'))
                jsonData.segwit = 'bip84'
        }

        try {
            lib_api.postXpub(jsonData)
            // Wait for import completion and display progress
            screenXpubsToolsScript.checkRescanStatus(() => {
                screenXpubsToolsScript._searchXpub(screenXpubsToolsScript.currentXpub).then(() => {
                    lib_msg.displayInfo('Import complete')
                })
            })
        } catch (error) {
            lib_errors.processError(error)
        }
    },

    rescanXpub: () => {
        lib_msg.displayMessage('Processing xpub rescan. Please wait...')
        let startIdx = document.querySelector('#rescan-start-idx').value
        startIdx = (startIdx == null) ? 0 : Number.parseInt(startIdx, 10)
        let lookahead = document.querySelector('#rescan-lookahead').value
        lookahead = (lookahead == null) ? 100 : Number.parseInt(lookahead, 10)

        try {
            lib_api.getXpubRescan(screenXpubsToolsScript.currentXpub, lookahead, startIdx)
            // Wait for rescan completion and display progress
            screenXpubsToolsScript.checkRescanStatus(() => {
                screenXpubsToolsScript.hideRescanForm()
                screenXpubsToolsScript._searchXpub(screenXpubsToolsScript.currentXpub).then(() => {
                    lib_msg.displayInfo('Rescan complete')
                })
            })
        } catch (error) {
            lib_errors.processError(error)
        }
    },

    deleteXpub: () => {
        lib_msg.displayMessage('Deleting a xpub. Please wait...')
        return lib_api.getXpubDelete(screenXpubsToolsScript.currentXpub)
            .then(() => {
                screenXpubsToolsScript.currentXpub = null
                screenXpubsToolsScript.preparePage()
                lib_msg.displayInfo('Xpub successfully deleted')
            }).catch(error => {
                lib_errors.processError(error)
            })
    },

    exportXpubHistory: () => {
        lib_msg.displayMessage('Exporting the transactional history of this xpub. Please wait...')

        const args = {
            'active': screenXpubsToolsScript.currentXpub,
            'page': 0,
            'count': 1000000000
        }

        if (document.querySelector('#export-type').value === 'notNull')
            args.excludeNullXfer = 1

        return lib_api.getTransactions(args)
            .then(result => {
                if (result.txs && result.txs.length > 0) {
                    let content = 'data:text/csv;charset=utf-8,'
                    content += 'height,txid,date,flow\n'
                    for (let tx of result.txs)
                        content += `${tx.block_height},${tx.hash},${new Date(tx.time * 1000).toString()},${tx.result / 100000000}\n`
                    const encodedURI = encodeURI(content)
                    window.open(encodedURI)
                }
                screenXpubsToolsScript.hideExportForm()
                lib_msg.displayInfo('Transactional history successfully exported.')
            }).catch(error => {
                lib_errors.processError(error)
            })
    },

    checkRescanStatus: callback => {
        screenXpubsToolsScript.rescanStatusTimerId = setTimeout(() => {
            lib_api.getXpubRescanStatus(screenXpubsToolsScript.currentXpub)
                .then(result => {
                    const {data} = result
                    if (data.import_in_progress) {
                        const lblOp = (data.status === 'rescan') ? 'Rescan' : 'Import'
                        const lblHits = (data.status === 'rescan') ? 'hits detected' : 'transactions imported'
                        const msg = `${lblOp} in progress (${data.hits} ${lblHits})`
                        lib_msg.displayMessage(msg)
                        return screenXpubsToolsScript.checkRescanStatus(callback)
                    } else {
                        clearTimeout(screenXpubsToolsScript.rescanStatusTimerId)
                        return callback()
                    }
                }).catch(error => {
                    lib_errors.processError(error)
                    lib_msg.displayMessage('Rescan in progress. Please wait...')
                    return screenXpubsToolsScript.checkRescanStatus(callback)
                })
        }, 1000)
    },

    setXpubDetails: xpubInfo => {
        for (const elem of document.querySelectorAll('tr.tx-row')) {
            elem.remove()
        }
        for (const elem of document.querySelectorAll('tr.utxo-row')) {
            elem.remove()
        }

        document.querySelector('#xpub-value').textContent = screenXpubsToolsScript.currentXpub
        document.querySelector('#xpub-import-date').textContent = xpubInfo.created
        document.querySelector('#xpub-deriv-type').textContent = xpubInfo.derivation
        document.querySelector('#xpub-nb-txs').textContent = xpubInfo.n_tx
        document.querySelector('#xpub-nb-utxos').textContent = '-'
        const balance = Number.parseInt(xpubInfo.balance, 10) / 100000000
        document.querySelector('#xpub-balance').textContent = `${balance} BTC`
        document.querySelector('#xpub-deriv-account').textContent = xpubInfo.account
        document.querySelector('#xpub-deriv-depth').textContent = xpubInfo.depth
        document.querySelector('#xpub-idx-unused-ext').textContent = xpubInfo.unused.external
        document.querySelector('#xpub-idx-derived-ext').textContent = xpubInfo.derived.external
        document.querySelector('#xpub-idx-unused-int').textContent = xpubInfo.unused.internal
        document.querySelector('#xpub-idx-derived-int').textContent = xpubInfo.derived.internal
    },

    setTxDetails: tx => {
        const txid = tx.hash
        const txidDisplay = `${txid.slice(0, 50)}...`
        const amount = Number.parseInt(tx.result, 10) / 100000000
        const amountLabel = amount < 0 ? amount : `+${amount}`
        const amountStyle = amount < 0 ? 'amount-sent' : 'amount-received'
        const date = lib_fmt.unixTsToLocaleString(tx.time)
        const txUrl = lib_cmn.getExplorerTxUrl(txid, screenXpubsToolsScript.explorerInfo)

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

        document.querySelector('#xpub-table-list-txs tr:last-child').insertAdjacentHTML('afterend', newRow)
    },

    setUtxoDetails: utxo => {
        const txid = utxo.tx_hash
        const txidVout = `${txid.slice(0, 50)}...:${utxo.tx_output_n}`
        const amount = Number.parseInt(utxo.value, 10) / 100000000
        const txUrl = lib_cmn.getExplorerTxUrl(txid, screenXpubsToolsScript.explorerInfo)

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

        document.querySelector('#xpub-table-list-utxos tr:last-child').insertAdjacentHTML('afterend', newRow)
    },

    showSearchForm: () => {
        document.querySelector('#xpubs-tool-details').setAttribute('hidden', '')
        document.querySelector('#xpubs-tool-import').setAttribute('hidden', '')
        document.querySelector('#xpub').value = ''
        document.querySelector('#xpubs-tool-search-form').removeAttribute('hidden')
        lib_msg.cleanMessagesUi()
    },

    showImportForm: isReimport => {
        screenXpubsToolsScript.isReimport = isReimport

        document.querySelector('#xpubs-tool-search-form').setAttribute('hidden', '')
        document.querySelector('#xpubs-tool-details').setAttribute('hidden', '')

        if (isReimport) {
            document.querySelector('#import-deriv-first-import-msg').setAttribute('hidden', '')
            document.querySelector('#import-deriv-reimport-msg').removeAttribute('hidden')
        } else {
            document.querySelector('#import-deriv-reimport-msg').setAttribute('hidden', '')
            document.querySelector('#import-deriv-first-import-msg').removeAttribute('hidden')
        }

        const xpubLen = screenXpubsToolsScript.currentXpub.length
        const xpubShortLbl = `"${screenXpubsToolsScript.currentXpub.slice(0, 20)}...${screenXpubsToolsScript.currentXpub.slice(xpubLen - 20, xpubLen)}"`
        document.querySelector('#import-xpub').textContent = xpubShortLbl
        document.querySelector('#xpubs-tool-import').removeAttribute('hidden')
    },

    hideImportForm: isReimport => {
        if (isReimport)
            screenXpubsToolsScript.showXpubDetails()
        else
            screenXpubsToolsScript.showSearchForm()
    },

    showXpubDetails: () => {
        document.querySelector('#xpubs-tool-search-form').setAttribute('hidden', '')
        document.querySelector('#xpubs-tool-import').setAttribute('hidden', '')
        document.querySelector('#xpubs-tool-details').removeAttribute('hidden')
    },

    showRescanForm: () => {
        document.querySelector('#xpubs-tool-actions').setAttribute('hidden', '')
        document.querySelector('#xpubs-rescans-actions').removeAttribute('hidden')
        lib_msg.cleanMessagesUi()
    },

    hideRescanForm: () => {
        document.querySelector('#xpubs-rescans-actions').setAttribute('hidden', '')
        document.querySelector('#xpubs-tool-actions').removeAttribute('hidden')
    },

    showDeletionForm: () => {
        document.querySelector('#xpubs-tool-actions').setAttribute('hidden', '')
        document.querySelector('#xpubs-deletion-actions').removeAttribute('hidden')
        lib_msg.cleanMessagesUi()
    },

    hideDeletionForm: () => {
        document.querySelector('#xpubs-deletion-actions').setAttribute('hidden', '')
        document.querySelector('#xpubs-tool-actions').removeAttribute('hidden')
    },

    showExportForm: () => {
        document.querySelector('#xpubs-tool-actions').setAttribute('hidden', '')
        document.querySelector('#xpubs-export-actions').removeAttribute('hidden')
        lib_msg.cleanMessagesUi()
    },

    hideExportForm: () => {
        document.querySelector('#xpubs-export-actions').setAttribute('hidden', '')
        document.querySelector('#xpubs-tool-actions').removeAttribute('hidden')
    },

}

screenScripts.set('#screen-xpubs-tools', screenXpubsToolsScript)
