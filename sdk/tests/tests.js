const data = '[0K[?25h{"Height":"19600141","TxHash":"E3621FD3BD695F9ADB7495067DD8D13C9D104AD5068C6EFB7FD9714EEAA3FEB6","Response":{"data":"NTQ4","log":"Msg 0: ","tags":[{"key":"YWN0aW9u","value":"c3VibWl0LXByb3Bvc2Fs"},{"key":"cHJvcG9zZXI=","value":"dGJuYjFndTB5NDlrNW5teWZ2NHJma2VsN2Z3djJ3aGV3NXRmamN6amQwaw=="},{"key":"cHJvcG9zYWwtaWQ=","value":"NTQ4"},{"key":"YWN0aW9u","value":"c3VibWl0X3Byb3Bvc2Fs"}]}}[0K[?25lPS C:\opt\fantom\fantom-binance\cli\node-binary\cli\testnet\0.5.8.1\windows>[0K[78G[?25h'
const removed = data.replace(/[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g, '')


console.log(removed)

if(removed.includes('PS')) {
  const index = removed.indexOf('"TxHash":')
  const hash = removed.substring(index+10, index+74).trim()

  console.log(hash)
}
