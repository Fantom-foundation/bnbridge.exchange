import React, { Component } from "react";
import PropTypes from 'prop-types';
import { withStyles } from '@material-ui/core/styles';
import {
  Grid,
  Typography,
  Paper,
  IconButton,
  SvgIcon
} from '@material-ui/core'

import Checkbox from "../common/checkbox";
import Input from '../common/input';
import Button from '../common/button';
import PageLoader from "../common/pageLoader";

import {
  ERROR,
  CREATE_BNB_ACCOUNT,
  BNB_ACCOUNT_CREATED,
  DOWNLOAD_BNB_KEYSTORE,
  BNB_KEYSTORE_DOWNLOADED
} from '../../constants'

import Store from "../../stores";
const dispatcher = Store.dispatcher
const emitter = Store.emitter

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

const styles = theme => ({
  root: {
    maxWidth: '400px'
  },
  button: {
    marginTop: '24px'
  },
  heading: {
    fontSize: '24px',
    marginBottom: '24px'
  },
  image: {
    padding: '24px',
    margin: '0 auto',
    width: '280px'
  },
  instruction: {
    marginBottom: '24px'
  },
  bordered: {
    padding: '24px',
    borderWidth: '1px',
    borderStyle: 'solid',
    borderColor: 'rgb(216, 216, 216)',
    backgroundColor: 'rgb(249, 249, 249)',
    minHeight: '180px',
    marginTop: '24px'
  },
  borderedError: {
    padding: '24px',
    borderWidth: '1px',
    borderStyle: 'solid',
    borderColor: '#f44336',
    backgroundColor: 'rgb(249, 249, 249)',
    minHeight: '180px',
    marginTop: '24px'
  },
  mnemonic: {
    wordSpacing: '16px',
    lineHeight: '30px',
    fontSize: '18px',
    fontWeight: '600'
  },
  step: {
    marginBottom: '12px'
  },
  wordPaper: {
    width: 'fit-content',
    padding: '4px 10px',
    display: 'inline-block',
    margin: '6px 12px',
    cursor: 'pointer'
  },
  accountAddress: {
    lineHeight: '30px',
    fontSize: '16px',
    fontWeight: '600',
    textAlign: 'center'
  }
});

class Swap extends Component {
  state = {
    loading: false,
    page: 0,
    accept: false,
    acceptError: false,
    account: null,
    enteredWords: [],
    wordError: false,
    validateEnabled: false
  };

  componentWillMount() {
    emitter.on(ERROR, this.error);
    emitter.on(BNB_ACCOUNT_CREATED, this.bnbAccountCreated)
    emitter.on(BNB_KEYSTORE_DOWNLOADED, this.bnbKeystoreDownloaded)
  };

  componentWillUnmount() {
    emitter.removeListener(ERROR, this.error);
    emitter.removeListener(BNB_ACCOUNT_CREATED, this.bnbAccountCreated)
    emitter.removeListener(BNB_KEYSTORE_DOWNLOADED, this.bnbKeystoreDownloaded)
  };

  error = (err) => {
    this.props.showError(err)
    this.setState({ loading: false })
  };

  bnbAccountCreated = (account) => {
    this.setState({
      account,
      mnemonicWords: account.mnemonic.split(" ").sort(() => Math.random() - 0.5),
    })

    this.callDownloadBNBKeystore(account.privateKey)
  };

  bnbKeystoreDownloaded = () => {
    this.setState({
      page: 1,
      loading: false
    })
  };

  onNext = (event) => {
    switch (this.state.page) {
      case 0:
        if(this.validateCreateAccountBNB()) {
          this.callCreateAccountBNB()
        }
        break;
      case 1:
        this.setState({ page: 2 })
        break;
      case 2:
        this.setState({ page: 3 })
        break;
      case 3:
        this.setState({ page: 4 })
        break;
      default:

      break;
    }
  };

