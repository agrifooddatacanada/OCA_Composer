/**
 * Custom node components for schema visualization
 *
 * TERMINOLOGY:
 * - isReference: true when the field type is refs:SAID (linked child schema)
 * - isPlaceholder: true when the field type is refn:name (placeholder child schema)
 * - isMaterializedChildSchema: refn: whose dependency already has attributes (show as Child Schema)
 * - Both display as "Child Schema" variants to the user
 */
import React, { useMemo } from "react";
import { Handle, Position } from "@xyflow/react";
import EditIcon from "@mui/icons-material/Edit";
import Tooltip from "@mui/material/Tooltip";
import "./SchemaVisualization.css";
import { useTranslation } from "react-i18next";
import { TYPE_CHILD_SCHEMA } from "../constants/constants";

// Constants
const FIELD_NAME_MAX_LENGTH = 35;

const TREE_ATTR_TOOLTIP_FONT_PX = 12;
const TREE_ATTR_TOOLTIP_LINE_HEIGHT = 1.4;
const TREE_ATTR_TOOLTIP_VISIBLE_LINES = 6;
const TREE_ATTR_TOOLTIP_LIST_MAX_PX = Math.round(
  TREE_ATTR_TOOLTIP_FONT_PX *
    TREE_ATTR_TOOLTIP_LINE_HEIGHT *
    TREE_ATTR_TOOLTIP_VISIBLE_LINES
);

const TREE_ATTR_TOOLTIP_SCROLL_AFTER_LINES = 5;
const DETAILED_HIDDEN_FIELDS_SCROLL_AFTER_LINES = 6;

/**
 * Get display type for a field in the visualization
 * @param {Object} field - Field object with isReference, isPlaceholder, and type properties
 * @returns {string} Human-readable type for display
 */
const getFieldDisplayType = (field) => {
  if (field.isReference || field.isMaterializedChildSchema) {
    return TYPE_CHILD_SCHEMA;
  }
  if (field.isPlaceholder) return "Placeholder Child Schema";
  return field.type;
};

