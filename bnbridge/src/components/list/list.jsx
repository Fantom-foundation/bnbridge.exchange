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
import PageLoader from "../common/pageLoader";

import { colors } from '../../theme'

import {
  ERROR,
  LIST_TOKEN,
  TOKEN_LISTED,
  SUBMIT_LIST_PROPOSAL,
  LIST_PROPOSAL_SUBMITTED,
  FINALIZE_LIST_PROPOSAL,
  LIST_PROPOSAL_FINALIZED,
  FEES_UPDATED,
  GET_LIST_PROPOSAL,
  LIST_PROPOSAL_UPDATED,
} from '../../constants'

import Store from "../../stores";
const dispatcher = Store.dispatcher
const emitter = Store.emitter
const store = Store.store

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
    page: 'SubmitProposal0',
    loading: false,

    listProposal: {},

    tokenListed: false,
    tokenListingProposal: false,
    tokenListingProposalUuid: null,

    token: '',
    tokenError: false,

    expiryTime: '',
    expiryTimeError: false,
    votingPeriod: '',
    votingPeriodError: false,
    initialPrice: '',
    initialPriceError: false,

    listProposalFee: store.getStore('fees')?store.getStore('fees').filter((fee) => {
      return fee.msg_type === 'submit_proposal'
    }).map((fee) => {
      return fee.fee/100000000
    })[0]:0,
    depositFee: 2000,
  };

  componentWillMount() {
    emitter.on(TOKEN_LISTED, this.tokenListed);
    emitter.on(LIST_PROPOSAL_SUBMITTED, this.listProposalSubmitted);
    emitter.on(LIST_PROPOSAL_FINALIZED, this.listProposalFinalized);
    emitter.on(ERROR, this.error);
    emitter.on(FEES_UPDATED, this.feesUpdated);
    emitter.on(LIST_PROPOSAL_UPDATED, this.listProposalUpdated)
  };

  componentWillUnmount() {
    emitter.removeListener(TOKEN_LISTED, this.tokenListed);
    emitter.removeListener(LIST_PROPOSAL_SUBMITTED, this.listProposalSubmitted);
    emitter.removeListener(LIST_PROPOSAL_FINALIZED, this.listProposalFinalized);
    emitter.removeListener(ERROR, this.error);
    emitter.removeListener(FEES_UPDATED, this.feesUpdated);
    emitter.removeListener(LIST_PROPOSAL_UPDATED, this.listProposalUpdated)
  };

  feesUpdated = () => {
    const fees = store.getStore('fees')

    let listProposalFee = fees.filter((fee) => {
      return fee.msg_type === 'submit_proposal'
    }).map((fee) => {
      return fee.fee/100000000
    })[0]

    let listFee = fees.filter((fee) => {
      return fee.msg_type === 'dexList'
    }).map((fee) => {
      return fee.fee/100000000
    })[0]

    this.setState({
      listProposalFee: listProposalFee,
      listFee: listFee
    })
  };

  listProposalUpdated = (data)  => {
    this.setState({
      loading: false,
      listProposal: data,
      page: 'SubmitList0'
    })
  };

  error = (err) => {
    this.props.showError(err)
    this.setState({ loading: false })
  }

  tokenListed = (data) => {
    this.setState({
      loading: false,
      page: 'Listed',
      listUuid: data.uuid,
      bnbDepositAddress: data.bnb_address
   })
  };

  listProposalSubmitted = (data) => {
    this.setState({
      loading: false,
      page: 'SubmitProposal1',
      proposalUuid: data.uuid,
      bnbDepositAddress: data.bnb_address
   })
  };

  listProposalFinalized = (data) => {
    this.setState({
      loading: false,
      page: 'SubmitProposal2'
    })
  };

  callSubmitListProposal = () => {

    const {
      expiryTime,
      votingPeriod,
      token,
      initialPrice,
    } = this.state

    const content = {
      token_uuid: token,
      expiry_time: expiryTime,
      voting_period: votingPeriod,
      initial_price: initialPrice
    }

    dispatcher.dispatch({type: SUBMIT_LIST_PROPOSAL, content })
    this.setState({ loading: true })
  };

  callFinalizeListProposal = () => {
    const {
      proposalUuid
    } = this.state

    const content = {
      uuid: proposalUuid
    }

    dispatcher.dispatch({type: FINALIZE_LIST_PROPOSAL, content })
    this.setState({ loading: true })
  };

  callList = () => {
    const {
      listProposal
    } = this.state

    const content = {
      uuid: listProposal.uuid
    }

    dispatcher.dispatch({type: LIST_TOKEN, content })
    this.setState({ loading: true })
  };

  validateListProposal = () => {
    this.setState({
      expiryTimeError: false,
      votingPeriodError: false,
      tokenError: false,
      initialPriceError: false
    })

    const {
      expiryTime,
      votingPeriod,
      token,
      initialPrice,
    } = this.state

    let error = false

    if(!votingPeriod || votingPeriod === '') {
      this.setState({ votingPeriodError: true })
      error = true
    }
    if(!expiryTime || expiryTime === '') {
      this.setState({ expiryTimeError: true })
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
      case 'SubmitProposal0':
        if(this.validateListProposal()) {
          this.callSubmitListProposal()
        }
        break;
      case 'SubmitProposal1':
        this.callFinalizeListProposal()
        break;
      case 'SubmitProposal2':
        this.resetPage()
        break;
      case 'SubmitList0':
        this.callList()
        break;
      default:
    }
  };

  resetPage = () => {
    this.setState({
      page: 'SubmitProposal0',
      token: '',
      tokenError: false,
      expiryTime: '',
      expiryTimeError: false,
      votingPeriod: '',
      votingPeriodError: false,
      initialPrice: '',
      initialPriceError: false,
      loading: false,
    })
  };

  onBack = (event) => {
    this.setState({ page: 'SubmitProposal0' })
  };

  onTokenSelected = (value) => {
    const tokens = store.getStore('tokens')
    const theToken = tokens.filter((token) => {
      return token.uuid === value
    })[0]

    this.setState({
      token: value,
      page: (theToken&&theToken.listed) ? 'Listed' : ((theToken&&theToken.listing_proposed) ? 'GettingList' : 'SubmitProposal0'),
      tokenListed: theToken?theToken.listed:null,
      tokenListingProposal: theToken?theToken.listing_proposed:null,
      tokenListingProposalUuid: theToken?theToken.listing_proposal_uuid:null
    })

    if(theToken && !theToken.listed && theToken.listing_proposed) {
      const content = {
        uuid: theToken.listing_proposal_uuid
      }
      dispatcher.dispatch({type: GET_LIST_PROPOSAL, content })
    }
  };

  onChange = (event) => {
    let val = []
    val[event.target.id] = event.target.value
    this.setState(val)
  };

  renderSubmitProposal0 = () => {
    const {
      expiryTime,
      expiryTimeError,
      votingPeriod,
      votingPeriodError,
      initialPrice,
      initialPriceError
    } = this.state

    return (
      <React.Fragment>
        <Grid item xs={ 12 }>
          <Input
            id="expiryTime"
            fullWidth={ true }
            label="Expiry Time"
            placeholder="eg: 15 (days)"
            value={ expiryTime }
            error={ expiryTimeError }
            onChange={ this.onChange }
          />
        </Grid>
        <Grid item xs={ 12 }>
          <Input
            id="votingPeriod"
            fullWidth={ true }
            label="Voting Period"
            placeholder="eg: 7 (days)"
            value={ votingPeriod }
            error={ votingPeriodError }
            onChange={ this.onChange }
          />
        </Grid>
        <Grid item xs={ 12 }>
          <Input
            id="initialPrice"
            fullWidth={ true }
            label="Initial Price"
            placeholder="eg: 100000000"
            value={ initialPrice }
            error={ initialPriceError }
            onChange={ this.onChange }
          />
        </Grid>
      </React.Fragment>
    )
  };

  renderSubmitProposal1 = () => {
    const {
      bnbDepositAddress,
      listProposalFee,
      depositFee
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
            Transfer {listProposalFee + depositFee} BNB
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

  renderSubmitProposal2 = () => {
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
          <Typography className={ classes.instructions }>
            The next steps require Binance validators to vote on whether they want the token listed on the DEX. Once 50% of the validators vote "Yes", you will need to submit the list transaction.
          </Typography>
          <Typography className={ classes.instructions }>
            You will be able to do so by usinng this utility.
          </Typography>
        </Grid>
      </React.Fragment>
    )
  };

  renderListed = () => {
    const {
      classes
    } = this.props

    return (
      <React.Fragment>
        { this.renderAssetSelection() }
        <Grid item xs={ 12 } className={ classes.frame }>
          <Typography className={ classes.instructionBold }>
            Token Listed
          </Typography>
          <Typography className={ classes.instructionBold }>
            This token listed on Binance DEX.
          </Typography>
          <Typography className={ classes.instructions }>
            You should be able to interact with it on the exchange.
          </Typography>
        </Grid>
      </React.Fragment>)
  };

  renderGettingList = () => {
    const {
      classes
    } = this.props

    return (
      <Grid item xs={ 12 } className={ classes.frame }>
        <Typography className={ classes.instructionBold }>
          Getting Proposal Status
        </Typography>
        <Typography className={ classes.instructions }>
          This token has a previous token listing proposal submitted to Binance.
        </Typography>
        <Typography className={ classes.instructions }>
          Please hold on while we get the listing information
        </Typography>
      </Grid>)
  };

  renderSubmitList0 = () => {
    const {
      classes
    } = this.props

    const {
      listProposal
    } = this.state

    if(!listProposal) {
      return null
    }

    return (
      <React.Fragment>
        <Grid item xs={ 12 } className={ classes.frame }>
          <Typography className={ classes.instructionBold }>
            {listProposal.chain_info.value.title}
          </Typography>
          <Typography className={ classes.instructions }>
            Proposal ID: {listProposal.proposal_id}
          </Typography>
          <Typography className={ classes.instructions }>
            Status: {listProposal.chain_info.value.proposal_status}
          </Typography>
          {
            listProposal.chain_info.value.proposal_status !== 'Passed' &&
            <Typography className={ classes.instructions }>
              Once the vote has passed you will be able to list the token on the Binance DEX
            </Typography>
          }
        </Grid>
        {
          listProposal.chain_info.value.proposal_status === 'Passed' &&
          <Grid item xs={ 12 } align="right" className={ classes.button }>
            <Button
              label="List"
              onClick={ this.onNext }
            />
          </Grid>
        }
      </React.Fragment>
      )
  };

  renderAssetSelection = () => {

    const { onIssue } = this.props

    return (
      <Grid item xs={ 12 }>
        <AssetSelection onIssue={ onIssue } onTokenSelected={ this.onTokenSelected } />
      </Grid>
    )
  };

  render() {
    const {
      classes
    } = this.props

    const {
      page,
      loading
    } = this.state

    return (
      <Grid container className={ classes.root }>
        { loading && <PageLoader /> }
        { (page === 'SubmitProposal0' || page === 'GettingList' || page === 'SubmitList0') && this.renderAssetSelection() }
        { page === 'SubmitProposal0' && this.renderSubmitProposal0() }
        { page === 'SubmitProposal1' && this.renderSubmitProposal1() }
        { page === 'SubmitProposal2' && this.renderSubmitProposal2() }
        { page === 'Listed' && this.renderListed() }
        { page === 'GettingList' &&  this.renderGettingList() }
        { page === 'SubmitList0' && this.renderSubmitList0() }
        { !(['SubmitProposal0', 'GettingList', 'SubmitList0'].includes(page)) &&
          <Grid item xs={ 6 } align='left' className={ classes.button }>
            <Button
              disabled={ loading }
              label="Back"
              onClick={ this.onBack }
            />
          </Grid>
        }
        {
          !(['GettingList', 'SubmitList0', 'Listed' ].includes(page)) &&
          <Grid item xs={ !(page === 'SubmitProposal0' || page === 'SubmitList0') ? 6 : 12 } align="right" className={ classes.button }>
            <Button
              disabled={ loading }
              fullWidth={true}
              label="Next"
              onClick={ this.onNext }
            />
          </Grid>
        }
      </Grid>
    )
  }
}

List.propTypes = {
  classes: PropTypes.object.isRequired
};

export default withStyles(styles)(List);
