import React from 'react'
import PropTypes from 'prop-types';
import { withStyles } from '@material-ui/core/styles';
import {
  Typography
} from '@material-ui/core';
import { colors } from '../../theme'

const styles = theme => ({
  root: {
    verticalAlign: 'top',
    background: colors.lightGray,
    width: '100%',
    height: '50px',
    padding: '.5rem 1rem'
  },
  label: {
    paddingTop: '.3125rem',
    paddingBottom: '.3125rem',
    marginRight: '1rem',
    fontSize: '1.25rem',
  }
});

function Header(props) {
  const {
    classes
  } = props;

  return (
    <div className={ classes.root }>
      <Typography className={ classes.label }>bnbridge</Typography>
    </div>
  )
}

Header.propTypes = {
  classes: PropTypes.object.isRequired
};

export default withStyles(styles)(Header);
