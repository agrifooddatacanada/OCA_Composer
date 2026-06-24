import {
  TYPE_CHILD_SCHEMA,
  TYPE_PLACEHOLDER_CHILD_SCHEMA
} from "../constants/constants";

export function resolveChildSchemaStateRootId(attr) {
  if (!attr) return null;
  const ot = attr.OriginalType;
  if (typeof ot === "string") {
    if (ot.startsWith("refs:")) return ot.slice(5);
    if (ot.startsWith("refn:")) return ot.slice(5);
  }
  const ty = attr.Type;
  if (typeof ty === "string" && ty.startsWith("refs:")) return ty.slice(5);
  if (typeof ty === "string" && ty.startsWith("refn:")) return ty.slice(5);
  if (ty === TYPE_CHILD_SCHEMA || ty === TYPE_PLACEHOLDER_CHILD_SCHEMA) return attr.Attribute;
  return null;
}

function childSchemaIdFromAttr(type, attributeName) {
  if (!type || typeof type !== "string") return null;
  const t = type.trim();
  if (t.startsWith("refs:")) return t.slice(5);
  if (t.startsWith("refn:")) return t.slice(5);
  if (t === TYPE_CHILD_SCHEMA || t === TYPE_PLACEHOLDER_CHILD_SCHEMA) return attributeName;
  return null;
}

export function collectDescendantSchemaIds(rootId, allStates) {
  const toRemove = new Set();
  const stack = [rootId];
  while (stack.length) {
    const id = stack.pop();
    if (!id || toRemove.has(id)) continue;
    toRemove.add(id);
    const state = allStates[id];
    if (!state?.attributes) continue;
    for (const attr of state.attributes) {
      const cid = childSchemaIdFromAttr(attr.Type, attr.Attribute);
      if (cid && allStates[cid]) stack.push(cid);
    }
  }
  return toRemove;
}
