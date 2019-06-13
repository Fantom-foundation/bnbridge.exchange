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
const async = require('async')

const FANTOM_UUID = ""

getToken()

function getToken() {
  db.oneOrNone("select * from tokens where uuid = $1;", [FANTOM_UUID])
  .then((token) => {
    getClientAddresses((clients) => {
      // console.log(clients)

      const clientAddresses = clients.map((client) => {
        return client.eth_address
      })

      getTransactionsForAddresses(token, clientAddresses, clients)
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

function getSwapsInDb(callback) {
  db.manyOrNone('select * from swaps where deposit_transaction_hash is not null;', [])
  .then(callback)
  .catch(error)
}

function getTransactionsForAddresses(token, clientAddresses, clients) {
  eth.getTransactionsForAddress(token.erc20_address, clientAddresses, (err, transactions) => {
    if(err) {
      return error(err)
    }

    getSwapsInDb((dbSwaps) => {

      const pendingSwaps = transactions.filter((tx) => {
        const thisSwap = dbSwaps.filter((swap) => {
          return swap.deposit_transaction_hash === tx.transactionHash
        })

        return thisSwap.length === 0
      }).map((pendingSwap) => {
        const thisClient = clients.filter((client) => {
          return client.eth_address === pendingSwap.to
        })

        if(thisClient.length > 0) {
          pendingSwap.client = thisClient[0]
        } else {
          console.log("WHERE IS MY CLIENT???????")
        }

        return pendingSwap
      })

      console.log(pendingSwaps)

      // async.map(pendingSwaps, (swap, callback) => {
      //   insertSwap(swap, token, callback)
      // }, (err, data) => {
      //   if(err) {
      //     return error(err)
      //   }
      //
      //   console.log("DONE")
      //   console.log('Inserted these:', data)
      // })
    })
  })
}

// function insertSwap(transaction, token, callback) {
//   db.oneOrNone('insert into swaps (uuid, token_uuid, eth_address, bnb_address, amount, client_account_uuid, deposit_transaction_hash, created) values (md5(random()::text || clock_timestamp()::text)::uuid, $1, $2, $3, $4, $5, $6, now()) returning uuid, eth_address, amount, deposit_transaction_hash;', [token.uuid, transaction.from, transaction.client.bnb_address, transaction.amount, transaction.client.uuid, transaction.transactionHash])
//   .then((response) => {
//     callback(null, response)
//   })
//   .catch(callback)
// }
