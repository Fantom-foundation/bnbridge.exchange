import React, { Component } from "react";
import PropTypes from 'prop-types';
import { withStyles } from '@material-ui/core/styles';
import {
  Grid,
  Typography
} from '@material-ui/core'
import config from '../../config'

import Input from '../common/input';
import Button from '../common/button';
import PageLoader from "../common/pageLoader";
import AssetSelection from "../assetSelection";
import Config from '../../config';

import {
  ERROR,
  SWAP_TOKEN,
  TOKEN_SWAPPED,
  FINALIZE_SWAP_TOKEN,
  TOKEN_SWAP_FINALIZED,
  TOKENS_UPDATED,
  GET_BNB_BALANCES,
  BNB_BALANCES_UPDATED,
  GET_ETH_BALANCES,
  ETH_BALANCES_UPDATED
} from '../../constants'

import Store from "../../stores";
const dispatcher = Store.dispatcher
const emitter = Store.emitter
const store = Store.store

const styles = theme => ({
  root: {
    width: '400px'
  },
  button: {
    marginTop: '24px'
  },
  frame: {
    border: '1px solid #e1e1e1',
    borderRadius: '3px',
    backgroundColor: '#fafafa',
    padding: '1rem'
  },
  instructions: {
    fontSize: '0.8rem',
    textAlign: 'center',
    marginBottom: '16px'
  },
  instructionUnderlined: {
    fontSize: '0.8rem',
    textDecoration: 'underline',
    textAlign: 'center',
    marginBottom: '16px'
  },
  instructionBold: {
    fontSize: '0.8rem',
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: '16px'
  },
  hash: {
    fontSize: '0.8rem',
    textAlign: 'center',
    marginBottom: '16px',
    maxWidth: '100%',
    cursor: 'pointer'
  },
  disclaimer: {
    fontSize: '16px',
    marginTop: '24px',
    lineHeight: '42px',
  },
});


class Swap extends Component {
  state = {
    loading: false,
    page: 0,
    token: '',
    tokenError: false,
    bnbAddress: '',
    bnbAddressError: false,
    erc20address: '',
    erc20AddressError: false,
    amount: '',
    amountError: false,
    amountErrorMessage: '',
    amountHelperText: '',
    tokens: [],
    selectedToken: null,
    receiveAmount: null,
    bnbBalances: null,
    ethBalances: null
  };

  componentWillMount() {
    emitter.on(TOKENS_UPDATED, this.tokensUpdated);
    emitter.on(TOKEN_SWAPPED, this.tokenSwapped);
    emitter.on(TOKEN_SWAP_FINALIZED, this.tokenSwapFinalized);
    emitter.on(BNB_BALANCES_UPDATED, this.bnbBalancesUpdated);
    emitter.on(ETH_BALANCES_UPDATED, this.ethBalancesUpdated);
    emitter.on(ERROR, this.error);
  };

  componentWillUnmount() {
    emitter.removeListener(TOKENS_UPDATED, this.tokensUpdated);
    emitter.removeListener(TOKEN_SWAPPED, this.tokenSwapped);
    emitter.removeListener(TOKEN_SWAP_FINALIZED, this.tokenSwapFinalized);
    emitter.removeListener(BNB_BALANCES_UPDATED, this.bnbBalancesUpdated);
    emitter.removeListener(ETH_BALANCES_UPDATED, this.ethBalancesUpdated);
    emitter.removeListener(ERROR, this.error);
  };

  tokensUpdated = () => {
    const tokens = store.getStore('tokens')

    this.setState({
      tokens: tokens
    })
  };

  bnbBalancesUpdated = (data) => {
    this.setState({ bnbBalances: data, loading: false })
  };

  ethBalancesUpdated = (data) => {
    this.setState({ ethBalances: data, loading: false })
  };

  error = (err) => {
    this.props.showError(err)
    this.setState({ loading: false })
  };

  tokenSwapped = (data) => {
    this.setState({
      page: 1,
      swapUuid: data.swap_uuid,
      ethDepositAddress: data.eth_address,
      symbol: data.symbol,
      loading: false
   })
  };

  tokenSwapFinalized = (transactionHash) => {
    this.setState({
      page: 2,
      loading: false,
      transactionHash: transactionHash
    })
  };

  callSwapToken = () => {

    const {
      token,
      bnbAddress,
      erc20address,
      amount,
    } = this.state

    const content = {
      token_uuid: token,
      bnb_address: bnbAddress,
      eth_address: erc20address,
      amount: amount
    }
    dispatcher.dispatch({type: SWAP_TOKEN, content })

    this.setState({ loading: true })
  };

  callFinalizeSwapToken = () => {
    const {
      swapUuid
    } = this.state

    const content = {
      uuid: swapUuid,
    }
    dispatcher.dispatch({type: FINALIZE_SWAP_TOKEN, content })

    this.setState({ loading: true })
  };

