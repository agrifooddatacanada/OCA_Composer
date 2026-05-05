import React, { useEffect, useRef } from "react";

const CheckboxRenderer = ({ value, rowIndex, colDef, gridRef }) => {
  const inputRef = useRef();

  useEffect(() => {
    inputRef.current.checked = value;
  }, [value]);

  const handleChange = (event) => {
    const { checked } = event.target;
    const node = gridRef.current.api.getRowNode(rowIndex);
    const colId = colDef.field;
    node.setDataValue(colId, checked);
    // TODO: savedEntryCodes has the entries, might need to erase the entries when the checkbox is unchecked
  };

  return <input type="checkbox" ref={inputRef} onChange={handleChange} />;
};

export default CheckboxRenderer;
