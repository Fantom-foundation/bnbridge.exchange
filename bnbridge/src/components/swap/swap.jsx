import React, { Component } from "react";
import PropTypes from 'prop-types';
import { withStyles } from '@material-ui/core/styles';
import {
  Grid,
  Typography,
  IconButton,
  SvgIcon
} from '@material-ui/core'
import config from '../../config'

import Input from '../common/input';
import Button from '../common/button';
import PageLoader from "../common/pageLoader";
import Label from "../common/label";
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
  ETH_BALANCES_UPDATED,
} from '../../constants'

import Store from "../../stores";
const dispatcher = Store.dispatcher
const emitter = Store.emitter
const store = Store.store

const styles = theme => ({
  root: {
    maxWidth: '400px'
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
    maxWidth: '250px'
  },
  createAccount: {
    fontSize: '0.8rem',
    textDecoration: 'underline',
    textAlign: 'right',
    marginBottom: '16px',
    cursor: 'pointer'
  },
  icon: {
    display: 'inline-block',
    verticalAlign: 'middle',
    borderRadius: '25px',
    background: '#dedede',
    height: '50px',
    width: '50px',
    textAlign: 'center',
    cursor: 'pointer'
  },
  iconName: {
    paddingLeft: '24px',
    display: 'inline-block',
    verticalAlign: 'middle'
  },
  swapDirection: {
    margin: '14px 12px 18px 12px'
  },
  gridClick: {
    cursor: 'pointer'
  }
});

function CopyIcon(props) {
  return (
    <SvgIcon {...props}>
      <path
        fill={'#6a6a6a'}
        d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm-1 4H8c-1.1 0-1.99.9-1.99 2L6 21c0 1.1.89 2 1.99 2H19c1.1 0 2-.9 2-2V11l-6-6zM8 21V7h6v5h5v9H8z"
      />
    </SvgIcon>
  );
}

function SwapIcon(props) {
  return (
    <SvgIcon {...props}>
      <path
        fill={'#6a6a6a'}
        d="M8,10V13H14V18H8V21L2,15.5L8,10M22,8.5L16,3V6H10V11H16V14L22,8.5Z"
      />
    </SvgIcon>
  );
}


