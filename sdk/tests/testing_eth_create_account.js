const Web3 = require('web3');
const config = require('../config')

var web3 = new Web3(new Web3.providers.HttpProvider(config.provider));

function createAccount(callback) {
  let account = web3.eth.accounts.create()
  callback(null, account)
}

createAccount((err, account) => {
  if(err) {
    console.log(err)
  }
  console.log(account.address)
  console.log(account.privateKey)

})
