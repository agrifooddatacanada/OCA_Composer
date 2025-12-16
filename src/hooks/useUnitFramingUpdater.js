import { useEffect, useState } from "react";
import { searchUnits } from "../utils/helpers";

const useUnitFramingUpdater = (unitRowData) => {
  const [unitFramedRowData, setUnitFramedRowData] = useState([]);

  useEffect(() => {
    if (!unitRowData) return;
    const framedUnits = unitRowData.map((row) => {
      const searchValue = row["UCUM Code"] || row.Unit;
      const { firstMatch } = searchUnits(searchValue);

      return {
        ...row,
        "UCUM Code": firstMatch?.code,
        "UCUM Label": firstMatch?.label,
        Description: firstMatch?.description
      };
    });

    setUnitFramedRowData(framedUnits);
  }, [unitRowData]);

  return unitFramedRowData;
};

export default useUnitFramingUpdater;
