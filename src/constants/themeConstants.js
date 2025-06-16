import { CustomPalette } from "./customPalette";
import { lightenColor } from "../utils/colorUtils";

// eslint-disable-next-line import/prefer-default-export
export const themes = {
  default: {
    domains: ['semanticengine.org', 'agrifooddatacanada.ca', 'localhost:3000'],
    primaryColor: "#94002a",
    secondaryColor: "#000",

    logos: {
      primaryLogo: {
        // eslint-disable-next-line global-require
        url: require("../assets/agri-logo.png"),
        website: "https://agrifooddatacanada.ca/",
        alt: "Agri Logo_white",
        style: { width: "200px", cursor: "pointer" }
      },

      supportedByLogo: {
        // eslint-disable-next-line global-require
        url: require("../assets/research-excellent-fund.png"),
        alt: "Canada First Logo",
        style: { height: "120px" }
      }
    },

    typography: {
      fontFamily: 'Courier New'
    },

    buttonStyles: {
      primary: "#94002a",
      secondary: "#ce1141",
      contrastText: CustomPalette.WHITE
    }
  },

  Genovis: {
    domains: ['http://localhost:5173/'],
    primaryColor: "#26557b",
    secondaryColor: "#8cc0e6",

    logos: {
      primaryLogo: {
        url: require("../assets/genovisLogo.png"),
        website: "http://localhost:5173/",
        alt: "Genovis Logo",
        style: { height: "120px", marginLeft: "1rem" }
      },

      supportedByLogo1: {
        url: require("../assets/genovisLogo.png"),
        website: "http://localhost:5173/",
        alt: "Genovis Logo",
        style: { height: "120px", marginLeft: "1rem" }
      },
      supportedByLogo2: {
        url: require("../assets/OMAFA.PNG"),
        website: "https://www.ontario.ca/page/ministry-agriculture-food-and-agribusiness-and-ministry-rural-affairs",
        alt: "OMAFA Logo",
        style: { height: "120px", marginLeft: "1rem" }
      }
    },

    typography: {
      fontFamily: "Roboto, sans-serif"
    },

    buttonStyles: {
      primary: "#26557b",
      secondary: lightenColor('#26557b', 20),
      contrastText: CustomPalette.WHITE
    }
  },

  BED: {
    domains: ['bed.example.com'],
    // still in progress

    // primaryColor: "#121212",
    // secondaryColor: "#343434",

    typography: {
      fontFamily: "Helvetica, sans-serif"
    },

    logos: {
      primaryLogo: {
        // eslint-disable-next-line global-require
        url: require("../assets/UofG_Cornerstone_wTagline_blk_rgb.png"),
        website: "https://www.uoguelph.ca/",
        alt: "University of Guelph Logo",
        style: { width: "200px", height: "100px", align: "left" }
      },
      secondaryLogo: {
        // eslint-disable-next-line global-require
        url: require("../assets/OMAFA.PNG"),
        website: "https://www.ontario.ca/page/ministry-agriculture-food-and-agribusiness-and-ministry-rural-affairs",
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
