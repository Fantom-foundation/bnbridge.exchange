const axios = require('axios');
const crypto = require('crypto');
const bip39 = require('bip39');
const sha256 = require('sha256');

const api = 'http://localhost:8000'
const httpClient = axios.create({ baseURL: api });

const listingUUID = "2db4dc87-5425-efe9-d939-ff9520b95860"

String.prototype.hexEncode = function () {
  var hex, i;
  var result = '';
  for (i = 0; i < this.length; i++) {
    hex = this.charCodeAt(i).toString(16);
    result += ('000' + hex).slice(-4);
  }
  return result;
};

function encrypt(data, url) {
  const signJson = JSON.stringify(data);
  const signMnemonic = bip39.generateMnemonic();
  const cipher = crypto.createCipher('aes-256-cbc', signMnemonic);
  const signEncrypted =
    cipher.update(signJson, 'utf8', 'base64') + cipher.final('base64');
  var signData = {
    e: signEncrypted.hexEncode(),
    m: signMnemonic.hexEncode(),
    u: sha256(url).toUpperCase(),
    p: sha256(sha256(url).toUpperCase()).toUpperCase(),
    t: new Date().getTime()
  };
  const signSeed = JSON.stringify(signData);
  const signSignature = sha256(signSeed);
  signData.s = signSignature;
  return signData;
}

const url = '/api/v1/decrypt'

httpClient
  .post(url, encrypt({
    uuid: listingUUID
  }, url))
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
