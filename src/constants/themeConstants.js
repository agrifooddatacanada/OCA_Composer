import { CustomPalette } from "./customPalette";

// eslint-disable-next-line import/prefer-default-export
export const themes = {
  default: {
    domains: ["semanticengine.org", "agrifooddatacanada.ca", "localhost:3000"],
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
      fontFamily: "Roboto, sans-serif"
    },

    buttonStyles: {
      primary: "#94002a",
      secondary: "#ce1141",
      contrastText: CustomPalette.WHITE
    }
  }
};