  validateSwapToken = () => {

    this.setState({
      tokenError: false,
      bnbAddressError: false,
      erc20AddressError: false,
      amountError: false,
      amountErrorMessage: ''
    })

    const {
      token,
      bnbAddress,
      erc20address,
      amount,
      tokens
    } = this.state

    let error = false

    if(!token || token === '') {
      this.setState({ tokenError: true })
      error = true
    }
    if(!bnbAddress || bnbAddress === '') {
      this.setState({ bnbAddressError: true })
      error = true
    }
    if(!erc20address || erc20address === '') {
      this.setState({ erc20AddressError: true })
      error = true
    }
    if(!amount || amount === '') {
      this.setState({ amountError: true })
      error = true
    }

    let theToken = tokens.filter((tok) => {
      return tok.uuid === token
    })

    if(theToken && theToken.length > 0) {

      if(theToken[0].minimum_swap_amount != null && parseFloat(amount) < parseFloat(theToken[0].minimum_swap_amount)) {
        this.setState({ amountError: true, amountErrorMessage: 'Amount < Minimum Swap Amount: '+theToken[0].minimum_swap_amount+' '+theToken[0].symbol })
        error = true
      }

      return !error
    }

    return false

  };

  onNext = (event) => {
    switch (this.state.page) {
      case 0:
        if(this.validateSwapToken()) {
          this.callSwapToken()
        }
        break;
      case 1:
        this.callFinalizeSwapToken()
        break;
      case 2:
        this.resetPage()
        break;
      default:

    }
  };

  resetPage = () => {
    this.setState({
      page: 0,
      token: '',
      tokenError: false,
      bnbAddress: '',
      bnbAddressError: false,
      erc20address: '',
      erc20AddressError: false,
      amount: '',
      amountError: false,
      amountErrorMessage: '',
      amountHelperText: '',
      selectedToken: null,
      receiveAmount: null,
      bnbBalances: null,
      ethBalances: null
    })
  };

  onBack = (event) => {
    this.setState({ page: 0 })
  };

  onHashClick = (event) => {
    const {
      transactionHash
    } = this.state

    window.open(config.explorerURL+transactionHash, "_blank")
  };

  onTokenSelected = (value) => {

    const {
      tokens,
      amount,
      bnbAddress,
      erc20address
    } = this.state

    let theToken = tokens.filter((tok) => {
      return tok.uuid === value
    })

    let amountHelperText = ''

    if(theToken && theToken.length > 0) {
      if(theToken[0].minimum_swap_amount != null) {
        amountHelperText = 'Minimum amount is '+theToken[0].minimum_swap_amount+' '+theToken[0].symbol
      }

      if(theToken[0].fee_per_swap != null && amount) {
        this.setState({ receiveAmount: parseFloat(amount) - parseFloat(theToken[0].fee_per_swap)  })
      } else if (theToken[0].fee_per_swap == null && amount) {
        this.setState({ receiveAmount: parseFloat(amount) })
      } else {
        this.setState({ receiveAmount: '' })
      }
    }

    this.setState({ token: value, selectedToken: theToken[0], amountHelperText: amountHelperText })

    if(theToken.length > 0  && bnbAddress && bnbAddress !== "" && bnbAddress.length === Config.bnbAddressLength) {
      const content = {
        bnb_address: bnbAddress,
        token_uuid: theToken[0].uuid
      }
      dispatcher.dispatch({type: GET_BNB_BALANCES, content })
      this.setState({ loading: true })
    }

    if(theToken.length > 0  && erc20address && erc20address !== "" && erc20address.length === Config.erc20addressLength) {
      const content = {
        eth_address: erc20address,
        token_uuid: theToken[0].uuid
      }
      dispatcher.dispatch({type: GET_ETH_BALANCES, content })
      this.setState({ loading: true })
    }
  };

  onChange = (event) => {
    let val = []
    val[event.target.id] = event.target.value
    this.setState(val)

    if(event.target.id === 'amount') {
      const {
        selectedToken
      } = this.state

      if(selectedToken != null) {
        if(selectedToken.fee_per_swap != null) {
          this.setState({ receiveAmount: parseFloat(event.target.value) - parseFloat(selectedToken.fee_per_swap)  })
        } else {
          this.setState({ receiveAmount: parseFloat(event.target.value) })
        }
      } else {
        this.setState({ receiveAmount: '' })
      }
    }

    if(event.target.id === 'bnbAddress') {

      const {
        selectedToken
      } = this.state

      if(selectedToken  && event.target.value && event.target.value !== "" && event.target.value.length === Config.bnbAddressLength) {
        const content = {
          bnb_address: event.target.value,
          token_uuid: selectedToken.uuid
        }
        dispatcher.dispatch({type: GET_BNB_BALANCES, content })
        this.setState({ loading: true })
      }
    }

    if(event.target.id === 'erc20address') {

      const {
        selectedToken
      } = this.state

      if(selectedToken  && event.target.value && event.target.value !== "" && event.target.value.length === Config.erc20addressLength) {
        const content = {
          eth_address: event.target.value,
          token_uuid: selectedToken.uuid
        }
        dispatcher.dispatch({type: GET_ETH_BALANCES, content })
        this.setState({ loading: true })
      }
    }
  };

