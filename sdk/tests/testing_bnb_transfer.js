const BnbApiClient = require('@binance-chain/javascript-sdk');
const axios = require('axios');

const MNEMONIC = 'garlic ice design cruel gorilla harvest side hat turn clap guide tuna already ice agent tenant fee wine theory banner price school swap wisdom';
const API = 'https://testnet-dex.binance.org/';
const ASSET = 'BNB';
const AMOUNT = 2010;
const ADDRESS_TO = 'tbnb103tgyx0xac3pga4e2q3t72czjrvjghhl94ch4e';
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