  validateCreateAccountBNB = () => {
    const {
      accept,
      password,
      confirmPassword
    } = this.state

    let valid = true

    if(!accept) {
      this.setState({ acceptError: true })
      valid = false
    }

    if(!password) {
      this.setState({ passwordError: true })
      valid = false
    }

    if(!confirmPassword) {
      this.setState({ confirmPasswordError: true })
      valid = false
    }

    if(password !== confirmPassword) {
      this.setState({ passwordError: true, confirmPasswordError: true })
      valid = false
    }

    return valid
  };

  callCreateAccountBNB = () => {
    dispatcher.dispatch({type: CREATE_BNB_ACCOUNT, content: {} })
    this.setState({ loading: true })
  };

  callDownloadBNBKeystore = (privateKey)  => {

    const {
      password
    } = this.state

    const content = {
      password: password,
      private_key: privateKey
    }

    dispatcher.dispatch({type: DOWNLOAD_BNB_KEYSTORE, content })
    this.setState({ loading: true })
  };

  resetPage = () => {
    this.setState({
      page: 0,
      loading: false,
    })
  };

  onBack = (event) => {
    this.setState({ page: 0 })
  };

  onChange = (event) => {
    let val = []
    val[event.target.id] = event.target.value
    this.setState(val)
  };

  onCheckChange = (event) => {
    let val = []
    val[event.target.id] = event.target.checked
    this.setState(val)
  }

  renderPage0 = () => {
    const {
      classes
    } = this.props

    const {
      accept,
      acceptError,
      password,
      passwordError,
      confirmPassword,
      confirmPasswordError,
      loading
    } = this.state

    return (
      <React.Fragment>
        <Grid item xs={ 12 }>
          <Typography className={ classes.step }>
            Step 1 of 4
          </Typography>
        </Grid>
        <Grid item xs={ 12 }>
          <Input
            id="password"
            fullWidth={ true }
            label="Password"
            placeholder="Set a New Password"
            value={ password }
            error={ passwordError }
            onChange={ this.onChange }
            disabled={ loading }
            password={ true }
          />
        </Grid>
        <Grid item xs={ 12 }>
          <Input
            id="confirmPassword"
            fullWidth={ true }
            label="Re-enter Password"
            placeholder="Re-enter Password"
            value={ confirmPassword }
            error={ confirmPasswordError }
            onChange={ this.onChange }
            disabled={ loading }
            password={ true }
          />
        </Grid>
        <Grid item xs={ 12 }>
          <Checkbox
            id="accept"
            fullWidth={ true }
            label="I understand that bnbridge cannot recover or reset my account details. I will make a backup of the account details and complete all wallet creation steps."
            value={ accept }
            error={ acceptError }
            onChange={ this.onCheckChange }
          />
        </Grid>
        <Grid item xs={ 12 } align='right' className={ classes.button }>
          <Button
            fullWidth={true}
            label={ "Download Mnemonic" }
            disabled={ !accept }
            onClick={ this.onNext }
          />
        </Grid>
      </React.Fragment>
    )

  }

