import { OcaPackage } from "oca_package";
import {
  getRangeOverlayInput,
  getTransformedEntryCodes,
  getUnitFramingInput,
  getAttributeFramingInput
} from "../constants/utils";
import {
  ORDERING,
  UNIT_FRAMING,
  UNIT_FRAME_ID,
  UNIT_FRAME_LABEL,
  UNIT_FRAME_LOCATION,
  UNIT_FRAME_VERSION,
  SENSITIVE,
  FIELD_RANGE_OVERLAY,
  RANGE,
  ATTRIBUTE_FRAMING
} from "../constants/constants";

// This function builds a full OCAPackage from the editor context
export default async function buildOCAPackageFromEditor({
  attributeRowData,
  attributesList,
  savedEntryCodes,
  formatRuleRowData,
  currentUnitFramedRowData,
  overlay,
  rangeRowData,
  attributeFramingRowData
}) {
  // ...existing logic from useExportLogicV2.js...
  // This is a simplified version for visualization only

  // Build OCA file text (simulate buildOCAText)
  // For visualization, we can skip the actual file text and focus on overlays/bundle

  // Prepare overlays and bundle
  const filteredEntryCodes = {};
  attributesList?.forEach((attribute, idx) => {
    if (attributeRowData[idx]?.List && savedEntryCodes?.[attribute]) {
      filteredEntryCodes[attribute] = savedEntryCodes[attribute];
    }
  });

  const sensitiveAttributes = attributeRowData
    .filter((item) => item.Flagged)
    .map((item) => item.Attribute);

  const rangeOverlayInput = getRangeOverlayInput(rangeRowData, formatRuleRowData);
  const retainedUniqueFramedUnits =
    currentUnitFramedRowData?.filter((row) => !row.deleted) || [];

  const extension_overlay_object = {
    ordering_overlay: {
      type: ORDERING,
      attribute_ordering: attributesList,
      entry_code_ordering: getTransformedEntryCodes(filteredEntryCodes)
    },
    ...(overlay?.["Unit Framing"]?.selected && {
      unit_framing_overlay: {
        type: UNIT_FRAMING,
        properties: {
          id: UNIT_FRAME_ID,
          label: UNIT_FRAME_LABEL,
          location: UNIT_FRAME_LOCATION,
          version: UNIT_FRAME_VERSION
        },
        units: getUnitFramingInput(retainedUniqueFramedUnits)
      }
    }),
    ...(overlay?.[FIELD_RANGE_OVERLAY]?.selected && {
      range_overlay: {
        type: RANGE,
        attributes: rangeOverlayInput
      }
    }),
    ...(sensitiveAttributes.length > 0 && {
      sensitive_overlay: {
        type: SENSITIVE,
        sensitive_attributes: sensitiveAttributes
      }
    }),
    ...(overlay?.["Attribute Framing"]?.selected &&
      Object.keys(getAttributeFramingInput(attributeFramingRowData)).length > 0 && {
        attribute_framing_overlay: {
          type: ATTRIBUTE_FRAMING,
          framing_metadata: {
            id: "FOODON",
            label: "Food Ontology",
            location:
              "https://raw.githubusercontent.com/FoodOntology/foodon/master/foodon.owl",
            version: "1.0"
          },
          attributes: getAttributeFramingInput(attributeFramingRowData)
        }
      })
  };

  const extension = {
    extensions: {
      ADC: {
        // Use a dummy bundle id for visualization
        bundle_id: [extension_overlay_object]
      }
    }
  };

  // Simulate bundle structure
  const bundle = {
    bundle: {
      d: "bundle_id",
      overlays: extension_overlay_object,
      capture_base: {
        attributes: Object.fromEntries(
          attributesList?.map((attr, idx) => [
            attr,
            attributeRowData[idx]?.Type || "Text"
          ])
        )
      }
    }
  };

  // Use OcaPackage to generate the full package
  const ocaPackageService = new OcaPackage(extension, bundle);
  const ocaPackage = JSON.parse(ocaPackageService.GenerateOcaPackage());

  return ocaPackage;
}
