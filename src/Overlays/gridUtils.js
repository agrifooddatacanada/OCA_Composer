import { useCallback } from "react";

/**
 * Callback for overlay grids to fit columns to container width (avoids horizontal scroll).
 */
export const overlayGridOnFirstDataRendered = (params) => {
  params?.api?.sizeColumnsToFit?.();
};

export const getAllGridRowData = (api) => {
  if (!api) return [];
  const rowData = [];
  api.forEachNode((node) => {
    if (node?.data) rowData.push(node.data);
  });
  return rowData;
};

/**
 * Hook for overlay grids that use loading state - returns onGridReady callback.
 */
export const useOverlayGridOnGridReady = (setLoading) =>
  useCallback(() => setLoading(false), [setLoading]);
