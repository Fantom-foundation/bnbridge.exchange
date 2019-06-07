import React from 'react'
import PropTypes from 'prop-types';
import { withStyles } from '@material-ui/core/styles';
import {
  FormControl,
  OutlinedInput,
  FormHelperText,
  InputAdornment,
  IconButton
} from '@material-ui/core';
import StyledLabel from './label.jsx';


import Visibility from '@material-ui/icons/Visibility';
import VisibilityOff from '@material-ui/icons/VisibilityOff';

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
    error,
    disabled,
    password
  } = props;


  const [values, setValues] = React.useState({
    amount: '',
    password: '',
    weight: '',
    weightRange: '',
    showPassword: false,
  });

  const handleClickShowPassword = () => {
    setValues({ ...values, showPassword: !values.showPassword });
  };

  const endAdornment = password ? (
    <InputAdornment position="end">
      <IconButton aria-label="Toggle password visibility" onClick={handleClickShowPassword}>
        {values.showPassword ? <Visibility /> : <VisibilityOff />}
      </IconButton>
    </InputAdornment>) :  null


  return (
    <FormControl className={classes.root} variant="outlined" fullWidth={fullWidth} error={error}>
      <StyledLabel label={ label } />
      <OutlinedInput
        id={ id }
        placeholder={ placeholder }
        fullWidth={ fullWidth }
        defaultValue={ defaultValue }
        labelWidth={ 0 }
        value={ value }
        onChange={ onChange }
        disabled={ disabled }
        type={ password ? values.showPassword ? 'text' : 'password' : "text" }
        password={ password }
        endAdornment={ endAdornment }
      />
    { helpertext && <FormHelperText>{helpertext}</FormHelperText> }
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
  disabled: PropTypes.bool,
  value: PropTypes.string,
  onChange: PropTypes.func,
  password: PropTypes.bool
};

export default withStyles(styles)(StyledInput);
