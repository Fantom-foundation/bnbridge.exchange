import React from 'react'
import PropTypes from 'prop-types';
import { withStyles } from '@material-ui/core/styles';
import {
  Snackbar,
  IconButton
} from '@material-ui/core';
import CloseIcon from '@material-ui/icons/Close';

const styles = theme => ({

});

function ErrorSnackbar(props) {

  const {
    open,
    handleClose,
    error
  } = props

  return (
    <Snackbar
      anchorOrigin={{
        vertical: 'bottom',
        horizontal: 'left',
      }}
      open={ open }
      autoHideDuration={6000}
      onClose={ handleClose }
      ContentProps={{
        'aria-describedby': 'message-id',
      }}
      message={<span id="message-id">{ error.toString() }</span>}
      action={[
        <IconButton
          key="close"
          aria-label="Close"
          color="inherit"
          onClick={ handleClose }
        >
          <CloseIcon />
        </IconButton>
      ]}
    />
  )
}

ErrorSnackbar.propTypes = {
  classes: PropTypes.object.isRequired
};

export default withStyles(styles)(ErrorSnackbar);
