const screenAddressesToolsScript = {

  explorerInfo: null,
  currentAddress: null,

  initPage: function() {
    this.getExplorerInfo()
    // Sets the event handlers
    $('#btn-address-search-go').click(() => {this.searchAddress()})
    $('#btn-address-details-reset').click(() => {this.showSearchForm()})
    $('#btn-address-details-rescan').click(() => {this.showRescanForm()})
    $('#btn-address-rescan-go').click(() => {this.rescanAddress()})
    $('#btn-address-rescan-cancel').click(() => {this.hideRescanForm()})
    $('#btn-address-import-go').click(() => {this.importAddress()})
    $('#btn-address-import-cancel').click(() => {this.showSearchForm()})
    $('#addresses-tool').keyup(evt => {
      if (evt.keyCode === 13) {
        this.searchAddress()
      }
    })
  },

  preparePage: function() {
    this.hideRescanForm()
    this.showSearchForm()
    $("#address").focus()
  },

  getExplorerInfo: function() {
    lib_api.getExplorerPairingInfo().then(explorerInfo => {
      this.explorerInfo = explorerInfo
    }).catch(e => {
      lib_errors.processError(e)
    })
  },

  searchAddress: function() {
    lib_msg.displayMessage('Search in progress...');
    const address = $('#address').val()
    this.currentAddress = address
    return this._searchAddress(address).then(() => {
      lib_msg.cleanMessagesUi()
    })
  },

  _searchAddress: function(address) {
    return lib_api.getAddressInfo(address).then(addressInfo => {
      if (addressInfo && addressInfo['tracked']) {
        this.setAddressDetails(addressInfo)
        this.showAddressDetails()
        const jsonData = {'active': address}
        return lib_api.getWallet(jsonData).then(walletInfo => {
          // Display the txs
          const txs = walletInfo['txs']
          for (let tx of txs)
            this.setTxDetails(tx)
          // Display the UTXOs
          const utxos = walletInfo['unspent_outputs'].sort((a,b) => {
            return a['confirmations'] - b['confirmations']
          })
          $('#addr-nb-utxos').text(utxos.length)
          for (let utxo of utxos)
            this.setUtxoDetails(utxo)
        })
      } else {
        lib_msg.displayErrors('address not found')
        this.showImportForm(false)
      }
    }).catch(e => {
      lib_errors.processError(e)
      throw e
    })
  },

  importAddress: function() {
    lib_msg.displayMessage('Processing address import. Please wait...');
    const jsonData = {'active': this.currentAddress}
    return lib_api.getWallet(jsonData)
      .then(result => {
        this._searchAddress(this.currentAddress).then(() => {
          lib_msg.displayInfo('Import complete')
        })
      }).catch(e => {
        lib_errors.processError(e)
      })
  },

  rescanAddress: function() {
    lib_msg.displayMessage('Processing address rescan. Please wait...');
    return lib_api.getAddressRescan(this.currentAddress)
      .then(result => {
        this.hideRescanForm()
        this._searchAddress(this.currentAddress).then(() => {
          lib_msg.displayInfo('Rescan complete')
        })
      }).catch(e => {
        lib_errors.processError(e)
      })
  },

  setAddressDetails: function(addressInfo) {
    $('tr.tx-row').remove()
    $('tr.utxo-row').remove()

    $('#addr-value').text(this.currentAddress)
    $('#addr-nb-txs').text(addressInfo['n_tx'])
    $('#addr-nb-utxos').text('-')

    const balance = parseInt(addressInfo['balance']) / 100000000
    $('#addr-balance').text(`${balance} BTC`)

    const addrType = (addressInfo['type'] == 'hd') ? 'Derived from an XPUB' : 'Loose address'
    $('#addr-type').text(addrType)

    if (addressInfo['segwit']) {
      $('#addr-segwit').html('&#10003;')
      $('#addr-segwit').css('color', '#76d776')
    } else {
      $('#addr-segwit').text('-')
      $('#addr-segwit').css('color', '#f77c7c')
    }

    if (addressInfo['type'] == 'hd') {
      $('#addr-xpub').text(addressInfo['xpub'])
      $('#addr-deriv-path').text(addressInfo['path'])
      $('#addresses-tool-details-row2').show()
    } else {
      $('#addresses-tool-details-row2').hide()
    }
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

    $('#addr-table-list-txs tr:last').after(newRow)
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

    $('#addr-table-list-utxos tr:last').after(newRow)
  },

  showSearchForm: function() {
    $('#addresses-tool-details').hide()
    $('#addresses-tool-import').hide()
    $('#address').val('')
    $('#addresses-tool-search-form').show()
    lib_msg.cleanMessagesUi()
  },

  showImportForm: function() {
    $('#addresses-tool-search-form').hide()
    $('#addresses-tool-details').hide()
    $('#import-address').text(this.currentAddress)
    $('#addresses-tool-import').show()
  },

  showAddressDetails: function() {
    $('#addresses-tool-search-form').hide()
    $('#addresses-tool-import').hide()
    $('#addresses-tool-details').show()
  },

  showRescanForm: function() {
    $('#addresses-tool-actions').hide()
    $('#addresses-rescans-actions').show()
    lib_msg.cleanMessagesUi()
  },

  hideRescanForm: function() {
    $('#addresses-rescans-actions').hide()
    $('#addresses-tool-actions').show()
  },
}

screenScripts.set('#screen-addresses-tools', screenAddressesToolsScript)
