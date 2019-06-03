
const BnbApiClient = require('@binance-chain/javascript-sdk');
const axios = require('axios');

const HTTP_API = 'https://testnet-dex.binance.org';
const NETWORK = 'mainnet';
const PREFIX = 'bnb';

const bnbClient = new BnbApiClient(HTTP_API);
bnbClient.chooseNetwork(NETWORK)

const result = bnbClient.createAccountWithMneomnic()

console.log(result)
