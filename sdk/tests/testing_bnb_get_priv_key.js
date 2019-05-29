const BnbApiClient = require('@binance-chain/javascript-sdk');
const MNEMONIC = '';
const PRIVATE_KEY = BnbApiClient.crypto.getPrivateKeyFromMnemonic(MNEMONIC);
console.log(PRIVATE_KEY)
