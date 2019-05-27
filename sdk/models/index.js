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
      erc20_address,
      mintable
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
    if(!mintable) {
      return 'mintable is required'
    }

    return true
  },

  insertToken(body, callback) {
    let {
      name,
      symbol,
      total_supply,
      erc20_address,
      mintable
    } = body

    total_supply = total_supply/10000000000 // divide by 18 decimals of erc20 multiply by 8 deceimals of binance
    total_supply = total_supply.toFixed(0)

    db.oneOrNone('insert into tokens (uuid, name, symbol, total_supply, erc20_address, mintable, created) values (md5(random()::text || clock_timestamp()::text)::uuid, $1, $2, $3, $4, $5, $6, $7, now()) returning uuid', [name, symbol, total_supply, erc20_address, mintable])
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
    const keyName = config.keyPrepend+symbol+'_key'
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
    db.oneOrNone('select tok.uuid, tok.name, tok.symbol, tok.unique_symbol, tok.total_supply, tok.erc20_address, tok.mintable, tok.fee_per_swap, tok.minimum_swap_amount, bnb.address as bnb_address from tokens tok left join bnb_accounts bnb on bnb.uuid = tok.bnb_account_uuid where tok.uuid = $1;',[uuid])
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

          bnb.issue(tokenInfo.name, tokenInfo.total_supply, tokenInfo.symbol, tokenInfo.mintable, key.key_name, key.password, (err, issueResult) => {
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
    db.manyOrNone('select tok.uuid, tok.name, tok.symbol, tok.total_supply, tok.minimum_swap_amount, tok.fee_per_swap, tok.listed, tok.listing_proposed, tok.listing_proposal_uuid, tok.erc20_address, eth.address as eth_address from tokens tok left join eth_accounts eth on eth.uuid = tok.eth_account_uuid where processed is true;')
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
    db.oneOrNone('select tok.uuid, tok.name, tok.symbol, tok.total_supply, tok.minimum_swap_amount, tok.fee_per_swap, tok.erc20_address, eth.address as eth_address from tokens tok left join eth_accounts eth on eth.uuid = tok.eth_account_uuid where tok.uuid = $1 and processed is true;',[req.params.uuid])
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
  * Returns the fees associated with the action
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
        return ['issueMsg', 'dexList', 'submit_proposal'].includes(fee.msg_type) || fee.fixed_fee_params != null
      }).map((fee) => {
        if(fee.fixed_fee_params != null) {
          return fee.fixed_fee_params
        } else {
          return fee
        }
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


    models.getTokenSwapInfo(token_uuid, (err, tokenInfo) => {
      if(err) {
        console.log(err)
        res.status(500)
        res.body = { 'status': 500, 'success': false, 'result': err }
        return next(null, req, res, next)
      }

      if(!tokenInfo) {
        res.status(400)
        res.body = { 'status': 400, 'success': false, 'result': 'Unable to get token information' }
        return next(null, req, res, next)
      }

      //validate amount only if it is set for the token. Need to figure out who sets this amount up? Manual per token owner?
      if(tokenInfo.minimum_swap_amount !== null && tokenInfo.minimum_swap_amount !== '') {
        if(parseFloat(amount) < parseFloat(tokenInfo.minimum_swap_amount)) {
          res.status(400)
          res.body = { 'status': 400, 'success': false, 'result': 'Swap amount < minimum swap amount' }
          return next(null, req, res, next)
        }
      }

      models.insertSwap(token_uuid, bnb_address, eth_address, amount, (err, insertResponse) => {
        if(err) {
          console.log(err)
          res.status(500)
          res.body = { 'status': 500, 'success': false, 'result': err }
          return next(null, req, res, next)
        }

        const uuid = insertResponse.uuid

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
    db.oneOrNone('select tok.uuid, tok.name, tok.symbol, tok.unique_symbol, tok.total_supply, tok.fee_per_swap, tok.minimum_swap_amount, tok.erc20_address, eth.address as eth_address, bnb.address as bnb_address from tokens tok left join eth_accounts eth on eth.uuid = tok.eth_account_uuid left join bnb_accounts bnb on bnb.uuid = tok.bnb_account_uuid where tok.uuid = $1;', [tokenUuuid])
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
              if(transactions) {
                for(var i = 0; i < transactions.length; i++) {
                  let used = false
                  if(previousTransactions) {
                    for(var j = 0; j < previousTransactions.length; j++) {
                      if(transactions[i].transactionHash == previousTransactions[j].deposit_transaction_hash) {
                        used = true
                      }
                    }
                  }
                  if(!used) {
                    acceptableTransactions.push(transactions[i])
                  }
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
                res.status(400)
                res.body = { 'status': 400, 'success': false, 'result': 'Unable to find the transaction' }
                return next(null, req, res, next)
              }
            })
          } else {
            res.status(400)
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
  },


  /**
  *  submitListProposal( token, initialPrice, expiryTime, votingPeriod )
  *  -- uses the existinge BNB account
  *  -- creates a listProposal (table)
  *  -- send the listProposal to (binance)
  *  -- returns to user with deposit address
  */
  submitListProposal(req, res, next) {
    let result = models.validateListProposal(req.body)

    if(result !== true) {
      res.status(400)
      res.body = { 'status': 400, 'success': false, 'result': result }
      return next(null, req, res, next)
    }

    const {
      token_uuid,
      initial_price,
      expiry_time,
      voting_period
    } = req.body

    models.getTokenInfo(token_uuid, (err, tokenInfo) => {
      if(err) {
        console.log(err)
        res.status(500)
        res.body = { 'status': 500, 'success': false, 'result': err }
        return next(null, req, res, next)
      }

      const title = 'List '+tokenInfo.unique_symbol+'/BNB'
      const description = 'List '+tokenInfo.unique_symbol+' to BNB exchange pair'

      const now = Math.floor(Date.now() / 1000)
      const votingTime = voting_period*86400
      const expiryTime = now + votingTime + (expiry_time*86400) /* pleb system doesn't use milliseconds */

      console.log(votingTime)
      console.log(expiryTime)

      models.insertListProposal(token_uuid, tokenInfo.unique_symbol, title, description, initial_price, expiryTime, votingTime, (err, insertResult) => {
        if(err) {
          console.log(err)
          res.status(500)
          res.body = { 'status': 500, 'success': false, 'result': err }
          return next(null, req, res, next)
        }

        insertResult.bnb_address = tokenInfo.bnb_address

        res.status(205)
        res.body = { 'status': 200, 'success': true, 'result': insertResult }
        return next(null, req, res, next)
      })
    })
  },

  validateListProposal(body) {
    const {
      token_uuid,
      initial_price,
      expiry_time,
      voting_period
    } = body

    if(!token_uuid) {
      return 'uuid is required'
    }

    if(!initial_price) {
      return 'initial_price is required'
    }

    if(!expiry_time) {
      return 'expiry_time is required'
    }

    if(!voting_period) {
      return 'voting_period is required'
    }

    return true
  },

  insertListProposal(tokenUuuid, uniqueSymbol, title, description, initialPrice, expiryTime, votingPeriod, callback) {
    db.oneOrNone('insert into list_proposals (uuid, token_uuid, unique_symbol, title, description, initial_price, expiry_time, voting_period, created) values (md5(random()::text || clock_timestamp()::text)::uuid, $1, $2, $3, $4, $5, $6, $7, now()) returning uuid, token_uuid, unique_symbol, title, description, initial_price, expiry_time, voting_period;',
    [tokenUuuid, uniqueSymbol, title, description, initialPrice, expiryTime, votingPeriod])
    .then((result) => {
      callback(null, result)
    })
    .catch(callback)
  },


  /**
  *  finalizeListProposal( uuid )
  *  -- checks to see if our deposit address balance is > fee
  *  -- deposits the total fee into governance system (binance)
  *  -- marks the listProposal (table) as depositted
  *  -- returns
  */
  finalizeListProposal(req, res, next) {
    let result = models.validateFinalizeListProposal(req.body)

    if(result !== true) {
      res.status(400)
      res.body = { 'status': 400, 'success': false, 'result': result }
      return next(null, req, res, next)
    }

    const { uuid } = req.body

    models.getListProposalInfo(uuid, (err, proposalInfo) => {
      if(err) {
        console.log(err)
        res.status(500)
        res.body = { 'status': 500, 'success': false, 'result': err }
        return next(null, req, res, next)
      }

      console.log(proposalInfo)
      models.validateProposalBalances(proposalInfo, (err, code, balanceValidation) => {
        console.log(balanceValidation)
        if(err) {
          console.log(err)
          res.status(code)
          res.body = { 'status': code, 'success': false, 'result': err }
          return next(null, req, res, next)
        }

        models.getTokenInfo(proposalInfo.token_uuid, (err, tokenInfo) => {
          if(err) {
            console.log(err)
            res.status(500)
            res.body = { 'status': 500, 'success': false, 'result': 'Unable to retrieve token information' }
            return next(null, req, res, next)
          }

          console.log(tokenInfo)
          models.getKey(tokenInfo.bnb_address, (err, key) => {
            if(err || !key) {
              console.log(err)
              res.status(500)
              res.body = { 'status': 500, 'success': false, 'result': 'Unable to retrieve key' }
              return next(null, req, res, next)
            }

            console.log(key)
            bnb.submitListProposal(tokenInfo.unique_symbol, key.key_name, key.password, proposalInfo.initial_price, proposalInfo.title, proposalInfo.description, proposalInfo.expiry_time, proposalInfo.voting_period, balanceValidation.depositRequired, (err, transactionHash) => {
              if(err) {
                console.log(err)
                res.status(500)
                res.body = { 'status': 500, 'success': false, 'result': err }
                return next(null, req, res, next)
              }

              console.log(transactionHash)
              models.updateListProposal(proposalInfo.uuid, transactionHash, (err, updateResponse) => {
                if(err) {
                  console.log(err)
                  res.status(500)
                  res.body = { 'status': 500, 'success': false, 'result': err }
                  return next(null, req, res, next)
                }

                console.log(updateResponse)

                models.updateTokenListProposed(tokenInfo.uuid, proposalInfo.uuid, (err, updateTokenResponse) => {
                  if(err) {
                    console.log(err)
                    res.status(500)
                    res.body = { 'status': 500, 'success': false, 'result': err }
                    return next(null, req, res, next)
                  }

                  proposalInfo.transaction_hash = transactionHash
                  res.status(205)
                  res.body = { 'status': 200, 'success': true, 'result': proposalInfo }
                  return next(null, req, res, next)
                })
              })
            })
          })
        })
      })
    })

  },

  validateFinalizeListProposal(body) {
    let { uuid } = body

    if(!uuid) {
      return 'uuid is required'
    }

    return true
  },

  getListProposalInfo(uuid, callback) {
    db.oneOrNone('select lp.*, bnb.address as bnb_address from list_proposals lp left join tokens tok on tok.uuid = lp.token_uuid left join bnb_accounts bnb on bnb.uuid = tok.bnb_account_uuid where lp.uuid = $1;', [uuid])
    .then((info) => {
      callback(null, info)
    })
    .catch(callback)
  },

  validateProposalBalances(proposalInfo, callback) {
    bnb.getFees((err, feesData) => {
      if(err) {
        console.log(err)
        return callback(err, 500)
      }

      const fees = feesData.data
      const reducer = (accumulator, currentValue) => accumulator + currentValue.fee;
      let totalRequired = fees.filter((fee) => {
        return ['submit_proposal'].includes(fee.msg_type)
      })
      .reduce(reducer, 0)

      let depositRequired = (1000 * 100000000) // 1000 on mainnet. Move to config
      totalRequired = totalRequired + depositRequired

      bnb.getBalance(proposalInfo.bnb_address, (err, balances) => {
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
            totalRequired,
            depositRequired
          })
        } else {
          return callback(null, 200, {
            accountBalance,
            totalRequired,
            depositRequired
          })
        }
      })
    })
  },

  updateListProposal(uuid, transactionHash, callback) {
    db.none('update list_proposals set transaction_hash = $2, submitted = true where uuid = $1;', [uuid, transactionHash])
    .then(callback)
    .catch(callback)
  },

  updateTokenListProposed(tokenUuid, proposalUuid, callback) {
    db.none('update tokens set listing_proposed = true, listing_proposal_uuid = $2 where uuid = $1;', [tokenUuid, proposalUuid])
    .then(callback)
    .catch(callback)
  },


  /**
  *  List( propsalId )
  *  -- we query the proposalId
  *  -- once it has been marked as proposal_status="Passed"
  *  -- we call List (binance)
  *  -- after listing, mark the listProposal (table) as listed
  *  -- we receive the 2000 BNB again.
  *  -- transfer that BNB back to the user. So we need to store the sending address of the funds. ( complications if we do multiple deposits )
  */
  list(req, res, next) {
    let result = models.validatelist(req.body)

    if(result !== true) {
      res.status(400)
      res.body = { 'status': 400, 'success': false, 'result': result }
      return next(null, req, res, next)
    }

    const {
      uuid
    } = req.body

    models.getListProposalInfo(uuid, (err, proposalInfo) => {
      if(err) {
        console.log(err)
        res.status(500)
        res.body = { 'status': 500, 'success': false, 'result': err }
        return next(null, req, res, next)
      }

      console.log(proposalInfo)
      bnb.getListProposal(proposalInfo.proposal_id, (err, bnbProposalInfo) => {
        if(err) {
          console.log(err)
          res.status(500)
          res.body = { 'status': 500, 'success': false, 'result': err }
          return next(null, req, res, next)
        }

        console.log(bnbProposalInfo)
        if(bnbProposalInfo && bnbProposalInfo.value && bnbProposalInfo.value.proposal_status === 'Passed') {

          models.validateListBalances(proposalInfo, (err, balanceValidation) => {
            if(err) {
              console.log(err)
              res.status(code)
              res.body = { 'status': code, 'success': false, 'result': err }
              return next(null, req, res, next)
            }

            console.log(balanceValidation)
            models.getKey(proposalInfo.bnb_address, (err, key) => {
              if(err || !key) {
                console.log(err)
                res.status(500)
                res.body = { 'status': 500, 'success': false, 'result': 'Unable to retrieve key' }
                return next(null, req, res, next)
              }

              console.log(key)
              bnb.list(proposalInfo.unique_symbol, key.key_name, key.password, proposalInfo.initial_price, proposalInfo.proposal_id, (err, listResult) => {
                if(err) {
                  console.log(err)
                  res.status(code)
                  res.body = { 'status': code, 'success': false, 'result': err }
                  return next(null, req, res, next)
                }

                console.log(listResult)
                models.updateListProposalListed(proposalInfo.uuid, (err, updateData) => {
                  if(err) {
                    console.log(err)
                    res.status(code)
                    res.body = { 'status': code, 'success': false, 'result': err }
                    return next(null, req, res, next)
                  }

                  console.log(updateData)
                  models.updateTokenListed(proposalInfo.token_uuid, (err, updateData) => {
                    if(err) {
                      console.log(err)
                      res.status(code)
                      res.body = { 'status': code, 'success': false, 'result': err }
                      return next(null, req, res, next)
                    }

                    res.status(205)
                    res.body = { 'status': 200, 'success': true, 'result': listResult }
                    return next(null, req, res, next)
                  })
                })
              })
            })
          })
        } else {
          res.status(400)
          res.body = { 'status': 400, 'success': false, 'result': 'List proposal has not passed yet' }
          return next(null, req, res, next)
        }
      })

    })
  },

  validatelist(body) {
    const {
      uuid
    } = body

    if(!uuid) {
      return 'uuid is required'
    }

    return true
  },

  validateListBalances(proposalInfo, callback) {
    bnb.getFees((err, feesData) => {
      if(err) {
        console.log(err)
        return callback(err, 500)
      }

      const fees = feesData.data
      const reducer = (accumulator, currentValue) => accumulator + currentValue.fee;
      let totalRequired = fees.filter((fee) => {
        return ['dexList'].includes(fee.msg_type)
      })
      .reduce(reducer, 0)

      bnb.getBalance(proposalInfo.bnb_address, (err, balances) => {
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

  updateListProposalListed(uuid, callback) {
    db.none('update list_proposals set processed = true where uuid = $1;', [uuid])
    .then(callback)
    .catch(callback)
  },

  updateTokenListed(uuid, callback) {
    db.none('update tokens set listed = true where uuid = $1;', [uuid])
    .then(callback)
    .catch(callback)
  },

  /**
  * getListProposal ()
  * returns the associated list proposal
  */
  getListProposal(req, res, next) {

    if(!req.params.uuid) {
      res.status(404)
      res.body = { 'status': 404, 'success': false, 'result': 'uuid is required' }
      return next(null, req, res, next)
    }

    db.oneOrNone('select lp.*, bnb.address as bnb_address from list_proposals lp left join tokens tok on lp.token_uuid = tok.uuid left join bnb_accounts bnb on bnb.uuid = tok.bnb_account_uuid where lp.uuid = $1;', [req.params.uuid])
    .then((listing_proposal) => {
      if (!listing_proposal) {
        res.status(404)
        res.body = { 'status': 404, 'success': false, 'result': 'No listing proposal defined' }
        return next(null, req, res, next)
      } else {

        if(listing_proposal.proposal_id == null) {
          bnb.getListProposals(listing_proposal.bnb_address, listing_proposal.unique_symbol, (err, proposalId) => {

            models.updateProposalId(listing_proposal.uuid, proposalId)

            bnb.getListProposal(proposalId, (err, proposalInfo) => {
              if(err) {
                console.log(err)
                res.status(500)
                res.body = { 'status': 500, 'success': false, 'result': err }
                return next(null, req, res, next)
              }

              listing_proposal.chain_info = proposalInfo

              res.status(205)
              res.body = { 'status': 200, 'success': true, 'result': listing_proposal }
              return next(null, req, res, next)
            })
          })
        } else {
          //get proposal
          bnb.getListProposal(listing_proposal.proposal_id, (err, proposalInfo) => {
            if(err) {
              console.log(err)
              res.status(500)
              res.body = { 'status': 500, 'success': false, 'result': err }
              return next(null, req, res, next)
            }

            listing_proposal.chain_info = proposalInfo

            res.status(205)
            res.body = { 'status': 200, 'success': true, 'result': listing_proposal }
            return next(null, req, res, next)
          })
        }
      }
    })
    .catch((err) => {
      console.log(err)
      res.status(500)
      res.body = { 'status': 500, 'success': false, 'result': err }
      return next(null, req, res, next)
    })
  },

  updateProposalId(uuid, proposal) {
    db.none('update list_proposals set proposal_id = $2 where uuid = $1', [uuid, proposal])
    .then(() => {

    })
    .catch((err) => {
      console.log(err)
    })
  }
}

module.exports = models
