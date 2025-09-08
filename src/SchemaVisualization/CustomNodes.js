/**
 * Custom node components for schema visualization
 */
import React from "react";
import { Handle, Position, NodeToolbar } from "@xyflow/react";
import EditIcon from "@mui/icons-material/Edit";
import "./SchemaVisualization.css";
import { useTranslation } from "react-i18next";

// Constants
// Constants
const FIELD_NAME_MAX_LENGTH = 35;

// Helper function to get display type for fields
const getFieldDisplayType = (field) => {
  if (field.isReference) return "Child Schema";
  if (field.isPlaceholder) return "Placeholder Child Schema";
  return field.type;
};

// Helper component for field handles
const FieldHandle = ({ field }) => (
  <Handle
    type="source"
    position={Position.Right}
    id={`${field.originalName || field.name}`}
    style={{
      right: "-7px",
      top: "50%",
      background: "#ccc",
      border: "1px solid white",
      width: "10px",
      height: "10px"
    }}
  />
);

/**
 * Placeholder Node Component - represents potential extension points
 */
export const PlaceholderNode = ({ data }) => {
  const { t } = useTranslation();
  const isRootNode = data.nodeId === "root";
  const isHighlighted = isRootNode
    ? data.currentSchemaId === data.rootId || data.currentSchemaId === "root"
    : data.currentSchemaId === data.nodeId;

  // Extract the name from the label (remove any existing "placeholder" text)
  const label = data.label || "Placeholder Child Schema";
  const name = label.replace(/\s*\(placeholder.*?\)/i, "").trim();
  const displayName = name || "Placeholder";

  return (
    <div className={`placeholder-node ${isHighlighted ? "highlighted" : ""}`}>
      <Handle type="target" position={Position.Top} />
      <div className="placeholder-node-content">
        <div className="placeholder-label">
          <div className="placeholder-name">{displayName}</div>
          <div className="placeholder-status">{t("(placeholder)")}</div>
        </div>
        {data.onNodeClick && (
          <button
            type="button"
            className="edit-schema-button-icon"
            onClick={(e) => {
              e.stopPropagation();
              data.onNodeClick(data.nodeId);
            }}
            title="Edit this schema"
          >
            <EditIcon sx={{ fontSize: 16 }} />
          </button>
        )}
      </div>
    </div>
  );
};

/**
 * Tree Node Component - represents schema entities in tree view
 */
export const TreeNode = ({ data }) => {
  const isRootNode = data.nodeId === "root";
  const isHighlighted = isRootNode
    ? data.currentSchemaId === data.rootId || data.currentSchemaId === "root"
    : data.currentSchemaId === data.nodeId;

  return (
    <div className={`tree-node ${isHighlighted ? "highlighted" : ""}`}>
      <Handle type="target" position={Position.Top} />
      <Handle type="source" position={Position.Bottom} />
      <div className="tree-node-content">
        <div className="tree-node-label">{data.label}</div>
        {data.onNodeClick && (
          <button
            type="button"
            className="edit-schema-button-icon"
            onClick={(e) => {
              e.stopPropagation();
              data.onNodeClick(data.nodeId);
            }}
            title="Edit this schema"
          >
            <EditIcon sx={{ fontSize: 16 }} />
          </button>
        )}
      </div>
    </div>
  );
};

/**
 * Detailed Node Component - represents schema entities with fields in left-to-right layout
 */
