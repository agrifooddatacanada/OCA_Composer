const readmeText = `
BEGIN_REFERENCE_MATERIAL
******************************************************************
OCA_READ_ME/1.0
This is a human-readable schema, based on the OCA schema standard.

Reference for Overlays Capture Architecture (OCA):
https://doi.org/10.5281/zenodo.7707467

Reference for OCA_READ_ME/1.0:
https://github.com/agrifooddatacanada/OCA_README

A schema describes details about a dataset.
In OCA, a schema consists of a capture_base which documents the attributes and their most basic features.
A schema may also contain overlays which add details to the capture_base.
For each overlay and capture_base, a hash of their original contents has been calculated and is reported here as the SAID value.

This README format documents the capture_base and overlays that were associated together in a single OCA Bundle.
OCA_MANIFEST lists all components of the OCA Bundle.
For the OCA_BUNDLE, each section between rows of ****'s contains the details of one "layer type/version" of the OCA Bundle.
******************************************************************
END_REFERENCE_MATERIAL\n\n`;


const useGenerateReadMeV2 = () => {

  const jsonToTextFile = async (jsonData) => {
    // Step 1: --- Read json schema bundle
    const json_bundle = jsonData;

    // Step 2: __init__ of OCA ReadMe file
    const text_file = [];

    const bundle_said = json_bundle.d;
    text_file.push(
      readmeText,
      "BEGIN_OCA_MANIFEST\n",
      "******************************************************************\n",
      "Bundle SAID/digest: ", bundle_said, "\n\n",
    );

    const overlay_saids = {};
    const overlay_texts = {};

    // Step 3: --- Converting schema overlays from objects to texts
    if (json_bundle.hasOwnProperty('capture_base')) {
      try {
        const said = json_bundle.capture_base.d;
        const layer_name = json_bundle.capture_base.type.split("spec/")[1];
        const classification = json_bundle.capture_base.classification;
        const schema_attributes = json_bundle.capture_base.attributes;
        overlay_saids['capture_base'] = said;
        overlay_texts['capture_base'] = `Layer name: ${layer_name}\n` +
          `SAID/digest: ${said}\n` +
          `Classification: ${classification}\n` +
          `\n` +
          `Schema attributes: data type` +
          `${Object.entries(schema_attributes)
            .map(([key, value]) => `    ${key}: ${value}`)
            .join('\n')}\n` +
          `\n`;

        // implement flagged attributes
      } catch (err) {
        throw err;
      };
    };

    const metas_overlays_txt = [];
    if (json_bundle.overlays.hasOwnProperty('meta')) {
      try {
        for (const overlay of json_bundle.overlays.meta) {
          const said = overlay.d;
          const layer_name = overlay.type.split("spec/overlays/")[1];
          const lang = overlay.language;
          const description = overlay.description;
          overlay_saids[`meta_${lang}`] = said;
          metas_overlays_txt.push(`Layer name: ${layer_name}\n` +
            `SAID/digest: ${said}\n` +
            `Language: ${lang}\n` +
            `Description: ${description}\n` +
            `\n`);
        }
        overlay_texts['meta'] = metas_overlays_txt.join('');
      } catch (err) {
        throw err;
      };
    };

    if (json_bundle.overlays.hasOwnProperty('label')) {
      try {
        const labels_overlays_txt = [];
        for (const overlay of json_bundle.overlays.label) {
          const said = overlay.d;
          const layer_name = overlay.type.split("spec/overlays/")[1];
          const lang = overlay.language;
          const schema_attributes = overlay.attribute_labels;
          overlay_saids[`label_${lang}`] = said;
          labels_overlays_txt.push(`Layer name: ${layer_name}\n` +
            `SAID/digest: ${said}\n` +
            `Language: ${lang}\n` +
            `Schema attributes: ${layer_name}\n` +
            `${Object.entries(schema_attributes)
              .map(([key, value]) => `    ${key}: ${value}`)
              .join('\n')}\n` +
            `\n`);
        };
        overlay_texts['label'] = labels_overlays_txt.join('');
      } catch (err) {
        throw err;
      };
    };

    if (json_bundle.overlays.hasOwnProperty('information')) {
      try {
        const information_overlays_txt = [];
        for (const overlay of json_bundle.overlays.information) {
          const said = overlay.d;
          const layer_name = overlay.type.split("spec/overlays/")[1];
          const lang = overlay.language;
          const schema_attributes = overlay.attribute_information;
          overlay_saids[`information_${lang}`] = said;
          information_overlays_txt.push(`Layer name: ${layer_name}\n` +
            `SAID/digest: ${said}\n` +
            `Language: ${lang}\n` +
            `Schema attributes: ${layer_name}\n` +
            `${Object.entries(schema_attributes)
              .map(([key, value]) => `    ${key}: ${value}`)
              .join('\n')}\n` +
            `\n`);
        };
        overlay_texts['information'] = information_overlays_txt.join('');

      } catch (err) {
        throw err;
      };

    };

    if (json_bundle.overlays.hasOwnProperty('unit')) {
      try {
        const said = json_bundle.overlays.unit.d;
        const layer_name = json_bundle.overlays.unit.type.split("spec/overlays/")[1];
        const measurement_system = json_bundle.overlays.unit.measurement_system;
        const schema_attributes = json_bundle.overlays.unit.attribute_units;
        overlay_saids['unit'] = said;
        overlay_texts['unit'] = `Layer name: ${layer_name}\n` +
          `SAID/digest: ${said}\n` +
          `Measurement system: ${measurement_system}\n` +
          `\n` +
          `Schema attributes: ${layer_name}\n` +
          `${Object.entries(schema_attributes)
            .map(([key, value]) => `    ${key}: ${value}`)
            .join('\n')}\n` +
          `\n`;
      } catch (err) {
        throw err;
      };
    };

    if (json_bundle.overlays.hasOwnProperty('conformance')) {
      try {
        const said = json_bundle.overlays.conformance.d;
        const schema_attributes = json_bundle.overlays.conformance.attribute_conformance;
        const layer_name = json_bundle.overlays.conformance.type.split("spec/overlays/")[1];
        overlay_saids['conformance'] = said;
        overlay_texts['conformance'] = `Layer name: ${layer_name}\n` +
          `SAID/digest: ${said}\n` +
          `\n` +
          `Schema attributes: ${layer_name}\n` +
          `${Object.entries(schema_attributes)
            .map(([key, value]) => `    ${key}: ${value}`)
            .join('\n')}\n` +
          `\n`;

      } catch (err) {
        throw err;
      };
    };

    if (json_bundle.overlays.hasOwnProperty('character_encoding')) {
      try {
        const said = json_bundle.overlays.character_encoding.d;
        const layer_name = json_bundle.overlays.character_encoding.type.split("spec/overlays/")[1];
        const schema_attributes = json_bundle.overlays.character_encoding.attribute_character_encoding;
        overlay_saids['character_encoding'] = said;
        overlay_texts['character_encoding'] = `Layer name: ${layer_name}\n` +
          `SAID/digest: ${said}\n` +
          `\n` +
          `Schema attributes: ${layer_name}\n` +
          `${Object.entries(schema_attributes)
            .map(([key, value]) => `    ${key}: ${value}`)
            .join('\n')}\n` +
          `\n`;

      } catch (err) {
        throw err;
      };
    };

    if (json_bundle.overlays.hasOwnProperty('format')) {
      try {
        const said = json_bundle.overlays.format.d;
        const layer_name = json_bundle.overlays.format.type.split("spec/overlays/")[1];
        const schema_attributes = json_bundle.overlays.format.attribute_formats;
        overlay_saids['format'] = said;
        overlay_texts['format'] = `Layer name: ${layer_name}\n` +
          `SAID/digest: ${said}\n` +
          `\n` +
          `Schema attributes: ${layer_name}\n` +
          `${Object.entries(schema_attributes)
            .map(([key, value]) => `    ${key}: ${value}`)
            .join('\n')}\n` +
          `\n`;

      } catch (err) {
        throw err;
      };
    };

    if (json_bundle.overlays.hasOwnProperty('entry_code')) {
      try {
        const said = json_bundle.overlays.entry_code.d;
        const layer_name = json_bundle.overlays.entry_code.type.split("spec/overlays/")[1];
        const schema_attributes = json_bundle.overlays.entry_code.attribute_entry_codes;
        overlay_saids['entry_code'] = said;
        overlay_texts['entry_code'] = `Layer name: ${layer_name}\n` +
          `SAID/digest: ${said}\n` +
          `\n` +
          `Schema attributes: ${layer_name}\n` +
          `${Object.entries(schema_attributes)
            .map(([key, value]) => `    ${key}: [${value}]`)
            .join('\n')}\n` +
          `\n`;
      } catch (err) {
        throw err;
      };
    };

    if (json_bundle.overlays['entry'] !== undefined) {
      const entry_overlays_txt = [];
      try {
        for (const overlay of json_bundle.overlays.entry) {
          const said = overlay.d;
          const layer_name = overlay.type.split("spec/overlays/")[1];
          const lang = overlay.language;
          const schema_attributes = overlay.attribute_entries;
          overlay_saids[`entry_${lang}`] = said;
          entry_overlays_txt.push(`Layer name: ${layer_name}\n` +
            `SAID/digest: ${said}\n` +
            `Schema attributes: ${layer_name}\n` +
            `${Object.entries(schema_attributes)
              .map(([key, value]) => {
                if (typeof value === 'object' && value !== null) {
                  return `    ${key}: ${Object.values(value).join(', ')}`;
                }
                return `    ${key}: ${value}`;
              })
              .join('\n')}\n\n`);
        };
        overlay_texts['entry'] = entry_overlays_txt.join('');

      } catch (err) {
        throw err;
      };
    };

    // Step 4: --- Constructing OCA ReadMe file
    const manifest = [];
    try {
      for (const [key, value] of Object.entries(overlay_saids)) {
        if (key === 'capture_base') {
          const capture_base_text = `capture_base SAID/digest: "${value}"\n`;
          manifest.push(capture_base_text);
        };
        if (key.includes('meta')) {
          const meta_text = `meta (${key.split("_")[1]}) SAID/digest: "${value}"\n`;
          manifest.push(meta_text);
        };
        if (key.includes('label')) {
          const label_text = `label (${key.split("_")[1]}) SAID/digest: "${value}"\n`;
          manifest.push(label_text);
        };
        if (key.includes('information')) {
          const information_text = `information (${key.split("_")[1]}) SAID/digest: "${value}"\n`;
          manifest.push(information_text);
        };
        if (key === 'unit') {
          const unit_text = `unit: "${value}"\n`;
          manifest.push(unit_text);
        };
        if (key === 'conformance') {
          const conformance_text = `conformance SAID/digest: "${value}"\n`;
          manifest.push(conformance_text);
        };
        if (key === 'character_encoding') {
          const character_encoding_text = `character_encoding SAID/digest: "${value}"\n`;
          manifest.push(character_encoding_text);
        };
        if (key === 'format') {
          const format_text = `format SAID/digest: "${value}"\n`;
          manifest.push(format_text);
        };
        if (key === 'entry_code') {
          const entry_code_text = `entry_code SAID/digest: "${value}"\n`;
          manifest.push(entry_code_text);
        };
        if (key.includes('entry') && key !== 'entry_code') {
          const entry_text = `entry (${key.split("_")[1]}) SAID/digest: "${value}"\n`;
          manifest.push(entry_text);
        };
      };
    } catch (err) {
      throw err;
    };

    text_file.push(...manifest);
    text_file.push(
      "******************************************************************\n",
      "END_OCA_MANIFEST\n\n",
      "BEGIN_OCA_BUNDLE\n",
      "******************************************************************\n"
    );
    text_file.push(overlay_texts['capture_base']);
    text_file.push(
      "******************************************************************\n",
    );
    if (overlay_texts.hasOwnProperty('meta')) {
      text_file.push(overlay_texts['meta']);
      text_file.push(
        "******************************************************************\n",
      );
    };
    if (overlay_texts.hasOwnProperty('label')) {
      text_file.push(overlay_texts['label']);
      text_file.push(
        "******************************************************************\n",
      );
    };
    if (overlay_texts.hasOwnProperty('information')) {
      text_file.push(overlay_texts['information']);
      text_file.push(
        "******************************************************************\n",
      );
    };
    if (overlay_texts.hasOwnProperty('unit')) {
      text_file.push(overlay_texts['unit']);
      text_file.push(
        "******************************************************************\n",
      );
    };
    if (overlay_texts.hasOwnProperty('conformance')) {
      text_file.push(overlay_texts['conformance']);
      text_file.push(
        "******************************************************************\n",
      );
    };
    if (overlay_texts.hasOwnProperty('character_encoding')) {
      text_file.push(overlay_texts['character_encoding']);
      text_file.push(
        "******************************************************************\n",
      );
    };
    if (overlay_texts.hasOwnProperty('format')) {
      text_file.push(overlay_texts['format']);
      text_file.push(
        "******************************************************************\n",
      );
    };
    if (overlay_texts.hasOwnProperty('entry_code')) {
      text_file.push(overlay_texts['entry_code']);
      text_file.push(
        "******************************************************************\n",
      );
    };
    if (overlay_texts.hasOwnProperty('entry')) {
      text_file.push(overlay_texts['entry']);
      text_file.push(
        "******************************************************************\n",

      );
    };

    text_file.push(
      "END_OCA_BUNDLE\n",
    );

    const text = text_file.join('');
    const textBlob = new Blob([text], { type: "text/plain" });
    const downloadUrl = URL.createObjectURL(textBlob);

    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = 'README_OCA_schema.txt';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  return { jsonToTextFile };
};

export default useGenerateReadMeV2;
