function schemaFileLabel(file) {
  if (!file) return "";
  const p = file.path || file.name || "";
  return String(p).toLowerCase();
}

export function isLandingZipSchema(file) {
  return schemaFileLabel(file).endsWith(".zip");
}

export function isLandingJsonSchema(file) {
  return schemaFileLabel(file).endsWith(".json");
}

export function isLandingYamlSchema(file) {
  const n = schemaFileLabel(file);
  return n.endsWith(".yaml") || n.endsWith(".yml");
}

export function syncLandingSchemaDrop(setRawFile, setJsonRawFile, acceptedFiles) {
  const f = acceptedFiles?.[0];
  setRawFile(acceptedFiles);
  if (isLandingZipSchema(f) || isLandingJsonSchema(f)) {
    setJsonRawFile([]);
    return;
  }
  if (isLandingYamlSchema(f)) {
    setJsonRawFile(acceptedFiles);
    return;
  }
  setJsonRawFile([]);
}
