import React, { Component } from "react";
import PropTypes from "prop-types";
import { withStyles } from "@material-ui/core/styles";
import {
  Grid,
  Typography
} from "@material-ui/core"

import Input from "../common/input";
import Button from "../common/button";
import AssetSelection from "../assetSelection";

import { colors } from '../../theme'

import {
  ERROR,
  LIST_TOKEN,
  TOKEN_LISTED,
  FINALIZE_LIST_TOKEN,
  TOKEN_LIST_FINALIZED
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


class List extends Component {
  state = {
    page: 0,

    token: '',
    tokenError: false,
    proposalId: '',
    proposalIdError: false,
    initialPrice: '',
    initialPriceError: false,
  };

  componentWillMount() {
    emitter.on(TOKEN_LISTED, this.tokenListed);
    emitter.on(TOKEN_LIST_FINALIZED, this.tokenListFinalized);
    emitter.on(ERROR, this.error);
  };

  componentWillUnmount() {
    emitter.removeListener(TOKEN_LISTED, this.tokenListed);
    emitter.removeListener(TOKEN_LIST_FINALIZED, this.tokenListFinalized);
    emitter.on(ERROR, this.error);
  };

  error = (err) => {
    this.props.showError(err)
  }

  tokenListed = (data) => {
    this.setState({
      page: 1,
      listUuid: data.uuid,
      bnbDepositAddress: data.bnb_address
   })
  };

  tokenListFinalized = (data) => {
    this.setState({ page: 2 })
  };

  callListToken = () => {

    const {
      proposalId,
      token,
      initialPrice,
    } = this.state

    const content = {
      token: token,
      proposalId: proposalId,
      initial_price: initialPrice
    }

    dispatcher.dispatch({type: LIST_TOKEN, content })
  };

  callFinalizeToken = () => {
    const {
      listUuid
    } = this.state

    const content = {
      uuid: listUuid
    }

    dispatcher.dispatch({type: FINALIZE_LIST_TOKEN, content })
  };

  validateListToken = () => {
    this.setState({
      proposalIdError: false,
      tokenError: false,
      initialPriceError: false
    })

    const {
      proposalId,
      token,
      initialPrice,
    } = this.state

    let error = false

    if(!proposalId || proposalId === '') {
      this.setState({ proposalIdError: true })
      error = true
    }
    if(!token || token === '') {
      this.setState({ tokenError: true })
      error = true
    }
    if(!initialPrice || initialPrice === '') {
      this.setState({ initialPriceError: true })
      error = true
    }

    return !error
  };

  onNext = (event) => {
    switch (this.state.page) {
      case 0:
        if(this.validateListToken()) {
          this.callListToken()
        }
        break;
      case 1:
        this.callFinalizeToken()
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
      proposalId: '',
      proposalIdError: false,
      initialPrice: '',
      initialPriceError: false,
    })
  };

  onBack = (event) => {
    this.setState({ page: 0 })
  };

  onTokenSelected = (value) => {
    this.setState({ token: value })
  };

  onChange = (event) => {
    let val = []
    val[event.target.id] = event.target.value
    this.setState(val)
  };

  renderPage0() {
    const {
      classes,
      onIssue
    } = this.props
    const {
      proposalId,
      proposalIdError,
      initialPrice,
      initialPriceError
    } = this.state

    return (
      <React.Fragment>
        <Grid item xs={ 12 }>
          <AssetSelection onIssue={ onIssue } onTokenSelected={ this.onTokenSelected } />
        </Grid>
        <Grid item xs={ 12 }>
          <Input
            id="proposalId"
            fullWidth={ true }
            label="Proposal ID"
            placeholder="eg: 15"
            value={ proposalId }
            error={ proposalIdError }
            onChange={ this.onChange }
          />
        </Grid>
        <Grid item xs={ 12 }>
          <Input
            id="initialPrice"
            fullWidth={ true }
            label="Initial Price"
            placeholder="eg: 1000000"
            value={ initialPrice }
            error={ initialPriceError }
            onChange={ this.onChange }
          />
        </Grid>
        <Grid item xs={ 12 }>
          <Typography className={ classes.disclaimer }>By listing a token here, you agree to bnbridge's Terms of Service.</Typography>
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
      listFee
    } = this.props

    return (
      <React.Fragment>
        <Grid item xs={ 12 } className={ classes.frame }>
        <Typography className={ classes.instructionUnderlined }>
            Here's what you need to do next:
          </Typography>
          <Typography className={ classes.instructionBold }>
            Transfer {listFee} BNB
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
            Your transaction was successfull.
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
      page
    } = this.state

    return (
      <Grid container className={ classes.root }>
        { page === 0 && this.renderPage0() }
        { page === 1 && this.renderPage1() }
        { page === 2 && this.renderPage2() }
        <Grid item xs={ 6 } className={ classes.button }>
          <Button
            label="Back"
            onClick={ page === 0 ? onBack : this.onBack }
          />
        </Grid>
        <Grid item xs={ 6 } align="right" className={ classes.button }>
          <Button
            label="Next"
            onClick={ this.onNext }
          />
        </Grid>
      </Grid>
    )
  }
}

List.propTypes = {
  classes: PropTypes.object.isRequired
};

export default withStyles(styles)(List);
