const getListOfSelectedOverlays = (overlay) => {
  const selectedFeatures = [];
  const unselectedFeatures = [];
  // Temporarily excluding these features
  const featuresToExclude = ["Data Standards", "Attribute Framing"];

  Object.values(overlay).forEach((item) => {
    if (featuresToExclude.includes(item.feature)) return;
    if (item.selected) {
      selectedFeatures.push(item.feature);
    } else {
      unselectedFeatures.push(item.feature);
    }
  });

  return { selectedFeatures, unselectedFeatures };
};

export default getListOfSelectedOverlays;
