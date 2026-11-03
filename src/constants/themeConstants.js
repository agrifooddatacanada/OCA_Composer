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
        alt: "Agri-food Data Canada",
        style: { width: "200px", cursor: "pointer" }
      },
      // logo for the landing page header
      homeNavLogo: {
        // eslint-disable-next-line global-require
        url: require("../assets/agri-logo-white.png"),
        website: "https://agrifooddatacanada.ca/",
        alt: "Agri-food Data Canada",
        style: { width: "200px", cursor: "pointer" }
      },

      // Funder acknowledgement logos shown in the footer's "Supported by"
      // section (see issue #763).
      supportedByLogoCFREF: {
        // eslint-disable-next-line global-require
        url: require("../assets/research-excellent-fund.png"),
        website: "https://schemas.semanticengine.org/",
        alt: "Canada First Research Excellence Fund",
        style: { height: "62px" }
      },
      supportedByLogoGenomeCanada: {
        // eslint-disable-next-line global-require
        url: require("../assets/genome-canada-logo.svg").default,
        website: "https://genomecanada.ca/",
        alt: "Genome Canada",
        style: { height: "65px" }
      },
      supportedByLogoGenomeBC: {
        // eslint-disable-next-line global-require
        url: require("../assets/genome-bc-logo.png"),
        website: "https://www.genomebc.ca/",
        alt: "Genome BC",
        style: { height: "62px" }
      },
      supportedByLogoOntarioGenomics: {
        // eslint-disable-next-line global-require
        url: require("../assets/ontario-genomics-logo.png"),
        website: "https://www.ontariogenomics.ca/",
        alt: "Ontario Genomics",
        style: { height: "60px" }
      },
      supportedByLogoGenomeQuebec: {
        // eslint-disable-next-line global-require
        url: require("../assets/genome-quebec-logo.svg").default,
        website: "https://genomequebec.com/",
        alt: "Genome Quebec",
        style: { height: "65px" }
      },
      supportedByLogoGovernmentOfOntario: {
        // eslint-disable-next-line global-require
        url: require("../assets/government-of-ontario-logo.png"),
        website: "https://www.ontario.ca/",
        alt: "Government of Ontario",
        // Solid black wordmark reads much heavier than the others at a
        // matched height, and its wide aspect ratio (~3.9:1) makes it very
        // wide too - scaled down on both axes to balance visually.
        style: { height: "42px" }
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
