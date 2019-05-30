const Web3 = require('web3');
const config = require('../config')

var web3 = new Web3(new Web3.providers.HttpProvider(config.provider));


const contractAddress = '0x4e15361fd6b4bb609fa63c81a2be19d873717870'
const accountAddress = '0xb258aD4125e84068F3A47fbBC4F6aCeD2bC148EC'
const depositAddress = '0x29B169183b0281c9b838190847184f7F1D555fa4'


function getTransactions(contractAddress, accountAddress, depositAddress, callback) {

  let myContract = new web3.eth.Contract(config.erc20ABI, contractAddress)

  myContract.getPastEvents('Transfer', {
    fromBlock: 0,
    toBlock: 'latest',
    filter: { _to: depositAddress, _from: accountAddress }
  })
  .then((events) => {
    let returnEvents = events.filter((event) => {
      if(event.returnValues._from == accountAddress && event.returnValues._to == depositAddress) {
        console.log(event.returnValues._value._hex)
        let amount = parseInt(event.returnValues._value._hex)/1000000000000000000
        console.log(amount)
        return true
      }
    })

    callback(null, returnEvents)
  })
  .catch(callback);

}


getTransactions(contractAddress, accountAddress, depositAddress, (err, result) => {
  if(err) {
    console.log("ERR")
    console.log(err)
    return
  }

  console.log(result)
})
