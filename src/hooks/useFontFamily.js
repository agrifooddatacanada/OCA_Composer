import { useContext } from "react";
import { Context } from "../App";

const DEFAULT_FONT_FAMILY = "Roboto, sans-serif";

export default function useFontFamily() {
  const { currentTheme } = useContext(Context);
  return currentTheme?.typography?.fontFamily ?? DEFAULT_FONT_FAMILY;
}
