const BnbApiClient = require('@binance-chain/javascript-sdk');
const axios = require('axios');

const MNEMONIC = 'accident mix soldier idea surface turn weekend over canal three awesome develop spoon gossip build basic shallow huge memory same bar album timber announce';
const API = 'https://testnet-dex.binance.org/';
const ASSET = 'BGE-223';
const AMOUNT = 1;
const ADDRESS_TO = 'tbnb166zsmcj6fmtdx87ksvt88dm99460a5aqgyg6rr';
const MESSAGE = 'Deposit';

// const PRIVATE_KEY = 'e9cd3a2a8c19f8ba594484e0aab212a364e804937a5c25b41451665d3b02c11e';

const PRIVATE_KEY = BnbApiClient.crypto.getPrivateKeyFromMnemonic(MNEMONIC);
const ADDRESS_FROM = BnbApiClient.crypto.getAddressFromPrivateKey(PRIVATE_KEY);

const bnbClient = new BnbApiClient(API);
const httpClient = axios.create({ baseURL: API });
const sequenceURL = `${API}api/v1/account/${ADDRESS_FROM}/sequence`;

bnbClient.setPrivateKey(PRIVATE_KEY);
bnbClient.initChain();

httpClient
  .get(sequenceURL)
  .then((res) => {
      const sequence = res.data.sequence || 0
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
