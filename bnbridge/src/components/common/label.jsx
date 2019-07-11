import React from 'react'
import PropTypes from 'prop-types';
import { withStyles } from '@material-ui/core/styles';
import {
  Typography
} from '@material-ui/core';

const styles = theme => ({
  inline: {
    verticalAlign: 'middle',
    display: 'inline-block',
    width: 'calc(100% - 50px)'
  }
});

function Label(props) {
  const {
    label,
    classes,
    overrideStyle
  } = props;

  return (
    <Typography variant="h6" gutterBottom className={ classes.inline } style={ overrideStyle }>
      {label}
    </Typography>
  )
}

Label.propTypes = {
  classes: PropTypes.object.isRequired,
  label: PropTypes.string.isRequired,
  overrideStyle: PropTypes.object
};

export default withStyles(styles)(Label);
