const db = require('../helpers/db.js').db
const axios = require('axios');
const config = require('../config')
const bnb = require('../helpers/bnb.js')

const models = {

  /**
   *  Creates a new BNB account for the user (privateKey)
   *  Creates a new Eth account for the user (privateKey)
   *  Inserts the BNB/Eth pairing into the DB with the Token symbol
   */
  createToken(req, res, next) {
    const {
      name,
      symbol,
      total_supply,
      erc20_address
    } = req.body
    if(!name) {
      res.status(400)
      res.body = { 'status': 400, 'success': false, 'result': 'name is required' }
      return next(null, req, res, next)
    }
    if(!symbol) {
      res.status(400)
      res.body = { 'status': 400, 'success': false, 'result': 'symbol is required' }
      return next(null, req, res, next)
    }
    if(!totalSupply) {
      res.status(400)
      res.body = { 'status': 400, 'success': false, 'result': 'total_supply is required' }
      return next(null, req, res, next)
    }
    if(!erc20_address) {
      res.status(400)
      res.body = { 'status': 400, 'success': false, 'result': 'erc20_address is required' }
      return next(null, req, res, next)
    }
    const keyName = symbol+'_key'
    const password = generator.generate({
      length: 10,
      numbers: true,
      symbols: true,
      uppercase: true,
      strict: true
    })

    db.oneOrNone('insert into tokens (uuid, name, symbol, total_supply, created) values (md5(random()::text || clock_timestamp()::text)::uuid, $1, $2, $3, now()) returning uuid', [name, symbol, totalSupply])
    .then((response) => {
      if(!response) {
        res.status(500)
        res.body = { 'status': 500, 'success': false, 'result': 'Unable to insert token' }
        return next(null, req, res, next)
      } else {
        const uuid = response.uuid

        bnb.createKey(keyName, password, (err, keyData) => {
          if(err) {
            console.log(err)
            return;
          }

          //insert into DB
        })

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
   *  Checks whether the account has been funded with the erc20 tokens.
   *  Once true
   *  Issues a new token on BNB chain
   *  Mints new tokens on BNB chain
   *  Transfers the funds from our BNB account to their BNB account
   */
  finalizeToken(req, res, next) {

  },

  /**
   *  Returns a list of tokens
   */
  getTokens(req, res, next) {
    db.manyOrNone('select tok.uuid, tok.name, tok.symbol, tok.total_supply, eth.public_key as eth_address, bnb.public_key as bnb_address from tokens tok left join eth_accounts eth on eth.uuid = tok.eth_account_uuid left join bnb_accounts bnb on bnb.uuid = tok.bnb_account_uuid;')
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
   *  Returns a specific token details. Deposit addresses (public keys)
   */
  getToken(req, res, next) {
    db.oneOrNone('select tok.uuid, tok.description, tok.short_description, eth.public_key as eth_address, bnb.public_key as bnb_address from tokens tok left join eth_accounts eth on eth.uuid = tok.eth_account_uuid left join bnb_accounts bnb on bnb.uuid = tok.bnb_account_uuid where tok.uuid = $1;',[req.params.uuid])
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
    bnb.getFees((err, data) => {
      if(err) {
        console.log(err)
        res.status(500)
        res.body = { 'status': 500, 'success': false, 'result': err }
        return next(null, req, res, next)
      }

      res.status(205)
      res.body = { 'status': 200, 'success': true, 'result': data }
      return next(null, req, res, next)
    })
  }
}

module.exports = models
