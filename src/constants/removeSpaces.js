export const removeSpacesFromString = (string) => {
  if (typeof string === "string") {
    return string.trim().replace(/\s+/g, " ");
  } else {
    return string;
  }
};
export const replaceColonFromString = (string) => {
  if (typeof string === "string") {
    return string.replace(/:/g, "-");
  } else {
    return string;
  }
};

export const removeSpacesFromObject = (object) => {
  const objectCopy = JSON.parse(JSON.stringify(object));
  const keys = Object.keys(object);
  keys.forEach((key) => {
    if (typeof objectCopy[key] === 'string') {
      objectCopy[key] = removeSpacesFromString(objectCopy[key]);
    } else if (typeof objectCopy[key] === 'object' && objectCopy[key] !== null) {
      // Recursively handle nested objects
      objectCopy[key] = removeSpacesFromObject(objectCopy[key]);
    }
  });
  return objectCopy;
};

export const replaceColonFromObject = (object) => {
  const objectCopy = JSON.parse(JSON.stringify(object));
  const keys = Object.keys(object);
  keys.forEach((key) => {
    objectCopy[key] = replaceColonFromString(objectCopy[key]);
  });
  return objectCopy;
};

export const removeSpacesFromObjectOfObjects = (object) => {
  // If the input is not an object (e.g., it's a string), just return the processed value
  if (typeof object === 'string') {
    return removeSpacesFromString(object);
  }
  
  // Handle null, undefined, or other non-object types
  if (!object || typeof object !== 'object') {
    return object;
  }
  
  // Handle arrays
  if (Array.isArray(object)) {
    return removeSpacesFromObject(object);
  }
  
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

export const removeSpacesAndColonFromArrayOfObjects = (objectArray) => {
  const noSpacesArray = objectArray.map((object) => {
    const removedString = removeSpacesFromObject(object);
    return replaceColonFromObject(removedString);
  });
  return noSpacesArray;
};
