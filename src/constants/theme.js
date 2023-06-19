import { createTheme } from "@mui/material/styles";
import { CustomPalette } from "./customPalette";

//When updating button colors, use customeTheme colors instead of customPalette

const customTheme = {
  status: {
    danger: "#e53e3e",
  },
  palette: {
    button: {
      light: CustomPalette.DARK,
      main: CustomPalette.PRIMARY,
      dark: CustomPalette.SECONDARY,
      contrastText: CustomPalette.WHITE,
      // light: CustomPalette.BLUE_200,
      // main: CustomPalette.PRIMARY,
      // dark: CustomPalette.BLUE_900,
      // contrastText: CustomPalette.WHITE,
    },
    navButton: {
      light: CustomPalette.DARK,
      main: CustomPalette.PRIMARY,
      dark: CustomPalette.SECONDARY,
      contrastText: CustomPalette.WHITE,
      // light: CustomPalette.PRIMARY,
      // main: CustomPalette.BLUE_300,
      // dark: CustomPalette.BLUE_900,
      // contrastText: CustomPalette.WHITE,
    },
  },
  typography: {
    fontFamily: ["Roboto", "sans-serif"].join(","),
  },
};

export const CustomTheme = createTheme(customTheme);
