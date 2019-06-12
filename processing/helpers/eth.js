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

  sendTransaction(contractAddress, myPrivateKey, from, to, amount, callback) {
    // let myContract = new web3.eth.Contract(config.erc20ABI, contractAddress)
    //
    // // amount = amount * 1000000000000000000
    //
    // console.log("SENDING: " + amount + "FTM - " + from + " -> " + to)
    // myContract.methods.transfer(to, amount).send({ from: from })
    // .then((hash) => {
    //   console.log(hash)
    //   callback(null, hash)
    // })
    // .catch(callback)

    var count = web3.eth.getTransactionCount(from);
    let myContract = new web3.eth.Contract(config.erc20ABI, contractAddress)

    var data = myContract.methods.transfer(to, amount).encodeABI();
    var gasPrice = web3.eth.gasPrice;
    var gasLimit = 90000;

    var rawTx = {
      "from": from,
      "nonce": web3.utils.toHex(count),
      "gasPrice": web3.utils.toHex(gasPrice),
      "gasLimit": web3.utils.toHex(gasLimit),
      "to": to,
      "value": "0x00",
      "data": data,
      "chainId": 3,
      "v": (3 * 2) + 35
    };


    var privKey = new Buffer(myPrivateKey, 'hex');
    var tx = new Tx(rawTx);
    tx.sign(privKey);
    var serializedTx = tx.serialize();

    web3.eth.sendSignedTransaction('0x' + serializedTx.toString('hex'), function(err, hash) {
      if (!err)
        console.log(hash);
      else
        console.log(err);

      callback(err, hash)
    });
  },

  addAccount(account) {
    const ret = web3.eth.accounts.wallet.add(account)

    return ret
  }
}

module.exports = eth
