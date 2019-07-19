const axios = require('axios');
const db = require('../helpers/db.js').db;

const api = 'https://dex.binance.org/';

const ADDRESS = ''
const SYMBOL = ''

const httpClient = axios.create({ baseURL: api });
const sequenceURL = `${api}api/v1/transactions?address=${ADDRESS}&txType=TRANSFER&txAsset=${SYMBOL}&side=RECEIVE`;

httpClient
  .get(sequenceURL)
  .then((res) => {
    console.log(res.data && res.data.tx ? res.data.tx : res)
  })
  .catch((error) => {
    console.error('error', error);
  });
