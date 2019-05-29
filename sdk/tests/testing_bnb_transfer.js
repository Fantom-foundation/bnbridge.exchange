const BnbApiClient = require('@binance-chain/javascript-sdk');
const axios = require('axios');

const MNEMONIC = '';
const HTTP_API = 'https://testnet-dex.binance.org';
const ASSET = 'BNB';
const AMOUNT = 40;
const ADDRESS_TO = '';
const MESSAGE = 'Transfer';
const NETWORK = 'testnet';
const PREFIX = 'tbnb';

// const PRIVATE_KEY = 'e9cd3a2a8c19f8ba594484e0aab212a364e804937a5c25b41451665d3b02c11e';

const bnbClient = new BnbApiClient(HTTP_API);
bnbClient.chooseNetwork(NETWORK)

const PRIVATE_KEY = BnbApiClient.crypto.getPrivateKeyFromMnemonic(MNEMONIC);
const ADDRESS_FROM = BnbApiClient.crypto.getAddressFromPrivateKey(PRIVATE_KEY, PREFIX);


console.log(ADDRESS_FROM)
const httpClient = axios.create({ baseURL: HTTP_API });
const sequenceURL = `${HTTP_API}/api/v1/account/${ADDRESS_FROM}/sequence`;

console.log(sequenceURL)

bnbClient.setPrivateKey(PRIVATE_KEY);
bnbClient.initChain();

httpClient
  .get(sequenceURL)
  .then((res) => {
      const sequence = res.data.sequence || 0
      console.log(sequence)
      return bnbClient.transfer(ADDRESS_FROM, ADDRESS_TO, AMOUNT, ASSET, MESSAGE, sequence)
  })
  .then((result) => {
      console.log(result);
      if (result.status === 200) {
        console.log('success', result.result[0].hash);
      } else {
        console.error('error', result);
      }
  })
  .catch((error) => {
    console.error('error', error);
  });
