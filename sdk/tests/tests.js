const axios = require('axios');

const api = 'http://localhost:8000'
const httpClient = axios.create({ baseURL: api });

const swapUUID = "879aaf6e-7a01-1c97-344d-f66b9a448f36"

httpClient
  .post('/api/v1/finalizeSwap', {
    uuid: swapUUID
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
