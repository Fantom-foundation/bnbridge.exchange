const db = require('../helpers/db.js').db
const config = require('../config')
const bnb = require('../helpers/bnb.js')
const eth = require('../helpers/eth.js')
const async = require('async')
const generator = require('generate-password');

const models = {

  /**
   *  Creates a new BNB account for the token (privateKey)
   *  Creates a new Eth account for the token (privateKey)
   *  Inserts the BNB/Eth pairing into the DB with the Token details
   */
  createToken(req, res, next) {
    let result = models.validateCreateToken(req.body)

    if(result !== true) {
      res.status(400)
      res.body = { 'status': 400, 'success': false, 'result': result }
      return next(null, req, res, next)
    }

    models.insertToken(req.body, (err, response) => {
      if(err || !response) {
        console.log(err)
        res.status(500)
        res.body = { 'status': 500, 'success': false, 'result': 'Unable to insert token' }
        return next(null, req, res, next)
      } else {
        const uuid = response.uuid

        async.parallel([
          (callback) => { models.processBNBAccount(req.body, callback) },
          (callback) => { models.processEthAccount(req.body, callback) }
        ], (err, data) => {
          if(err) {
            console.log(err)
            res.status(500)
            res.body = { 'status': 500, 'success': false, 'result': 'Unable to process request' }
            return next(null, req, res, next)
          }
          let bnbUUID = data[0]
          let ethUUID = data[1]

          models.updateTokenAddresses(uuid, bnbUUID, ethUUID, (err, updateResponse) => {
            models.getTokenInfo(uuid, (err, getResponse) => {
              if(err) {
                console.log(err)
                res.status(500)
                res.body = { 'status': 500, 'success': false, 'result': 'Unable to retrieve token information' }
                return next(null, req, res, next)
              }

              res.status(205)
              res.body = { 'status': 200, 'success': true, 'result': getResponse }
              return next(null, req, res, next)
            })
          })
        })

      }
    })
  },

  validateCreateToken(body, response) {
    const {
      name,
      symbol,
      total_supply,
      erc20_address
    } = body
    if(!name) {
      return 'name is required'
    }
    if(!symbol) {
      return 'symbol is required'
    }
    if(!total_supply) {
      return 'total_supply is required'
    }
    if(!erc20_address) {
      return 'erc20_address is required'
    }

    return true
  },

  insertToken(body, callback) {
    const {
      name,
      symbol,
      total_supply,
      erc20_address,
    } = body

    db.oneOrNone('insert into tokens (uuid, name, symbol, total_supply, erc20_address, created) values (md5(random()::text || clock_timestamp()::text)::uuid, $1, $2, $3, $4, now()) returning uuid', [name, symbol, total_supply, erc20_address])
    .then((response) => {
      callback(null, response)
    })
    .catch(callback)
  },

  genPassword() {
    return generator.generate({
      length: 20,
      numbers: true,
      symbols: false,
      uppercase: true,
      strict: true
    })
  },

  processBNBAccount(body, callback) {
    const { symbol } = body
    const keyName = symbol+'_key'
    const password = models.genPassword()

    bnb.createKey(keyName, password, (err, keyData) => {
      if(err) {
        console.log(err)
        callback(err)
      }

      models.insertBNBAccount(keyName, password, keyData, callback)
    })
  },

  insertBNBAccount(keyName, password, keyData, callback) {

    db.oneOrNone('insert into bnb_accounts (uuid, public_key, address, seed_phrase, key_name, password, created) values (md5(random()::text || clock_timestamp()::text)::uuid, $1, $2, $3, $4, $5, now()) returning uuid;', [keyData.publicKey, keyData.address, keyData.seedPhrase, keyName, password])
    .then((response) => {
      callback(null, response)
    })
    .catch(callback)
  },

  processEthAccount(body, callback) {
    eth.createAccount((err, account) => {
      if(err) {
        console.log(err)
        return callback(err)
      }

      models.insertEthAccount(account, callback)
    })
  },

  insertEthAccount(account, callback) {
    db.oneOrNone('insert into eth_accounts (uuid, private_key, address, created) values (md5(random()::text || clock_timestamp()::text)::uuid, $1, $2, now()) returning uuid;', [account.privateKey, account.address])
    .then((response) => {
      callback(null, response)
    })
    .catch(callback)
  },

  updateTokenAddresses(uuid, bnbUUID, ethUUID, callback) {
    db.none('update tokens set bnb_account_uuid=$1, eth_account_uuid=$2 where uuid=$3;', [bnbUUID.uuid, ethUUID.uuid, uuid])
    .then(callback)
    .catch(callback)
  },

  getTokenInfo(uuid, callback) {
    db.oneOrNone('select tok.uuid, tok.name, tok.symbol, tok.total_supply, tok.erc20_address, bnb.address as bnb_address from tokens tok left join bnb_accounts bnb on bnb.uuid = tok.bnb_account_uuid where tok.uuid = $1;',[uuid])
    .then((token) => {
      callback(null, token)
    })
    .catch(callback)
  },

  /**
   *  Checks whether the account has been funded with the BNB tokens.
   *  Once true
   *  Issues a new token on BNB chain
   *  Mints new tokens on BNB chain
   *  Transfers the funds from our BNB account to their BNB account
   */
  finalizeToken(req, res, next) {
    let result = models.validateFinalize(req.body)

    if(result !== true) {
      res.status(400)
      res.body = { 'status': 400, 'success': false, 'result': result }
      return next(null, req, res, next)
    }

    let { uuid } = req.body

    models.getTokenInfo(uuid, (err, tokenInfo) => {
      if(err) {
        console.log(err)
        res.status(500)
        res.body = { 'status': 500, 'success': false, 'result': 'Unable to retrieve token information' }
        return next(null, req, res, next)
      }

      models.validateBalances(tokenInfo, (err, code, balanceValidation) => {
        if(err) {
          console.log(err)
          res.status(code)
          res.body = { 'status': code, 'success': false, 'result': err }
          return next(null, req, res, next)
        }

        models.getKey(tokenInfo.bnb_address, (err, key) => {
          if(err || !key) {
            console.log(err)
            res.status(500)
            res.body = { 'status': 500, 'success': false, 'result': 'Unable to retrieve key' }
            return next(null, req, res, next)
          }

          bnb.issue(tokenInfo.name, tokenInfo.total_supply, tokenInfo.symbol, key.key_name, key.password, (err, issueResult) => {
            if(err) {
              console.log(err)
              res.status(500)
              res.body = { 'status': 500, 'success': false, 'result': err }
              return next(null, req, res, next)
            }

            models.updateUniqueSymbol(uuid, issueResult.uniqueSymbol, (err, result) => {
              if(err) {
                console.log(err)
                res.status(500)
                res.body = { 'status': 500, 'success': false, 'result': err }
                return next(null, req, res, next)
              }

              res.status(205)
              res.body = { 'status': 200, 'success': true, 'result': 'Token Issued' }
              return next(null, req, res, next)
            })
          })
        })
      })
    })
  },

  validateFinalize(body) {
    let { uuid } = body

    if(!uuid) {
      return 'uuid is required'
    }

    return true
  },

  validateBalances(getResponse, callback) {

    bnb.getFees((err, feesData) => {
      if(err) {
        console.log(err)
        return callback(err, 500)
      }

      const fees = feesData.data
      const reducer = (accumulator, currentValue) => accumulator + currentValue.fee;
      let totalRequired = fees.filter((fee) => {
        return ['issueMsg'].includes(fee.msg_type)
      })
      .reduce(reducer, 0)

      bnb.getBalance(getResponse.bnb_address, (err, balances) => {
        if(err) {
          console.log(err)
          return callback(err, 500)
        }

        let accountBalance = 0
        if(balances.length > 0) {
          let bal = balances.filter((balance) => {
            return balance.symbol == 'BNB'
          }).map((balance) => {
            return balance.free
          })

          if(bal.length > 0) {
            bal = bal[0]
            accountBalance = bal * 100000000
          } else {
            return callback('Unable to get balances.', 500)
          }
        }

        if(accountBalance < totalRequired) {
          return callback('Insufficient funds.', 400, {
            accountBalance,
            totalRequired
          })
        } else {
          return callback(null, 200, {
            accountBalance,
            totalRequired
          })
        }
      })
    })
  },

  getKey(address, callback) {
    db.oneOrNone('select key_name, seed_phrase as mnemonic, password from bnb_accounts where address = $1;', [address])
    .then((key) => {
      callback(null, key)
    })
    .catch(callback)
  },

  updateUniqueSymbol(uuid, uniqueSymbol, callback) {
    db.none('update tokens set unique_symbol=$1, processed=true where uuid=$2;', [uniqueSymbol, uuid])
    .then(callback)
    .catch(callback)
  },

  /**
   *  Returns a list of tokens
   */
  getTokens(req, res, next) {
    db.manyOrNone('select tok.uuid, tok.name, tok.symbol, tok.total_supply, tok.erc20_address, eth.address as eth_address from tokens tok left join eth_accounts eth on eth.uuid = tok.eth_account_uuid where processed is true;')
    .then((tokens) => {
      if (!tokens) {
        res.status(404)
        res.body = { 'status': 404, 'success': false, 'result': 'No tokens defined' }
        return next(null, req, res, next)
      } else {
        res.status(205)
        res.body = { 'status': 200, 'success': true, 'result': tokens }
        return next(null, req, res, next)
      }
    })
    .catch((err) => {
      console.log(err)
      res.status(500)
      res.body = { 'status': 500, 'success': false, 'result': err }
      return next(null, req, res, next)
    })
  },

  /**
   *  Returns a specific token details. Deposit addresses
   */
  getToken(req, res, next) {
    db.oneOrNone('select tok.uuid, tok.name, tok.symbol, tok.total_supply, tok.erc20_address, eth.address as eth_address from tokens tok left join eth_accounts eth on eth.uuid = tok.eth_account_uuid where tok.uuid = $1 and processed is true;',[req.params.uuid])
    .then((token) => {
      if (!token) {
        res.status(404)
        res.body = { 'status': 404, 'success': false, 'result': 'No token defined' }
        return next(null, req, res, next)
      } else {
        res.status(205)
        res.body = { 'status': 200, 'success': true, 'result': token }
        return next(null, req, res, next)
      }
    })
    .catch((err) => {
      console.log(err)
      res.status(500)
      res.body = { 'status': 500, 'success': false, 'result': err }
      return next(null, req, res, next)
    })
  },

  /**
  *
  */
  getFees(req, res, next) {
    bnb.getFees((err, feesData) => {
      if(err) {
        console.log(err)
        res.status(500)
        res.body = { 'status': 500, 'success': false, 'result': err }
        return next(null, req, res, next)
      }

      const data = feesData.data
      let fees = data.filter((fee) => {
        return ['issueMsg', ''].includes(fee.msg_type)
      })

      res.status(205)
      res.body = { 'status': 200, 'success': true, 'result': fees }
      return next(null, req, res, next)
    })
  },

  /**
  * Inserts teh swap record into the DB.
  * Returns the token deposit address.
  */
  swapToken(req, res, next) {
    let result = models.validateSwap(req.body)

    if(result !== true) {
      res.status(400)
      res.body = { 'status': 400, 'success': false, 'result': result }
      return next(null, req, res, next)
    }

    const {
      token_uuid,
      bnb_address,
      eth_address,
      amount
    } = req.body

    models.insertSwap(token_uuid, bnb_address, eth_address, amount, (err, insertResponse) => {
      if(err) {
        console.log(err)
        res.status(500)
        res.body = { 'status': 500, 'success': false, 'result': err }
        return next(null, req, res, next)
      }

      const uuid = insertResponse.uuid

      models.getTokenSwapInfo(token_uuid, (err, tokenInfo) => {
        if(err) {
          console.log(err)
          res.status(500)
          res.body = { 'status': 500, 'success': false, 'result': err }
          return next(null, req, res, next)
        }

        if(!tokenInfo) {
          res.status(500)
          res.body = { 'status': 500, 'success': false, 'result': 'Unable to get token information' }
          return next(null, req, res, next)
        }

        tokenInfo.swap_uuid = uuid

        res.status(205)
        res.body = { 'status': 200, 'success': true, 'result': tokenInfo }
        return next(null, req, res, next)
      })
    })
  },

  validateSwap(body) {
    const {
      token_uuid,
      bnb_address,
      eth_address,
      amount
    } = body

    if(!token_uuid) {
      return 'token_uuid is required'
    }
    if(!bnb_address) {
      return 'bnb_address is required'
    }
    if(!eth_address) {
      return 'eth_address is required'
    }
    if(!amount) {
      return 'amount is required'
    }

    return true
  },

  insertSwap(tokenUuuid, bnbAddress, ethAddress, amount, callback) {
    db.oneOrNone('insert into swaps (uuid, token_uuid, eth_address, bnb_address, amount, created) values (md5(random()::text || clock_timestamp()::text)::uuid, $1, $2, $3, $4, now()) returning uuid;', [tokenUuuid, ethAddress, bnbAddress, amount])
    .then((response) => {
      callback(null, response)
    })
    .catch(callback)
  },

  getTokenSwapInfo(tokenUuuid, callback) {
    db.oneOrNone('select tok.uuid, tok.name, tok.symbol, tok.unique_symbol, tok.total_supply, tok.erc20_address, eth.address as eth_address, bnb.address as bnb_address from tokens tok left join eth_accounts eth on eth.uuid = tok.eth_account_uuid left join bnb_accounts bnb on bnb.uuid = tok.bnb_account_uuid where tok.uuid = $1;', [tokenUuuid])
    .then((response) => {
      callback(null, response)
    })
    .catch(callback)
  },

  /**
  * Checks to see if a deposit was made worth amount from erc20 address defined.
  * If true, transfers the equivalent amoutn to the bnb address defined.
  */
  finalizeSwap(req, res, next) {
    let result = models.validateFinalizeSwap(req.body)

    if(result !== true) {
      res.status(400)
      res.body = { 'status': 400, 'success': false, 'result': result }
      return next(null, req, res, next)
    }

    models.getTokenSwap(req.body.uuid, (err, swapInfo) => {
      if(err) {
        console.log(err)
        res.status(500)
        res.body = { 'status': 500, 'success': false, 'result': err }
        return next(null, req, res, next)
      }

      console.log('SWAP INFO')
      console.log(swapInfo)
      models.getTokenSwapInfo(swapInfo.token_uuid, (err, tokenInfo) => {
        if(err) {
          console.log(err)
          res.status(500)
          res.body = { 'status': 500, 'success': false, 'result': err }
          return next(null, req, res, next)
        }

        console.log('TOKEN INFO')
        console.log(tokenInfo)
        eth.getTransactions(tokenInfo.erc20_address, swapInfo.eth_address, tokenInfo.eth_address, swapInfo.amount, (err, transactions) => {

          console.log('ERC0: ', tokenInfo.erc20_address)
          console.log('From: ', swapInfo.eth_address)
          console.log('To: ', tokenInfo.eth_address)
          console.log('Amount: ', swapInfo.amount)

          console.log('TRANSACTIONS')
          console.log(transactions)
          if(transactions.length > 0) {
            models.getTransactionHashs(swapInfo.eth_address, tokenInfo.erc20_address, (err, previousTransactions) => {

              console.log('PREVIOUS TRANSACTIONS')
              console.log(previousTransactions)
              //checck whether the transfer was done to fund a previous swap
              let acceptableTransactions = []
              for(var i = 0; i < transactions.length; i++) {
                let used = false
                for(var j = 0; j < previousTransactions.length; j++) {
                  if(transactions[i].transactionHash == previousTransactions[j].deposit_transaction_hash) {
                    used = true
                  }
                }
                if(!used) {
                  acceptableTransactions.push(transactions[i])
                }
              }


              console.log('ACCEPTABLE TRANSACTIONS')
              console.log(acceptableTransactions)
              //success, we can transfer the funds
              if(acceptableTransactions.length > 0) {
                models.updateWithDepositTransactionHash(swapInfo.uuid, acceptableTransactions[0].transactionHash, (err) => {
                  if(err) {
                    console.log(err)
                    res.status(500)
                    res.body = { 'status': 500, 'success': false, 'result': err }
                    return next(null, req, res, next)
                  }

                  models.getKey(tokenInfo.bnb_address, (err, key) => {
                    if(err || !key) {
                      console.log(err)
                      res.status(500)
                      res.body = { 'status': 500, 'success': false, 'result': 'Unable to retrieve key' }
                      return next(null, req, res, next)
                    }

                    console.log('KEY')
                    console.log(key)
                    bnb.transfer(key.mnemonic, swapInfo.bnb_address, swapInfo.amount, tokenInfo.unique_symbol, 'BNBridge Swap', (err, swapResult) => {
                      if(err) {
                        console.log(err)
                        res.status(500)
                        res.body = { 'status': 500, 'success': false, 'result': err }
                        return next(null, req, res, next)
                      }

                      console.log('SWAP RESULT')
                      console.log(swapResult)
                      if(swapResult && swapResult.result && swapResult.result.length > 0) {
                        let resultHash = swapResult.result[0].hash

                        models.updateWithTransferTransactionHash(swapInfo.uuid, resultHash, (err) => {
                          if(err) {
                            console.log(err)
                            res.status(500)
                            res.body = { 'status': 500, 'success': false, 'result': err }
                            return next(null, req, res, next)
                          }

                          res.status(205)
                          res.body = { 'status': 200, 'success': true, 'result': resultHash }
                          return next(null, req, res, next)
                        })
                      }
                    })
                  })
                })
              } else {
                res.status(500)
                res.body = { 'status': 400, 'success': false, 'result': 'Unable to find the transaction' }
                return next(null, req, res, next)
              }
            })
          } else {
            res.status(500)
            res.body = { 'status': 400, 'success': false, 'result': 'Unable to find the transaction' }
            return next(null, req, res, next)
          }
        })
      })
    })
  },

  validateFinalizeSwap(body) {
    const {
      uuid
    } = body

    if(!uuid) {
      return 'uuid is required'
    }

    return true
  },

  getTokenSwap(uuid, callback) {
    db.oneOrNone('select * from swaps where uuid = $1;', [uuid])
    .then((response) => {
      callback(null, response)
    })
    .catch(callback)
  },

  getTransactionHashs(ethAddress, erc20Address, callback) {
    db.manyOrNone('select * from swaps where eth_address = $1 and token_uuid = (select uuid from tokens where erc20_address = $2);', [ethAddress, erc20Address])
    .then((response) => {
      callback(null, response)
    })
    .catch(callback)
  },

  updateWithDepositTransactionHash(uuid, hash, callback) {
    db.none('update swaps set deposit_transaction_hash = $2 where uuid = $1;', [uuid, hash])
    .then(callback)
    .catch(callback)
  },

  updateWithTransferTransactionHash(uuid, hash,  callback) {
    db.none('update swaps set transfer_transaction_hash = $2 where uuid = $1;', [uuid, hash])
    .then(callback)
    .catch(callback)
  }
}

module.exports = models
