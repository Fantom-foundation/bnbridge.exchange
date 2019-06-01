const crypto = require('crypto');
const sha256 = require('sha256');
const bip39 = require('bip39');
const algorithm = 'aes-256-ctr';


const codePassword = 'witness canyon foot sing song tray task defense float bottom town obvious faint globe door tonight alpha battle purse jazz flag author choose whisper'
const dbPassword = bip39.generateMnemonic()
// const dbPassword = 'describe hammer make moment farm ability husband grain rubber claw vague tobacc'

const privateKey = '0x6964e9deea92093921c82e88b1ad716b0826f60b98c7507340227acaebce9122'

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
