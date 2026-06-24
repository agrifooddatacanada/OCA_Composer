import { forwardRef } from "react";
import { AgGridReact as AgGridReactBase } from "ag-grid-react";

export const AgGridReact = forwardRef(function AgGridReact(props, ref) {
  const {
    suppressDragLeaveHidesColumns,
    suppressMovableColumns,
    ...rest
  } = props;
  return (
    <AgGridReactBase
      ref={ref}
      {...rest}
      suppressDragLeaveHidesColumns={suppressDragLeaveHidesColumns ?? true}
      suppressMovableColumns={suppressMovableColumns ?? true}
    />
  );
});
