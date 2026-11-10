import { DateTime, Duration } from "luxon";
import { customDateFormatParsers } from "../constants/constants";

export const isValidNumber = (value) => !Number.isNaN(Number.parseFloat(value));

export const parseDateString = (str) => {
  let result;
  // Custom parser is needed for non ISO 8601 formats
  const customParser = customDateFormatParsers.find((parser) => parser.regex.test(str));

  if (customParser) {
    result = customParser.parse(str);
  } else if (str.startsWith("P")) {
    result = Duration.fromISO(str);
  } else {
    result = DateTime.fromISO(str);
  }

  if (result.isValid) return result;
  return null;
};
