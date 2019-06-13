const Web3 = require('web3');
const config = require('../config')
const Tx = require('ethereumjs-tx').Transaction;

var web3 = new Web3(new Web3.providers.HttpProvider(config.provider));

const eth = {
  createAccount(callback) {
    let account = web3.eth.accounts.create()
    callback(null, account)
  },

  getTransactionsForAddress(contractAddress, depositAddress, callback) {
    let myContract = new web3.eth.Contract(config.erc20ABI, contractAddress)

    myContract.getPastEvents('Transfer', {
      fromBlock: 0,
      toBlock: 'latest',
      filter: { _to: depositAddress }
    })
    .then((events) => {
      const returnEvents = events.map((event) => {
        return {
          from: event.returnValues._from,
          to: event.returnValues._to,
          amount: parseFloat(web3.utils.fromWei(event.returnValues._value._hex, 'ether')),
          transactionHash: event.transactionHash
        }
      })
      return callback(null, returnEvents)
    })
    .catch((err) => {
      console.log(err)
      // callback(err)
    });
  },

  getTransactions(contractAddress, accountAddress, depositAddress, depositAmount, callback) {
    let myContract = new web3.eth.Contract(config.erc20ABI, contractAddress)

    myContract.getPastEvents('Transfer', {
      fromBlock: 0,
      toBlock: 'latest',
      filter: { _to: depositAddress, _from: accountAddress }
    })
    .then((events) => {
      let returnEvents = events.filter((event) => {
        if(event.returnValues._from.toUpperCase() == accountAddress.toUpperCase() && event.returnValues._to.toUpperCase() == depositAddress.toUpperCase()) {
          let amount = parseFloat(web3.utils.fromWei(event.returnValues._value._hex, 'ether'))
          return depositAmount == amount
        }
      })
      callback(null, returnEvents)
    })
    .catch((err) => {
      callback(err)
    });

  },

  getERC20Balance(address, contractAddress, callback) {
    let myContract = new web3.eth.Contract(config.erc20ABI, contractAddress)

    myContract.methods.balanceOf(address).call({ from: address })
    .then((balance) => {
      const theBalance = web3.utils.fromWei(balance.toString(), 'ether')
      callback(null, theBalance)
    })
  },

  async sendTransaction(contractAddress, privateKey, from, to, amount, callback) {

    const consumerContract = new web3.eth.Contract(config.erc20ABI, contractAddress);
    const myData = consumerContract.methods.transfer(to, amount).encodeABI();

    const tx = {
      from,
      to: contractAddress,
      value: '0',
      gasPrice: web3.utils.toWei('6', 'gwei'),
      gas: 100000,
      chainId: 1,
      nonce: await web3.eth.getTransactionCount(from,'pending'),
      data: myData
    }

    const signed = await web3.eth.accounts.signTransaction(tx, privateKey)
    const rawTx = signed.rawTransaction

    const sendRawTx = rawTx =>
      new Promise((resolve, reject) =>
        web3.eth
          .sendSignedTransaction(rawTx)
          .on('transactionHash', resolve)
          .on('error', reject)
      )

    const result = await sendRawTx(rawTx)

    console.log(result)

    return result
  },

  addAccount(account) {
    const ret = web3.eth.accounts.wallet.add(account)

    return ret
  }
}

module.exports = eth
