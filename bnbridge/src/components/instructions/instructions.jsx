import React from 'react'
import PropTypes from 'prop-types';
import { withStyles } from '@material-ui/core/styles';
import {
  Typography,
  Grid
} from '@material-ui/core';
import { colors } from '../../theme'

const styles = theme => ({
  root: {
    width: '400px'
  },
  header: {
    fontSize: '1.75rem',
    color: colors.yellow
  },
  action: {
    fontSize: '1rem',
    color: colors.lightBlack,
    display: 'inline-block'
  }
});

function Header(props) {
  const {
    classes
  } = props;

  return (
    <Grid
      container
      justify="flex-start"
      alignItems="flex-end">
      <Grid item xs={12} align='left'>
        <div className={ classes.root } >
          <Typography className={ classes.header }>With bnbridge you can:</Typography>
          <li><Typography className={ classes.action }>Swap ERC20 to BEP2 compatible tokens</Typography></li>
          <li><Typography className={ classes.action }>Launch BEP2 assets</Typography></li>
          <li><Typography className={ classes.action }>List tokens on Binance DEX</Typography></li>
        </div>
      </Grid>
    </Grid>
  )
}

Header.propTypes = {
  classes: PropTypes.object.isRequired
};

export default withStyles(styles)(Header);
