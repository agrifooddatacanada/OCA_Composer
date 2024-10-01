
import { CustomPalette } from './customPalette';

export const themes = {

  default: {
    primaryColor: CustomPalette.WHITE,
    secondaryColor: "#AAAAAA",
    
    logos: {
      agriFoodCanada_white_logo: {
        url: '../assets/agri-logo-white.png', 
        website: "https://agrifooddatacanada.ca/",
        alt: "Agri Logo_white",
        style: { width: '200px', cursor: "pointer" }
      },
      agriFoodCanada_logo: {
        url: '../assets/agri-logo-white.png', 
        website: "https://agrifooddatacanada.ca/",
        alt: "Agri Logo",
        style: { width: '200px', cursor: "pointer" }
      },
      canadaFirst_logo: {
        url: '../assets/research-excellent-fund.png', 
        alt: "Canada First Logo",
        style: { height: '120px' }
      },
      omafa_ontario_logo: {
        url: "/path/to/default_logo3.png",
        website: "https://www.ontario.ca/page/ministry-agriculture-food-and-agribusiness-and-ministry-rural-affairs",
        alt: "OMAFA Logo",
        style: { height: '120px', marginLeft: '1rem' }
      },
    },
    
    typography: {
      fontFamily: "Roboto, sans-serif",
    },
    buttonStyles: {
      light: CustomPalette.WHITE,
      main: CustomPalette.PRIMARY,
      dark: CustomPalette.SECONDARY,
      contrastText: CustomPalette.WHITE,
    },
  },

  BED: { //still in progress
    primaryColor: "#121212",
    secondaryColor: "#343434",
    typography: {
      fontFamily: "Helvetica, sans-serif",
    },
    buttonStyles: {
      light: "#121212",
      main: "#121212",
      dark: "#343434",
      contrastText: CustomPalette.WHITE,
    },
  },

};
