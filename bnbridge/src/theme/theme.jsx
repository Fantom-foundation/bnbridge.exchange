export const colors = {
  white: "#fff",
  black: '#000',
  yellow: "#f5bc00",
  gray: "#e1e1e1",
  lightGray: "#fafafa",
  lightBlack: "#6a6a6a"
};

const bnbridgeTheme =  {
  typography: {
    fontFamily: ['Lato', 'Roboto', 'Open Sans', 'sans-serif'].join(","),
    lineHeight: 1.45,
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
    MuiGrid: {
      paddingLeft: '10px',
    },
    MuiOutlinedInput: {
      input: {
        padding: '14px'
      }
    },
    MuiPrivateNotchedOutline: {
      root: {
        borderRadius: '0px'
      }
    },
    MuiButton: {
      label: {
        fontSize: '0.7rem'
      }
    },
    MuiTab: {
      label: {
        fontWeight: 700,
      },
      selected: {
        color: colors.yellow
      },
      root: {
        borderBottom: "1px solid #dee2e6!important"
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
