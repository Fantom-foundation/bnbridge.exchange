const axios = require('axios');

const api = 'https://testnet-dex.binance.org/';

const httpClient = axios.create({ baseURL: api });
const sequenceURL = `${api}api/v1/fees`;

httpClient
  .get(sequenceURL)
  .then((res) => {
    const fees = res.data
    console.log(fees);
  })
  .catch((error) => {
    console.error('error', error);
  });
