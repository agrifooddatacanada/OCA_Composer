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
      supportedByLogoGenomeCanada: {
        // eslint-disable-next-line global-require
        url: require("../assets/genome-canada-logo.svg").default,
        website: "https://genomecanada.ca/",
        alt: "Genome Canada",
        // Taller than the others: its helix icon reads much smaller than
        // Genome BC/Quebec/Ontario Genomics' at the same height, since it
        // takes up less of this particular asset's canvas - bumped up so
        // the icon marks end up visually the same size across all four.
        style: { height: "96.2px" },
        // This asset has ~16% empty space below the icon (measured by pixel
        // bbox), so bottom-aligning the image leaves the icon itself
        // sitting well above Genome Quebec/Ontario Genomics' (whose icons
        // are flush to their own image bottom, 0% gap) - pull it down.
        marginBottomPx: -20.02
      },
      supportedByLogoGenomeBC: {
        // eslint-disable-next-line global-require
        url: require("../assets/genome-bc-logo.png"),
        website: "https://www.genomebc.ca/",
        alt: "Genome BC",
        // Smaller bump than Genome Canada - its icon was only slightly small.
        style: { height: "80px" },
        // This asset has a caption line ("Genomics positively impacts life...")
        // below the icon+wordmark row, spanning the full width - a naive
        // column-restricted bbox measurement picked up the caption text and
        // undercounted the gap. Measured by row-gap instead: icon ends at
        // y=73, caption runs y=81-88, true image height 91 - ~18.7% gap below
        // the icon, close to Genome Canada's.
        marginBottomPx: -18.1
      },
      supportedByLogoGenomeQuebec: {
        // eslint-disable-next-line global-require
        url: require("../assets/genome-quebec-logo.svg").default,
        website: "https://genomequebec.com/",
        alt: "Genome Quebec",
        style: { height: "65px" },
        marginBottomPx: -3.2
      },
      supportedByLogoOntarioGenomics: {
        // eslint-disable-next-line global-require
        url: require("../assets/ontario-genomics-logo.png"),
        website: "https://www.ontariogenomics.ca/",
        alt: "Ontario Genomics",
        style: { height: "60px" }
      },
      supportedByLogoGovernmentOfOntario: {
        // eslint-disable-next-line global-require
        url: require("../assets/government-of-ontario-logo.png"),
        website: "https://www.ontario.ca/",
        alt: "Government of Ontario",
        // Solid black wordmark reads much heavier than the others at a
        // matched height, and its wide aspect ratio (~3.9:1) makes it very
        // wide too - scaled down on both axes to balance visually.
        style: { height: "42px" },
        // Short and wide, so bottom-aligning it like the rest leaves it
        // looking low against the taller logos - nudge it up a bit. True
        // center (vs the row's tallest logo) overshot and looked too high.
        marginBottomPx: 10
      },
      supportedByLogoCFREF: {
        // eslint-disable-next-line global-require
        url: require("../assets/research-excellent-fund.png"),
        website: "https://schemas.semanticengine.org/",
        alt: "Canada First Research Excellence Fund",
        style: { height: "62px" },
        marginBottomPx: -10
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
