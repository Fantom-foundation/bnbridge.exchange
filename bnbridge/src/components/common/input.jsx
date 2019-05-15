import React from 'react'
import PropTypes from 'prop-types';
import { withStyles } from '@material-ui/core/styles';
import {
  FormControl,
  OutlinedInput
} from '@material-ui/core';
import StyledLabel from './label.jsx';

const styles = theme => ({
  root: {
    verticalAlign: 'bottom',
    minWidth: '200px',
    display: 'inline-block',
    marginTop: '12px',
    marginBottom: '12px'
  }
});

function StyledInput(props) {
  const {
    classes,
    helpertext,
    placeholder,
    id,
    defaultValue,
    label,
    fullWidth,
    value,
    onChange,
    error
  } = props;

  return (
    <FormControl className={classes.root} variant="outlined" fullWidth={fullWidth} error={error}>
      <StyledLabel label={ label } />
      <OutlinedInput
        id={ id }
        placeholder={ placeholder }
        helpertext={ helpertext }
        fullWidth={ fullWidth }
        defaultValue={ defaultValue }
        labelWidth={ 0 }
        value={ value }
        onChange={ onChange }
      />
    </FormControl>
  )
}

StyledInput.propTypes = {
  classes: PropTypes.object.isRequired,
  label: PropTypes.string.isRequired,
  helpertext: PropTypes.string,
  placeholder: PropTypes.string,
  id: PropTypes.string,
  defaultValue: PropTypes.string,
  fullWidth: PropTypes.bool,
  value: PropTypes.string,
  onChange: PropTypes.func,
};

export default withStyles(styles)(StyledInput);
