var os = require('os');
var pty = require('node-pty');

var shell = os.platform() === 'win32' ? 'powershell.exe' : 'bash';

var ptyProcess = pty.spawn(shell, [], {
  name: 'xterm-color',
  cols: 80,
  rows: 30,
  cwd: process.env.HOME,
  env: process.env
});

const KEY_NAME = "anton_key"
const PASSWORD = "123123123"
const PATH = "c:/opt/fantom/fantom-binance/cli/node-binary/cli/testnet/0.5.8.1/windows/"
const FILE = "tbnbcli.exe"

ptyProcess.on('data', function(data) {
  process.stdout.write(data);

  if(data.includes("Enter a passphrase")) {
    process.stdout.write('Setting password to '+PASSWORD);
    ptyProcess.write(PASSWORD+'\r');
  }

  if(data.includes("Repeat the passphrase")) {
    process.stdout.write('Confirming password to '+PASSWORD);
    ptyProcess.write(PASSWORD+'\r');
  }

  if(data.includes("**Important**")) {
    process.stdout.write(data);
  }

  if(data.includes("override the existing name")) {
    process.stdout.write('Overwriting key');
    ptyProcess.write('y\r');
  }
});

ptyProcess.write('cd '+PATH+'\r');
ptyProcess.write('./'+FILE+' keys add '+KEY_NAME+'\r');
