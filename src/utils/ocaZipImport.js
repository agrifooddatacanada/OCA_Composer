import JSZip from "jszip";
import { replaceAttributeCharsInJsonString } from "./helpers";

export async function parseOcaZipArrayBuffer(arrayBuffer) {
  const zip = await JSZip.loadAsync(arrayBuffer);
  const allZipFiles = [];

  const loadMetadataFile = await zip.files["meta.json"].async("text");
  const metadataJson = JSON.parse(loadMetadataFile);
  const { root } = metadataJson;
  allZipFiles.push(loadMetadataFile);

  const captureBase = JSON.parse(
    replaceAttributeCharsInJsonString(
      await zip.files[`${root}.json`].async("text")
    )
  );
  allZipFiles.push(JSON.stringify(captureBase));

  const overlays = {};

  for (const [key, file] of Object.entries(metadataJson.files[root])) {
    /* eslint-disable-next-line no-await-in-loop */
    const content = await zip.files[`${file}.json`].async("text");
    const convertedContent = replaceAttributeCharsInJsonString(content);
    const parsedData = JSON.parse(convertedContent);
    allZipFiles.push(convertedContent);

    if (key.includes("meta")) {
      overlays.meta = overlays.meta || [];
      overlays.meta.push(parsedData);
    } else if (key.includes("information")) {
      overlays.information = overlays.information || [];
      overlays.information.push(parsedData);
    } else if (key.includes("label")) {
      overlays.label = overlays.label || [];
      overlays.label.push(parsedData);
    } else if (key.includes("entry (")) {
      overlays.entry = overlays.entry || [];
      overlays.entry.push(parsedData);
    } else if (key.includes("entry_code")) {
      overlays.entry_code = parsedData;
    } else if (key.includes("conformance")) {
      overlays.conformance = parsedData;
    } else if (key.includes("character_encoding")) {
      overlays.character_encoding = parsedData;
    } else if (key.includes("unit")) {
      overlays.unit = parsedData;
    } else if (key.includes("cardinality")) {
      overlays.cardinality = parsedData;
    } else if (key.includes("format")) {
      overlays.format = parsedData;
    } else if (key === "standard") {
      overlays.standard = parsedData;
    }
  }

  const ocaBundle = {
    d: root,
    bundle: {
      d: root,
      capture_base: captureBase,
      overlays
    }
  };

  const ocaPackage = {
    __composerImportSource: "zip",
    oca_bundle: ocaBundle
  };

  return { ocaPackage, allZipFiles, root, captureBase };
}
