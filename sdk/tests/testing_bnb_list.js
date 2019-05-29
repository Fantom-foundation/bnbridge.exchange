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

const INIT_PRICE = '100000000000000000'
const PROPOSAL_ID = '15'
const SYMBOL = 'ANT-B90'
const KEY_NAME = 'key'
const PATH = "c:/opt/fantom/fantom-binance/cli/node-binary/cli/testnet/0.5.8.1/windows/"
const FILE = "tbnbcli.exe"

const PASSWORD = ""

ptyProcess.on('data', function(data) {
  process.stdout.write(data);

  if(data.includes('Password to sign with')) {
    ptyProcess.write(PASSWORD+'\r');
  }
});

ptyProcess.write('cd '+PATH+'\r');
ptyProcess.write('./'+FILE+' dex list -s '+SYMBOL+' --quote-asset-symbol BNB --from '+KEY_NAME+' --init-price '+INIT_PRICE+' --proposal-id '+PROPOSAL_ID+' --chain-id=Binance-Chain-Nile --node=data-seed-pre-2-s1.binance.org:80 --trust-node --json\r');
