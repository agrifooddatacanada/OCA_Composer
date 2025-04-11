import { CustomPalette } from "./customPalette";

// eslint-disable-next-line import/prefer-default-export
export const themes = {
  default: {
    primaryColor: CustomPalette.WHITE,
    secondaryColor: "#AAAAAA",

    logos: {
      agriFoodCanada_white_logo: {
        // eslint-disable-next-line global-require
        url: require("../assets/agri-logo-white.png"),
        website: "https://agrifooddatacanada.ca/",
        alt: "Agri Logo_white",
        style: { width: "200px", cursor: "pointer" }
      },

      agriFoodCanada_logo: {
        // eslint-disable-next-line global-require
        url: require("../assets/agri-logo-white.png"),
        website: "https://agrifooddatacanada.ca/",
        alt: "Agri Logo",
        style: { width: "200px", cursor: "pointer" }
      },

      canadaFirst_logo: {
        // eslint-disable-next-line global-require
        url: require("../assets/research-excellent-fund.png"),
        alt: "Canada First Logo",
        style: { height: "120px" }
      },

      omafa_ontario_logo: {
        // eslint-disable-next-line global-require
        url: require("../assets/OMAFA.PNG"),
        website:
          "https://www.ontario.ca/page/ministry-agriculture-food-and-agribusiness-and-ministry-rural-affairs",
        alt: "OMAFA Logo",
        style: { height: "120px", marginLeft: "1rem" }
      }
    },

    typography: {
      fontFamily: "Roboto, sans-serif"
    },

    buttonStyles: {
      light: CustomPalette.WHITE,
      main: CustomPalette.PRIMARY,
      dark: CustomPalette.SECONDARY,
      contrastText: CustomPalette.WHITE
    }
  },

  BED: {
    // still in progress

    // primaryColor: "#121212",
    // secondaryColor: "#343434",

    typography: {
      fontFamily: "Helvetica, sans-serif"
    },

    logos: {
      UofG_Cornerstone: {
        // eslint-disable-next-line global-require
        url: require("../assets/UofG_Cornerstone_wTagline_blk_rgb.png"),
        alt: "University of Guelph Logo",
        style: { width: "200px", height: "100px", align: "left" }
      },
      OMAFA: {
        // eslint-disable-next-line global-require
        url: require("../assets/OMAFA.PNG"),
        alt: "OMAFA Ontario Logo",
        style: { width: "200px", height: "100px", align: "right" }
      }
    },

    buttonStyles: {
      light: "#dc3545",
      main: "#dc3545",
      dark: "#343434",
      contrastText: CustomPalette.WHITE
    }
  }
};
