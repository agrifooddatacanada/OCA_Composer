import { Slot, Enum, LinkMLSchema, OCABundle, CaptureBase } from "./types.ts";

type OverlayName = keyof OCABundle["overlays"];

type OverlaySpec = {
  name: OverlayName;
  type: string;
  key: string;
  data: Record<string, any>;
};

// Helper: build an overlay block only if data has keys
function buildOverlay<T extends string>(
  type: string,
  key: T,
  data: Record<string, any>
): Record<string, any> | null {
  if (Object.keys(data).length === 0) return null;
  return {
    type,
    capture_base: "",
    language: "en",
    [key]: data
  };
}

// Build overlays from enums used in slots
function buildEntryOverlays(
  slots: Record<string, Slot>,
  enums: Record<string, Enum>
) {

  const entry_code_data: Record<string, string[]> = {};
  const entry_data: Record<string, Record<string, string>> = {};

  for (const [slotName, slot] of Object.entries(slots)) {
    const enumName = slot.range;
    const enumDef = enums[enumName];
    if (!enumDef) continue;

    // For "Entry Code" overlay
    entry_code_data[slotName] = Object.keys(enumDef.permissible_values || {});

    // For "Entry" overlay
    entry_data[slotName] = Object.fromEntries(
      Object.entries(enumDef.permissible_values || {}).map(([code, value]) => [
        code,
        value.description || code
      ])
    );
  }

  const overlays: Partial<OCABundle["overlays"]> = {};

  if (Object.keys(entry_code_data).length > 0) {
    overlays.entry_code = [
      {
        type: "spec/overlays/entry_code/1.0",
        capture_base: "",
        language: "en",
        attribute_entry_codes: entry_code_data
      }
    ];
  }

  if (Object.keys(entry_data).length > 0) {
    overlays.entry = [
      {
        type: "spec/overlays/entry/1.0",
        capture_base: "",
        language: "en",
        attribute_entries: entry_data
      }
    ];
  }

  return overlays;
}

export function buildOverlays(
  slots: Record<string, Slot>,
  enums: Record<string, Enum>,
  linkmlSchema: { name: string; description?: string }
): { overlays: Partial<OCABundle["overlays"]> } {
  const overlays: Partial<OCABundle["overlays"]> = {};

  const overlaySpecs: OverlaySpec[] = [
    {
      name: "format",
      type: "spec/overlays/format/1.0",
      key: "attribute_formats",
      data: Object.fromEntries(
        Object.entries(slots).filter(([, s]) => s.pattern).map(([k, s]) => [k, s.pattern])
      )
    },
    {
      name: "information",
      type: "spec/overlays/information/1.0",
      key: "attribute_information",
      data: Object.fromEntries(
        Object.entries(slots).filter(([, s]) => s.description).map(([k, s]) => [k, s.description])
      )
    },
    {
      name: "label",
      type: "spec/overlays/label/1.0",
      key: "attribute_labels",
      data: Object.fromEntries(
        Object.entries(slots).filter(([, s]) => s.title).map(([k, s]) => [k, s.title])
      )
    },
    {
      name: "standard",
      type: "spec/overlays/standard/1.0",
      key: "attr_standards",
      data: Object.fromEntries(
        Object.entries(slots).filter(([, s]) => s.slot_uri).map(([k, s]) => [k, s.slot_uri])
      )
    },
    {
      name: "unit",
      type: "spec/overlays/unit/1.0",
      key: "attribute_units",
      data: Object.fromEntries(
        Object.entries(slots)
          .filter(([, slot]) => slot.unit?.ucum_code)
          .map(([key, slot]) => [key, slot.unit?.ucum_code || ""])
      )
    }
  ];

  overlaySpecs.forEach(({ name, type, key, data }) => {
    const overlay = buildOverlay(type, key, data);
    if (overlay) {
      (overlays as any)[name] = [overlay];
    }
  });

  // Meta overlay
  const metaOverlay = {
    type: "spec/overlays/meta/1.0",
    capture_base: "",
    language: "en",
    name: linkmlSchema.name,
    description: linkmlSchema.description || ""
  };
  if (metaOverlay.name || metaOverlay.description) {
    overlays.meta = [metaOverlay];
  }

  // Add entry/entry_code overlays
  const entryOverlays = buildEntryOverlays(slots, enums);
  Object.assign(overlays, entryOverlays);

  return { overlays };
}



/**
 * Maps a LinkML schema to an OCA bundle structure.
 */
export function mapLinkMLToOCABundle(linkmlSchema: LinkMLSchema): OCABundle {
  const slots = linkmlSchema.slots || {};
  const enums = linkmlSchema.enums || {};

  // Extract OCA attributes and flagged attributes
  const attributes: Record<string, string> = Object.fromEntries(
    Object.entries(slots).map(([key, slot]) => {
      let range = "Text";
  
      if (["integer", "decimal", "float"].includes(slot.range)) {
        range = "Numeric";
      }

      if (slot.range === "datetime") {
        range = "Datetime";
      }
  
      // OCA does not support Event or Type?
      if (/Event|Type/.test(slot.range)) {
        range = "";
      }
  
      return [key, range];
    })
  );

  const flaggedAttributes: string[] = Object.entries(slots)
    .filter(([, slot]) => slot.annotations?.flagged)
    .map(([key]) => key);

  // Define capture_base separately
  const capture_base: CaptureBase = {
    type: "spec/capture_base/1.0",
    // digest: "",
    language: "en",
    attributes,
    flagged_attributes: flaggedAttributes
  };

  const { overlays } = buildOverlays(slots, enums, linkmlSchema);

  return {
    capture_base,
    overlays
  };
}
