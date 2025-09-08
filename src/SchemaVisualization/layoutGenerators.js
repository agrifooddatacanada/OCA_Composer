/**
 * Layout generators for different visualization modes
 */
import dagre from "dagre";
import {
  createDependencyMap,
  processAttributes,
  getDependencyInfo,
  truncateText
} from "./dataUtils";

/**
 * DATA STRUCTURE DOCUMENTATION
 *
 * Node Structure:
 * Each node in the visualization has three distinct properties:
 *
 * - id: Unique technical identifier
 *   - Used by Dagre for layout calculations and React Flow as unique key
 *   - Must be globally unique across entire graph
 *   - Examples: "root", "AddressSchema", "placeholder-root-contact"
 *
 * - name/title: Display label for users
 *   - What users actually see on the node
 *   - Can be human-readable and localized
 *   - Examples: "Parent Schema", "Address Schema", "contact\n(placeholder child schema)"
 *
 * - type: Node behavior and rendering control
 *   - Determines React Flow node type mapping and CSS classes
 *   - Controls visual styling and rendering logic
 *   - Values: "root", "reference", "placeholder"
 *
 * Layout Modes:
 * - Tree Layout: Hierarchical parent-child structure, minimal node info (schema names only)
 * - Detailed Layout: Flat network of detailed nodes, all field information visible, connected by edges
 */

/**
 * Calculate node dimensions based on expected maximum content for consistent sizing
 * @param {Object} node - Node object with data
 * @param {string} viewMode - 'tree' or 'detailed' to determine sizing strategy
 * @returns {Object} Object with width and height properties
 */
const calculateNodeDimensions = (node, viewMode = "detailed") => {
  if (viewMode === "tree") {
    // Simple fixed size for tree view - uniform sizing for clean hierarchy
    return { width: 180, height: 60 };
  }

  // Complex sizing for detailed view based on expected content
  const nodeType = node.data?.nodeType;

  if (nodeType === "root") {
    // Root nodes: assume max 8 fields (as per our limit)
    const headerHeight = 50;
    const fieldHeight = 45;
    const maxFields = 8;
    const padding = 20;

    return {
      width: 300, // Wider for root nodes
      height: headerHeight + maxFields * fieldHeight + padding
    };
  }

  // Non-root nodes: expect 3 child schemas/placeholder child schemas + "...X more fields" indicator
  const headerHeight = 50;
  const fieldHeight = 45;
  const expectedVisibleFields = 3; // 3 child schemas/placeholder child schemas
  const extraRowForTruncation = 1; // There might be a "...more fields" row
  const padding = 20;

  return {
    width: 250, // Fixed width for consistent layout
    height:
      headerHeight +
      (expectedVisibleFields + extraRowForTruncation) * fieldHeight +
      padding
  };
};

/**
 * Apply Dagre layout to nodes and edges
 * @param {Array} nodes - Array of nodes
 * @param {Array} edges - Array of edges
 * @param {string} direction - Layout direction ('TB', 'LR', 'BT', 'RL')
 * @param {string} viewMode - 'tree' or 'detailed' for sizing strategy
 * @returns {Object} Object with layouted nodes and edges
 */
const getLayoutedElements = (nodes, edges, direction = "TB", viewMode = "detailed") => {
  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));

  // Configure graph with spacing - less spacing needed for tree view with uniform sizes
  const spacing =
    viewMode === "tree"
      ? { nodesep: 50, ranksep: 80, marginx: 20, marginy: 20 }
      : { nodesep: 80, ranksep: 150, marginx: 30, marginy: 30 };

  dagreGraph.setGraph({
    rankdir: direction,
    ...spacing
  });

  // Add nodes to dagre graph with calculated dimensions
  nodes.forEach((node) => {
    const dimensions = calculateNodeDimensions(node, viewMode);
    dagreGraph.setNode(node.id, {
      width: dimensions.width,
      height: dimensions.height
    });
  });

  // Add edges to dagre graph
  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  // Calculate layout
  dagre.layout(dagreGraph);

  // Apply positions back to nodes
  const layoutedNodes = nodes.map((node) => {
    const nodeWithPosition = dagreGraph.node(node.id);
    return {
      ...node,
      position: {
        x: nodeWithPosition.x - nodeWithPosition.width / 2,
        y: nodeWithPosition.y - nodeWithPosition.height / 2
      }
    };
  });

  return { nodes: layoutedNodes, edges };
};

/**
 * Generate hierarchical tree layout nodes and edges
 *
 * Tree Layout Approach:
 * - Uses recursive buildHierarchy function to create nested parent-child structure
 * - Creates minimal nodes showing only schema names and parent-child relationships; no field information
 * - No cycle detection needed as schema verification prevents cycles at earlier stage
 *
 * @param {Object} schemaData - Processed schema data with attributes, dependencies, and overlays
 * @param {string} language - Language code for labels (e.g., "eng", "fra")
 * @param {string} rootLabel - Translated label for the root node
 * @returns {Object} Object containing nodes and edges arrays
 */
