const lib_msg = {

  // UI functions
  addTextinID: function(text, id){
    $(id).html(text.toUpperCase())
  },

  displayMessage: function(text){
    this.addTextinID('', '#errors')
    this.addTextinID('', '#info')
    this.addTextinID(text, '#msg')
  },

  displayErrors: function(text){
    this.addTextinID('', '#msg')
    this.addTextinID('', '#info')
    this.addTextinID(text, '#errors')
  },

  displayInfo: function(text){
    this.addTextinID('', '#msg')
    this.addTextinID('', '#errors')
    this.addTextinID(text, '#info')
  },

  cleanMessagesUi: function() {
    this.addTextinID('', '#msg')
    this.addTextinID('', '#errors')
    this.addTextinID('', '#info')
  }

}
