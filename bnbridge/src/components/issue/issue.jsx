import React, { Component } from "react";
import PropTypes from "prop-types";
import { withStyles } from "@material-ui/core/styles";
import {
  Grid,
  Typography
} from "@material-ui/core"

import Checkbox from "../common/checkbox";
import Input from "../common/input";
import Button from "../common/button";
import PageLoader from "../common/pageLoader";

import { colors } from '../../theme'

import {
  ERROR,
  ISSUE_TOKEN,
  TOKEN_ISSUED,
  FINALIZE_TOKEN,
  TOKEN_FINALIZED,
  GET_ERC20_INFO,
  ERC20_INFO_UPDATED
} from '../../constants'

import Store from "../../stores";
const dispatcher = Store.dispatcher
const emitter = Store.emitter

const styles = theme => ({
  root: {
    width: "400px"
  },
  button: {
    marginTop: "24px"
  },
  disclaimer: {
    fontSize: '12px',
    marginTop: '24px'
  },
  heading: {
    fontSize: '0.8125rem',
    fontFamily: 'Roboto,sans-serif',
    fontWeight: '500',
    lineHeight: '1.75',
    flexShrink: 0,
    whiteSpace: 'normal',
    textTransform: 'uppercase',
    marginTop: '38px',
    marginBottom: '14px',
    paddingBottom: '10px',
    textAlign: 'center',
    width: '200px',
    borderBottom: '2px solid '+colors.yellow
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
});


class Issue extends Component {
  state = {
    page: 0,
    loading: false,

    erc20address: '',
    erc20addressError: false,
    tokenName: '',
    tokenNameError: false,
    symbol: '',
    symbolError: false,
    totalSupply: '',
    totalSupplyError: false,
    mintable: false,
    mintableError: false,
    erc20Info: null
  };

  componentWillMount() {
    emitter.on(TOKEN_ISSUED, this.tokenIssued);
    emitter.on(TOKEN_FINALIZED, this.tokenFinalized);
    emitter.on(ERC20_INFO_UPDATED, this.erc20InfoUpdated);
    emitter.on(ERROR, this.error);
  };

  componentWillUnmount() {
    emitter.removeListener(TOKEN_ISSUED, this.tokenIssued);
    emitter.removeListener(TOKEN_FINALIZED, this.tokenFinalized);
    emitter.removeListener(ERC20_INFO_UPDATED, this.erc20InfoUpdated);
    emitter.on(ERROR, this.error);
  };

  error = (err) => {
    this.props.showError(err)

    this.setState({ loading: false })
  }

  tokenIssued = (data) => {
    this.setState({
      page: 1,
      loading: false,
      issueUuid: data.uuid,
      bnbDepositAddress: data.bnb_address
   })
  };

  tokenFinalized = (data) => {
    this.setState({
      page: 2,
      loading: false
    })
  };

  erc20InfoUpdated = (data) => {
    this.setState({
      erc20Info: data,
      loading: false,
      tokenName: data.name,
      totalSupply: data.total_supply,
      symbol: data.symbol
    })
  };

  callGetTokenInfo = (erc20address) => {
    if(erc20address && erc20address.length === 42) {
      const content = {
        contract_address: erc20address,
      }

      dispatcher.dispatch({type: GET_ERC20_INFO, content })

      this.setState({ loading: true })
    }
  };

  callIssueToken = () => {

    const {
      tokenName,
      symbol,
      erc20address,
      totalSupply,
      mintable,
    } = this.state

    const content = {
      erc20_address: erc20address,
      name: tokenName,
      symbol: symbol,
      total_supply: totalSupply,
      mintable: mintable
    }

    dispatcher.dispatch({type: ISSUE_TOKEN, content })

    this.setState({ loading: true })
  };

  callFinalizeToken = () => {
    const {
      issueUuid
    } = this.state

    const content = {
      uuid: issueUuid
    }
    dispatcher.dispatch({type: FINALIZE_TOKEN, content })

    this.setState({ loading: true })
  };

  validateIssueToken = () => {
    this.setState({
      tokenNameError: false,
      symbolError: false,
      erc20addressError: false,
      totalSupplyError: false,
    })

    const {
      tokenName,
      symbol,
      erc20address,
      totalSupply
    } = this.state

    let error = false

    if(!tokenName || tokenName === '') {
      this.setState({ tokenNameError: true })
      error = true
    }
    if(!symbol || symbol === '') {
      this.setState({ symbolError: true })
      error = true
    }
    if(!erc20address || erc20address === '') {
      this.setState({ erc20addressError: true })
      error = true
    }
    if(!totalSupply || totalSupply === '') {
      this.setState({ totalSupplyError: true })
      error = true
    }

    return !error
  };

  onNext = (event) => {
    switch (this.state.page) {
      case 0:
        if(this.validateIssueToken()) {
          this.callIssueToken()
        }
        break;
      case 1:
        this.callFinalizeToken()
        break;
      case 2:
        this.props.onBack()
        break;
      default:

    }
  };

  onBack = (event) => {
    this.setState({ page: 0 })
  };

  onChange = (event) => {
    let val = []
    val[event.target.id] = event.target.value
    this.setState(val)

    if(event.target.id === 'erc20address') {
      this.callGetTokenInfo(event.target.value)
    }
  };

  onSelectChange = (event) => {
    let val = []
    val[event.target.id] = event.target.checked
    this.setState(val)
  }

  renderPage0() {
    const {
      erc20address,
      erc20addressError,
      tokenName,
      tokenNameError,
      symbol,
      symbolError,
      totalSupply,
      totalSupplyError,
      mintable,
      mintableError,
      loading
    } = this.state

    return (
      <React.Fragment>
        <Grid item xs={ 12 }>
          <Input
            id="erc20address"
            fullWidth={ true }
            label="ERC20 contract address"
            placeholder="eg: 0x0dE0BCb0703ff8F1aEb8C892eDbE692683bD8030"
            value={ erc20address }
            error={ erc20addressError }
            onChange={ this.onChange }
            disabled={ loading }
          />
        </Grid>
        <Grid item xs={ 12 }>
          <Input
            id="tokenName"
            fullWidth={ true }
            label="Token Name"
            placeholder="eg: Binance Coin"
            value={ tokenName }
            error={ tokenNameError }
            onChange={ this.onChange }
            disabled={ loading }
          />
        </Grid>
        <Grid item xs={ 12 }>
          <Input
            id="symbol"
            fullWidth={ true }
            label="Symbol"
            placeholder="eg: BNB"
            value={ symbol }
            error={ symbolError }
            onChange={ this.onChange }
            disabled={ loading }
          />
        </Grid>
        <Grid item xs={ 12 }>
          <Input
            id="totalSupply"
            fullWidth={ true }
            label="Total Supply"
            placeholder="eg: 10000000000000000"
            value={ totalSupply }
            error={ totalSupplyError }
            onChange={ this.onChange }
            disabled={ loading }
          />
        </Grid>
        <Grid item xs={ 12 }>
          <Checkbox
            id="mintable"
            fullWidth={ true }
            label="Mintable"
            value={ mintable }
            error={ mintableError }
            onChange={ this.onSelectChange }
            disabled={ loading }
          />
        </Grid>
      </React.Fragment>
    )
  };

  renderPage1() {
    const {
      bnbDepositAddress
    } = this.state

    const {
      classes,
      issueFee
    } = this.props

    return (
      <React.Fragment>
        <Grid item xs={ 12 } className={ classes.frame }>
        <Typography className={ classes.instructionUnderlined }>
            Here's what you need to do next:
          </Typography>
          <Typography className={ classes.instructionBold }>
            Transfer {issueFee} BNB
          </Typography>
          <Typography className={ classes.instructions }>
            to
          </Typography>
          <Typography className={ classes.instructionBold }>
            {bnbDepositAddress}
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
            Awesome
          </Typography>
          <Typography className={ classes.instructions }>
            Your transaction was successfull. You should find it in the token list.
          </Typography>
        </Grid>
      </React.Fragment>
    )
  };

  render() {
    const {
      classes,
      onBack
    } = this.props

    const {
      page,
      loading
    } = this.state

    return (
      <Grid container className={ classes.root }>
        { loading && <PageLoader /> }
        { page === 0 && this.renderPage0() }
        { page === 1 && this.renderPage1() }
        { page === 2 && this.renderPage2() }
        { page > 0 &&
        <Grid item xs={ 6 } className={ classes.button }>
          <Button
            disabled={ loading }
            label="Back"
            onClick={ page === 0 ? onBack : this.onBack }
          />
        </Grid>}
        <Grid item xs={ page > 0 ? 6 : 12 } align="right" className={ classes.button }>
          <Button
            disabled={ loading }
            fullWidth={true}
            label="Next"
            onClick={ this.onNext }
          />
        </Grid>
      </Grid>
    )
  }
}

Issue.propTypes = {
  classes: PropTypes.object.isRequired
};

export default withStyles(styles)(Issue);
