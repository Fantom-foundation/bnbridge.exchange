const BnbApiClient = require('@binance-chain/javascript-sdk');
const axios = require('axios');
const config = require('../config')

const os = require('os');
const pty = require('node-pty');
const shell = os.platform() === 'win32' ? 'powershell.exe' : 'bash';
const httpClient = axios.create({ baseURL: config.api });

const bnb = {
  spawnProcess() {
    return pty.spawn(shell, [], {
      name: 'xterm-color',
      cols: 800,
      rows: 30,
      cwd: process.env.HOME,
      env: process.env
    });
  },

  test(callback) {
    const ptyProcess = bnb.spawnProcess()

    ptyProcess.on('data', function(data) {
      callback(data)
    });

    ptyProcess.write('cd '+config.filePath+'\r');
    ptyProcess.write('./'+config.fileName+' status -n '+config.nodeHTTPS+'\r');
    ptyProcess.write('exit\r');
  },

  getFees(callback) {
    const url = `${config.api}api/v1/fees`;

    httpClient
      .get(url)
      .then((res) => {
        callback(null, res)
      })
      .catch((error) => {
        callback(error)
      });
  },

  createKey(name, password, callback) {
    const ptyProcess = bnb.spawnProcess()

    ptyProcess.on('data', function(data) {
      process.stdout.write(data);

      if(data.includes("Enter a passphrase")) {
        // process.stdout.write('Setting password to '+password);
        ptyProcess.write(password+'\r');
      }

      if(data.includes("Repeat the passphrase")) {
        // process.stdout.write('Confirming password to '+password);
        ptyProcess.write(password+'\r');
      }

      if(data.includes("**Important**")) {
        // process.stdout.write(data);
        const tmpData = data.replace(/\s\s+/g, ' ').replace(/[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g, '').split(' ');
        const address = tmpData[6]
        const publicKey = tmpData[7]
        const seedPhrase = tmpData.slice(33, 57).join(' ')

        ptyProcess.write('exit\r');
        callback(null, {
          address,
          publicKey,
          seedPhrase
        })
      }

      if(data.includes("override the existing name")) {
        ptyProcess.write('y\r');
        // callback('Key already exists')
      }
    });

    ptyProcess.write('cd '+config.filePath+'\r');
    ptyProcess.write('./'+config.fileName+' keys add '+name+'\r');
  },

  issue(tokenName, totalSupply, symbol, keyName, password, callback) {
    const ptyProcess = bnb.spawnProcess()

    ptyProcess.on('data', function(data) {
      process.stdout.write(data);

      if(data.includes("Committed")) {

        let index = data.indexOf('Issued '+symbol)
        let uniqueSymbol = data.substr(index+7, 7)

        callback(null, { uniqueSymbol })
        ptyProcess.write('exit\r');
      }

      if(data.includes('Password to sign with')) {
        ptyProcess.write(password+"\r");
      }
    });

    ptyProcess.write('cd '+config.filePath+'\r');
    ptyProcess.write('./'+config.fileName+' token issue --token-name "'+tokenName+'" --total-supply '+totalSupply+' --symbol '+symbol+' --mintable --from '+keyName+' --chain-id='+config.chainID+' --node='+config.nodeData+' --trust-node\r');
  },

  mint(amount, symbol, keyName, callback) {
    const ptyProcess = bnb.spawnProcess()

    ptyProcess.on('data', function(data) {
      // process.stdout.write(data);
      callback(null, data)
      ptyProcess.write('exit\r');
    });

    ptyProcess.write('cd '+config.filePath+'\r');
    ptyProcess.write('./'+config.fileName+' token mint --amount '+amount+' --symbol '+symbol+' --from '+keyName+' --chain-id='+config.chainID+' --node='+config.nodeData+' --trust-node\r');
  },

  burn(amount, symbol, keyName, callback) {
    const ptyProcess = bnb.spawnProcess()

    ptyProcess.on('data', function(data) {
      // process.stdout.write(data);
      callback(null, data)
      ptyProcess.write('exit\r');
    });

    ptyProcess.write('cd '+config.filePath+'\r');
    ptyProcess.write('./'+config.fileName+' token burn --amount '+amount+' --symbol '+symbol+' --from '+keyName+' --chain-id='+config.chainID+' --node='+config.nodeData+' --trust-node\r');
  },

  transfer(mnemonic, publicTo, amount, asset, message, callback) {

    console.log('TRANSFER INFORMATION')
    console.log(mnemonic)
    console.log(publicTo)
    console.log(amount)
    console.log(asset)
    console.log(message)

    const privateFrom = BnbApiClient.crypto.getPrivateKeyFromMnemonic(mnemonic);
    const publicFrom = BnbApiClient.crypto.getAddressFromPrivateKey(privateFrom);

    const sequenceURL = `${config.api}api/v1/account/${publicFrom}/sequence`;

    const bnbClient = new BnbApiClient(config.api);
    bnbClient.setPrivateKey(privateFrom);
    bnbClient.initChain();

    httpClient.get(sequenceURL)
    .then((res) => {
      const sequence = res.data.sequence || 0
      return bnbClient.transfer(publicFrom, publicTo, amount, asset, message, sequence)
    })
    .then((result) => {
      if (result.status === 200) {
        callback(null, result)
      } else {
        callback(result)
      }
    })
    .catch((error) => {
      callback(error)
    });
  },

  freeze(amount, symbol, keyName, callback) {
    const ptyProcess = bnb.spawnProcess()

    ptyProcess.on('data', function(data) {
      // process.stdout.write(data);
      callback(null, data)
      ptyProcess.write('exit\r');
    });

    ptyProcess.write('cd '+config.filePath+'\r');
    ptyProcess.write('./'+config.fileName+' token freeze --amount '+amount+' --symbol '+symbol+' --from '+keyName+' --chain-id='+config.chainID+' --node='+config.nodeData+' --trust-node\r');
  },

  unfreeze(amount, symbol, keyName, callback) {
    const ptyProcess = bnb.spawnProcess()

    ptyProcess.on('data', function(data) {
      // process.stdout.write(data);
      callback(null, data)
      ptyProcess.write('exit\r');
    });

    ptyProcess.write('cd '+config.filePath+'\r');
    ptyProcess.write('./'+config.fileName+' token unfreeze --amount '+amount+' --symbol '+symbol+' --from '+keyName+' --chain-id='+config.chainID+' --node='+config.nodeData+' --trust-node\r');
  },

  getBalance(address, callback) {
    const bnbClient = new BnbApiClient(config.api);
    bnbClient.getBalance(address).then((balances) => { callback(null, balances ) });
  }
}

module.exports = bnb
