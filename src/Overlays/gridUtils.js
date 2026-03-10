/**
 * Callback for overlay grids to fit columns to container width (avoids horizontal scroll).
 */
export const overlayGridOnFirstDataRendered = (params) => {
  params?.api?.sizeColumnsToFit?.();
};