export const DetailedNode = ({ data }) => {
  const { title, fields = [], nodeType } = data;

  // Sort fields to prioritize child schemas and placeholder child schemas first
  const sortedFields = [...fields].sort((a, b) => {
    // References come first
    if (a.isReference && !b.isReference) return -1;
    if (!a.isReference && b.isReference) return 1;

    // Placeholders come second
    if (a.isPlaceholder && !b.isPlaceholder) return -1;
    if (!a.isPlaceholder && b.isPlaceholder) return 1;

    // Keep original order for fields of same type
    return 0;
  });

  // Separate child schemas/placeholder child schemas from regular fields
  const childSchemas = sortedFields.filter(
    (field) => field.isReference || field.isPlaceholder
  );
  const regularFields = sortedFields.filter(
    (field) => !field.isReference && !field.isPlaceholder
  );

  // Always show all child schemas and placeholder child schemas, then add regular fields up to the limit
  const maxRegularFields =
    nodeType === "root"
      ? Math.max(0, 8 - childSchemas.length)
      : Math.max(0, 3 - childSchemas.length);
  const visibleRegularFields = regularFields.slice(0, maxRegularFields);

  const visibleFields = [...childSchemas, ...visibleRegularFields];
  const hiddenFieldsCount = regularFields.length - visibleRegularFields.length;

  // Prepare tooltip content for truncated fields
  const truncatedFields = visibleFields.filter((field) => {
    const originalName = field.originalName || field.name || "";
    return originalName.length > FIELD_NAME_MAX_LENGTH;
  });

  // Only show toolbar if there's actually content to display
  const showToolbar = truncatedFields.length > 0 || hiddenFieldsCount > 0;

  const isRootNode = data.nodeId === "root";
  const isHighlighted = isRootNode
    ? data.currentSchemaId === data.rootId || data.currentSchemaId === "root"
    : data.currentSchemaId === data.nodeId;

  return (
    <>
      {showToolbar && (
        <NodeToolbar
          isVisible={data.forceToolbarVisible || undefined}
          position={Position.Top}
          style={{
            background: "rgba(0, 0, 0, 0.9)",
            color: "white",
            padding: "8px 12px",
            borderRadius: "6px",
            fontSize: "12px",
            maxWidth: "400px",
            whiteSpace: "pre-line"
          }}
        >
          {truncatedFields.length > 0 && (
            <div style={{ marginBottom: "8px" }}>
              <strong>Full field names:</strong>
              {truncatedFields.map((field) => (
                <div key={field.originalName || field.name}>
                  • {field.originalName || field.name} ({getFieldDisplayType(field)})
                </div>
              ))}
            </div>
          )}
          {hiddenFieldsCount > 0 && (
            <div>
              <strong>Hidden fields ({hiddenFieldsCount}):</strong>
              {regularFields.slice(maxRegularFields).map((field) => (
                <div key={field.originalName || field.name}>
                  • {field.originalName || field.name} ({getFieldDisplayType(field)})
                </div>
              ))}
            </div>
          )}
        </NodeToolbar>
      )}

      <div className={`detailed-node ${nodeType} ${isHighlighted ? "highlighted" : ""}`}>
        {/* Only show input handle for non-root nodes */}
        {nodeType !== "root" && (
          <Handle type="target" position={Position.Left} style={{ top: "20px" }} />
        )}

        <div className="detailed-header">
          <span>{title}</span>
          {data.onNodeClick && (
            <button
              type="button"
              className="edit-schema-button-header"
              onClick={(e) => {
                e.stopPropagation();
                if (data.onNodeClick) {
                  data.onNodeClick(data.nodeId);
                }
              }}
              title="Edit this schema"
            >
              Edit
            </button>
          )}
        </div>

        <div className="detailed-fields">
          {visibleFields.map((field, index) => {
            const fieldName = field.name || "";
            const originalName = field.originalName || fieldName;
            const isLong = originalName.length > FIELD_NAME_MAX_LENGTH;

            return (
              <div
                key={field.originalName || field.name || `field-${index}`}
                className={`field ${field.isReference ? "Reference" : field.isPlaceholder ? "Placeholder" : field.type}`}
              >
                <span
                  className="field-name"
                  style={{
                    cursor: isLong ? "help" : "default",
                    textDecoration: isLong ? "underline dotted" : "none"
                  }}
                >
                  {fieldName}
                </span>
                <span className="field-type">{getFieldDisplayType(field)}</span>
                {(field.isReference || field.isPlaceholder) && (
                  <FieldHandle field={field} />
                )}
              </div>
            );
          })}

          {/* Show hidden field count if there are any */}
          {hiddenFieldsCount > 0 && (
            <div
              className="field hidden-fields-indicator"
              style={{ fontStyle: "italic", color: "#666" }}
            >
              <span
                className="field-name"
                style={{
                  cursor: "help",
                  textDecoration: "underline dotted"
                }}
                title="Select node to see hidden fields"
              >
                ... {hiddenFieldsCount} more field{hiddenFieldsCount > 1 ? "s" : ""}
              </span>
              <span className="field-type" />
            </div>
          )}
        </div>
      </div>
    </>
  );
};