  renderPage1 = () => {

    const {
      classes
    } = this.props

    const {
      accept,
    } = this.state

    return (
      <React.Fragment>
        <Grid item xs={ 12 }>
          <Typography className={ classes.step }>
            Step 2 of 4
          </Typography>
        </Grid>
        <Grid item xs={ 12 } align={'middle'}>
          <svg className={ classes.image }>
            <g id="Create-new" stroke="none" stroke-width="1" fill="none" fill-rule="evenodd"><g id="11" transform="translate(-848.000000, -528.000000)"><g id="6" transform="translate(850.000000, 529.000000)"><g id="分组-6" transform="translate(0.000000, 36.240831)"><path d="M49.3511776,42.9559311 C35.7454673,42.8216759 28.7518785,36.8239426 26.3292309,34.1856553 C26.3292309,34.1856553 25.4465549,33.189663 24.2683715,34.2417972 C21.7993145,36.9077403 14.8085461,42.8226978 1.29841092,42.9559311 C1.29841092,42.9559311 -8.35730826,76.633678 24.9936786,95.7459482 L25.1609832,95.7591693 C29.0225145,93.5462577 32.3512992,91.1378393 35.2190668,88.6087062 C35.2190668,88.6087062 38.7659885,85.7423383 43.4425688,79.4459478 C55.713432,61.9073122 49.3511776,42.9559311 49.3511776,42.9559311 Z" id="路径" stroke="#848E9C" stroke-width="2.5" opacity="0.5" fill-rule="nonzero"></path><polygon id="路径" fill="#848E9C" opacity="0.5" points="39.731212 55.7591693 24.8951201 70.2605026 18.4844743 63.9758197 16 66.3918197 24.8951201 75.0925027 42.2156863 58.1751694"></polygon><g id="分组-2" transform="translate(38.000000, 0.000000)" fill-rule="nonzero"><rect id="矩形" stroke="#F0B90B" stroke-width="4" fill="#FFFFFF" x="9.37453056" y="2" width="130.585183" height="85.1089109" rx="3"></rect><g id="分组" transform="translate(23.045408, 15.841584)" fill="#EFB80B"><use id="矩形" stroke="#F0B90B" mask="url(#mask-2)" stroke-width="2" fill-opacity="0.1" stroke-dasharray="3,3" ></use><rect id="矩形" fill-opacity="0.3" x="5.53089792" y="20.7920792" width="20.279959" height="3.96039604"></rect><rect id="矩形-copy-11" fill-opacity="0.3" x="5.53089792" y="36.6336634" width="35.0290201" height="3.96039604"></rect><rect id="矩形-copy-12" x="0" y="0" width="29.4981222" height="5.94059406"></rect><rect id="矩形-copy-7" fill-opacity="0.3" x="20.279959" y="28.7128713" width="39.6381017" height="3.96039604"></rect><rect id="矩形-copy-18" fill-opacity="0.3" x="34.1072038" y="44.5544554" width="34.1072038" height="3.96039604"></rect><rect id="矩形-copy-8" fill-opacity="0.3" x="72.8234892" y="28.7128713" width="24.8890406" height="3.96039604"></rect><rect id="矩形-copy-9" fill-opacity="0.3" x="61.7616934" y="28.7128713" width="8.29634688" height="3.96039604"></rect><rect id="矩形-copy-5" fill-opacity="0.3" x="45.1689997" y="20.7920792" width="17.5145101" height="3.96039604"></rect><rect id="矩形-copy-13" fill-opacity="0.3" x="43.325367" y="36.6336634" width="21.2017753" height="3.96039604"></rect><rect id="矩形-copy-6" fill-opacity="0.3" x="66.370775" y="20.7920792" width="12.9054285" height="3.96039604"></rect><rect id="矩形-copy-14" fill-opacity="0.3" x="66.370775" y="36.6336634" width="12.9054285" height="3.96039604"></rect><rect id="矩形-copy" fill-opacity="0.3" x="28.5763059" y="20.7920792" width="11.9836122" height="3.96039604"></rect><rect id="矩形-copy-15" fill-opacity="0.3" x="5.53089792" y="44.5544554" width="11.9836122" height="3.96039604"></rect><rect id="矩形-copy-17" fill-opacity="0.3" x="20.279959" y="44.5544554" width="11.9836122" height="3.96039604"></rect><rect id="矩形-copy-2" fill-opacity="0.3" x="5.53089792" y="28.7128713" width="11.9836122" height="3.96039604"></rect><rect id="矩形-copy-3" fill-opacity="0.3" x="82.0416524" y="20.7920792" width="14.7490611" height="3.96039604"></rect><rect id="矩形-copy-16" fill-opacity="0.3" x="82.9634688" y="36.6336634" width="14.7490611" height="3.96039604"></rect><rect id="矩形-copy-19" fill-opacity="0.3" x="70.9798566" y="44.5544554" width="14.7490611" height="3.96039604"></rect><rect id="矩形-copy-4" fill-opacity="0.3" x="88.4943667" y="44.5544554" width="9.2181632" height="3.96039604"></rect></g><path d="M149.334244,89.1089109 L149.334244,97 C149.334244,98.6568542 147.991098,100 146.334244,100 L3,100 C1.34314575,100 1.43505514e-12,98.6568542 1.43485224e-12,97 L1.43529633e-12,89.1089109 L149.334244,89.1089109 Z" id="矩形-copy-10" fill="#F9E9B4"></path><rect id="矩形" stroke="#F0B90B" stroke-width="6" fill="#FFFFFF" x="56.4653465" y="91.1188119" width="36.4035507" height="1"></rect></g></g><g id="分组-3" transform="translate(48.000000, 0.000000)" fill-rule="nonzero"><g id="分组-8" transform="translate(0.000000, 10.000000)" fill="url(#linearGradient-3)"><path d="M0.0394765126,51.6666667 C1.5943825,50.8986743 50.6545099,33.676452 147.219859,0 L180.903352,1.10714019 L133.175645,53.3571429 C42.8632935,52.9981511 -1.51542948,52.4346591 0.0394765126,51.6666667 Z" id="路径-2"></path></g><g id="分组-7" opacity="0.800000012" transform="translate(151.199637, 11.620415) rotate(-1.000000) translate(-151.199637, -11.620415) translate(144.199637, 0.120415)"><ellipse id="椭圆形" stroke="#848E9C" stroke-width="2" fill="#FFFFFF" transform="translate(6.821809, 11.398176) rotate(-1.000000) translate(-6.821809, -11.398176) " cx="6.82180851" cy="11.3981763" rx="6.57601674" ry="11.2728577"></ellipse><ellipse id="椭圆形" fill="#48515D" transform="translate(6.821809, 11.398176) rotate(-2.000000) translate(-6.821809, -11.398176) " cx="6.82180851" cy="11.3981763" rx="2.51982707" ry="4.25856274"></ellipse><ellipse id="椭圆形" fill="#FFF9F9" transform="translate(7.190555, 10.145629) rotate(2.000000) translate(-7.190555, -10.145629) " cx="7.19055492" cy="10.1456294" rx="1" ry="1.37777029"></ellipse></g><g id="分组-7-copy" opacity="0.800000012" transform="translate(166.000000, 0.000000)"><ellipse id="椭圆形" stroke="#848E9C" stroke-width="2" fill="#FFFFFF" transform="translate(7.610475, 12.000000) rotate(-4.000000) translate(-7.610475, -12.000000) " cx="7.61047463" cy="12" rx="6.39331825" ry="11.3623043"></ellipse><ellipse id="椭圆形" fill="#48515D" transform="translate(7.610475, 12.000000) rotate(-2.000000) translate(-7.610475, -12.000000) " cx="7.61047463" cy="12" rx="2.44876154" ry="4.29257864"></ellipse><ellipse id="椭圆形" fill="#FFF9F9" transform="translate(8.459769, 10.226794) rotate(2.000000) translate(-8.459769, -10.226794) " cx="8.4597691" cy="10.2267945" rx="1" ry="1.38877498"></ellipse></g></g></g></g></g>
          </svg>
        </Grid>
        <Grid item xs={ 12 } className={ classes.instruction }>
          <Typography>
            We are about to show your mnemonic phrase, please ensure that no one else is looking at your screen.
          </Typography>
        </Grid>
        <Grid item xs={ 12 } align='right' className={ classes.button }>
          <Button
            fullWidth={true}
            label={ "Continue" }
            disabled={ !accept }
            onClick={ this.onNext }
          />
        </Grid>
      </React.Fragment>
    )
  };

