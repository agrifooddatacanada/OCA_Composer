import * as XLSX from 'xlsx';
import Papa from 'papaparse';

export default class OCADataSet {
  // Processing excel files.
  static async readExcel(fileContent) {
    return new Promise((resolve, reject) => {
      try {
        const workbook = XLSX.readFile(fileContent);
        const sheetNameToUse = workbook.SheetNames.includes('Schema Conformant Data') ? 'Schema Conformant Data' : 'Data Entry'
        const worksheet = workbook.Sheets[sheetNameToUse];
        const range = XLSX.utils.decode_range(worksheet['!ref']);

        // Find the last row index containing data.
        let lastRowIndex = null;
        for (let row = range.e.r; row >= range.s.r; row--) {
          let isRowEmpty = true;
          for (let col = range.s.c; col <= range.e.c; col++) {
            const cellAddress = { c: col, r: row };
            const cellRef = XLSX.utils.encode_cell(cellAddress);
            const cell = worksheet[cellRef];
            if (cell && cell.v !== undefined && cell.v !== '') {
              isRowEmpty = false;
              // lastRowIndex = row;
              break;
            }
          }
          if (!isRowEmpty) {
            lastRowIndex = row;
            break;
          }
        }

        const dataset = [];
        for (let row = range.s.r; row <= lastRowIndex; row++) {
          const rowData = [];
          for (let col = range.s.c; col <= range.e.c; col++) {
            const cellAddress = { c: col, r: row };
            const cellRef = XLSX.utils.encode_cell(cellAddress);
            const cell = worksheet[cellRef];
            rowData.push(cell ? cell.v : '');
          }
          dataset.push(rowData);
        }
        // Convert the worksheet to a JSON object.
        const result = {};
        for (let col = 0; col < dataset[0].length; col++) {
          const columnName = dataset[0][col];
          result[columnName] = dataset.slice(1, lastRowIndex + 1).map(row => row[col]);
        }
       resolve(result);
      } catch (error) {
        reject(error);
      }
    });
  }

  // Processing CSV files.
  static readCSV(file) {
    return new Promise((resolve, reject) => {
      Papa.parse(file, {
        header: true,
        complete: (result) => {
          resolve(result.data);
        },
        error: reject
      });
    });
  }
};