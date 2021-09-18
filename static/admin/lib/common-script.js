const lib_cmn = {
  // Utils functions
  hasProperty: function(obj, propName) {
    /* Checks if an object has a property with given name */
      if ( (obj == null) || (!propName) )
        return false
      else if (obj.hasOwnProperty('propName') || propName in obj)
        return true
      else
        return false
  },

  // Go to default page
  goToDefaultPage: function() {
    const baseUri = conf['adminTool']['baseUri']
    sessionStorage.setItem('activeTab', '#link-status')
    window.location = baseUri + '/dmt/'
  },

  // Go to home page
  goToHomePage: function() {
    sessionStorage.setItem('activeTab', null)
    window.location = conf['adminTool']['baseUri'] + '/'
  },

  // Get Transaction url on selected explorer
  getExplorerTxUrl: function(txid, explorerInfo) {
    if (explorerInfo == null)
      return null
    else if (explorerInfo['pairing']['type'] === 'explorer.oxt')
      return `${explorerInfo['pairing']['url']}/transaction/${txid}`
    else if (explorerInfo['pairing']['type'] === 'explorer.btc_rpc_explorer')
      return `http://${explorerInfo['pairing']['url']}/tx/${txid}`
    else
      return null
  },

  // Loads html snippets
  includeHTML: function(cb) {
    let self = this
    let z, i, elmnt, file, xhttp
    z = document.getElementsByTagName('*')
    for (i = 0; i < z.length; i++) {
      elmnt = z[i]
      file = elmnt.getAttribute('include-html')
      if (file) {
        xhttp = new XMLHttpRequest()
        xhttp.onreadystatechange = function() {
          if (this.readyState === 4 && this.status === 200) {
            elmnt.innerHTML = this.responseText
            elmnt.removeAttribute('include-html')
            self.includeHTML(cb)
            self.includeJs(elmnt)
          }
        }
        xhttp.open('GET', file, true)
        xhttp.send()
        return
      }
    }
    if (cb) cb()
  },

  // Loads js snippets
  includeJs: function(element) {
    let self = this
    let z, i, elmnt, file, xhttp
    z = element.querySelectorAll('script')
    for (i = 0; i < z.length; i++) {
      elmnt = z[i]
      file = elmnt.getAttribute('include-js')
      if (file) {
        xhttp = new XMLHttpRequest()
        xhttp.onreadystatechange = function() {
          if (this.readyState === 4 && this.status === 200) {
            const newElmnt = document.createElement('script')
            newElmnt.textContent = this.responseText
            if (elmnt.parentNode) {
              elmnt.parentNode.insertBefore(newElmnt, elmnt.nextSibling)
              elmnt.parentNode.removeChild(elmnt)
            }
          }
        }
        xhttp.open('GET', file, true)
        xhttp.send()
        return
      }
    }
  },

  pad10: function(v) {
    return (v < 10) ? `0${v}` : `${v}`
  },

  pad100: function(v) {
    if (v < 10) return `00${v}`
    if (v < 100) return `0${v}`
    return `${v}`
  },

  timePeriod: function(period, milliseconds) {
    milliseconds = !!milliseconds

    const whole = Math.floor(period)
    const ms = 1000*(period - whole)
    const s = whole % 60
    const m = (whole >= 60) ? Math.floor(whole / 60) % 60 : 0
    const h = (whole >= 3600) ? Math.floor(whole / 3600) % 24 : 0
    const d = (whole >= 86400) ? Math.floor(whole / 86400) : 0

    const parts = [this.pad10(h), this.pad10(m), this.pad10(s)]

    if (d > 0)
      parts.splice(0, 0, this.pad100(d))

    const str = parts.join(':')

    if (milliseconds) {
      return str + '.' + this.pad100(ms)
    } else {
      return str
    }
  }

}
