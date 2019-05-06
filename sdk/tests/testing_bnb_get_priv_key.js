const BnbApiClient = require('@binance-chain/javascript-sdk');
const MNEMONIC = 'brass recall toy remember east roof slow awful fee other page over crane air review hungry bleak tone display toy two prosper source spirit';
const PRIVATE_KEY = BnbApiClient.crypto.getPrivateKeyFromMnemonic(MNEMONIC);
console.log(PRIVATE_KEY)
