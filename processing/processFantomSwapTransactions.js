/*
  PROCESS TRANSACTIONS:

  1. Get all swap transactions where a deposit transaction hash is defined and a transfer deposit hash is not defined from the DB.
  2. Issue the swap commmand via BNB helper
  3. Mark transfers successful and update the transfer deposit hash in the DB

*/

const db = require('./helpers/db.js').db
const config = require('./config')
const bnb = require('./helpers/bnb.js')

const FANTOM_UUID = "81c68eea-5650-a48a-b550-f090f3ea9fcf"

getToken()

function getToken() {
  db.oneOrNone("select * from tokens where uuid = $1;", [FANTOM_UUID])
  .then((token) => {
    getAllTransactions(token)
  })
  .catch(error)
}

function getAllTransactions(token) {
  db.manyOrNone("select * from swaps where token_uuid = $1 and deposit_transaction_hash is not null and transfer_transaction_hash is null and processed is null;", [FANTOM_UUID])
  .then((swaps) => {
    callTransfer(token, swaps)
  })
  .catch(error)
}

function error(err) {
  console.log(err)
  return
}

function getKey(callback) {
  db.oneOrNone('select bnb.* from tokens tok left join bnb_accounts bnb on tok.bnb_account_uuid = bnb.uuid where tok.uuid = $1;', [FANTOM_UUID])
  .then(callback)
  .catch(error)
}

function callTransfer(token, swaps) {
  if(!swaps || swaps.length === 0) {
    return error('Nothing to process: ', swaps)
  }

  getKey((key) => {
    if(!key) {
      return error('Key not found: ', key)
    }

    let swapUuids = []

    const toObj = swaps.map((swap) => {
      swapUuids.push(swap.uuid)

      return {
        to: swap.bnb_address,
        coins: [
          {
            denom: token.unique_symbol,
            amount: token.fee_per_swap ? (parseFloat(swap.amount) - parseFloat(token.fee_per_swap))+"" : swap.amount
          }
        ]
      }
    })

    console.log(toObj)

    bnb.multiSend(key.seed_phrase, toObj, 'BNBridge Swap', (err, sendResult) => {
      if(err) {
        return error('Nothing to process swap:', err)
      }

      console.log(sendResult)

      if(sendResult && sendResult.result && sendResult.result.length > 0) {
        const transactionHash = sendResult.result[0].hash

        updateSuccess(swapUuids, transactionHash)

      } else {
        return error('Swap result invalid:', sendResult)
      }
    })
  })
}

function updateSuccess(swapUuids, transactionHash) {
  const swapString = "'" + swapUuids.join("', '") + "'"
  console.log(swapString)

  db.none("update swaps set transfer_transaction_hash = $1 where uuid in ("+swapString+");", [transactionHash])
  .then(() => {
    console.log("DONE")
  })
  .catch(error)
}
