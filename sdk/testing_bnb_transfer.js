const BnbApiClient = require('@binance-chain/javascript-sdk');
const axios = require('axios');

const API = 'https://testnet-dex.binance.org/';
const PRIVATE_KEY = 'e9cd3a2a8c19f8ba594484e0aab212a364e804937a5c25b41451665d3b02c11e';
const ASSET = 'BNB';
const AMOUNT = 1.012;
const ADDRESS_TO = 'tbnb1mmxvnhkyqrvd2dpskvsgl8lmft4tnrcs97apr3';
const MESSAGE = 'Testing Transfer';

const addressFrom = BnbApiClient.crypto.getAddressFromPrivateKey(PRIVATE_KEY);

const bnbClient = new BnbApiClient(API);
const httpClient = axios.create({ baseURL: API });
const sequenceURL = `${API}api/v1/account/${addressFrom}/sequence`;

bnbClient.setPrivateKey(privKey);
bnbClient.initChain();

httpClient
  .get(sequenceURL)
  .then((res) => {
      const sequence = res.data.sequence || 0
      return bnbClient.transfer(addressFrom, ADDRESS_TO, AMOUNT, ASSET, MESSAGE, sequence)
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