export const generateTreeLayout = (
  schemaData,
  language = "eng",
  rootLabel = "Parent Schema",
  currentSchemaId = null
) => {
  // Expect attributes as we don't use viz where there is one root and no children
  if (!schemaData || !schemaData.attributes) {
    return { nodes: [], edges: [] };
  }

  const { attributes, dependencies, overlays } = schemaData;
  const dependencyMap = createDependencyMap(dependencies);

  // Get label overlay for attribute labels using the specified language
  const labelOverlay =
    overlays?.label?.find((l) => l.language === language) || overlays?.label?.[0] || {};

  // Recursive function to build hierarchical structure
  const buildHierarchy = ({
    nodeId,
    attributes: nodeAttributes,
    labelOverlay: nodeLabelOverlay,
    metaOverlay = null,
    nodeType
  }) => {
    const labels = nodeLabelOverlay?.attribute_labels || {};
    const nodeName = metaOverlay?.name ? metaOverlay.name : rootLabel;

    const nodeData = {
      id: nodeId,
      name: nodeName,
      type: nodeType,
      children: []
    };

    // Process all attributes to find child schemas and placeholder child schemas
    Object.entries(nodeAttributes).forEach(([key, value]) => {
      const isRefs = typeof value === "string" && value.startsWith("refs:");
      const isRefn = typeof value === "string" && value.startsWith("refn:");

      if (isRefs) {
        const refId = value.replace("refs:", "");
        const refDep = dependencyMap[refId];

        if (refDep) {
          const refLabelOverlays = refDep.overlays?.label;
          const refLabelOverlay = Array.isArray(refLabelOverlays)
            ? (refLabelOverlays.find((l) => l.language === language) || refLabelOverlays[0])
            : null;
          
          const refMetaOverlays = refDep.overlays?.meta;
          const refMetaOverlay = Array.isArray(refMetaOverlays)
            ? (refMetaOverlays.find((m) => m.language === language) || refMetaOverlays[0])
            : null;

          const childNode = buildHierarchy({
            nodeId: refId,
            attributes: refDep.capture_base.attributes,
            labelOverlay: refLabelOverlay,
            metaOverlay: refMetaOverlay,
            nodeType: "reference"
          });
          if (childNode) {
            nodeData.children.push(childNode);
          }
        }
      } else if (isRefn) {
        nodeData.children.push({
          id: key, // Use the field name (e.g., "q9") as the node ID
          name: labels[key] || key,
          type: "placeholder",
          children: []
        });
      }
    });

    return nodeData;
  };

  // Build the complete hierarchy starting from root
  const rootData = buildHierarchy({
    nodeId: "root",
    attributes,
    labelOverlay,
    metaOverlay: null,
    nodeType: "root"
  });

  if (!rootData) {
    return { nodes: [], edges: [] };
  }

  // Build nodes for Dagre layout
  const nodes = [];
  const edges = [];

  // Process nodes recursively to build flat structure for Dagre
  const processNodeForDagre = (nodeData, processedIds = new Set()) => {
    if (!nodeData || processedIds.has(nodeData.id)) return;
    processedIds.add(nodeData.id);

    const nodeLabel = truncateText(nodeData.name, 20);

    // Add node to nodes array
    nodes.push({
      id: nodeData.id,
      data: {
        label: nodeLabel,
        title: nodeLabel,
        fields: [],
        currentSchemaId,
        nodeId: nodeData.id
      },
      type: nodeData.type === "placeholder" ? "placeholderNode" : "treeNode",
      className: nodeData.type
    });

    // Process children and create edges
    if (nodeData.children) {
      nodeData.children.forEach((child) => {
        // Add edge from parent to child
        edges.push({
          id: `${nodeData.id}-${child.id}`,
          source: nodeData.id,
          target: child.id,
          type: "default",
          animated: child.type === "placeholder",
          style: {
            stroke: "#999",
            strokeWidth: 1
          }
        });

        // Recursively process child
        processNodeForDagre(child, processedIds);
      });
    }
  };

  // Start processing from parent
  processNodeForDagre(rootData);

  // Apply Dagre layout (Top-Bottom for tree view)
  const layoutedElements = getLayoutedElements(nodes, edges, "TB", "tree");

  return { nodes: layoutedElements.nodes, edges: layoutedElements.edges };
};

/**
 * Generate detailed-style left-to-right layout nodes and edges
 *
 * Detailed Layout Approach:
 * - Uses non-recursive processNode function to create flat network of detailed nodes
 * - Each node contains all its field information for detailed viewing
 * - Edges connect from specific fields to referenced child schema nodes
 * - sourceHandle identifies which field the connection originates from
 * - Results in network where schemas are separate nodes connected by field-to-schema edges
 *
 * @param {Object} schemaData - Processed schema data with attributes, dependencies, and overlays
 * @param {string} language - Language code for labels (e.g., "eng", "fra")
 * @param {string} rootLabel - Translated label for the root node
 * @returns {Object} Object containing nodes and edges arrays
 */
