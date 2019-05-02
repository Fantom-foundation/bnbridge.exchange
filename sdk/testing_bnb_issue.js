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

const TOKEN_NAME = "anton_token"
const TOTAL_SUPPLY = "100000000000000000"
const SYMBOL = 'ANT'
const KEY_NAME = 'anton_key'
const PATH = "c:/opt/fantom/fantom-binance/cli/node-binary/cli/testnet/0.5.8.1/windows/"
const FILE = "tbnbcli.exe"

ptyProcess.on('data', function(data) {
  process.stdout.write(data);
});

ptyProcess.write('cd '+PATH+'\r');
ptyProcess.write('./'+FILE+' token issue --token-name "'+TOKEN_NAME+'" --total-supply '+TOTAL_SUPPLY+' --symbol '+SYMBOL+' --mintable --from '+KEY_NAME+' --chain-id=Binance-Chain-Nile --node=data-seed-pre-2-s1.binance.org:80 --trust-node\r');
