import OCADataSetErr from "./utils/Err";
import { matchFormat, matchCharacterEncoding } from "./utils/matchRules";

// The version number of the OCA Technical Specification which this script is
// developed for. See https://oca.colossi.network/specification/
const OCA_VERSION = "1.0";

// Names of OCA bundle dictionary keys.
const CB_KEY = "capture_base";
const TYPE_KEY = "type";
const ATTR_KEY = "attributes";
const FORMAT_KEY = "format";
const ATTR_FORMAT_KEY = "attribute_formats";
const CONF_KEY = "conformance";
const ATTR_CONF_KEY = "attribute_conformance";
const EC_KEY = "entry_code";
const ATTR_EC_KEY = "attribute_entry_codes";
const CHE_KEY = "character_encoding";
const ATTR_CHE_KEY = "attribute_character_encoding";
const DEFAULT_ATTR_CHE_KEY = "default_character_encoding";
const DEFAULT_ENCODING = "utf-8";
const FLAG_KEY = "flagged_attributes";
const OVERLAYS_KEY = "overlays";

// Error messages. For text notices only.
const ATTR_UNMATCH_MSG =
  "Unmatched attribute (attribute not found in the OCA Bundle).";
const ATTR_MISSING_MSG =
  "Missing attribute (attribute not found in the data set).";
const MISSING_MSG =
  "Missing an entry for a mandatory attribute (check for other missing entries before continuing).";
const NOT_AN_ARRAY_MSG = "Valid array required.";
const FORMAT_ERR_MSG = "Format mismatch.";
// const EC_FORMAT_ERR_MSG = 'Entry code format mismatch (manually fix the attribute format).';
const EC_ERR_MSG = "One of the entry codes is required.";
const CHE_ERR_MSG = "Character encoding mismatch.";
const DATA_TYPE_ERR_MSG = "Data type mismatch.";

export default class OCABundle {
  constructor() {
    this.captureBase = null;
    this.overlays = {};
    this.ErrorBuilder = new OCADataSetErr();
  }

  // Load the OCA bundle from a JSON file.
  async loadedBundle(bundle) {
    try {
      this.captureBase = bundle[CB_KEY];
      this.overlays = bundle[OVERLAYS_KEY];
    } catch (error) {
      console.error("Error loading bundle:", error);
      throw error;
    }

    return this;
  }

  static getOverlay(overlay) {
    if (Object.keys(this.overlays).includes(overlay)) {
      return this.overlays[overlay];
    } else {
      console.error("overlay not found:", overlay);
    }
  }

  static getOverlayVersion(overlay) {
    const overlays = this.getOverlay(overlay);
    if (overlays.length >= 1) {
      return overlays[0][TYPE_KEY].split("/").pop();
    } else {
      return overlays[TYPE_KEY].split("/").pop();
    }
  }

  getAttributes() {
    return this.captureBase[ATTR_KEY];
  }

  getAttributeType(attrName) {
    return this.getAttributes()[attrName];
  }

  getAttributeFormat(attrName) {
    const formatKey = this.overlays[FORMAT_KEY];
    const attrFormatKey = formatKey && formatKey[ATTR_FORMAT_KEY];

    if (attrFormatKey && attrFormatKey[attrName] !== undefined) {
      return attrFormatKey[attrName];
    }
    return null;
  }

  getAttributeConformance(attrName) {
    const confKey = this.overlays[CONF_KEY];
    const attrConfKey = confKey && confKey[ATTR_CONF_KEY];

    if (attrConfKey && attrConfKey[attrName] !== undefined) {
      return attrConfKey[attrName];
    } else {
      return "O";
    }
  }

  getEntryCodes() {
    try {
      return this.overlays[EC_KEY][ATTR_EC_KEY];
    } catch (error) {
      return {};
    }
  }

  getCharacterEncoding(attrName) {
    const cheKey = this.overlays[CHE_KEY];
    const attrCheKey = cheKey && cheKey[ATTR_CHE_KEY];
    const defaultCheKey = cheKey && cheKey[DEFAULT_ATTR_CHE_KEY];

    if (attrCheKey && attrCheKey[attrName] !== undefined) {
      return attrCheKey[attrName];
    } else {
      return defaultCheKey || DEFAULT_ENCODING;
    }
  }

  // The start validation methods...
  /**
   * Validates all attributes for existence in the OCA Bundle.
   * @param {*} dataset - Dataset to be validated. Input from the user.
   * @returns {Array} - An array of unmatched attributes / missing attributes.
   */
  validateAttribute(dataset) {
    const rslt = this.ErrorBuilder.attErr;
    for (const attrName of Object.keys(dataset)) {
      if (!Object.keys(this.getAttributes()).includes(attrName)) {
        rslt.errs.push([attrName, ATTR_UNMATCH_MSG]);
      }
    }

    for (const attrName of Object.keys(this.getAttributes())) {
      if (!Object.keys(dataset).includes(attrName)) {
        rslt.errs.push([attrName, ATTR_MISSING_MSG]);
      }
    }

    return rslt.errs;
  }