  renderPage2 = () => {
    const {
      classes
    } = this.props

    const {
      account,
      loading
    } = this.state

    return (
      <React.Fragment>
        <Grid item xs={ 12 }>
          <Typography className={ classes.step }>
            Step 3 of 4
          </Typography>
        </Grid>
        <Grid item xs={ 12 } className={ classes.instruction }>
          <Typography>
            Back up the mnemonic text below on paper and keep it somewhere secret and safe.
          </Typography>
        </Grid>
        <Grid item xs={ 12 }>
          <div className={ classes.bordered }>
            <Typography className={ classes.mnemonic }>
              { account.mnemonic }
            </Typography>
          </div>
        </Grid>
        <Grid item xs={ 12 } align='right' className={ classes.button }>
          <Button
            fullWidth={true}
            label={ "Continue" }
            disabled={ loading }
            onClick={ this.onNext }
          />
        </Grid>
      </React.Fragment>
    )
  };

  renderPage3 = () => {
    const {
      classes
    } = this.props

    const {
      enteredWords,
      wordError,
      loading,
      validateEnabled
    } = this.state

    return (
      <React.Fragment>
        <Grid item xs={ 12 }>
          <Typography className={ classes.step }>
            Step 4 of 4
          </Typography>
        </Grid>
        <Grid item xs={ 12 } className={ classes.instruction }>
          <Typography>
            Please select the Mnemonic Phrase in the correct order to ensure that your copy is correct.
          </Typography>
        </Grid>
        <Grid item xs={ 12 }>
          <div className={ classes.bordered }>
            <Typography className={ classes.mnemonic }>
              { enteredWords.join(" ") }
            </Typography>
          </div>
        </Grid>
        <Grid item xs={ 12 }>
          <div className={ wordError ? classes.borderedError : classes.bordered }>
            { this.renderWords() }
          </div>
        </Grid>
        <Grid item xs={ 12 } align='right' className={ classes.button }>
          <Button
            fullWidth={true}
            label={ "Validate" }
            disabled={ loading || !validateEnabled }
            onClick={ this.onNext }
          />
        </Grid>
      </React.Fragment>
    )
  };

