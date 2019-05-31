const db = require('../helpers/db.js').db
const config = require('../config')
const bnb = require('../helpers/bnb.js')
const eth = require('../helpers/eth.js')
const async = require('async')
const generator = require('generate-password');

const sha256 = require('sha256');
const crypto = require('crypto-browserify');

const models = {

  descryptPayload(req, res, next, callback) {
    const {
      m,
      e,
      t,
      s,
      u,
      p
    } = req.body

    if(!m || !e || !t ||!s || !u || !p) {
      res.status(501)
      res.body = { 'status': 501, 'success': false, 'message': 'Invalid payload' }
      return next(null, req, res, next)
    }

    const mnemonic = m.hexDecode()
    const encrypted = e.hexDecode()
    const time = t
    const signature = s

    const sig = {
      e: e,
      m: m,
      u: u,
      p: p,
      t: t
    }
    const seed = JSON.stringify(sig)
    const compareSignature = sha256(seed)

    if (compareSignature !== signature) {
      res.status(501)
      res.body = { 'status': 501, 'success': false, 'message': 'Signature mismatch' }
      return next(null, req, res, next)
    }

    const payload = decrypt(encrypted, mnemonic)

    var data = null
    try {
      data = JSON.parse(payload)
      callback(data)
    } catch (ex) {
      res.status(501)
      res.body = { 'status': 501, 'success': false, 'message': ex }
      return next(null, req, res, next)
    }
  },

  decrypt(req, res, next) {
    models.descryptPayload(req, res, next, (data) => {
      res.status(200)
      res.body = { 'status': 400, 'success': false, 'result': data }
      return next(null, req, res, next)
    })
  },

  /**
   *  Creates a new BNB account for the token (privateKey)
   *  Creates a new Eth account for the token (privateKey)
   *  Inserts the BNB/Eth pairing into the DB with the Token details
   */
  createToken(req, res, next) {

    models.descryptPayload(req, res, next, (data) => {

      let result = models.validateCreateToken(data)

      if(result !== true) {
        res.status(400)
        res.body = { 'status': 400, 'success': false, 'result': result }
        return next(null, req, res, next)
      }

      models.insertToken(data, (err, response) => {
        if(err || !response) {
          console.log(err)
          res.status(500)
          res.body = { 'status': 500, 'success': false, 'result': 'Unable to insert token' }
          return next(null, req, res, next)
        } else {
          const uuid = response.uuid

          async.parallel([
            (callback) => { models.processBNBAccount(data, callback) },
            (callback) => { models.processEthAccount(data, callback) }
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
    models.descryptPayload(req, res, next, (data) => {

      let result = models.validateFinalize(data)

      if(result !== true) {
        res.status(400)
        res.body = { 'status': 400, 'success': false, 'result': result }
        return next(null, req, res, next)
      }

      let { uuid } = data

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
    db.manyOrNone('select tok.uuid, tok.name, tok.symbol, tok.total_supply, tok.minimum_swap_amount, tok.fee_per_swap, tok.listed, tok.listing_proposed, tok.listing_proposal_uuid, tok.erc20_address, tok.process_date, eth.address as eth_address from tokens tok left join eth_accounts eth on eth.uuid = tok.eth_account_uuid where processed is true;')
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
    db.oneOrNone('select tok.uuid, tok.name, tok.symbol, tok.total_supply, tok.minimum_swap_amount, tok.fee_per_swap, tok.erc20_address, tok.process_date, eth.address as eth_address from tokens tok left join eth_accounts eth on eth.uuid = tok.eth_account_uuid where tok.uuid = $1 and processed is true;',[req.params.uuid])
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
        return ['issueMsg', 'dexList', 'submit_proposal'].includes(fee.msg_type)
      })

      fees.push({ msg_type: 'list_proposal_deposit', fee: config.list_proposal_deposit })

      res.status(205)
      res.body = { 'status': 200, 'success': true, 'result': fees }
      return next(null, req, res, next)
    })
  },

  /**
  * check to see if the BNB address for that token exists.
  * If so, we return the eth address
  * If not, we create a new address then return it.
  */
  swapToken(req, res, next) {
    models.descryptPayload(req, res, next, (data) => {
      let result = models.validateSwap(data)

      if(result !== true) {
        res.status(400)
        res.body = { 'status': 400, 'success': false, 'result': result }
        return next(null, req, res, next)
      }

      const {
        bnb_address
      } = data

      models.getClientAccountForBnbAddress(bnb_address, (err, clientAccount) => {
        if(err) {
          console.log(err)
          res.status(500)
          res.body = { 'status': 500, 'success': false, 'result': err }
          return next(null, req, res, next)
        }

        if(clientAccount) {
          res.status(205)
          res.body = { 'status': 200, 'success': true, 'result': clientAccount }
          return next(null, req, res, next)
        } else {
          eth.createAccount((err, account) => {
            if(err) {
              console.log(err)
              res.status(500)
              res.body = { 'status': 500, 'success': false, 'result': err }
              return next(null, req, res, next)
            }

            models.insertClientEthAccount(bnb_address, account, (err, clientAccount) => {
              if(err) {
                console.log(err)
                res.status(500)
                res.body = { 'status': 500, 'success': false, 'result': err }
                return next(null, req, res, next)
              }

              res.status(205)
              res.body = { 'status': 200, 'success': true, 'result': clientAccount }
              return next(null, req, res, next)
            })
          })
        }
      })
    })
  },

  validateSwap(body) {
    const {
      bnb_address
    } = body

    if(!bnb_address) {
      return 'bnb_address is required'
    }

    if(!bnb.validateAddress(bnb_address)) {
      return 'bnb_address is invalid'
    }

    return true
  },

  getClientAccountForBnbAddress(bnbAddress, callback) {
    db.oneOrNone('select ca.uuid, ca.bnb_address, cea.address as eth_address from client_accounts ca left join client_eth_accounts cea on cea.uuid = ca.client_eth_account_uuid where ca.bnb_address = $1;', [bnbAddress])
    .then((response) => {
      callback(null, response)
    })
    .catch(callback)
  },

  insertClientEthAccount(bnbAddress, ethAccount, callback) {
    db.oneOrNone('insert into client_eth_accounts(uuid, private_key, address, created) values (md5(random()::text || clock_timestamp()::text)::uuid, $1, $2, now()) returning uuid, address;', [ethAccount.privateKey, ethAccount.address])
    .then((returnedEthAccount) => {
      db.oneOrNone('insert into client_accounts(uuid, bnb_address, client_eth_account_uuid, created) values (md5(random()::text || clock_timestamp()::text)::uuid, $1, $2, now()) returning uuid, bnb_address;', [bnbAddress, returnedEthAccount.uuid])
      .then((clientAccount) => {
        const returnObj = {
          uuid: clientAccount.uuid,
          bnb_address: clientAccount.bnb_address,
          eth_address: returnedEthAccount.address
        }
        callback(null, returnObj)
      })
      .catch(callback)
    })
    .catch(callback)
  },

  /**
  * Take the token with the eth address, check to see if a transfer was done.
  * Validate that against the swaps that have been recorded previously.
  * Insert all new deposits into swaps.
  * Return all new deposits.
  */
  finalizeSwap(req, res, next) {
    models.descryptPayload(req, res, next, (data) => {

      let result = models.validateFinalizeSwap(data)

      if(result !== true) {
        res.status(400)
        res.body = { 'status': 400, 'success': false, 'result': result }
        return next(null, req, res, next)
      }

      const {
        uuid,
        token_uuid
      } = data

      models.getClientAccountForUuid(uuid, (err, clientAccount) => {
        if(err) {
          console.log(err)
          res.status(500)
          res.body = { 'status': 500, 'success': false, 'result': err }
          return next(null, req, res, next)
        }

        if(!clientAccount) {
          res.status(400)
          res.body = { 'status': 400, 'success': false, 'result': 'Unable to find swap details' }
          return next(null, req, res, next)
        }

        models.getTokenInfoForSwap(token_uuid, (err, tokenInfo) => {
          if(err) {
            console.log(err)
            res.status(500)
            res.body = { 'status': 500, 'success': false, 'result': err }
            return next(null, req, res, next)
          }

          if(!tokenInfo) {
            res.status(400)
            res.body = { 'status': 400, 'success': false, 'result': 'Unable to find token details' }
            return next(null, req, res, next)
          }

          async.parallel([
            (callback) => { eth.getTransactionsForAddress(tokenInfo.erc20_address, clientAccount.eth_address, callback) },
            (callback) => { models.getTransactionHashs(token_uuid, uuid, callback) }
          ], (err, data) => {
            if(err) {
              console.log(err)
              res.status(500)
              res.body = { 'status': 500, 'success': false, 'result': 'Unable to process request: '+err }
              return next(null, req, res, next)
            }

            const ethTransactions = data[0]
            const swaps = data[1]

            if(!ethTransactions || ethTransactions.length === 0) {
              res.status(400)
              res.body = { 'status': 400, 'success': false, 'result': 'Unable to find a deposit' }
              return next(null, req, res, next)
            }

            const newTransactions = ethTransactions.filter((ethTransaction) => {
              const thisTransaction = swaps.filter((swap) => {
                return swap.deposit_transaction_hash === ethTransaction.transactionHash
              })

              if(thisTransaction.length > 0) {
                return false
              } else {
                return true
              }
            })

            if(newTransactions.length === 0) {
              res.status(400)
              res.body = { 'status': 400, 'success': false, 'result': 'Unable to find any new deposits' }
              return next(null, req, res, next)
            }

            models.insertSwaps(newTransactions, clientAccount, token_uuid,  (err, newSwaps) => {
              if(err) {
                console.log(err)
                res.status(500)
                res.body = { 'status': 500, 'success': false, 'result': err }
                return next(null, req, res, next)
              }

              res.status(205)
              res.body = { 'status': 200, 'success': true, 'result': newSwaps }
              return next(null, req, res, next)
            })
          })
        })
      })
    })
  },

  validateFinalizeSwap(body) {
    const {
      uuid,
      token_uuid
    } = body

    if(!uuid) {
      return 'uuid is required'
    }

    if(!token_uuid) {
      return 'token_uuid is required'
    }

    return true
  },

  getClientAccountForUuid(uuid, callback) {
    db.oneOrNone('select ca.uuid, ca.bnb_address, cea.address as eth_address from client_accounts ca left join client_eth_accounts cea on cea.uuid = ca.client_eth_account_uuid where ca.uuid = $1;', [uuid])
    .then((response) => {
      callback(null, response)
    })
    .catch(callback)
  },

  getTokenInfoForSwap(tokenUuid, callback) {
    db.oneOrNone('select tok.uuid, tok.name, tok.symbol, tok.unique_symbol, tok.total_supply, tok.fee_per_swap, tok.minimum_swap_amount, tok.erc20_address from tokens tok where tok.uuid = $1;', [tokenUuid])
    .then((response) => {
      callback(null, response)
    })
    .catch(callback)
  },

  getTransactionHashs(tokenUuid, clientAccountUuid, callback) {
    db.manyOrNone('select * from swaps where token_uuid = $1 and client_account_uuid = $2;', [tokenUuid, clientAccountUuid])
    .then((response) => {
      callback(null, response)
    })
    .catch(callback)
  },

  insertSwaps(transactions, clientAccount, tokenUuid, callback) {
    async.map(transactions,
      function (transaction, callbackInner) {
        models.insertSwap(transaction, clientAccount, tokenUuid, callbackInner)
      },
      function(err, result) {
        if (err) {
          console.log(err)
          return callback(err)
        }

        callback(null, result)
      }
    )
  },

  insertSwap(transaction, clientAccount, tokenUuid, callback) {
    db.oneOrNone('insert into swaps (uuid, token_uuid, eth_address, bnb_address, amount, client_account_uuid, deposit_transaction_hash, created) values (md5(random()::text || clock_timestamp()::text)::uuid, $1, $2, $3, $4, $5, $6, now()) returning uuid, eth_address, amount, deposit_transaction_hash;', [tokenUuid, transaction.from, clientAccount.bnb_address, transaction.amount, clientAccount.uuid, transaction.transactionHash])
    .then((response) => {
      callback(null, response)
    })
    .catch((err) => {
      callback(err)
    })
  },


  /**
  *  submitListProposal( token, initialPrice, expiryTime, votingPeriod )
  *  -- uses the existinge BNB account
  *  -- creates a listProposal (table)
  *  -- send the listProposal to (binance)
  *  -- returns to user with deposit address
  */
  submitListProposal(req, res, next) {
    models.descryptPayload(req, res, next, (data) => {
      let result = models.validateListProposal(data)

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
      } = data

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
        const expiryTime = now + votingTime + (expiry_time*86400)

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
    models.descryptPayload(req, res, next, (data) => {
      let result = models.validateFinalizeListProposal(data)

      if(result !== true) {
        res.status(400)
        res.body = { 'status': 400, 'success': false, 'result': result }
        return next(null, req, res, next)
      }

      const { uuid } = data

      models.getListProposalInfo(uuid, (err, proposalInfo) => {
        if(err) {
          console.log(err)
          res.status(500)
          res.body = { 'status': 500, 'success': false, 'result': err }
          return next(null, req, res, next)
        }

        models.validateProposalBalances(proposalInfo, (err, code, balanceValidation) => {
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

            models.getKey(tokenInfo.bnb_address, (err, key) => {
              if(err || !key) {
                console.log(err)
                res.status(500)
                res.body = { 'status': 500, 'success': false, 'result': 'Unable to retrieve key' }
                return next(null, req, res, next)
              }

              bnb.submitListProposal(tokenInfo.unique_symbol, key.key_name, key.password, proposalInfo.initial_price, proposalInfo.title, proposalInfo.description, proposalInfo.expiry_time, proposalInfo.voting_period, balanceValidation.depositRequired, (err, transactionHash) => {
                if(err) {
                  console.log(err)
                  res.status(500)
                  res.body = { 'status': 500, 'success': false, 'result': err }
                  return next(null, req, res, next)
                }

                models.updateListProposal(proposalInfo.uuid, transactionHash, (err, updateResponse) => {
                  if(err) {
                    console.log(err)
                    res.status(500)
                    res.body = { 'status': 500, 'success': false, 'result': err }
                    return next(null, req, res, next)
                  }

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

      let depositRequired = parseFloat(config.list_proposal_deposit) // 1000 on mainnet. Move to config
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
    models.descryptPayload(req, res, next, (data) => {
      let result = models.validatelist(data)

      if(result !== true) {
        res.status(400)
        res.body = { 'status': 400, 'success': false, 'result': result }
        return next(null, req, res, next)
      }

      const {
        uuid
      } = data

      models.getListProposalInfo(uuid, (err, proposalInfo) => {
        if(err) {
          console.log(err)
          res.status(500)
          res.body = { 'status': 500, 'success': false, 'result': err }
          return next(null, req, res, next)
        }

        bnb.getListProposal(proposalInfo.proposal_id, (err, bnbProposalInfo) => {
          if(err) {
            console.log(err)
            res.status(500)
            res.body = { 'status': 500, 'success': false, 'result': err }
            return next(null, req, res, next)
          }

          if(bnbProposalInfo && bnbProposalInfo.value && bnbProposalInfo.value.proposal_status === 'Passed') {

            models.validateListBalances(proposalInfo, (err, balanceValidation) => {
              if(err) {
                console.log(err)
                res.status(code)
                res.body = { 'status': code, 'success': false, 'result': err }
                return next(null, req, res, next)
              }

              models.getKey(proposalInfo.bnb_address, (err, key) => {
                if(err || !key) {
                  console.log(err)
                  res.status(500)
                  res.body = { 'status': 500, 'success': false, 'result': 'Unable to retrieve key' }
                  return next(null, req, res, next)
                }

                bnb.list(proposalInfo.unique_symbol, key.key_name, key.password, proposalInfo.initial_price, proposalInfo.proposal_id, (err, listResult) => {
                  if(err) {
                    console.log(err)
                    res.status(code)
                    res.body = { 'status': code, 'success': false, 'result': err }
                    return next(null, req, res, next)
                  }

                  models.updateListProposalListed(proposalInfo.uuid, (err, updateData) => {
                    if(err) {
                      console.log(err)
                      res.status(code)
                      res.body = { 'status': code, 'success': false, 'result': err }
                      return next(null, req, res, next)
                    }

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
  },


  /**
  *  GetBnbBalances( bnb_address, token_uuid )
  *  -- Get the current balance BEP2 address, for the symbol specified
  *  -- Get pending transfers that haven't been processed yet
  */
  getBnbBalance(req, res, next) {
    models.descryptPayload(req, res, next, (data) => {
      let result = models.validateGetBnbBalances(data)

      if(result !== true) {
        res.status(400)
        res.body = { 'status': 400, 'success': false, 'result': result }
        return next(null, req, res, next)
      }

      const {
        bnb_address,
        token_uuid
      } = data

      models.getTokenInfo(token_uuid, (err, tokenInfo) => {
        if(err) {
          console.log(err)
          res.status(500)
          res.body = { 'status': 500, 'success': false, 'result': err }
          return next(null, req, res, next)
        }

        bnb.getBalance(bnb_address, (err, balances) => {
          if(err) {
            console.log(err)
            res.status(500)
            res.body = { 'status': 500, 'success': false, 'result': err }
            return next(null, req, res, next)
          }


          let balance = 0;

          let filteredBalances = balances.filter((balance) => {
            return balance.symbol === tokenInfo.unique_symbol
          })

          if(filteredBalances.length > 0) {
              balance = filteredBalances[0].free
          }

          models.getPendingBnbBalance(token_uuid, bnb_address, (err, pendingBalance) => {
            if(err) {
              console.log(err)
              res.status(500)
              res.body = { 'status': 500, 'success': false, 'result': err }
              return next(null, req, res, next)
            }

            const returnObj = {
              balance: parseFloat(balance),
              pendingBalance: parseFloat(pendingBalance.pending_balance ? pendingBalance.pending_balance : 0)
            }

            res.status(205)
            res.body = { 'status': 200, 'success': true, 'result': returnObj }
            return next(null, req, res, next)
          })
        })
      })
    })
  },

  validateGetBnbBalances(body) {
    let { bnb_address, token_uuid } = body

    if(!bnb_address) {
      return 'bnb_address is required'
    }

    if(!token_uuid) {
      return 'token_uuid is required'
    }

    if(!bnb.validateAddress(bnb_address)) {
      return 'bnb_address is invalid'
    }

    return true
  },

  getPendingBnbBalance(tokenUuid, bnbAddress, callback) {
    db.oneOrNone('select sum(swaps.amount::numeric - tok.fee_per_swap::numeric) as pending_balance from swaps left join tokens tok on tok.uuid = swaps.token_uuid where swaps.token_uuid = $1 and swaps.bnb_address = $2 and swaps.deposit_transaction_hash is not null and swaps.transfer_transaction_hash is null;', [tokenUuid, bnbAddress])
    .then((info) => {
      callback(null, info)
    })
    .catch(callback)
  },


  /**
  *  GetEthBalances( eth_address, token_uuid )
  *  -- Get the current balance ErC20 address, for the symbol specified
  *  -- Get pending transfers that haven't been processed yet
  */
  getEthBalance(req, res, next) {
    models.descryptPayload(req, res, next, (data) => {
      let result = models.validateGetEthbalances(data)

      if(result !== true) {
        res.status(400)
        res.body = { 'status': 400, 'success': false, 'result': result }
        return next(null, req, res, next)
      }

      const {
        eth_address,
        token_uuid
      } = data

      models.getTokenInfo(token_uuid, (err, tokenInfo) => {
        if(err) {
          console.log(err)
          res.status(500)
          res.body = { 'status': 500, 'success': false, 'result': err }
          return next(null, req, res, next)
        }

        eth.getERC20Balance(eth_address, tokenInfo.erc20_address, (err, balance) => {
          if(err) {
            console.log(err)
            res.status(500)
            res.body = { 'status': 500, 'success': false, 'result': err }
            return next(null, req, res, next)
          }

          const returnObj = {
            balance: parseFloat(balance),
          }

          res.status(205)
          res.body = { 'status': 200, 'success': true, 'result': returnObj }
          return next(null, req, res, next)

        })
      })
    })
  },

  validateGetEthbalances(body) {
    let { eth_address, token_uuid } = body

    if(!eth_address) {
      return 'eth_address is required'
    }

    if(!token_uuid) {
      return 'token_uuid is required'
    }

    return true
  },
}

String.prototype.hexEncode = function(){
    var hex, i;
    var result = "";
    for (i=0; i<this.length; i++) {
        hex = this.charCodeAt(i).toString(16);
        result += ("000"+hex).slice(-4);
    }
    return result
}
String.prototype.hexDecode = function(){
    var j;
    var hexes = this.match(/.{1,4}/g) || [];
    var back = "";
    for(j = 0; j<hexes.length; j++) {
        back += String.fromCharCode(parseInt(hexes[j], 16));
    }

    return back;
}

function decrypt(text,seed){
  var decipher = crypto.createDecipher('aes-256-cbc', seed)
  var dec = decipher.update(text,'base64','utf8')
  dec += decipher.final('utf8');
  return dec;
}

module.exports = models
