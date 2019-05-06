var os = require('os');
var pty = require('node-pty');

var shell = os.platform() === 'win32' ? 'powershell.exe' : 'bash';

var ptyProcess = pty.spawn(shell, [], {
  name: 'xterm-color',
  cols: 160,
  rows: 30,
  cwd: process.env.HOME,
  env: process.env
});

const PATH = "c:/opt/fantom/fantom-binance/cli/node-binary/cli/testnet/0.5.8.1/windows/"
const FILE = "tbnbcli.exe"

ptyProcess.on('data', function(data) {
  process.stdout.write(data);
});

ptyProcess.write('cd '+PATH+'\r');
ptyProcess.write('./'+FILE+' status -n https://seed-pre-s3.binance.org:443\r');

ptyProcess.write('exit\r');
