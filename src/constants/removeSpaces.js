export const removeSpacesFromString = (string) => {
  if (typeof string === "string") {
    return string.trim().replace(/\s+/g, " ");
  } else {
    return string;
  }
};

export const removeSpacesFromObject = (object) => {
  const objectCopy = JSON.parse(JSON.stringify(object));
  const keys = Object.keys(object);
  keys.forEach((key) => {
    objectCopy[key] = removeSpacesFromString(objectCopy[key]);
  });
  return objectCopy;
};

export const removeSpacesFromObjectOfObjects = (object) => {
  const objectCopy = JSON.parse(JSON.stringify(object));

  const keysArray = Object.keys(objectCopy);
  keysArray.forEach((item) => {
    objectCopy[item] = removeSpacesFromObject(objectCopy[item]);
  });
  return objectCopy;
};

export const removeSpacesFromArrayOfObjects = (objectArray) => {
  const noSpacesArray = objectArray.map((object) => {
    return removeSpacesFromObject(object);
  });
  return noSpacesArray;
};
