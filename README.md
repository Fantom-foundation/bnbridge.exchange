# BNBridge

### Features:
- [x] Issue a new token on the Binance network.
- [x] Swap a token from ERC20 to BEP2.
- [x] List newly issued token on Binance DEX.
- [x] Create a new BNB account.

### Repository
## ./bnbridge
Front end website allowing for BNB to ERC bridge support.

## ./cli
Binance CLI utility.

## ./sdk
API used to interact with the CLI utility, Binance javascript SDK and Web3.js to enable BNB to ERC bridge utility.


### Installation
    git clone the repo

    cd ./sdk

    npm install
    run ./sql/setup.sql to instantiate the DB.
    update ./config/index.js with
        - databse connection details.
        - Binance cli path.
        - Binance connection details for mainnet/testnet.
        - Ethereum connection details for mainnet/testnet.
    node ./api.bnbridge.exchange.js
    or
    pm2 start api.bnbridge.exchange.js

    cd ../bnbridge

    npm install
    vi ./src/config.js
    Modify config urls that the bnbridge.excahnge API is running at. (http://localhost:8000 by default)