export const generateDetailedLayout = (
  schemaData,
  language = "eng",
  rootLabel = "Parent Schema",
  currentSchemaId = null
) => {
  if (!schemaData || !schemaData.attributes) {
    return { nodes: [], edges: [] };
  }

  const { attributes, dependencies } = schemaData;
  const dependencyMap = createDependencyMap(dependencies);

  const allNodes = new Map();
  const allEdges = [];

  const processNode = (nodeId, nodeType, title, fields, level = 0) => {
    if (allNodes.has(nodeId)) return;

    // console.log(`Processing node ${nodeId} (${nodeType}) at level ${level}:`, {
    //   title,
    //   fieldCount: fields.length,
    //   fields: fields.map(f => ({ name: f.name, type: f.type, isReference: f.isReference, isPlaceholder: f.isPlaceholder }))
    // });

    // No more field processing here - handled in UI component
    const nodeData = {
      id: nodeId,
      type: "detailedLR",
      data: {
        title: truncateText(title, 20),
        fields, // Raw fields - truncation handled in UI
        nodeType, // Ensure nodeType is explicitly set
        currentSchemaId,
        nodeId
      },
      level
    };

    allNodes.set(nodeId, nodeData);

    // Process child schemas in this node's fields
    fields.forEach((field) => {
      if (field.isReference && field.type.startsWith("refs:")) {
        const referencedId = field.type.replace("refs:", "");
        const referencedInfo = getDependencyInfo(referencedId, dependencyMap, language);

        processNode(
          referencedId,
          "reference",
          referencedInfo.name,
          referencedInfo.fields,
          level + 1
        );

        allEdges.push({
          id: `${nodeId}-${referencedId}`,
          source: nodeId,
          sourceHandle: field.originalName || field.name,
          target: referencedId
        });
      } else if (field.isPlaceholder) {
        const placeholderId = field.originalName || field.name; // Use the field name as the placeholder ID

        // Check if this placeholder schema now has actual attributes
        let placeholderFields = [];
        let placeholderTitle = field.name;

        // Look for the schema in dependencies to see if it has attributes
        if (dependencies) {
          const dependencyWithAttributes = dependencies.find((dep) => {
            const metaOverlays = dep.overlays?.meta;
            const metaOverlay = Array.isArray(metaOverlays)
              ? (metaOverlays.find((m) => m.language === language) || metaOverlays[0])
              : null;
            return metaOverlay?.name === placeholderId;
          });

          // console.log(`Processing placeholder ${placeholderId}:`, {
          //   found: !!dependencyWithAttributes,
          //   hasAttributes: !!dependencyWithAttributes?.capture_base?.attributes,
          //   attributeCount: Object.keys(dependencyWithAttributes?.capture_base?.attributes || {}).length,
          //   attributes: dependencyWithAttributes?.capture_base?.attributes
          // });

          if (
            dependencyWithAttributes &&
            dependencyWithAttributes.capture_base?.attributes
          ) {
            // This placeholder now has attributes, use them
            const labelOverlays = dependencyWithAttributes.overlays?.label;
            const labelAttributes = Array.isArray(labelOverlays) 
              ? (labelOverlays.find((l) => l.language === language)?.attribute_labels || {})
              : {};
            
            placeholderFields = processAttributes(
              dependencyWithAttributes.capture_base.attributes,
              labelAttributes
            );
            
            console.log(`Processed fields for ${placeholderId}:`, {
              fieldCount: placeholderFields.length,
              fields: placeholderFields.map(f => ({ name: f.name, type: f.type, isReference: f.isReference, isPlaceholder: f.isPlaceholder }))
            });
            
            const metaOverlays = dependencyWithAttributes.overlays?.meta;
            const metaOverlay = Array.isArray(metaOverlays)
              ? (metaOverlays.find((m) => m.language === language) || metaOverlays[0])
              : null;
            placeholderTitle = metaOverlay?.name || placeholderId;
          }
        }

        processNode(
          placeholderId,
          "placeholder",
          placeholderTitle,
          placeholderFields,
          level + 1
        );

        allEdges.push({
          id: `${nodeId}-${placeholderId}`,
          source: nodeId,
          sourceHandle: field.originalName || field.name,
          target: placeholderId
        });
      }
    });
  };

  // Start with parent node
  const rootFields = processAttributes(attributes, schemaData.labels);
  processNode("root", "root", rootLabel, rootFields, 0);

  // Convert allNodes Map to array for Dagre
  const nodes = [];
  allNodes.forEach((node) => {
    nodes.push(node);
  });

  // Apply Dagre layout (Left-Right for detailed view)
  const layoutedElements = getLayoutedElements(nodes, allEdges, "LR", "detailed");

  return { nodes: layoutedElements.nodes, edges: layoutedElements.edges };
};
