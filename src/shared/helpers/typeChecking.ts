export default function hasPropertiesOfType(obj, type) {
  for (let key in type) {
    if (type.hasOwnProperty(key)) {
      // Check if the property exists in the object
      if (!obj.hasOwnProperty(key)) {
        return false;
      }

      // Check if the property has the correct type
      if (typeof obj[key] !== type[key]) {
        return false;
      }
    }
  }

  // All properties have the correct type
  return true;
}
