const Web3 = require('web3');
const config = require('../config')

var web3 = new Web3(new Web3.providers.HttpProvider(config.provider));

const eth = {
  createAccount(callback) {
    let account = web3.eth.accounts.create()
    callback(null, account)
  },

  getTransactions(contractAddress, accountAddress, depositAddress, depositAmount, callback) {
    let myContract = new web3.eth.Contract(config.erc20ABI, contractAddress)

    myContract.getPastEvents('Transfer', {
      fromBlock: 0,
      toBlock: 'latest'
    })
    .then((events) => {
      let returnEvents = events.filter((event) => {
        if(event.returnValues._from == accountAddress && event.returnValues._to == depositAddress) {
          let amount = parseInt(event.returnValues._value._hex)/1000000000000000000

          console.log(amount)

          return depositAmount == amount
        }
      })
      callback(null, returnEvents)
    });

  }
}

module.exports = eth