  renderPage4 = () => {
    const {
      classes,
      onBack
    } = this.props

    const {
      account
    } = this.state

    return (
      <React.Fragment>
        <Grid item xs={ 12 }>
          <Typography className={ classes.step }>
            Completed
          </Typography>
        </Grid>
        <Grid item xs={ 12 } className={ classes.instruction }>
          <Typography>
            Your account number is:
          </Typography>
          <Typography className={ classes.accountAddress } id={ 'accountAddress' }>
            { account.address }
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
        </Grid>
        <Grid item xs={ 12 } align='right' className={ classes.button }>
          <Button
            fullWidth={true}
            label={ "Done" }
            onClick={ onBack }
          />
        </Grid>
      </React.Fragment>
    )
  };

  renderWords = () => {
    const {
      classes
    } = this.props

    return this.state.mnemonicWords.map((word) => {
      return (
        <Paper className={ classes.wordPaper } onClick={ (e) => { this.addWord(word) } }>
          <Typography>
            { word }
          </Typography>
        </Paper>
      )
    })
  };

  addWord = (word) => {
    let {
      mnemonicWords,
      enteredWords,
      account
    } = this.state

    const goal = account.mnemonic

    var tmpMnemonicWords = Array.from(mnemonicWords);

    for(let i = 0; i < tmpMnemonicWords.length; i++) {
      if(tmpMnemonicWords[i] === word) {
        tmpMnemonicWords.splice(i, 1);
        break;
      }
    }

    enteredWords.push(word)

    //validate the click
    const joinedWords = enteredWords.join(' ')
    if(joinedWords === goal.substring(0, joinedWords.length)) {
      this.setState({
        mnemonicWords: tmpMnemonicWords,
        enteredWords,
        wordError: false
      })
    } else {
      enteredWords.pop()
      this.setState({
        enteredWords,
        wordError: true
      })
    }

    if(joinedWords === goal) {
      this.setState({
        validateEnabled: true
      })
    }
  };

  onCopy = () => {
    var elm = document.getElementById("accountAddress");
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


  render() {
    const {
      classes
    } = this.props

    const {
      page,
      loading,
    } = this.state

    return (
      <Grid container className={ classes.root }>
        { loading && <PageLoader /> }
        <Grid item xs={ 12 }>
          <Typography className={ classes.heading }>
            Create New Wallet
          </Typography>
        </Grid>
        { page === 0 && this.renderPage0() }
        { page === 1 && this.renderPage1() }
        { page === 2 && this.renderPage2() }
        { page === 3 && this.renderPage3() }
        { page === 4 && this.renderPage4() }
      </Grid>
    )
  };
}

Swap.propTypes = {
  classes: PropTypes.object.isRequired
};

export default withStyles(styles)(Swap);
