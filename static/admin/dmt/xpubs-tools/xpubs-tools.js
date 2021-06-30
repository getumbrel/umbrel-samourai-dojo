const screenXpubsToolsScript = {

  explorerInfo: null,
  currentXpub: null,
  isReimport: false,
  rescanStatusTimerId: null,

  initPage: function() {
    this.getExplorerInfo()
    // Sets the event handlers
    $('#btn-xpub-search-go').click(() => {this.searchXpub()})
    $('#btn-xpub-details-reset').click(() => {this.showSearchForm()})
    $('#btn-xpub-details-rescan').click(() => {this.showRescanForm()})
    $('#btn-xpub-details-delete').click(() => {this.showDeletionForm()})
    $('#btn-xpub-details-export').click(() => {this.showExportForm()})
    $('#btn-xpub-rescan-go').click(() => {this.rescanXpub()})
    $('#btn-xpub-rescan-cancel').click(() => {this.hideRescanForm()})
    $('#btn-xpub-delete-go').click(() => {this.deleteXpub()})
    $('#btn-xpub-delete-cancel').click(() => {this.hideDeletionForm()})
    $('#btn-xpub-export-go').click(() => {this.exportXpubHistory()})
    $('#btn-xpub-export-cancel').click(() => {this.hideExportForm()})
    $('#btn-xpub-import-go').click(() => {this.importXpub()})
    $('#btn-xpub-details-retype').click(() => {this.showImportForm(true)})
    $('#btn-xpub-import-cancel').click(() => {this.hideImportForm(this.isReimport)})
    $('#xpubs-tool').keyup(evt => {
      if (evt.keyCode === 13) {
        this.searchXpub()
      }
    })
  },

  preparePage: function() {
    // Disable custom lookahead if data source is a third party explorer
    const isTPE = sessionStorage.getItem('indexerType') == 'third_party_explorer'
    const isLRI = sessionStorage.getItem('indexerType') == 'local_rest_indexer'
    const disableLookahead = isTPE || isLRI
    $('#rescan-lookahead').prop('disabled', disableLookahead)

    this.hideRescanForm()
    this.hideDeletionForm()
    this.hideExportForm()
    this.showSearchForm()
    $("#xpub").focus()
  },

  getExplorerInfo: function() {
    lib_api.getExplorerPairingInfo().then(explorerInfo => {
      this.explorerInfo = explorerInfo
    }).catch(e => {
      lib_errors.processError(e)
    })
  },

  searchXpub: function() {
    lib_msg.displayMessage('Search in progress...');
    const xpub = $('#xpub').val()
    this.currentXpub = xpub
    return this._searchXpub(xpub).then(() => {
      lib_msg.cleanMessagesUi()
    })
  },

  _searchXpub: function(xpub) {
    return lib_api.getXpubInfo(xpub).then(xpubInfo => {
      if (xpubInfo && xpubInfo['tracked']) {
        this.setXpubDetails(xpubInfo)
        this.showXpubDetails()
        const jsonData = {'active': xpub}
        return lib_api.getWallet(jsonData).then(walletInfo => {
          // Display the txs
          const txs = walletInfo['txs']
          for (let tx of txs)
            this.setTxDetails(tx)
          // Display the UTXOs
          const utxos = walletInfo['unspent_outputs'].sort((a,b) => {
            return a['confirmations'] - b['confirmations']
          })
          $('#xpub-nb-utxos').text(utxos.length)
          for (let utxo of utxos)
            this.setUtxoDetails(utxo)
        })
      } else {
        lib_msg.displayErrors('xpub not found')
        this.showImportForm(false)
      }
    }).catch(e => {
      lib_errors.processError(e)
      throw e
    })
  },

  importXpub: function() {
    lib_msg.displayMessage('Processing xpub import. Please wait...');

    const jsonData = {
      'xpub': this.currentXpub,
      'type': 'restore',
      'force': true
    }

    const derivType = $('#import-deriv-type').val()
    if (derivType == 'bip49' || derivType == 'bip84') {
      jsonData['segwit'] = derivType
    } else if (derivType == 'auto') {
      if (this.currentXpub.startsWith('ypub'))
        jsonData['segwit'] = 'bip49'
      else if (this.currentXpub.startsWith('zpub'))
        jsonData['segwit'] = 'bip84'
    }

    try {
      lib_api.postXpub(jsonData)
      // Wait for import completion and display progress
      this.checkRescanStatus(() => {
        this._searchXpub(this.currentXpub).then(() => {
          lib_msg.displayInfo('Import complete')
        })
      })
    } catch(e) {
      lib_errors.processError(e)
    }
  },

  rescanXpub: function() {
    lib_msg.displayMessage('Processing xpub rescan. Please wait...');
    let startIdx = $('#rescan-start-idx').val()
    startIdx = (startIdx == null) ? 0 : parseInt(startIdx)
    let lookahead = $('#rescan-lookahead').val()
    lookahead = (lookahead == null) ? 100 : parseInt(lookahead)

    try {
      lib_api.getXpubRescan(this.currentXpub, lookahead, startIdx)
      // Wait for rescan completion and display progress
      this.checkRescanStatus(() => {
        this.hideRescanForm()
        this._searchXpub(this.currentXpub).then(() => {
          lib_msg.displayInfo('Rescan complete')
        })
      })
    } catch(e) {
      lib_errors.processError(e)
    }
  },

  deleteXpub: function() {
    lib_msg.displayMessage('Deleting a xpub. Please wait...')
    return lib_api.getXpubDelete(this.currentXpub)
      .then(result => {
        this.currentXpub = null
        this.preparePage()
        lib_msg.displayInfo('Xpub successfully deleted')
      }).catch(e => {
        lib_errors.processError(e)
      })
  },

  exportXpubHistory: function() {
    lib_msg.displayMessage('Exporting the transactional history of this xpub. Please wait...')

    const args = {
      'active': this.currentXpub,
      'page': 0,
      'count': 1000000000
    }

    if ($('#export-type').val() == 'notNull')
      args['excludeNullXfer'] = 1

    return lib_api.getTransactions(args)
      .then(result => {
        if (result['txs'] && result['txs'].length > 0) {
          let content = 'data:text/csv;charset=utf-8,'
          content += 'height,txid,date,flow\n'
          for (let tx of result['txs'])
            content += `${tx['block_height']},${tx['hash']},${new Date(tx['time']*1000).toString()},${tx['result']/100000000}\n`
          const encodedURI = encodeURI(content)
          window.open(encodedURI)
        }
        this.hideExportForm()
        lib_msg.displayInfo('Transactional history successfully exported.')
      }).catch(e => {
        lib_errors.processError(e)
      })
  },

  checkRescanStatus: function(callback) {
    this.rescanStatusTimerId = setTimeout(() => {
      lib_api.getXpubRescanStatus(this.currentXpub)
        .then(result => {
          const data = result['data']
          if (data['import_in_progress']) {
            const lblOp = (data['status'] == 'rescan') ? 'Rescan' : 'Import'
            const lblHits = (data['status'] == 'rescan') ? 'hits detected' : 'transactions imported'
            const msg = `${lblOp} in progress (${data['hits']} ${lblHits})`
            lib_msg.displayMessage(msg)
            return this.checkRescanStatus(callback)
          } else {
            clearTimeout(this.rescanStatusTimerId)
            return callback()
          }
        }).catch(e => {
          lib_errors.processError(e)
          lib_msg.displayMessage('Rescan in progress. Please wait...')
          return this.checkRescanStatus(callback)
        })
      }, 1000)
  },

  setXpubDetails: function(xpubInfo) {
    $('tr.tx-row').remove()
    $('tr.utxo-row').remove()

    $('#xpub-value').text(this.currentXpub)
    $('#xpub-import-date').text(xpubInfo['created'])
    $('#xpub-deriv-type').text(xpubInfo['derivation'])
    $('#xpub-nb-txs').text(xpubInfo['n_tx'])
    $('#xpub-nb-utxos').text('-')
    const balance = parseInt(xpubInfo['balance']) / 100000000
    $('#xpub-balance').text(`${balance} BTC`)
    $('#xpub-deriv-account').text(xpubInfo['account'])
    $('#xpub-deriv-depth').text(xpubInfo['depth'])
    $('#xpub-idx-unused-ext').text(xpubInfo['unused']['external'])
    $('#xpub-idx-derived-ext').text(xpubInfo['derived']['external'])
    $('#xpub-idx-unused-int').text(xpubInfo['unused']['internal'])
    $('#xpub-idx-derived-int').text(xpubInfo['derived']['internal'])
  },

  setTxDetails: function(tx) {
    const txid = tx['hash']
    const txidDisplay = `${txid.substring(0,50)}...`
    const amount = parseInt(tx['result']) / 100000000
    const amountLabel = amount < 0 ? amount : `+${amount}`
    const amountStyle = amount < 0 ? 'amount-sent' : 'amount-received'
    const date = lib_fmt.unixTsToLocaleString(tx['time'])
    const txUrl = lib_cmn.getExplorerTxUrl(txid, this.explorerInfo)

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
        <td class="table-value">${tx['block_height']}</td>
      </tr>
      <tr class="tx-row">
        <td class="table-label">Date</td>
        <td class="table-value">${date}</td>
      </tr>`

    $('#xpub-table-list-txs tr:last').after(newRow)
  },

  setUtxoDetails: function(utxo) {
    const txid = utxo['tx_hash']
    const txidVout = `${txid.substring(0,50)}...:${utxo['tx_output_n']}`
    const amount = parseInt(utxo['value']) / 100000000
    const txUrl = lib_cmn.getExplorerTxUrl(txid, this.explorerInfo)

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
        <td class="table-value">${utxo['addr']}</td>
      </tr>
      <tr class="utxo-row">
        <td class="table-label">Confirmations</td>
        <td class="table-value">${utxo['confirmations']}</td>
      </tr>`

    $('#xpub-table-list-utxos tr:last').after(newRow)
  },

  showSearchForm: function() {
    $('#xpubs-tool-details').hide()
    $('#xpubs-tool-import').hide()
    $('#xpub').val('')
    $('#xpubs-tool-search-form').show()
    lib_msg.cleanMessagesUi()
  },

  showImportForm: function(isReimport) {
    this.isReimport = isReimport

    $('#xpubs-tool-search-form').hide()
    $('#xpubs-tool-details').hide()

    if (isReimport) {
      $('#import-deriv-first-import-msg').hide()
      $('#import-deriv-reimport-msg').show()
    } else {
      $('#import-deriv-reimport-msg').hide()
      $('#import-deriv-first-import-msg').show()
    }

    const xpubLen = this.currentXpub.length
    const xpubShortLbl = `"${this.currentXpub.substring(0, 20)}...${this.currentXpub.substring(xpubLen-20, xpubLen)}"`
    $('#import-xpub').text(xpubShortLbl)
    $('#xpubs-tool-import').show()
  },

  hideImportForm: function(isReimport) {
    if (isReimport)
      this.showXpubDetails()
    else
      this.showSearchForm()
  },

  showXpubDetails: function() {
    $('#xpubs-tool-search-form').hide()
    $('#xpubs-tool-import').hide()
    $('#xpubs-tool-details').show()
  },

  showRescanForm: function() {
    $('#xpubs-tool-actions').hide()
    $('#xpubs-rescans-actions').show()
    lib_msg.cleanMessagesUi()
  },

  hideRescanForm: function() {
    $('#xpubs-rescans-actions').hide()
    $('#xpubs-tool-actions').show()
  },

  showDeletionForm: function() {
    $('#xpubs-tool-actions').hide()
    $('#xpubs-deletion-actions').show()
    lib_msg.cleanMessagesUi()
  },

  hideDeletionForm: function() {
    $('#xpubs-deletion-actions').hide()
    $('#xpubs-tool-actions').show()
  },

  showExportForm: function() {
    $('#xpubs-tool-actions').hide()
    $('#xpubs-export-actions').show()
    lib_msg.cleanMessagesUi()
  },

  hideExportForm: function() {
    $('#xpubs-export-actions').hide()
    $('#xpubs-tool-actions').show()
  },

}

screenScripts.set('#screen-xpubs-tools', screenXpubsToolsScript)
