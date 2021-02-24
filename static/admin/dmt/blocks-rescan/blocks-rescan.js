const screenBlocksRescanScript = {

  initPage: function() {
    // Sets the event handlers
    $('#btn-rescan-go').click(() => {
      this.processRescan()
    })
    $('#blocks-rescan').keyup(evt => {
      if (evt.keyCode === 13) {
        this.processRescan()
      }
    })
  },

  preparePage: function() {
    $("#rescan-from-height").focus()
  },

  processRescan: function() {
    lib_msg.displayMessage('Processing...');

    let fromHeight = $("#rescan-from-height").val()
    let toHeight = $("#rescan-to-height").val()
    fromHeight = parseInt(fromHeight)
    toHeight = (toHeight) ? parseInt(toHeight) : fromHeight;

    lib_api.getBlocksRescan(fromHeight, toHeight).then(result => {
      if (!result)
        return
      const fromHeightRes = result['fromHeight']
      const toHeightRes = result['toHeight']
      const msg = `successfully rescanned blocks between height ${fromHeightRes} and height ${toHeightRes}`
      lib_msg.displayInfo(msg)
    }).catch(e => {
      lib_errors.processError(e)
    }).then(() => {
      $('#rescan-from-height').val('')
      $('#rescan-to-height').val('')
    })
  },

}

screenScripts.set('#screen-blocks-rescan', screenBlocksRescanScript)
