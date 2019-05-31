/*
  PROCESS SWAPS:
  1. get all the client addresses defined in the DB.
  2. Get all the transactions to those accounts
  3. Check to see if the transactions exist in the DB
     If not, Add them to the swaps table
*/

const db = require('./helpers/db.js').db
const config = require('./config')
const bnb = require('./helpers/bnb.js')
const eth = require('./helpers/eth.js')

const FANTOM_UUID = "81c68eea-5650-a48a-b550-f090f3ea9fcf"

getToken()

function getToken() {
  db.oneOrNone("select * from tokens where uuid = $1;", [FANTOM_UUID])
  .then((token) => {
    getClientAddresses((clients) => {
      console.log(clients)

      const clientAddresses = clients.map((client) => {
        return client.eth_address
      })

      getTransactionsForAddresses(token.erc20_address, clientAddresses)
    })
  })
  .catch(error)
}


function error(err) {
  console.log(err)
  return
}

function getClientAddresses(callback) {
  db.manyOrNone('select ca.uuid, ca.bnb_address, cea.address as eth_address from client_accounts ca left join client_eth_accounts cea on ca.client_eth_account_uuid = cea.uuid')
  .then(callback)
  .catch(error)
}

function getTransactionsForAddresses(contractAddress, clientAddresses) {
  eth.getTransactionsForAddress(contractAddress, clientAddresses, (err, transactions) => {
    if(err) {
      return error(err)
    }

    console.log(transactions)
  })
}
