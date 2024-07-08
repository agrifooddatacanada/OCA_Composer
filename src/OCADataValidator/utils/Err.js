// Error messages
const ATTR_UNMATCH_MSG = 'Unmatched attribute (attribute not found in the OCA Bundle).';
const ATTR_MISSING_MSG = 'Missing attribute (attribute not found in the data set).';

// Base error class for FormatErr and EntryCodeErr.
class BaseErr {
  constructor() {
    this.errs = {};
  }
};

class AttributeErr {
  constructor() {
    this.errs = [];
  }
};

class FormatErr extends BaseErr { }
class EntryCodeErr extends BaseErr { }
class CharacterEcodeErr extends BaseErr { }

export default class OCADataSetErr {
  constructor() {
    this.attErr = new AttributeErr();
    this.formatErr = this.createErrInstance(FormatErr);
    this.entryCodeErr = this.createErrInstance(EntryCodeErr);
    this.characterEcodeErr = this.createErrInstance(CharacterEcodeErr);

    this.missingAttrs = new Set();
    this.unmachedAttrs = new Set();

    this.errCols = new Set();
    this.errRows = new Set();

    this.errCollection = {};
  };

  createErrInstance(ErrClass) {
    return new ErrClass();
  }

  /**
   * @returns {string} - This method returns the first column with errors if it exist else null.
   */
  getfirstErrCol() {
    this.updateErr();
    if (this.errCols.size > 0) {
      const firstErrCol = [...this.errCols].sort()[0];
      return firstErrCol;
    } else {
      return null;
    }
  };

  /**
   * @returns {object} - This method returns the object that consits of attr_missing, attr_unmatch attributes, errRows, and errCols errors.
   */
  updateErr() {
    for (const i of this.attErr.errs) {
      if (i[1] === ATTR_MISSING_MSG) {
        this.missingAttrs.add(i[0]);
      } else if (i[1] === ATTR_UNMATCH_MSG) {
        this.unmachedAttrs.add(i[0]);
      }
    }

    for (const i in this.formatErr.errs) {
      for (const j in this.formatErr.errs[i]) {
        this.errRows.add(j);
        if (Object.keys(this.formatErr.errs).includes(i)) {
          this.errCols.add(i);
        }
      }
    }
    for (const i in this.entryCodeErr.errs) {
      for (const j in this.entryCodeErr.errs[i]) {
        this.errRows.add(j);
        if (Object.keys(this.entryCodeErr.errs).includes(i)) {
          this.errCols.add(i);
        }
      }
    }

    for (const i in this.characterEcodeErr.errs) {
      for (const j in this.characterEcodeErr.errs[i]) {
        this.errRows.add(j);
        if (Object.keys(this.characterEcodeErr.errs).includes(i)) {
          this.errCols.add(i);
        }
      }
    }
    this.getAllErrs();

    return this;
  };

  getAttErr() { return this.attErr.errs; };
  getFormatErr() { return this.formatErr.errs; };
  getEntryCodeErr() { return this.entryCodeErr.errs; };

  /**
   *
   * @param {*} attrName - The attribute name (column name).
   * @returns {Set} - This method returns a set of rows with errors if exist else null.
   */
  static getErrCol(attrName) {
    this.errRows.clear();
    if (!Array.from(this.errCols).includes(attrName)) {
      return null;
    } else {
      if (Object.keys(this.getFormatErr()).includes(attrName)) {
        for (const row in this.getFormatErr()[attrName]) {
          this.errRows.add(row);
        }
      } else {
        return null;
      }
      if (attrName in Object.keys(this.getEntryCodeErr())) {
        for (const row in this.getEntryCodeErr()[attrName]) {
          this.errRows.add(row);
        }
      } else {
        return this.errRows;
      }
    };
    return this.errRows;
  };

  rowErrorsForErrCollection(errObject, row) {
    const outputErrCollection = {};
    for (const col in errObject) {
      if (errObject[col][row] !== undefined) {
        const error = errObject[col][row] ?? null;
        if (error) {
          if (col in outputErrCollection) {
            const existingErrors = outputErrCollection[col];
            outputErrCollection[col] = [...existingErrors, error];
          } else {
            outputErrCollection[col] = [error];
          }
        }
      }
    }
    return outputErrCollection;
  }

  mergeErrors(...errors) {
    const mergedErrors = {};

    for (const errorSet of errors) {
      if (Object.keys(errorSet).length === 0) {
        continue;
      }
      for (const [columnName, rowsErrs] of Object.entries(errorSet)) {
        if (!mergedErrors[columnName]) {
          mergedErrors[columnName] = [...rowsErrs];
        } else {
          mergedErrors[columnName] = [...mergedErrors[columnName], ...rowsErrs];
        }
      }
    }
    return mergedErrors;
  }

  getAllErrs() {
    const rowsErros = Array.from(this.errRows);
    for (const row of rowsErros) {
      const formatError = this.rowErrorsForErrCollection(this.formatErr.errs, row);
      const entryCodeError = this.rowErrorsForErrCollection(this.entryCodeErr.errs, row);
      const characterEncodingError = this.rowErrorsForErrCollection(this.characterEcodeErr.errs, row);
      const mergedErrors = this.mergeErrors(formatError, entryCodeError, characterEncodingError);
      this.errCollection[row] = mergedErrors;
    }
  };
};