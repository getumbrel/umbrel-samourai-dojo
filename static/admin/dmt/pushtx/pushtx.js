const pushtxScript = {

  processedSchedTxs: new Set(),

  initPage: function() {
    // Refresh PushTx status
    setInterval(() => {this.refreshPushTxStatus()}, 60000)
    // Refresh ScheduledTxs list
    setInterval(() => {this.refreshScheduledTxsList()}, 60000)
  },

  preparePage: function() {
    this.refreshPushTxStatus()
    this.refreshScheduledTxsList()
  },

  refreshPushTxStatus: function() {
    //lib_msg.displayMessage('Loading PushTx status info...');
    lib_api.getPushtxStatus().then(pushTxStatus => {
      if (pushTxStatus) {
        const data = pushTxStatus['data']
        const uptime = lib_cmn.timePeriod(data['uptime'])
        $('#pushed-uptime').text(uptime)
        $('#pushed-count').text(data['push']['count'])
        $('#pushed-amount').text(data['push']['amount'])
        //lib_msg.cleanMessagesUi()
      }
    }).catch(e => {
      $('#pushed-uptime').text('-')
      $('#pushed-count').text('-')
      $('#pushed-amount').text('-')
      lib_errors.processError(e)
    })
  },

  refreshScheduledTxsList: function() {
    //lib_msg.displayMessage('Loading PushTx orchestrator status info...');
    lib_api.getOrchestratorStatus().then(orchestrStatus => {
      if(orchestrStatus) {
        const data = orchestrStatus['data']
        for (let tx of data['txs']) {
          if (!this.processedSchedTxs.has(tx['schTxid'])) {
            this.displayScheduledTx(tx)
            this.processedSchedTxs.add(tx['schTxid'])
          }
        }
        //lib_msg.cleanMessagesUi()
      }
    }).catch(e => {
      lib_errors.processError(e)
    })
  },

  displayScheduledTx: function(tx) {
    const newRow = `<tr><td colspan="2">&nbsp;</td></tr>
      <tr class="table-value">
        <td class="table-label">TXID</td>
        <td class="table-value" id="scheduled-txid">${tx['schTxid']}</td>
      </tr>
      <tr class="table-value">
        <td class="table-label">Schedule Id</td>
        <td class="table-value" id="scheduled-txid">${tx['schID']}</td>
      </tr>
      <tr class="table-value">
        <td class="table-label">Scheduled for block</td>
        <td class="table-value" id="scheduled-trigger">${tx['schTrigger']}</td>
      </tr>
      <tr class="table-value">
        <td class="table-label">Created on</td>
        <td class="table-value" id="scheduled-created">${lib_fmt.unixTsToLocaleString(tx['schCreated'])}</td>
      </tr>
      <tr class="table-value">
        <td class="table-label">Parent TXID</td>
        <td class="table-value" id="scheduled-parent-txid">${tx['schParentTxid']}</td>
      </tr>
      <tr class="table-value">
        <td class="table-label">Raw Transaction</td>
        <td class="table-value" id="scheduled-tx">
          <pre class="raw-tx">${tx['schRaw']}</pre>
        </td>
      </tr>`

    $('#table-scheduled-txs tr:last').after(newRow)
  },

}

screenScripts.set('#screen-pushtx', pushtxScript)
