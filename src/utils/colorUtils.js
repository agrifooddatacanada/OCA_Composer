/**
 * This file contains utility functions for color manipulation.
 * I created this file for the lightenColor function which I use for to get a lighter shade of any hex color for the hover state of buttons.
 * @file colorUtils.js
 * @author [Ali Asjad]
 * @version 1.0.0
 * @since 2025-06-16
 */

/**
 * Converts a hex color to HSL
 * @param {string} hex - Hex color code (e.g. "#94002a")
 * @returns {Object} HSL values {h, s, l}
 */
const hexToHSL = (hex) => {
  // Remove the hash if it exists
  hex = hex.replace("#", "");

  // Convert hex to RGB
  const r = parseInt(hex.substring(0, 2), 16) / 255;
  const g = parseInt(hex.substring(2, 4), 16) / 255;
  const b = parseInt(hex.substring(4, 6), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h;
  let s;
  const l = (max + min) / 2;

  if (max === min) {
    h = 0;
    s = 0; // achromatic
  } else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      case b:
        h = (r - g) / d + 4;
        break;
      default:
        break;
    }
    h /= 6;
  }

  return { h: h * 360, s: s * 100, l: l * 100 };
};

/**
 * Converts HSL to hex color
 * @param {number} h - Hue (0-360)
 * @param {number} s - Saturation (0-100)
 * @param {number} l - Lightness (0-100)
 * @returns {string} Hex color code
 */
const HSLToHex = (h, s, l) => {
  s /= 100;
  l /= 100;

  const a = s * Math.min(l, 1 - l);
  const f = (n) => {
    const k = (n + h / 30) % 12;
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color)
      .toString(16)
      .padStart(2, "0");
  };

  return `#${f(0)}${f(8)}${f(4)}`;
};

/**
 * Lightens a color by a specified percentage
 * @param {string} hex - Hex color code (e.g. "#94002a")
 * @param {number} percent - Percentage to lighten (0-100)
 * @returns {string} Lightened hex color code
 */
// eslint-disable-next-line import/prefer-default-export
export const lightenColor = (hex, percent = 20) => {
  const hsl = hexToHSL(hex);
  // Increase lightness while keeping hue and saturation
  hsl.l = Math.min(100, hsl.l + percent);
  return HSLToHex(hsl.h, hsl.s, hsl.l);
};
