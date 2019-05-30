const Web3 = require('web3');
const config = require('../config')

var web3 = new Web3(new Web3.providers.HttpProvider(config.provider));


const contractAddress = '0x4E15361FD6b4BB609Fa63C81A2be19d873717870'
const accountAddress = '0x1e321be460b5b056e861f682323fdf1511d275c7'
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
      if(event.returnValues._from.toUpperCase() == accountAddress.toUpperCase() && event.returnValues._to.toUpperCase() == depositAddress.toUpperCase()) {
        let amount = parseFloat(web3.utils.fromWei(event.returnValues._value._hex, 'ether'))
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
