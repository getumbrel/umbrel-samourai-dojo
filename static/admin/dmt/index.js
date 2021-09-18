/**
 * Global obkjects
 */

// Ordered list of screens
const screens = [
  '#screen-welcome',
  '#screen-status',
  '#screen-pushtx',
  '#screen-pairing',
  '#screen-xpubs-tools',
  '#screen-addresses-tools',
  '#screen-txs-tools',
  '#screen-blocks-rescan',
  '#screen-help-dmt'
]

// Ordered list of menu items
const tabs = [
  '#link-welcome',
  '#link-status',
  '#link-pushtx',
  '#link-pairing',
  '#link-xpubs-tools',
  '#link-addresses-tools',
  '#link-txs-tools',
  '#link-blocks-rescan',
  '#link-help-dmt'
]

// Mapping of scripts associaed to screens
const screenScripts = new Map()


/**
 * UI initialization
 */
function initTabs() {
  // Activates the current tab
  let currentTab = sessionStorage.getItem('activeTab')
  if (!currentTab)
    currentTab = '#link-status'
  $(currentTab).addClass('active')

  // Sets event handlers
  for (let tab of tabs) {
    $(tab).click(function() {
      $(sessionStorage.getItem('activeTab')).removeClass('active')
      sessionStorage.setItem('activeTab', tab)
      $(tab).addClass('active')
      preparePage()
    })
  }
}

function initPages() {
  // Dynamic loading of screens and scripts
  lib_cmn.includeHTML(_initPages)
  // Dojo version
  let lblVersion = sessionStorage.getItem('lblVersion')
  if (lblVersion == null) {
    lib_api.getPairingInfo().then(apiInfo => {
      lblVersion = 'v' + apiInfo['pairing']['version'] + ' beta'
      sessionStorage.setItem('lblVersion', lblVersion)
      $('#dojo-version').text(lblVersion)
    })
  } else {
    $('#dojo-version').text(lblVersion)
  }
}

function _initPages() {
  for (let screen of screens) {
    const screenScript = screenScripts.get(screen)
    if (screenScript)
      screenScript.initPage()
  }
  preparePage()
  $('#top-container').show()
}

function preparePage() {
  lib_msg.cleanMessagesUi()
  const activeTab = sessionStorage.getItem('activeTab')
  for (let idxTab in tabs) {
    const screen = screens[idxTab]
    if (tabs[idxTab] === activeTab) {
      $(screen).show()
      if (screenScripts.has(screen))
        screenScripts.get(screen).preparePage()
    } else {
      $(screen).hide()
    }
  }
}


/**
 * Processing on loading completed
 */
$(document).ready(function() {
  // Refresh the access token
  lib_auth.refreshAccessToken()
  setInterval(() => {
    lib_auth.refreshAccessToken()
  }, 300000)

  // Inits menu and pages
  initTabs()
  initPages()

  // Set event handlers
  $('#btn-logout').click(function() {
    lib_auth.logout()
  })
})
