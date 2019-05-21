const axios = require('axios');

const api = 'http://localhost:8000'
const httpClient = axios.create({ baseURL: api });

const listingUUID = "2db4dc87-5425-efe9-d939-ff9520b95860"

httpClient
  .post('/api/v1/finalizeListProposal', {
    uuid: listingUUID
  })
  .then((res) => {
    if (res.status === 200) {
      console.log('success', res.status, res.data);
    } else {
      console.error('error', res.status, res.data);
    }
  })
  .catch((error) => {
    console.error('error', error.response.status, error.response.data);
  });
