const express = require('express')
const router = express.Router()
const bodyParser = require('body-parser')

const models = require('../models')

router.get('/', function (req, res, next) {
  res.status(400)
  next(null, req, res, next)
})


router.post('/api/v1/tokens', bodyParser.json(), models.createToken)
router.post('/api/v1/tokens/:uuid/finalize', bodyParser.json(), models.finalizeToken)
router.get('/api/v1/tokens', bodyParser.json(), models.getTokens)
router.get('/api/v1/tokens/:uuid', bodyParser.json(), models.getToken)

router.get('/api/v1/fees', bodyParser.json(), models.getFees)

module.exports = router
