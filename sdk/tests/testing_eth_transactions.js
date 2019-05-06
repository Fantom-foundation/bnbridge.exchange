const Web3 = require('web3');
const config = require('../config')

var web3 = new Web3(new Web3.providers.HttpProvider(config.provider));


const contractAddress = '0x0897677cadb29c15c473044f40b64b69e5e53751'
const accountAddress = '0xb258aD4125e84068F3A47fbBC4F6aCeD2bC148EC'
const depositAddress = '0x31486289c00C9255f8E565FE65d28467363F846f'

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
