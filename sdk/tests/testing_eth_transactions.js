const Web3 = require('web3');
const config = require('../config')

var web3 = new Web3(new Web3.providers.HttpProvider(config.provider));


const contractAddress = '0x8622701992bd91d45f24694fd3cbd60fd4f351da'
const accountAddress = '0xb258aD4125e84068F3A47fbBC4F6aCeD2bC148EC'
const depositAddress = '0x91E8E1e174D93a8E50c10C3F49B9c5b3C0022966'

let myContract = new web3.eth.Contract(config.erc20ABI, contractAddress)

myContract.getPastEvents('Transfer', {
  fromBlock: 0,
  toBlock: 'latest'
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
});
