
const BnbApiClient = require('@binance-chain/javascript-sdk');
const axios = require('axios');

const HTTP_API = 'https://testnet-dex.binance.org';
const NETWORK = 'mainnet';
const PREFIX = 'bnb';
const PASSWORD = '123123123'

const bnbClient = new BnbApiClient(HTTP_API);
bnbClient.chooseNetwork(NETWORK)

const result = bnbClient.createAccountWithMneomnic()

console.log(result)

const keystore = BnbApiClient.crypto.generateKeyStore(result.privateKey, PASSWORD);

console.log(keystore)





const privateKey = BnbApiClient.crypto.getPrivateKeyFromKeyStore(keystore, PASSWORD)


console.log(privateKey)
