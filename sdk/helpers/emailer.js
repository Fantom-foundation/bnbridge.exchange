var nodemailer = require('nodemailer')
var config = require('../config')

var emailer = {

  sendMail: function(subject, text, callback) {
    var mailOptions = {
      from: '"BNBridge" <bnbridge@fantom.foundation>',
      to: 'anton.nell@fantom.foundation',
      cc: 'andre.cronje@fantom.foundation',
      subject: subject,
      text: text
    }

    emailer._sendMail(mailOptions, callback)
  },

  _sendMail: function(mailOptions, callback) {
    var transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: config.emailerUser,
        pass: config.emailerPassword
      }
    });

    transporter.sendMail(mailOptions, function(error, info) {
      if (error) {
        console.log(error)
      }

      if (callback != null) {
        callback(error, info)
      }
    })
  }
}

module.exports = emailer
