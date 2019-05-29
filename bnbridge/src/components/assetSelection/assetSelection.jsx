import React, { Component } from "react";
import PropTypes from 'prop-types';
import { withStyles } from '@material-ui/core/styles';
import {
  Grid
} from '@material-ui/core'

import Select from '../common/select';
import Button from '../common/button';

import {
  TOKENS_UPDATED,
  GET_TOKENS
} from '../../constants'

import Store from "../../stores";
const dispatcher = Store.dispatcher
const emitter = Store.emitter
const store = Store.store

const styles = theme => ({
  root: {
    width: '400px'
  },
  container: {
    display: 'flex',
    alignItems: 'flex-end'
  }
});


class AssetSelection extends Component {
  state = {
    tokens: null,
    tokenOptions: []
  };

  componentWillMount() {
    emitter.on(TOKENS_UPDATED, this.tokensUpdated);
    dispatcher.dispatch({type: GET_TOKENS, content: {} })
  };

  componentWillUnmount() {
    emitter.removeListener(TOKENS_UPDATED, this.tokensUpdated);
  };

  tokensUpdated = () => {
    const tokens = store.getStore('tokens')
    const tokenOptions = tokens.map((token) => {
      return {
        value: token.uuid,
        description: token.name + " ("+token.symbol+")"
      }
    })

    this.setState({
      tokens: tokens,
      tokenOptions: tokenOptions
    })
  };

  onSelectChange = (event) => {
    let val = []
    val[event.target.id] = event.target.value
    this.setState(val)

    if(event.target.id === 'token') {
      this.props.onTokenSelected(event.target.value)
    }
  };

  render() {
    const {
      classes,
      onIssue,
      disabled
    } = this.props

    const {
      tokenOptions,
      token,
      tokenError
    } = this.state

    return (
      <Grid container className={ classes.root }>
        <Grid item xs={ 9 }>
          <Select
            id="token"
            fullWidth={ true }
            label="Binance Chain Token"
            placeholder="Select Token"
            options={ tokenOptions }
            value={ token }
            error={ tokenError }
            handleChange={ this.onSelectChange }
            disabled={ disabled }
          />
        </Grid>
        <Grid item xs={ 3 } className={ classes.container }>
          <Button
            label="Issue"
            disabled={ disabled }
            onClick={ onIssue }
          />
        </Grid>
      </Grid>
    )
  }
}

AssetSelection.propTypes = {
  classes: PropTypes.object.isRequired
};

export default withStyles(styles)(AssetSelection);
