const crypto = require('crypto');
const sha256 = require('sha256');
const bip39 = require('bip39');
const algorithm = 'aes-256-ctr';


const codePassword = ''
const dbPassword = ''

const password = codePassword+':'+dbPassword

const encryptedKey = ''
const decrypedKey = decrypt(encryptedKey, password)

console.log(dbPassword)
console.log(password)

console.log(encryptedKey)
console.log(decrypedKey)

function decrypt(text, password){
  var decipher = crypto.createDecipher(algorithm,password)
  var dec = decipher.update(text,'hex','utf8')
  dec += decipher.final('utf8');
  return dec;
}
