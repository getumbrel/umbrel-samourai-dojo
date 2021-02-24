const screenPairingScript = {

  initPage: function() {},

  preparePage: function() {
    this.displayQRPairing()
  },

  loadPairingPayloads: function() {
    let result = {
      'api': null,
      'explorer': null
    }

    lib_msg.displayMessage('Loading pairing payloads...');

    return lib_api.getPairingInfo().then(apiInfo => {
      if (apiInfo) {
        apiInfo['pairing']['url'] = window.location.protocol + '//' + window.location.host + conf['api']['baseUri']
        result['api'] = apiInfo
      }
    }).then(() => {
      return lib_api.getExplorerPairingInfo()
    }).then(explorerInfo => {
      if (explorerInfo)
        result['explorer'] = explorerInfo
      lib_msg.cleanMessagesUi()
      return result
    }).catch(e => {
      lib_errors.processError(e)
      return result
    })
  },

  displayQRPairing: function() {
    this.loadPairingPayloads().then(
      function (result) {
        if (result) {
          if (result['api']) {
            const textJson = JSON.stringify(result['api'], null, 4)
            $("#qr-pairing").html('') // clear qrcode first
            $('#qr-pairing').qrcode({width: 256, height: 256, text: textJson})
          }
          if (result['explorer'] && result['explorer']['pairing']['url']) {
            const textJson = JSON.stringify(result['explorer'], null, 4)
            $("#qr-explorer-pairing").html('') // clear qrcode first
            $('#qr-explorer-pairing').qrcode({width: 256, height: 256, text: textJson})
          } else {
            $("#qr-label").removeClass('halfwidth')
            $("#qr-label").addClass('fullwidth')
            $("#qr-container").removeClass('halfwidth')
            $("#qr-container").addClass('fullwidth')
            $("#qr-explorer-label").hide()
            $("#qr-explorer-container").hide()
          }
        }
      },
      function (jqxhr) {}
    );
  }

}

screenScripts.set('#screen-pairing', screenPairingScript)
