export const getCurrentData = (currentApi, includedError) => {
  const newData = [];
  currentApi.forEachNode((node) => {
    const newObject = { ...node?.data };
    if (!includedError) {
      delete newObject['error'];
    }
    newData.push(newObject);
  });
  return newData;
};
