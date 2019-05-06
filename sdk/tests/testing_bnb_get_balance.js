const BnbApiClient = require('@binance-chain/javascript-sdk');

const API = 'https://testnet-dex.binance.org/';
// const MNEMONIC = 'quick style hundred panic hello museum drama torch nephew stadium already erosion turkey stove candy sister ankle vicious before neutral try fossil egg health';
// const PRIVATE_KEY = BnbApiClient.crypto.getPrivateKeyFromMnemonic(MNEMONIC);
// const ADDRESS = BnbApiClient.crypto.getAddressFromPrivateKey(PRIVATE_KEY);
const ADDRESS = 'tbnb166zsmcj6fmtdx87ksvt88dm99460a5aqgyg6rr'

const bnbClient = new BnbApiClient(API);
const balance = bnbClient.getBalance(ADDRESS).then(console.log);
