export const getListOfSelectedOverlays = (overlay) => {
  const selectedFeatures = [];
  const unselectedFeatures = [];

  Object.values(overlay).forEach(item => {
    if (item.selected) {
      selectedFeatures.push(item.feature);
    } else {
      unselectedFeatures.push(item.feature);
    }
  });

  return { selectedFeatures, unselectedFeatures };
}

