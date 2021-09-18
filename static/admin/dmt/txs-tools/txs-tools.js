const screenTxsToolsScript = {

  explorerInfo: null,
  currentTxid: null,

  initPage: function() {
    this.getExplorerInfo()
    // Sets the event handlers
    $('#btn-tx-search-go').click(() => {this.searchTx()})
    $('#btn-txs-details-reset').click(() => {this.showSearchForm()})
    $('#txs-tool').keyup(evt => {
      if (evt.keyCode === 13) {
        this.searchTx()
      }
    })
  },

  preparePage: function() {
    this.showSearchForm()
    $("#txid").focus()
  },

  getExplorerInfo: function() {
    lib_api.getExplorerPairingInfo().then(explorerInfo => {
      this.explorerInfo = explorerInfo
    }).catch(e => {
      lib_errors.processError(e)
    })
  },

  searchTx: function() {
    lib_msg.displayMessage('Search in progress...');
    const txid = $('#txid').val()
    this.currentTxid = txid
    return this._searchTx(txid).then(() => {
      lib_msg.cleanMessagesUi()
    })
  },

  _searchTx: function(txid) {
    return lib_api.getTransaction(txid).then(txInfo => {
      if (txInfo) {
        console.log(txInfo)
        this.setTxDetails(txInfo)
        this.showTxDetails()
      }
    }).catch(e => {
      lib_msg.displayErrors('No transaction found')
      console.log(e)
      throw e
    })
  },

  setTxDetails: function(txInfo) {
    $('tr.input-row').remove()
    $('tr.output-row').remove()

    const txUrl = lib_cmn.getExplorerTxUrl(this.currentTxid, this.explorerInfo)
    $('#txid-value').text(this.currentTxid)
    $('#txid-value').attr('href', txUrl)

    const firstseen = txInfo['created'] ? lib_fmt.unixTsToLocaleString(txInfo['created']) : '--'
    $('#tx-firstseen').text(firstseen)

    if (txInfo.hasOwnProperty('block'))
      $('#tx-location').text(` Block ${txInfo['block']['height']}`)
    else
      $('#tx-location').text(' Mempool')


    const nbInputs = txInfo['inputs'].length
    $('#tx-nb-inputs').text(nbInputs)

    const nbOutputs = txInfo['outputs'].length
    $('#tx-nb-outputs').text(nbOutputs)

    $('#tx-vfeerate').text(`${txInfo['vfeerate']} sats/vbyte`)

    const fees = parseInt(txInfo['fees'])
    $('#tx-fees').text(`${fees} sats`)

    let amount = fees
    for (let o of txInfo['outputs']) {
      amount += parseInt(o['value'])
    }
    amount = amount / 100000000
    $('#tx-amount').text(`${amount} BTC`)

    $('#tx-size').text(`${txInfo['size']} bytes`)
    $('#tx-vsize').text(`${txInfo['vsize']} vbytes`)
    $('#tx-version').text(txInfo['version'])

    let nlocktime = parseInt(txInfo['locktime'])
    if (nlocktime < 500000000) {
      $('#tx-nlocktime').text(`Block ${nlocktime}`)
    } else {
      locktime = lib_fmt.unixTsToLocaleString(locktime)
      $('#tx-nlocktime').text(locktime)
    }
  },

  showSearchForm: function() {
    $('#txs-tool-details').hide()
    $('#txid').val('')
    $('#txs-tool-search-form').show()
    lib_msg.cleanMessagesUi()
  },

  showTxDetails: function() {
    $('#txs-tool-search-form').hide()
    $('#txs-tool-details').show()
  },

}

screenScripts.set('#screen-txs-tools', screenTxsToolsScript)
