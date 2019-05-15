export const colors = {
  white: "#fff",
  black: '#000',
  yellow: "#f5bc00",
  gray: "#e1e1e1",
  lightGray: "#fafafa",
  lightBlack: "#141414"
};

const bnbridgeTheme =  {
  typography: {
    fontFamily: ['Roboto', 'sans-serif'].join(","),
    useNextVariants: true,
    h6: {
      fontSize: '0.8rem',
      fontWeight: 600,
      marginBottom: '.5rem'
    }
  },
  type: 'light',
  overrides: {
    MuiInputBase: {
      root: {
        fontSize: '13px',
        background: colors.lightGray
      }
    },
    MuiOutlinedInput: {
      input: {
        padding: '14px'
      }
    },
    MuiPrivateNotchedOutline: {
      root: {
        borderRadius: '3px'
      }
    },
    MuiButton: {
      label: {
        fontSize: '0.7rem'
      }
    },
    MuiTab: {
      textColorPrimary: {
        color: colors.yellow,
        "&$selected": {
          color: colors.yellow
        }
      }
    },
  },
  palette: {
    primary: {
      main: colors.yellow
    },
    secondary: {
      main: colors.lightBlack
    },
    background:{
      paper: colors.white,
      default: colors.white
    },
    text: {
      primary: colors.lightBlack,
      secondary: colors.yellow
    }
  }
};

export default bnbridgeTheme;