class Swap extends Component {
  state = {
    loading: false,
    page: 0,
    token: '',
    tokenError: false,
    bnbReceiveAddress: '',
    bnbReceiveAddressError: false,
    ethReceiveAddress: '',
    ethReceiveAddressError: false,
    tokens: [],
    selectedToken: null,
    bnbBalances: null,
    ethBalances: null,
    swapDirection: 'EthereumToBinance'
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
      clientUuid: data.uuid,
      ethDepositAddress: data.eth_address,
      bnbDepositAddress: data.bnb_address,
      loading: false
   })
  };

  tokenSwapFinalized = (transactions) => {
    this.setState({
      page: 2,
      loading: false,
      transactions: transactions
    })
  };

  callSwapToken = () => {

    const {
      token,
      swapDirection,
      bnbReceiveAddress,
      ethReceiveAddress
    } = this.state

    const content =  {
      token_uuid: token,
      direction: swapDirection,
      bnb_address: bnbReceiveAddress,
      eth_address: ethReceiveAddress,
    }

    dispatcher.dispatch({ type: SWAP_TOKEN, content })

    this.setState({ loading: true })
  };

  callFinalizeSwapToken = () => {
    const {
      clientUuid,
      selectedToken,
      swapDirection
    } = this.state

    const content = {
      uuid: clientUuid,
      direction: swapDirection,
      token_uuid: selectedToken.uuid
    }
    dispatcher.dispatch({type: FINALIZE_SWAP_TOKEN, content })

    this.setState({ loading: true })
  };

  validateSwapToken = () => {

    this.setState({
      tokenError: false,
      bnbReceiveAddressError: false,
      ethReceiveAddressError: false,
    })

    const {
      token,
      swapDirection,
      bnbReceiveAddress,
      ethReceiveAddress,
    } = this.state

    let error = false

    if(!token || token === '') {
      this.setState({ tokenError: true })
      error = true
    }

    if(swapDirection === 'EthereumToBinance') {
      if(!bnbReceiveAddress || bnbReceiveAddress === '') {
        this.setState({ bnbReceiveAddressError: true })
        error = true
      }
    } else {
      if(!ethReceiveAddress || ethReceiveAddress === '') {
        this.setState({ ethReceiveAddressError: true })
        error = true
      }
    }

    return !error
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

  onSwapDirectionClick = () => {
    const {
      swapDirection,
      selectedToken
    } = this.state

    let direction = swapDirection==='EthereumToBinance'?'BinanceToEthereum':'EthereumToBinance'

    if(selectedToken){
      if(!selectedToken.eth_to_bnb_enabled && direction === 'EthereumToBinance') {
        direction = 'BinanceToEthereum'
      }

      if(!selectedToken.bnb_to_eth_enabled && direction === 'BinanceToEthereum') {
        direction = 'EthereumToBinance'
      }
    }

    this.setState({
      swapDirection: direction,
      ethReceiveAddress: '',
      bnbReceiveAddress: '',
      ethBalances: null,
      bnbBalances: null
    })
  };

  resetPage = () => {
    this.setState({
      page: 0,
      token: '',
      tokenError: false,
      bnbReceiveAddress: '',
      bnbReceiveAddressError: false,
      ethReceiveAddress: '',
      ethReceiveAddressError: false,
      selectedToken: null,
      bnbBalances: null,
      ethBalances: null,
    })
  };

  onBack = (event) => {
    this.setState({ page: 0 })
  };

  onHashClick = (hash) => {
    const {
      swapDirection
    } = this.state

    if(swapDirection === 'EthereumToBinance') {
      window.open(config.etherscanURL+hash, "_blank")
    } else {
      window.open(config.explorerURL+hash, "_blank")
    }
  };

  onTokenSelected = (value) => {

    const {
      tokens,
      swapDirection,
      bnbReceiveAddress,
      ethReceiveAddress,
    } = this.state

    let theToken = tokens.filter((tok) => {
      return tok.uuid === value
    })

    if(theToken.length < 1) {
      this.setState({ token: value, selectedToken: null })
      return false;
    }

    this.setState({ token: value, selectedToken: theToken[0] })

    if(!theToken[0].eth_to_bnb_enabled && !theToken[0].bnb_to_eth_enabled) {
      this.setState({ swapDirection: null })
      return false
    }

    let direction = swapDirection

    if(!theToken[0].eth_to_bnb_enabled && swapDirection === 'EthereumToBinance') {
      direction = 'BinanceToEthereum'
      this.setState({ swapDirection: direction })
    }

    if(!theToken[0].bnb_to_eth_enabled && swapDirection === 'BinanceToEthereum') {
      direction = 'EthereumToBinance'
      this.setState({ swapDirection: direction })
    }

    if(direction === 'EthereumToBinance') {
      if(theToken.length > 0  && bnbReceiveAddress && bnbReceiveAddress !== "" && bnbReceiveAddress.length === Config.bnbAddressLength) {
        const content = {
          bnb_address: bnbReceiveAddress,
          token_uuid: theToken[0].uuid
        }
        dispatcher.dispatch({type: GET_BNB_BALANCES, content })
        this.setState({ loading: true })
      }
      this.setState({ bnbBalances: null })
    } else {
      if(theToken.length > 0  && ethReceiveAddress && ethReceiveAddress !== "" && ethReceiveAddress.length === Config.erc20addressLength) {
        const content = {
          eth_address: ethReceiveAddress,
          token_uuid: theToken[0].uuid
        }
        dispatcher.dispatch({type: GET_ETH_BALANCES, content })
        this.setState({ loading: true })
      }
      this.setState({ ethBalances: null })
    }
  };

  onChange = (event) => {
    let val = []
    val[event.target.id] = event.target.value
    this.setState(val)

    if(event.target.id === 'bnbReceiveAddress') {

      const {
        selectedToken,
      } = this.state

      if(selectedToken  && event.target.value && event.target.value !== "" && event.target.value.length === Config.bnbAddressLength) {
        const content = {
          bnb_address: event.target.value,
          token_uuid: selectedToken.uuid
        }
        dispatcher.dispatch({type: GET_BNB_BALANCES, content })
        this.setState({ loading: true })
      }
      this.setState({ bnbBalances: null })
    }

    if(event.target.id === 'ethReceiveAddress') {

      const {
        selectedToken,
      } = this.state

      if(selectedToken  && event.target.value && event.target.value !== "" && event.target.value.length === Config.erc20addressLength) {
        const content = {
          eth_address: event.target.value,
          token_uuid: selectedToken.uuid
        }
        dispatcher.dispatch({type: GET_ETH_BALANCES, content })
        this.setState({ loading: true })
      }
      this.setState({ ethBalances: null })
    }
  };

  onCopy = () => {
    var elm = document.getElementById("depositAddress");
    let range;
    // for Internet Explorer

    if (document.body.createTextRange) {
      range = document.body.createTextRange();
      range.moveToElementText(elm);
      range.select();
      document.execCommand("Copy");
    } else if (window.getSelection) {
      // other browsers
      var selection = window.getSelection();
      range = document.createRange();
      range.selectNodeContents(elm);
      selection.removeAllRanges();
      selection.addRange(range);
      document.execCommand("Copy");
    }
  };

  renderPage0 = () => {

    const {
      bnbReceiveAddress,
      bnbReceiveAddressError,
      ethReceiveAddress,
      ethReceiveAddressError,
      loading,
      bnbBalances,
      ethBalances,
      selectedToken,
      swapDirection
    } = this.state

    const {
      onIssue,
      onCreateAccount,
      classes
    } = this.props

    return (
      <React.Fragment>
        { this.renderSwapDirection() }
        <AssetSelection onIssue={ onIssue } onTokenSelected={ this.onTokenSelected } disabled={ loading } />
        <Grid item xs={ 12 }>
          {


            (selectedToken && !selectedToken.eth_to_bnb_enabled && !selectedToken.bnb_to_eth_enabled) ?
              <React.Fragment>
              </React.Fragment>
            :
            swapDirection === "EthereumToBinance" ?
              <React.Fragment>
                <Input
                  id='bnbReceiveAddress'
                  fullWidth={ true }
                  label="BNB Receive Address"
                  placeholder="eg: bnb1mmxvnhkyqrvd2dpskvsgl8lmft4tnrcs97apr3"
                  value={ bnbReceiveAddress }
                  error={ bnbReceiveAddressError }
                  onChange={ this.onChange }
                  disabled={ loading }
                />
                {
                  bnbBalances &&
                  <React.Fragment>
                    <Typography>
                      Current {selectedToken.name} Balance: { bnbBalances.balance } { selectedToken.symbol }
                    </Typography>
                  </React.Fragment>
                }
                {
                  !bnbBalances &&
                  <Typography className={ classes.createAccount } onClick={ onCreateAccount }>
                    Don't have an account? Create one
                  </Typography>
                }
              </React.Fragment>
              :
              <React.Fragment>
                <Input
                  id='ethReceiveAddress'
                  fullWidth={ true }
                  label="Eth Receive Address"
                  placeholder="eg: 0x0dE0BCb0703ff8F1aEb8C892eDbE692683bD8030"
                  value={ ethReceiveAddress }
                  error={ ethReceiveAddressError }
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
             </React.Fragment>
          }
        </Grid>
      </React.Fragment>
    )
  };

  renderPage1 = () => {
    const {
      selectedToken,
      ethDepositAddress,
      bnbDepositAddress,
      swapDirection
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
            Transfer your {swapDirection === 'EthereumToBinance' ? (selectedToken.symbol+'-ERC20') : selectedToken.unique_symbol}
          </Typography>
          <Typography className={ classes.instructions }>
            to
          </Typography>
          <Typography className={ classes.instructionBold }>
            <div id='depositAddress'>{swapDirection === 'EthereumToBinance' ? ethDepositAddress : bnbDepositAddress}</div>
            <IconButton
              style={{
                verticalAlign: "top",
                marginRight: "-5px"
              }}
              onClick={this.onCopy}
            >
              <CopyIcon/>
            </IconButton>
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
            Swap request pending
          </Typography>
          <Typography className={ classes.instructions }>
            We have added the following transaction/s to our log for your address:
          </Typography>
          { this.renderTransactions() }
          { this.renderTotals() }
        </Grid>
      </React.Fragment>
    )
  };

  renderTotals = () => {
    const {
      transactions,
      selectedToken,
      bnbReceiveAddress,
      ethReceiveAddress,
      swapDirection
    } = this.state

    const {
      classes
    } = this.props

    const reducer = (accumulator, currentValue) => accumulator + parseFloat(currentValue.amount);
    const totalAmount = transactions.reduce(reducer, 0)

    return (
      <React.Fragment>
        <Typography className={ classes.instructions }>
          You will receive another <b>{totalAmount} { swapDirection === 'EthereumToBinance' ? selectedToken.unique_symbol : (selectedToken.symbol+'-ERC20') }</b> in your address <b>{ swapDirection === 'EthereumToBinance' ? bnbReceiveAddress : ethReceiveAddress }</b>
        </Typography>
      </React.Fragment>
    )
  };

  renderTransactions = () => {
    const {
      transactions,
      selectedToken,
      swapDirection
    } = this.state

    const {
      classes
    } = this.props

    return transactions.map((transaction) => {
      return (
        <React.Fragment>
          <Typography className={ classes.hash } onClick={ (event) => { this.onHashClick(transaction.deposit_transaction_hash); } }>
            <b>{transaction.amount} { swapDirection === 'EthereumToBinance' ? (selectedToken.symbol+'-ERC20') : selectedToken.unique_symbol }</b> from <b>{ swapDirection === 'EthereumToBinance' ? transaction.eth_address : transaction.bnb_address }</b>
          </Typography>
        </React.Fragment>)
    })
  };

  renderSwapDirection = () => {

    const {
      classes
    } = this.props

    const {
      swapDirection,
      selectedToken
    } = this.state

    let first = 'Binance'
    let second = 'Ethereum'

    if(swapDirection === 'EthereumToBinance') {
      first = 'Ethereum'
      second = 'Binance'
    }

    if(selectedToken && !selectedToken.eth_to_bnb_enabled && !selectedToken.bnb_to_eth_enabled) {

      return (
        <React.Fragment>
          <Label label={ 'Swap direction' } overrideStyle={ { marginTop: '12px' } } />
          <Typography>No available swaps for selectedToken.symbol</Typography>
        </React.Fragment>
      )
    }

    return (
      <React.Fragment>
        <Label label={ 'Swap direction' } overrideStyle={ { marginTop: '12px' } } />
        <Grid item xs={ 5 } onClick={ this.onSwapDirectionClick } className={ classes.gridClick }>
          <div className={ classes.icon }>
            <img
              alt=""
              src={ require('../../assets/images/'+first+'-logo.png') }
              height="50px"
            />
          </div>
          <div className={ classes.iconName }>
            <Typography  variant='h5'>{ first ==='Binance' ? 'BEP2' : 'ERC20' }</Typography>
          </div>
        </Grid>
        <Grid item xs={ 2 } onClick={ this.onSwapDirectionClick } className={ classes.gridClick }>
          <SwapIcon className={ classes.swapDirection } />
        </Grid>
        <Grid item xs={ 5 } align='left' onClick={ this.onSwapDirectionClick } className={ classes.gridClick }>
          <div className={ classes.icon }>
            <img
              alt=""
              src={ require('../../assets/images/'+second+'-logo.png') }
              height="50px"
            />
          </div>
          <div className={ classes.iconName }>
            <Typography  variant='h5'>{ second ==='Binance' ? 'BEP2' : 'ERC20' }</Typography>
          </div>
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
      selectedToken
    } = this.state

    return (
      <Grid container className={ classes.root }>
        { loading && <PageLoader /> }
        { page === 0 && this.renderPage0() }
        { page === 1 && this.renderPage1() }
        { page === 2 && this.renderPage2() }
        <Grid item xs={ 12 } align='right' className={ classes.button }>
          <Button
            fullWidth={true}
            label={ page === 2 ? "Done" : "Next" }
            disabled={ loading || (selectedToken && !selectedToken.eth_to_bnb_enabled && !selectedToken.bnb_to_eth_enabled) }
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
