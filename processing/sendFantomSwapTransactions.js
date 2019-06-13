/*
  PROCESS TRANSACTIONS:

  1. Get all swap transactions where a deposit transaction hash is defined and a transfer deposit hash is not defined from the DB.
  2. Issue the swap commmand via BNB helper
  3. Mark transfers successful and update the transfer deposit hash in the DB

*/

const db = require('./helpers/db.js').db
const config = require('./config')
const bnb = require('./helpers/bnb.js')

const FANTOM_UUID = ""

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

    let sum = 0

    const toObj = swaps.reduce((accumulator, currentValue) => {

      swapUuids.push(currentValue.uuid)
      sum = parseFloat(sum) + (parseFloat(currentValue.amount))

      const thisSwap = accumulator.filter((swap) => {
        return swap.to === currentValue.bnb_address
      })

      const amount = (parseFloat(currentValue.amount)).toFixed(8)

      if(thisSwap.length > 0) {
        thisSwap[0].coins[0].amount = (parseFloat(thisSwap[0].coins[0].amount) + parseFloat(amount)).toFixed(8)

        return accumulator
      } else {
        accumulator.push({
          to: currentValue.bnb_address,
          coins: [
            {
              denom: token.unique_symbol,
              amount: amount
            }
          ]
        })
        return accumulator
      }
    }, [])

    console.log(JSON.stringify(toObj, null, 2))

    console.log("TOTAL SENDING: ", sum)

    bnb.multiSend(key.seed_phrase, toObj, 'BNBridge Swap', (err, sendResult) => {
      if(err) {
        return error('Swap failed!:', err)
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

  db.none("update swaps set transfer_transaction_hash = $1, processed = true where uuid in ("+swapString+");", [transactionHash])
  .then(() => {
    console.log("DONE")
  })
  .catch(error)
}
