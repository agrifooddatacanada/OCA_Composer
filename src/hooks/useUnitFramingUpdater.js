import { useEffect, useState } from "react";
import { searchUnits } from "../utils/helpers";

const useUnitFramingUpdater = (unitRowData) => {
  const [unitFramedRowData, setUnitFramedRowData] = useState([]);

  useEffect(() => {
    if (!unitRowData) return;
    // Do not auto-search UCUM here — AttributeDetails is responsible for populating UCUM codes.
    const framedUnits = unitRowData.map((row) => ({
      ...row,
      "UCUM Code": row["UCUM Code"] || "",
      "UCUM Label": row["UCUM Label"] || "",
      Description: row.Description || ""
    }));

    setUnitFramedRowData(framedUnits);
  }, [unitRowData]);

  return unitFramedRowData;
};

export default useUnitFramingUpdater;
