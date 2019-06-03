const BnbApiClient = require('@binance-chain/javascript-sdk');
const axios = require('axios');

const HTTP_API = 'https://testnet-dex.binance.org';
const NETWORK = 'testnet';
const PREFIX = 'tbnb';

const PASSWORD = '123123123'


const bnbClient = new BnbApiClient(HTTP_API);
bnbClient.chooseNetwork(NETWORK)
bnbClient.initChain();

const result = bnbClient.createAccountWithKeystore(PASSWORD)
console.log(result)


const privateKey = result.result
const address = result.address
const keyStore = result.keyStore

//
// .then((result) => {
//   console.log(result)
// })
// .catch((err) => {
//   console.log(err)
// })