  errorForEntryCodesForArrayEntries(
    dataEntryWithErrors,
    rslt,
    attr,
    i,
    attrFormat,
    attrEntryCodes
  ) {
    rslt.errs[attr][i] = {
      type: "FE",
      detail: `The following entry(ies): [${dataEntryWithErrors}] have, ${FORMAT_ERR_MSG} Supported format: ${attrFormat} Note: Supported entry codes: ${attrEntryCodes}`,
    };
  }

  splitRespectingQuotes(dataEntry) {
    const result = [];
    let current = '';
    let insideQuotes = false;

    for (let i = 0; i < dataEntry.length; i++) {
      const char = dataEntry[i];

      if (char === '"') {
        insideQuotes = !insideQuotes;
      } else if (!insideQuotes && /[,;|]/.test(char)) {
        result.push(current);
        current = '';
      } else {
        current += char;
      }
    }

    if (current) {
      result.push(current);
    }

    return result;
  }

  processEntries(dataEntry) {
    const dataArr = this.splitRespectingQuotes(dataEntry);
    let newDataArr = [];

    dataArr.forEach(item => {
      if (item.includes(',')) {
        newDataArr = newDataArr.concat(item.split(','));
      } else {
        newDataArr.push(item);
      }
    });

    return newDataArr;
  }

  /** Validates all attributes for format values.
   * Also checks for any missing mandatory attributes.
   * @param {*} dataset - Dataset to be validated. Input from the user.
   * @returns {Object} - An object of format errors. Example: {attr1: {0: "Format mismatch."}, attr2: {1: "Missing mandatory attribute."}}
   */
  validateFormat(dataset) {
    const rslt = this.ErrorBuilder.formatErr;

    for (const attr in this.getAttributes()) {
      rslt.errs[attr] = {};
      const attrType = this.getAttributeType(attr);
      const attrFormat = this.getAttributeFormat(attr);
      const attrConformance = this.getAttributeConformance(attr);
      const attrEntryCodes = this.getEntryCodes()[attr];
      let hasEntryCodes = false;

      if (Object.keys(this.getEntryCodes()).includes(attr)) {
        hasEntryCodes = true;
      }

      try {
        for (let i = 0; i < dataset[attr]?.length; i++) {
          let dataEntry = dataset[attr][i];
          if (
            (dataEntry === undefined ||
              dataEntry === null ||
              dataEntry === "") &&
            attrConformance === "O"
          ) {
            dataEntry = "";
          }
          // Verifying the data entries for attributes with Array data type.
          if (attrType.includes("Array") || Array.isArray(attrType)) {
            let dataEntryWithErrors = [];
            try {

              const dataArr = this.processEntries(dataEntry);
              for (let j = 0; j < dataArr.length; j++) {
                if (!matchFormat(attrType[0], attrFormat, String(dataArr[j]))) {
                  dataEntryWithErrors.push(dataArr[j]);
                }
                if (
                  attrConformance === "M" &&
                  dataEntryWithErrors.length === 0
                ) {
                  if (hasEntryCodes) {
                    this.errorForEntryCodesForArrayEntries(
                      dataEntryWithErrors,
                      rslt,
                      attr,
                      i,
                      attrFormat,
                      attrEntryCodes
                    );
                  } else {
                    rslt.errs[attr][i] = {
                      type: "FE",
                      detail: `${MISSING_MSG} Supported format: ${attrFormat}.`,
                    };
                  }
                } else if (
                  attrConformance === "O" &&
                  dataEntryWithErrors.length === 0
                ) {
                  continue;
                } else {
                  if (attrType[0].includes("Boolean") && attrConformance === "M") {
                    if (hasEntryCodes) {
                      this.errorForEntryCodesForArrayEntries(
                        dataEntryWithErrors,
                        rslt,
                        attr,
                        i,
                        attrFormat,
                        attrEntryCodes
                      );
                    } else {
                      rslt.errs[attr][i] = {
                        type: "FE",
                        detail: `The following entry(ies): [${dataEntryWithErrors}] have, ${FORMAT_ERR_MSG} Supported format: ['True','true','TRUE','T','1','1.0','False','false','FALSE','F','0','0.0']`,
                      };
                    }
                  } else if (attrFormat == null && attrConformance === "M") {
                    if (hasEntryCodes) {
                      this.errorForEntryCodesForArrayEntries(
                        dataEntryWithErrors,
                        rslt,
                        attr,
                        i,
                        attrFormat,
                        attrEntryCodes
                      );
                    } else {
                      rslt.errs[attr][i] = {
                        type: "DTE",
                        detail: `${DATA_TYPE_ERR_MSG} Supported data type: ${attrType}.`,
                      };
                    }
                  } else {
                    // implementation for other data types except Boolean.
                    if (hasEntryCodes & attrConformance === "M") {
                      this.errorForEntryCodesForArrayEntries(
                        dataEntryWithErrors,
                        rslt,
                        attr,
                        i,
                        attrFormat,
                        attrEntryCodes
                      );
                    } else {

                      rslt.errs[attr][i] = {
                        type: "FE",
                        detail: `The following entry(ies): [${dataEntryWithErrors}] have, ${FORMAT_ERR_MSG} Supported format: ${attrFormat}.`,
                      };
                    }
                  }
                }
              }
            } catch (error) {
              // Not a valid Array format string.
              rslt.errs[attr][i] = NOT_AN_ARRAY_MSG;
            }
          } else if (!matchFormat(attrType, attrFormat, String(dataEntry))) {
            if (attrConformance === "O" && dataEntry === "") {
              continue;
            } else if (attrConformance === "M" && dataEntry === "") {
              rslt.errs[attr][i] = {
                type: "FE",
                detail: `${MISSING_MSG} Supported format: ${attrFormat}.`,
              };
            } else {
              if (attrType.includes("Boolean")) {
                rslt.errs[attr][i] = {
                  type: "FE",
                  detail: `${FORMAT_ERR_MSG} Supported format: ['True','true','TRUE','T','1','1.0','False','false','FALSE','F','0','0.0']`,
                };
              } else {
                if (attrFormat == null) {
                  rslt.errs[attr][i] = {
                    type: "DTE",
                    detail: `${DATA_TYPE_ERR_MSG} Supported data type: ${attrType}.`,
                  };
                } else {
                  rslt.errs[attr][i] = {
                    type: "FE",
                    detail: `${FORMAT_ERR_MSG}`,
                  };
                }
              }
            }
          }
        }
      } catch (error) { }
    }
    return rslt.errs;
  }

