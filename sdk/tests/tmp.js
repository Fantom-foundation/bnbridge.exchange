const crypto = require('crypto');
const sha256 = require('sha256');
const bip39 = require('bip39');
const algorithm = 'aes-256-ctr';


const codePassword = ''
// const dbPassword = bip39.generateMnemonic()
const dbPassword = ''

const privateKey = ''

const password = codePassword+':'+dbPassword

const encryptedKey = encrypt(privateKey, password)
const decrypedKey = decrypt(encryptedKey, password)

console.log(dbPassword)
console.log(password)

console.log(privateKey)
console.log(encryptedKey)
console.log(decrypedKey)




console.log("/*******************************************************/")
console.log("  Insert this into the DB")
console.log(" encr_key = '"+dbPassword+"'")
console.log(" encrypted = '"+encryptedKey+"'")
console.log("/*******************************************************/")

function encrypt(text, password){
  var cipher = crypto.createCipher(algorithm,password)
  var crypted = cipher.update(text,'utf8','hex')
  crypted += cipher.final('hex');
  return crypted;
}

function decrypt(text, password){
  var decipher = crypto.createDecipher(algorithm,password)
  var dec = decipher.update(text,'hex','utf8')
  dec += decipher.final('utf8');
  return dec;
}
