import { useContext } from "react";
import { Context } from "../App";
import {
  getDescriptiveFileName,
  getOrderedAttributeMap,
  getOrderedEntries
} from "../constants/utils";

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
  const { schemaDescription } = useContext(Context);
  const jsonToTextFile = async (jsonData, ocaPackage = null) => {
    // Step 1: --- Read json schema bundle
    const json_bundle = jsonData;

    // Check if ordering overlay can be retrieved from oca package
    const orderingOverlay = ocaPackage?.extensions?.[0]?.overlays?.ordering;
    const hasAttributeOrdering = orderingOverlay?.attribute_ordering?.length > 0;
    const hasEntryCodeOrdering =
      Object.keys(orderingOverlay?.entry_code_ordering || {}).length > 0;

    // Step 2: __init__ of OCA ReadMe file
    const text_file = [];

    const bundle_said = json_bundle.d;
    text_file.push(
      readmeText,
      "BEGIN_OCA_MANIFEST\n",
      "******************************************************************\n"
    );

    if (ocaPackage?.type?.includes("oca_package")) {
      text_file.push(`Package SAID/digest: ${ocaPackage.d}\n`);
    }

    text_file.push(`Bundle SAID/digest: ${bundle_said}\n\n`);

    const overlay_saids = {};
    const overlay_texts = {};

    // Step 3: --- Converting schema overlays from objects to texts
    if (Object.prototype.hasOwnProperty.call(json_bundle, "capture_base")) {
      const said = json_bundle.capture_base.d;
      const layer_name = json_bundle.capture_base.type;
      const { classification } = json_bundle.capture_base;
      const schema_attributes = hasAttributeOrdering
        ? getOrderedAttributeMap(
            orderingOverlay.attribute_ordering,
            json_bundle.capture_base.attributes
          )
        : json_bundle.capture_base.attributes;

      overlay_saids[layer_name] = said;
      overlay_texts.capture_base =
        `Layer name: ${layer_name}\n` +
        `SAID/digest: ${said}\n` +
        `Classification: ${classification}\n` +
        "\n" +
        "Schema attributes: data type\n" +
        `${Object.entries(schema_attributes)
          .map(([key, value]) => `    ${key}: ${value}`)
          .join("\n")}\n` +
        "\n";
      // implement flagged attributes
    }

    const metas_overlays_txt = [];
    if (Object.prototype.hasOwnProperty.call(json_bundle.overlays, "meta")) {
      for (const overlay of json_bundle.overlays.meta) {
        const said = overlay.d;
        const layer_name = overlay.type;
        const lang = overlay.language;
        const { description } = overlay;
        overlay_saids[`${layer_name} (${lang})`] = said;
        metas_overlays_txt.push(
          `Layer name: ${layer_name}\n` +
            `SAID/digest: ${said}\n` +
            `Language: ${lang}\n` +
            `Description: ${description}\n` +
            "\n"
        );
      }
      overlay_texts.meta = metas_overlays_txt.join("");
    }

    if (Object.prototype.hasOwnProperty.call(json_bundle.overlays, "label")) {
      const labels_overlays_txt = [];
      for (const overlay of json_bundle.overlays.label) {
        const said = overlay.d;
        const layer_name = overlay.type;
        const lang = overlay.language;
        const schema_attributes = hasAttributeOrdering
          ? getOrderedAttributeMap(
              orderingOverlay.attribute_ordering,
              overlay.attribute_labels
            )
          : overlay.attribute_labels;
        overlay_saids[`${layer_name} (${lang})`] = said;
        labels_overlays_txt.push(
          `Layer name: ${layer_name}\n` +
            `SAID/digest: ${said}\n` +
            `Language: ${lang}\n` +
            `Schema attributes: ${layer_name}\n` +
            `${Object.entries(schema_attributes)
              .map(([key, value]) => `    ${key}: ${value}`)
              .join("\n")}\n` +
            "\n"
        );
      }
      overlay_texts.label = labels_overlays_txt.join("");
    }

    if (Object.prototype.hasOwnProperty.call(json_bundle.overlays, "information")) {
      const information_overlays_txt = [];
      for (const overlay of json_bundle.overlays.information) {
        const said = overlay.d;
        const layer_name = overlay.type;
        const lang = overlay.language;
        const schema_attributes = hasAttributeOrdering
          ? getOrderedAttributeMap(
              orderingOverlay.attribute_ordering,
              overlay.attribute_information
            )
          : overlay.attribute_information;
        overlay_saids[`${layer_name} (${lang})`] = said;
        information_overlays_txt.push(
          `Layer name: ${layer_name}\n` +
            `SAID/digest: ${said}\n` +
            `Language: ${lang}\n` +
            `Schema attributes: ${layer_name}\n` +
            `${Object.entries(schema_attributes)
              .map(([key, value]) => `    ${key}: ${value}`)
              .join("\n")}\n` +
            "\n"
        );
      }
      overlay_texts.information = information_overlays_txt.join("");
    }

    if (Object.prototype.hasOwnProperty.call(json_bundle.overlays, "unit")) {
      const said = json_bundle.overlays.unit.d;
      const layer_name = json_bundle.overlays.unit.type;
      const { measurement_system } = json_bundle.overlays.unit;
      const attributeUnits =
        json_bundle.overlays.unit.attribute_units ||
        json_bundle.overlays.unit.attribute_unit ||
        {};
      const schema_attributes = hasAttributeOrdering
        ? getOrderedAttributeMap(orderingOverlay.attribute_ordering, attributeUnits)
        : attributeUnits;
      overlay_saids[layer_name] = said;
      overlay_texts.unit =
        `Layer name: ${layer_name}\n` +
        `SAID/digest: ${said}\n` +
        `Measurement system: ${measurement_system}\n` +
        "\n" +
        `Schema attributes: ${layer_name}\n` +
        `${Object.entries(schema_attributes)
          .map(([key, value]) => `    ${key}: ${value}`)
          .join("\n")}\n` +
        "\n";
    }

    if (Object.prototype.hasOwnProperty.call(json_bundle.overlays, "conformance")) {
      const said = json_bundle.overlays.conformance.d;
      const schema_attributes = hasAttributeOrdering
        ? getOrderedAttributeMap(
            orderingOverlay.attribute_ordering,
            json_bundle.overlays.conformance.attribute_conformance
          )
        : json_bundle.overlays.conformance.attribute_conformance;
      const layer_name = json_bundle.overlays.conformance.type;
      overlay_saids[layer_name] = said;
      overlay_texts.conformance =
        `Layer name: ${layer_name}\n` +
        `SAID/digest: ${said}\n` +
        "\n" +
        `Schema attributes: ${layer_name}\n` +
        `${Object.entries(schema_attributes)
          .map(([key, value]) => `    ${key}: ${value}`)
          .join("\n")}\n` +
        "\n";
    }

    if (
      Object.prototype.hasOwnProperty.call(json_bundle.overlays, "character_encoding")
    ) {
      const said = json_bundle.overlays.character_encoding.d;
      const layer_name = json_bundle.overlays.character_encoding.type;
      const schema_attributes = hasAttributeOrdering
        ? getOrderedAttributeMap(
            orderingOverlay.attribute_ordering,
            json_bundle.overlays.character_encoding.attribute_character_encoding
          )
        : json_bundle.overlays.character_encoding.attribute_character_encoding;
      overlay_saids[layer_name] = said;
      overlay_texts.character_encoding =
        `Layer name: ${layer_name}\n` +
        `SAID/digest: ${said}\n` +
        "\n" +
        `Schema attributes: ${layer_name}\n` +
        `${Object.entries(schema_attributes)
          .map(([key, value]) => `    ${key}: ${value}`)
          .join("\n")}\n` +
        "\n";
    }

    if (Object.prototype.hasOwnProperty.call(json_bundle.overlays, "format")) {
      const said = json_bundle.overlays.format.d;
      const layer_name = json_bundle.overlays.format.type;
      const schema_attributes = hasAttributeOrdering
        ? getOrderedAttributeMap(
            orderingOverlay.attribute_ordering,
            json_bundle.overlays.format.attribute_formats
          )
        : json_bundle.overlays.format.attribute_formats;
      overlay_saids[layer_name] = said;
      overlay_texts.format =
        `Layer name: ${layer_name}\n` +
        `SAID/digest: ${said}\n` +
        "\n" +
        `Schema attributes: ${layer_name}\n` +
        `${Object.entries(schema_attributes)
          .map(([key, value]) => `    ${key}: ${value}`)
          .join("\n")}\n` +
        "\n";
    }

    if (Object.prototype.hasOwnProperty.call(json_bundle.overlays, "entry_code")) {
      const said = json_bundle.overlays.entry_code.d;
      const layer_name = json_bundle.overlays.entry_code.type;
      const schema_attributes = hasEntryCodeOrdering
        ? orderingOverlay.entry_code_ordering
        : json_bundle.overlays.entry_code.attribute_entry_codes;
      overlay_saids[layer_name] = said;
      overlay_texts.entry_code =
        `Layer name: ${layer_name}\n` +
        `SAID/digest: ${said}\n` +
        "\n" +
        `Schema attributes: ${layer_name}\n` +
        `${Object.entries(schema_attributes)
          .map(([key, value]) => `    ${key}: [${value}]`)
          .join("\n")}\n` +
        "\n";
    }

    if (json_bundle.overlays.entry !== undefined) {
      const entry_overlays_txt = [];
      for (const overlay of json_bundle.overlays.entry) {
        const said = overlay.d;
        const layer_name = overlay.type;
        const lang = overlay.language;
        const schema_attributes = hasEntryCodeOrdering
          ? getOrderedEntries(
              orderingOverlay.entry_code_ordering,
              overlay.attribute_entries
            )
          : overlay.attribute_entries;
        overlay_saids[`${layer_name} (${lang})`] = said;
        entry_overlays_txt.push(
          `Layer name: ${layer_name}\n` +
            `SAID/digest: ${said}\n` +
            `Schema attributes: ${layer_name}\n` +
            `${Object.entries(schema_attributes)
              .map(([key, value]) => {
                if (typeof value === "object" && value !== null) {
                  return `    ${key}: ${Object.values(value).join(", ")}`;
                }
                return `    ${key}: ${value}`;
              })
              .join("\n")}\n\n`
        );
      }
      overlay_texts.entry = entry_overlays_txt.join("");
    }

    // Step 4: --- Constructing OCA ReadMe file
    const manifest = [];
    Object.entries(overlay_saids).forEach(([key, value]) => {
      manifest.push(`${key} SAID/digest: "${value}"\n`);
    });

    // Add SAIDs of extension overlays
    if (ocaPackage?.extensions?.length > 0) {
      // For now, use the first set of extension overlays (associated with the main/top-level schema bundle)
      // TODO: Add support for extension overlays of nested schema bundles
      const { overlays } = ocaPackage.extensions[0];
      manifest.push("\n");
      Object.values(overlays).forEach((overlay) => {
        manifest.push(`${overlay.type} SAID/digest: "${overlay.d}"\n`);
      });
    }

    text_file.push(...manifest);
    text_file.push(
      "******************************************************************\n",
      "END_OCA_MANIFEST\n\n",
      "BEGIN_OCA_BUNDLE\n",
      "******************************************************************\n"
    );
    text_file.push(overlay_texts.capture_base);
    text_file.push(
      "******************************************************************\n"
    );
    if (overlay_texts.meta) {
      text_file.push(overlay_texts.meta);
      text_file.push(
        "******************************************************************\n"
      );
    }
    if (Object.prototype.hasOwnProperty.call(overlay_texts, "label")) {
      text_file.push(overlay_texts.label);
      text_file.push(
        "******************************************************************\n"
      );
    }
    if (Object.prototype.hasOwnProperty.call(overlay_texts, "information")) {
      text_file.push(overlay_texts.information);
      text_file.push(
        "******************************************************************\n"
      );
    }
    if (Object.prototype.hasOwnProperty.call(overlay_texts, "unit")) {
      text_file.push(overlay_texts.unit);
      text_file.push(
        "******************************************************************\n"
      );
    }
    if (Object.prototype.hasOwnProperty.call(overlay_texts, "conformance")) {
      text_file.push(overlay_texts.conformance);
      text_file.push(
        "******************************************************************\n"
      );
    }
    if (Object.prototype.hasOwnProperty.call(overlay_texts, "character_encoding")) {
      text_file.push(overlay_texts.character_encoding);
      text_file.push(
        "******************************************************************\n"
      );
    }
    if (Object.prototype.hasOwnProperty.call(overlay_texts, "format")) {
      text_file.push(overlay_texts.format);
      text_file.push(
        "******************************************************************\n"
      );
    }
    if (Object.prototype.hasOwnProperty.call(overlay_texts, "entry_code")) {
      text_file.push(overlay_texts.entry_code);
      text_file.push(
        "******************************************************************\n"
      );
    }
    if (Object.prototype.hasOwnProperty.call(overlay_texts, "entry")) {
      text_file.push(overlay_texts.entry);
      text_file.push(
        "******************************************************************\n"
      );
    }

    text_file.push("END_OCA_BUNDLE\n");

    if (ocaPackage?.extensions?.length > 0) {
      text_file.push(
        "\n",
        "BEGIN_OCA_PACKAGE_EXTENSIONS\n",
        "******************************************************************\n"
      );

      ocaPackage.extensions.forEach((extension) => {
        const extensionOverlays = extension.overlays;
        if (Object.prototype.hasOwnProperty.call(extensionOverlays, "ordering")) {
          const orderingOverlay = extensionOverlays.ordering;
          const entryCodeOrdering = orderingOverlay?.entry_code_ordering || {};
          const hasAttributeOrdering = orderingOverlay.attribute_ordering?.length > 0;
          const hasEntryCodeOrdering = Object.keys(entryCodeOrdering).length > 0;

          text_file.push(
            `Layer name: ${orderingOverlay.type}\n`,
            `SAID/digest: ${orderingOverlay.d}\n`
          );

          if (hasAttributeOrdering) {
            text_file.push(
              `Attribute ordering: ${orderingOverlay.attribute_ordering.join(", ")}\n`
            );
          }

          if (hasEntryCodeOrdering) {
            text_file.push("Entry code ordering:\n");
            Object.entries(entryCodeOrdering).forEach(([key, value]) => {
              text_file.push(`    ${key}: ${value.join(", ")}\n`);
            });
          }

          text_file.push(
            "\n",
            "******************************************************************\n"
          );
        }
      });

      text_file.push("END_OCA_PACKAGE_EXTENSIONS\n");
    }

    const text = text_file.join("");
    const textBlob = new Blob([text], { type: "text/plain" });
    const downloadUrl = URL.createObjectURL(textBlob);
    const descriptiveFileName = getDescriptiveFileName(
      schemaDescription,
      "README_OCA_schema.txt"
    );

    const link = document.createElement("a");
    link.href = downloadUrl;
    link.download = descriptiveFileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  return { jsonToTextFile };
};

export default useGenerateReadMeV2;
