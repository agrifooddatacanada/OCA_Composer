import { themes } from "../constants/themeConstants";

/**
 * Determines which theme to use based on the current domain
 * @returns {string} The name of the theme to use
 */
export const detectTheme = () => {
  //   const hostname = window.location.hostname;
  //   const port = window.location.port;
  const currentDomain = document.referrer;
  // Find the first theme that includes the current domain
  let themeName = null;
  for (const [name, theme] of Object.entries(themes)) {
    if (theme.domains.includes(currentDomain)) {
      themeName = name;
      break;
    }
  }
  return themeName || "default";
};

/**
 * Gets the theme object based on the current domain
 * @returns {Object} The theme object to use
 */
export const getCurrentTheme = () => {
  const themeName = detectTheme();
  return themes[themeName] || themes.default;
};
