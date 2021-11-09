// eslint-disable-next-line no-unused-vars
const lib_msg = {

    // UI functions
    addTextinID: (text, id) => {
        document.querySelector(id).innerHTML = text.toUpperCase()
    },

    displayMessage: (text = '') => {
        lib_msg.addTextinID('', '#errors')
        lib_msg.addTextinID('', '#info')
        lib_msg.addTextinID(text, '#msg')
    },

    displayErrors: (text = '') => {
        lib_msg.addTextinID('', '#msg')
        lib_msg.addTextinID('', '#info')
        lib_msg.addTextinID(text, '#errors')
    },

    displayInfo: (text = '') => {
        lib_msg.addTextinID('', '#msg')
        lib_msg.addTextinID('', '#errors')
        lib_msg.addTextinID(text, '#info')
    },

    cleanMessagesUi: () => {
        lib_msg.addTextinID('', '#msg')
        lib_msg.addTextinID('', '#errors')
        lib_msg.addTextinID('', '#info')
    }

}
