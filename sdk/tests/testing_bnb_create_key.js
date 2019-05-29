var os = require('os');
var pty = require('node-pty');

var shell = os.platform() === 'win32' ? 'powershell.exe' : 'bash';

var ptyProcess = pty.spawn(shell, [], {
  name: 'xterm-color',
  cols: 800,
  rows: 30,
  cwd: process.env.HOME,
  env: process.env
});

const KEY_NAME = "key"
const PASSWORD = ""
const PATH = "c:/opt/fantom/fantom-binance/cli/node-binary/cli/testnet/0.5.8.1/windows/"
const FILE = "tbnbcli.exe"

ptyProcess.on('data', function(data) {
  process.stdout.write(data);

  if(data.includes("Enter a passphrase")) {
    // process.stdout.write('Setting password to '+PASSWORD);
    ptyProcess.write(PASSWORD+'\r');
  }

  if(data.includes("Repeat the passphrase")) {
    // process.stdout.write('Confirming password to '+PASSWORD);
    ptyProcess.write(PASSWORD+'\r');
  }

  if(data.includes("**Important**")) {
    // process.stdout.write(data);

    const tmpData = data.replace(/\s\s+/g, ' ').replace(/[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g, '').split(' ');
    const publicKey = tmpData[6]
    const privateKey = tmpData[7]
    const seedPhrase = tmpData.slice(33, 57).join(' ')
    console.log(publicKey)
    console.log(privateKey)
    console.log(seedPhrase)

    ptyProcess.write('exit\r');
  }

  if(data.includes("override the existing name")) {
    // process.stdout.write('Overwriting key');
    ptyProcess.write('y\r');
  }
});

ptyProcess.write('cd '+PATH+'\r');
ptyProcess.write('./'+FILE+' keys add '+KEY_NAME+'\r');