  validateEntryCodes(dataset) {
    const rslt = this.ErrorBuilder.entryCodeErr;
    const attrEntryCodes = this.getEntryCodes();
    for (const attr in attrEntryCodes) {
      const attrType = this.getAttributeType(attr);
      rslt.errs[attr] = {};
      for (let i = 0; i < dataset[attr]?.length; i++) {
        const dataEntryWithSpaces = String(dataset[attr][i]);
        const dataEntry = dataEntryWithSpaces.replace(/,\s*/g, ',');

        if (attrType.includes("Array") || Array.isArray(attrType)) {
          const dataArr = this.processEntries(dataEntry);
          for (let j = 0; j < dataArr.length; j++) {
            let nonEntrycodeDataEntries = [];
            if (
              !attrEntryCodes[attr].includes(dataArr[j]) &&
              dataArr[j] !== "" &&
              dataArr[j] !== undefined
            ) { nonEntrycodeDataEntries.push(dataArr[j]); }
          if (nonEntrycodeDataEntries.length > 0) {
            rslt.errs[attr][i] = {
              type: "EC",
              detail: `The following entry(ies): [${nonEntrycodeDataEntries}] are not part of the Entry codes list. Entry codes allowed: [${Object.values(attrEntryCodes[attr])}]`,
            };
          }
        }
      } else if( !attrType.includes('Array') &&
          !attrEntryCodes[attr].includes(dataEntry) &&
          dataEntry !== "" &&
          dataEntry !== undefined
        ) {
          rslt.errs[attr][i] = {
            type: "EC",
            detail: `${EC_ERR_MSG} Entry codes allowed: [${Object.values(
              attrEntryCodes[attr]
            )}]`,
          };
        }      
      }
    }
    return rslt.errs;
  }

  validateCharacterEncoding(dataset) {
    const rslt = this.ErrorBuilder.characterEcodeErr;
    for (const attr in this.getAttributes()) {
      rslt.errs[attr] = {};
      const attrChe = this.getCharacterEncoding(attr);
      for (let i = 0; i < dataset[attr]?.length; i++) {
        const dataEntry = dataset[attr][i];
        if (!matchCharacterEncoding(dataEntry, attrChe)) {
          rslt.errs[attr][i] = { type: "CHE", detail: CHE_ERR_MSG };
        }
      }
    }
    return rslt.errs;
  }

  flaggedAlarm() {
    const flagged = [];
    if (
      Object.keys(this.captureBase).includes(FLAG_KEY) &&
      this.captureBase.flagged_attributes.length > 0
    ) {
      for (const attr in this.captureBase.flagged_attributes) {
        flagged.push(attr);
      }
    }
    return flagged;
  }

  versionAlarm() {
    let versionError = false;
    let errorMessage = "";

    for (const overlay of Object.keys(this.overlays)) {
      const fileVer = this.getOverlayVersion(overlay);
      if (fileVer && fileVer !== OCA_VERSION) {
        versionError = true;
        errorMessage = `Warning: overlay ${overlay} has a different OCA specification version: ${fileVer}.`;
        break;
      }
    }

    if (versionError) {
      errorMessage += ` Warning: The OCA bundle has a different OCA specification version: ${OCA_VERSION}.`;
    }

    return { isError: versionError, message: errorMessage };
  }

  validate(dataset) {
    const rslt = this.ErrorBuilder;
    rslt.attErr.errs = this.validateAttribute(dataset);
    rslt.formatErr.errs = this.validateFormat(dataset);
    rslt.entryCodeErr.errs = this.validateEntryCodes(dataset);
    rslt.characterEcodeErr.errs = this.validateCharacterEncoding(dataset);
    return rslt.updateErr();
  }
}
