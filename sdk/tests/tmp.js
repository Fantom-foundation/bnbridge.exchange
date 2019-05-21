const response = '[0K[?25h{"Height":"16114770","TxHash":"9A128DEAFCB6DD0E8545D6A44FF65381FCCE03FDF6C39BD3FBECC75B2FB53DE0","Response":{"data":"NDc0","log":"Msg 0: ","tags":[{"key":"YWN0aW9u","value":"c3VibWl0LXByb3Bvc2Fs"},{"key":"cHJvcG9zZXI=","value":"dGJuYjEwM3RneXgweGFjM3BnYTRlMnEzdDcyY3pqcnZqZ2hobDk0Y2g0ZQ=="},{"key":"cHJvcG9zYWwtaWQ=","value":"NDc0"},{"key":"YWN0aW9u","value":"c3VibWl0X3Byb3Bvc2Fs"}]}}[0K[?25l'


let tmpData = response.replace(/\s\s+/g, ' ').replace(/[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g, '')

if(tmpData.includes(' PS ')) {
  let index = tmpData.indexOf(' PS ')
  tmpData = tmpData.substring(0, index).trim()
}

tmpData = JSON.parse(tmpData)






// if(tmpData.includes(" PS ")) {
//   let index = tmpData.indexOf(' PS ')
//   tmpData = tmpData.substring(0, index))
// }


console.log(tmpData)