  renderPage0 = () => {

    const {
      bnbAddress,
      bnbAddressError,
      erc20address,
      erc20AddressError,
      amount,
      amountError,
      amountErrorMessage,
      amountHelperText,
      loading,
      bnbBalances,
      ethBalances,
      selectedToken
    } = this.state

    const {
      onIssue
    } = this.props

    return (
      <React.Fragment>
        <AssetSelection onIssue={ onIssue } onTokenSelected={ this.onTokenSelected } disabled={ loading } />
        <Grid item xs={ 12 }>
          <Input
            id='bnbAddress'
            fullWidth={ true }
            label="BNB receive address"
            placeholder="eg: bnb1mmxvnhkyqrvd2dpskvsgl8lmft4tnrcs97apr3"
            value={ bnbAddress }
            error={ bnbAddressError }
            onChange={ this.onChange }
            disabled={ loading }
          />
          {
            bnbBalances &&
            <React.Fragment>
              <Typography>
                Current {selectedToken.name} Balance: { bnbBalances.balance } { selectedToken.symbol }
              </Typography>
              <Typography>
                Pending {selectedToken.name} Balance: { bnbBalances.pendingBalance } { selectedToken.symbol }
              </Typography>
            </React.Fragment>
          }
        </Grid>
        <Grid item xs={ 12 }>
          <Input
            id='erc20address'
            fullWidth={ true }
            label="ERC20 from address"
            placeholder="eg: 0x0dE0BCb0703ff8F1aEb8C892eDbE692683bD8030"
            value={ erc20address }
            error={ erc20AddressError }
            onChange={ this.onChange }
            disabled={ loading }
          />
          {
            ethBalances &&
            <React.Fragment>
              <Typography>
                Current {selectedToken.name} Balance: { ethBalances.balance } { selectedToken.symbol }
              </Typography>
            </React.Fragment>
          }
        </Grid>
        <Grid item xs={ 12 }>
          <Input
            id='amount'
            fullWidth={ true }
            label="Amount"
            placeholder="eg: 100"
            value={ amount }
            error={ amountError }
            onChange={ this.onChange }
            helpertext={ amountErrorMessage && amountErrorMessage !== '' ? amountErrorMessage : amountHelperText }
            disabled={ loading }
          />
        </Grid>
      </React.Fragment>
    )
  };

  renderPage1 = () => {
    const {
      amount,
      symbol,
      ethDepositAddress,
      erc20address
    } = this.state

    const {
      classes
    } = this.props

    return (
      <React.Fragment>
        <Grid item xs={ 12 } className={ classes.frame }>
        <Typography className={ classes.instructionUnderlined }>
            Here's what you need to do next:
          </Typography>
          <Typography className={ classes.instructionBold }>
            Transfer {amount} {symbol}-ERC20
          </Typography>
          <Typography className={ classes.instructions }>
            from
          </Typography>
          <Typography className={ classes.instructionBold }>
            {erc20address}
          </Typography>
          <Typography className={ classes.instructions }>
            to
          </Typography>
          <Typography className={ classes.instructionBold }>
            {ethDepositAddress}
          </Typography>
          <Typography className={ classes.instructionUnderlined }>
            Please ensure that the amount received by the contract is {amount} {symbol}-ERC20
          </Typography>
          <Typography className={ classes.instructionUnderlined }>
            After you've completed the transfer, click the "NEXT" button so we can verify your transaction.
          </Typography>
        </Grid>
      </React.Fragment>
    )
  };

  renderPage2 = () => {
    const {
      classes
    } = this.props

    return (
      <React.Fragment>
        <Grid item xs={ 12 } className={ classes.frame }>
          <Typography className={ classes.instructionBold }>
            Swap request completed
          </Typography>
          <Typography className={ classes.instructions }>
            Your transaction was successful. You will receive your tokens in your Binance address when they are released.
          </Typography>
        </Grid>
      </React.Fragment>
    )
  };

  render() {
    const {
      classes
    } = this.props

    const {
      page,
      loading,
      receiveAmount,
      selectedToken
    } = this.state

    return (
      <Grid container className={ classes.root }>
        { loading && <PageLoader /> }
        { page === 0 && this.renderPage0() }
        { page === 1 && this.renderPage1() }
        { page === 2 && this.renderPage2() }
        { page > 0 &&
          <Grid item xs={ 8 } align='left' className={ classes.button }>
            <Button
              label="Back"
              disabled={ loading }
              onClick={ this.onBack }
            />
          </Grid>
        }
        {
            (page === 0 && receiveAmount > 0 && selectedToken) &&
            <Grid item xs={ 8 }>
              <Typography className={ classes.disclaimer }>You will receive {receiveAmount} {selectedToken.symbol}-BEP2</Typography>
            </Grid>
        }
        <Grid item xs={ (page > 0 || (receiveAmount > 0 && selectedToken)) ? 4 : 12 } align='right' className={ classes.button }>
          <Button
            fullWidth={true}
            label={ page === 2 ? "Done" : "Next" }
            disabled={ loading }
            onClick={ this.onNext }
          />
        </Grid>
      </Grid>
    )
  };
}

Swap.propTypes = {
  classes: PropTypes.object.isRequired
};

export default withStyles(styles)(Swap);
