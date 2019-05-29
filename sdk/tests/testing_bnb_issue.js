var os = require('os');
var pty = require('node-pty');

var shell = os.platform() === 'win32' ? 'powershell.exe' : 'bash';

var ptyProcess = pty.spawn(shell, [], {
  name: 'xterm-color',
  cols: 8000,
  rows: 30,
  cwd: process.env.HOME,
  env: process.env
});

const TOKEN_NAME = "TEST TOKEN"
const TOTAL_SUPPLY = "100000000000000"
const SYMBOL = 'TST'
const KEY_NAME = 'key'
const PATH = "c:/opt/fantom/fantom-binance/cli/node-binary/cli/testnet/0.5.8.1/windows/"
const FILE = "tbnbcli.exe"
const PASSWORD = ""

ptyProcess.on('data', function(data) {
  process.stdout.write(data);

  if(data.includes("Committed")) {

    let index = data.indexOf('Issued '+SYMBOL)
    data.substr(index+7, 7)

    ptyProcess.write('exit\r');
  }

  if(data.includes('Password to sign with')) {
    ptyProcess.write(PASSWORD+'\r');
  }
});

ptyProcess.write('cd '+PATH+'\r');
ptyProcess.write('./'+FILE+' token issue --token-name "'+TOKEN_NAME+'" --total-supply '+TOTAL_SUPPLY+' --symbol '+SYMBOL+' --mintable --from '+KEY_NAME+' --chain-id=Binance-Chain-Nile --node=data-seed-pre-2-s1.binance.org:80 --trust-node\r');