function TreeAttributesPopover({ fields, t }) {
  const list = fields || [];
  const tooltipTitle = useMemo(() => {
    const needsScroll = list.length > TREE_ATTR_TOOLTIP_SCROLL_AFTER_LINES;
    return (
      <div>
        <strong>{t("tree node field count", { count: list.length })}:</strong>
        <div
          style={{
            marginTop: 6,
            fontSize: TREE_ATTR_TOOLTIP_FONT_PX,
            lineHeight: TREE_ATTR_TOOLTIP_LINE_HEIGHT,
            ...(needsScroll
              ? {
                  maxHeight: TREE_ATTR_TOOLTIP_LIST_MAX_PX,
                  overflowY: "auto"
                }
              : { overflowY: "visible" })
          }}
        >
          {list.map((field, index) => (
            <div key={field.originalName || field.name || `attr-${index}`}>
              • {field.originalName || field.name} ({t(getFieldDisplayType(field))})
            </div>
          ))}
        </div>
      </div>
    );
  }, [list, t]);

  if (list.length === 0) return null;

  return (
    <Tooltip
      title={tooltipTitle}
      placement="top"
      arrow
      enterDelay={300}
      enterTouchDelay={0}
      leaveDelay={200}
      PopperProps={{ style: { zIndex: 5000 } }}
      componentsProps={{
        tooltip: {
          sx: {
            bgcolor: "#000",
            color: "#fff",
            maxWidth: 400,
            textAlign: "left",
            fontSize: `${TREE_ATTR_TOOLTIP_FONT_PX}px`,
            lineHeight: TREE_ATTR_TOOLTIP_LINE_HEIGHT,
            "& .MuiTooltip-arrow": { color: "#000" }
          }
        },
        arrow: { sx: { color: "#000" } }
      }}
    >
      <button
        type="button"
        className="tree-node-attributes-button nodrag nopan"
        onClick={(e) => e.stopPropagation()}
      >
        {t("tree node field count", { count: list.length })}
      </button>
    </Tooltip>
  );
}

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
          {data.labelFull && data.labelFull !== data.label ? (
            <Tooltip
              title={data.labelFull}
              placement="top"
              arrow
              enterDelay={300}
              enterTouchDelay={0}
              PopperProps={{ style: { zIndex: 5000 } }}
            >
              <div className="placeholder-name tree-node-label-truncated">
                {displayName}
              </div>
            </Tooltip>
          ) : (
            <div className="placeholder-name">{displayName}</div>
          )}
          <div className="placeholder-status">{t("(placeholder)")}</div>
        </div>
        <TreeAttributesPopover fields={data.fields || []} t={t} />
        {data.onNodeClick && (
          <button
            type="button"
            className="edit-schema-button-icon"
            onClick={(e) => {
              e.stopPropagation();
              data.onNodeClick(data.nodeId);
            }}
            title={t("Edit this schema")}
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
  const { t } = useTranslation();
  const isRootNode = data.nodeId === "root";
  const isHighlighted = isRootNode
    ? data.currentSchemaId === data.rootId || data.currentSchemaId === "root"
    : data.currentSchemaId === data.nodeId;

  return (
    <div className={`tree-node ${isHighlighted ? "highlighted" : ""}`}>
      <Handle type="target" position={Position.Top} />
      <Handle type="source" position={Position.Bottom} />
      <div className="tree-node-content">
        {data.labelFull && data.labelFull !== data.label ? (
          <Tooltip
            title={data.labelFull}
            placement="top"
            arrow
            enterDelay={300}
            enterTouchDelay={0}
            PopperProps={{ style: { zIndex: 5000 } }}
          >
            <div className="tree-node-label tree-node-label-truncated">{data.label}</div>
          </Tooltip>
        ) : (
          <div className="tree-node-label">{data.label}</div>
        )}
        <TreeAttributesPopover fields={data.fields || []} t={t} />
        {data.onNodeClick && (
          <button
            type="button"
            className="edit-schema-button-icon"
            onClick={(e) => {
              e.stopPropagation();
              data.onNodeClick(data.nodeId);
            }}
            title={t("Edit this schema")}
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
  const { t } = useTranslation();
  const { title, titleFull, fields = [], nodeType } = data;
  const headerFullName = titleFull ?? title;
  const headerTruncated = headerFullName !== title;

  // Sort fields to prioritize child schemas and placeholder child schemas first
  const sortedFields = [...fields].sort((a, b) => {
    const aChild = a.isReference || a.isMaterializedChildSchema;
    const bChild = b.isReference || b.isMaterializedChildSchema;
    // References / materialized refn come first
    if (aChild && !bChild) return -1;
    if (!aChild && bChild) return 1;

    // Placeholders come second
    if (a.isPlaceholder && !b.isPlaceholder) return -1;
    if (!a.isPlaceholder && b.isPlaceholder) return 1;

    // Keep original order for fields of same type
    return 0;
  });

  // Separate child schemas/placeholder child schemas from regular fields
  const childSchemas = sortedFields.filter(
    (field) => field.isReference || field.isPlaceholder || field.isMaterializedChildSchema
  );
  const regularFields = sortedFields.filter(
    (field) =>
      !field.isReference && !field.isPlaceholder && !field.isMaterializedChildSchema
  );

  // Always show all child schemas and placeholder child schemas, then add regular fields up to the limit
  const maxRegularFields =
    nodeType === "root"
      ? Math.max(0, 8 - childSchemas.length)
      : Math.max(0, 3 - childSchemas.length);
  const visibleRegularFields = regularFields.slice(0, maxRegularFields);

  const visibleFields = [...childSchemas, ...visibleRegularFields];
  const hiddenFieldsCount = regularFields.length - visibleRegularFields.length;

  const hiddenFieldsTooltipTitle = useMemo(() => {
    const rows = regularFields.slice(maxRegularFields);
    const needsScroll = rows.length > DETAILED_HIDDEN_FIELDS_SCROLL_AFTER_LINES;
    return (
      <div>
        <strong>Hidden fields ({hiddenFieldsCount}):</strong>
        <div
          style={{
            marginTop: 6,
            fontSize: TREE_ATTR_TOOLTIP_FONT_PX,
            lineHeight: TREE_ATTR_TOOLTIP_LINE_HEIGHT,
            ...(needsScroll
              ? {
                  maxHeight: TREE_ATTR_TOOLTIP_LIST_MAX_PX,
                  overflowY: "auto"
                }
              : { overflowY: "visible" })
          }}
        >
          {rows.map((field) => (
            <div key={field.originalName || field.name}>
              • {field.originalName || field.name} ({t(getFieldDisplayType(field))})
            </div>
          ))}
        </div>
      </div>
    );
  }, [regularFields, maxRegularFields, hiddenFieldsCount, t]);

  const isRootNode = data.nodeId === "root";
  const isHighlighted = isRootNode
    ? data.currentSchemaId === data.rootId || data.currentSchemaId === "root"
    : data.currentSchemaId === data.nodeId;

  return (
    <div className={`detailed-node ${nodeType} ${isHighlighted ? "highlighted" : ""}`}>
      {/* Only show input handle for non-root nodes */}
      {nodeType !== "root" && (
        <Handle type="target" position={Position.Left} style={{ top: "20px" }} />
      )}

      <div className="detailed-header">
        {headerTruncated ? (
          <Tooltip
            title={headerFullName}
            placement="top"
            arrow
            enterDelay={300}
            enterTouchDelay={0}
            PopperProps={{ style: { zIndex: 5000 } }}
          >
            <span
              className="detailed-header-title"
              style={{
                cursor: "help",
                textDecoration: "underline dotted"
              }}
            >
              {title}
            </span>
          </Tooltip>
        ) : (
          <span className="detailed-header-title">{title}</span>
        )}
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
            title={t("Edit this schema")}
          >
            {t("Edit")}
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
              className={`field ${
                field.isReference || field.isMaterializedChildSchema
                  ? "Reference"
                  : field.isPlaceholder
                    ? "Placeholder"
                    : field.type
              }`}
            >
              {isLong ? (
                <Tooltip
                  title={originalName}
                  placement="top"
                  arrow
                  enterDelay={300}
                  enterTouchDelay={0}
                  PopperProps={{ style: { zIndex: 5000 } }}
                >
                  <span
                    role="button"
                    tabIndex={0}
                    className="field-name nodrag nopan"
                    style={{
                      cursor: "help",
                      textDecoration: "underline dotted"
                    }}
                    onClick={(e) => e.stopPropagation()}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.stopPropagation();
                      }
                    }}
                  >
                    {fieldName}
                  </span>
                </Tooltip>
              ) : (
                <span className="field-name">{fieldName}</span>
              )}
              <span className="field-type">{t(getFieldDisplayType(field))}</span>
              {(field.isReference ||
                field.isPlaceholder ||
                field.isMaterializedChildSchema) && <FieldHandle field={field} />}
            </div>
          );
        })}

        {/* Show hidden field count if there are any */}
        {hiddenFieldsCount > 0 && (
          <div
            className="field hidden-fields-indicator"
            style={{ fontStyle: "italic", color: "#666" }}
          >
            <Tooltip
              title={hiddenFieldsTooltipTitle}
              placement="top"
              arrow
              enterDelay={300}
              enterTouchDelay={0}
              leaveDelay={200}
              PopperProps={{ style: { zIndex: 5000 } }}
              componentsProps={{
                tooltip: {
                  sx: {
                    bgcolor: "#000",
                    color: "#fff",
                    maxWidth: 400,
                    textAlign: "left",
                    fontSize: `${TREE_ATTR_TOOLTIP_FONT_PX}px`,
                    lineHeight: TREE_ATTR_TOOLTIP_LINE_HEIGHT,
                    "& .MuiTooltip-arrow": { color: "#000" }
                  }
                },
                arrow: { sx: { color: "#000" } }
              }}
            >
              <span
                role="button"
                tabIndex={0}
                className="field-name nodrag nopan"
                style={{
                  cursor: "help",
                  textDecoration: "underline dotted"
                }}
                onClick={(e) => e.stopPropagation()}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.stopPropagation();
                  }
                }}
              >
                ... {t("more fields", { count: hiddenFieldsCount })}
              </span>
            </Tooltip>
            <span className="field-type" />
          </div>
        )}
      </div>
    </div>
  );
};
