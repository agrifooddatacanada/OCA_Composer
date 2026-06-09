import { useContext } from "react";
import { Context } from "../App";
import { CustomPalette } from "../constants/customPalette";

export default function usePrimaryColor() {
  const { currentTheme } = useContext(Context);
  return currentTheme?.primaryColor ?? CustomPalette.PRIMARY;
}
