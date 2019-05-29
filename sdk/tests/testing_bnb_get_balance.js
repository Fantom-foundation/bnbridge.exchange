const BnbApiClient = require('@binance-chain/javascript-sdk');

const API = 'https://testnet-dex.binance.org/';
const ADDRESS = 'tbnb166zsmcj6fmtdx87ksvt88dm99460a5aqgyg6rr'

const bnbClient = new BnbApiClient(API);
const balance = bnbClient.getBalance(ADDRESS).then(console.log);
