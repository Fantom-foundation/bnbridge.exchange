import React from 'react'
import PropTypes from 'prop-types';
import { withStyles } from '@material-ui/core/styles';
import {
  FormControl,
  Checkbox
} from '@material-ui/core';
import StyledLabel from './label.jsx';

const styles = theme => ({
  root: {
    verticalAlign: 'middle',
    minWidth: '200px',
    display: 'inline-block',
    marginTop: '12px',
    marginBottom: '12px'
  }
});

function StyledCheckbox(props) {
  const {
    classes,
    helpertext,
    id,
    label,
    fullWidth,
    value,
    onChange,
    error,
    disabled
  } = props;

  return (
    <FormControl className={classes.root} variant="outlined" fullWidth={fullWidth} error={error}>
      <Checkbox
        id={ id }
        helpertext={ helpertext }
        checked={ value }
        onChange={ onChange }
        value={ id }
        disabled={ disabled }
      />
      <StyledLabel label={ label } />
    </FormControl>
  )
}

StyledCheckbox.propTypes = {
  classes: PropTypes.object.isRequired,
  label: PropTypes.string.isRequired,
  helpertext: PropTypes.string,
  id: PropTypes.string,
  defaultValue: PropTypes.string,
  fullWidth: PropTypes.bool,
  disabled: PropTypes.bool,
  value: PropTypes.string,
  onChange: PropTypes.func,
};

export default withStyles(styles)(StyledCheckbox);
