const axios = require('axios');

const api = 'https://testnet-dex.binance.org/';

const httpClient = axios.create({ baseURL: api });
const sequenceURL = `${api}api/v1/fees`;

httpClient
  .get(sequenceURL)
  .then((res) => {
    const fees = res.data
    console.log(fees);
    console.log(fees.filter((fee) => {
      return fee.dex_fee_fields != null
    }).map((fee) => {
      return fee.dex_fee_fields
    }))


    const reducer = (accumulator, currentValue) => accumulator + currentValue.fee;
    let totalRequired = fees.filter((fee) => {
      return ['issueMsg', 'mintMsg', 'dexList'].includes(fee.msg_type)
    })
    .reduce(reducer, 0)
    console.log(totalRequired)
  })
  .catch((error) => {
    console.error('error', error);
  });
