const lib_errors = {

  // Extract jqxhr error message
  extractJqxhrErrorMsg: function(jqxhr) {
    let hasErrorMsg = ('responseJSON' in jqxhr) &&
      (jqxhr['responseJSON'] != null) &&
      ('error' in jqxhr['responseJSON']) &&
      (typeof jqxhr['responseJSON']['error'] == 'string')

    return hasErrorMsg ? jqxhr['responseJSON']['error'] : jqxhr.statusText
  },

  // Manage errors
  processError: function(e) {
    const errorMsg = this.extractJqxhrErrorMsg(e)
    // Redirect to sign in page if authentication error
    if (errorMsg == 'Invalid JSON Web Token' || errorMsg == 'Missing JSON Web Token') {
      lib_auth.logout()
    } else {
      lib_msg.displayErrors(errorMsg)
      console.log(e)
    }
  },

}
