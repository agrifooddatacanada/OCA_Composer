import React, { useEffect, useMemo, useState, useCallback } from "react";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import AccountTreeIcon from "@mui/icons-material/AccountTree";
import FolderSharedIcon from "@mui/icons-material/FolderShared";
import PeopleOutlineIcon from "@mui/icons-material/PeopleOutline";
import SchemaIcon from "@mui/icons-material/Schema";
import ParkIcon from "@mui/icons-material/Park";
import InsertDriveFileIcon from "@mui/icons-material/InsertDriveFile";
import {
  Box,
  Typography,
  CircularProgress,
  Card,
  CardHeader,
  CardContent,
  Chip,
  Stack,
  Divider,
  Collapse,
  IconButton,
  alpha
} from "@mui/material";
import { CustomPalette } from "../constants/customPalette";

const NODE_META = {
  selected: {
    label: "Selected",
    color: CustomPalette.PRIMARY,
    icon: AccountTreeIcon
  },
  ancestor: {
    label: "Ancestor",
    color: CustomPalette.SECONDARY,
    icon: FolderSharedIcon
  },
  sibling: {
    label: "Sibling",
    color: "#ff9800",
    icon: PeopleOutlineIcon
  },
  child: {
    label: "Subclass",
    color: CustomPalette.PINK_400,
    icon: ParkIcon
  },
  descendant: {
    label: "Descendant",
    color: CustomPalette.BLUE_200,
    icon: SchemaIcon
  },
  related: {
    label: "Related",
    color: CustomPalette.GREY_600,
    icon: InsertDriveFileIcon
  }
};

const ensureNodeId = (id) => (id ? String(id) : undefined);

const createNode = (item = {}, type = "related") => {
  const meta = NODE_META[type] || NODE_META.related;

  return {
    id: ensureNodeId(item.id || item.uri || item.term),
    label: item.label || item.term || item.id || item.uri || "Unknown term",
    description: item.definition || item.description || "",
    uri: item.uri || item.id || "",
    type,
    meta,
    children: []
  };
};

const dedupeById = (list = []) => {
  const map = new Map();
  list.forEach((item) => {
    const id = ensureNodeId(item?.id || item?.uri);
    if (!id || map.has(id)) return;
    map.set(id, item);
  });
  return Array.from(map.values());
};

const buildHierarchyTree = (hierarchyData, selectedTerm) => {
  const selectedSource = hierarchyData?.selected || {
    id:
      selectedTerm?.uri ||
      selectedTerm?.id ||
      selectedTerm?.objectId ||
      selectedTerm?.term ||
      "selected"
  };

  const selectedNode = createNode(
    {
      ...selectedSource,
      label: selectedSource.label || selectedTerm?.term,
      definition: selectedSource.definition || selectedTerm?.description
    },
    "selected"
  );

  const ancestorList = dedupeById(hierarchyData?.ancestors).sort((a, b) => {
    const levelA = a?.level ?? 0;
    const levelB = b?.level ?? 0;
    return levelA - levelB;
  });

  const siblingList = dedupeById(hierarchyData?.siblings);
  const childList = dedupeById(hierarchyData?.children);
  const descendantList = dedupeById(hierarchyData?.descendants);

  let rootNodes = [];
  let currentParent = null;

  if (ancestorList.length > 0) {
    const rootAncestor = createNode(ancestorList[0], "ancestor");
    rootNodes = [rootAncestor];
    currentParent = rootAncestor;

    ancestorList.slice(1).forEach((ancestor) => {
      const nextNode = createNode(ancestor, "ancestor");
      currentParent.children = currentParent.children || [];
      currentParent.children.push(nextNode);
      currentParent = nextNode;
    });
  }

  const immediateParent = ancestorList.length ? currentParent : null;

  const siblingNodes = siblingList
    .filter((item) => ensureNodeId(item?.id || item?.uri) !== selectedNode.id)
    .map((item) => createNode(item, "sibling"))
    .sort((a, b) => a.label.localeCompare(b.label));

  const childNodes = childList.map((item) => createNode(item, "child"));

  if (descendantList.length > 0 && childNodes.length === 0) {
    descendantList.forEach((item) => {
      const level = item?.level ?? 1;
      const type = level > 1 ? "descendant" : "child";
      childNodes.push(createNode(item, type));
    });
  }

  selectedNode.children = childNodes;

  if (immediateParent) {
    immediateParent.children = [selectedNode, ...siblingNodes];
  } else {
    rootNodes = [selectedNode, ...siblingNodes];
  }

  if (rootNodes.length === 0) {
    rootNodes = [selectedNode];
  }

  return rootNodes;
};

const collectNodeIds = (nodes = []) => {
  const ids = [];
  const visit = (node) => {
    if (!node?.id) return;
    ids.push(node.id);
    node.children?.forEach(visit);
  };
  nodes.forEach(visit);
  return ids;
};

const renderLabel = (node) => {
  const { meta } = node;
  const IconComponent = meta.icon || NODE_META.related.icon;

  return (
    <Stack spacing={0.5} sx={{ alignItems: "flex-start" }}>
      <Stack direction="row" spacing={1} alignItems="center">
        <IconComponent fontSize="small" sx={{ color: meta.color }} />
        <Typography
          variant="body2"
          sx={{
            fontWeight: node.type === "selected" ? 600 : 500,
            color: node.type === "selected" ? CustomPalette.PRIMARY : "#333"
          }}
        >
          {node.label}
        </Typography>
        <Chip
          size="small"
          label={meta.label}
          sx={{
            height: 18,
            fontSize: "10px",
            color: meta.color,
            borderColor: alpha(meta.color, 0.32),
            borderWidth: 1,
            borderStyle: "solid",
            backgroundColor: alpha(meta.color, 0.08)
          }}
        />
      </Stack>
      {node.description && (
        <Typography variant="caption" sx={{ color: "#666", lineHeight: 1.3 }}>
          {node.description}
        </Typography>
      )}
    </Stack>
  );
};

const OntologyTreeView = ({ selectedTerm, hierarchyData, isLoading, errorMessage }) => {
  const treeData = useMemo(
    () => (hierarchyData ? buildHierarchyTree(hierarchyData, selectedTerm) : []),
    [hierarchyData, selectedTerm]
  );

  const [expandedNodeIds, setExpandedNodeIds] = useState(() => new Set());

  useEffect(() => {
    setExpandedNodeIds(new Set(collectNodeIds(treeData)));
  }, [treeData]);

  const handleToggleNode = useCallback((nodeId) => {
    if (!nodeId) {
      return;
    }

    setExpandedNodeIds((prev) => {
      const next = new Set(prev);
      if (next.has(nodeId)) {
        next.delete(nodeId);
      } else {
        next.add(nodeId);
      }
      return next;
    });
  }, []);

  const renderNodes = (nodes, depth = 0) =>
    nodes?.map((node) => {
      if (!node?.id) {
        return null;
      }

      const hasChildren = Array.isArray(node.children) && node.children.length > 0;
      const isExpanded = expandedNodeIds.has(node.id);

      return (
        <Box key={node.id} sx={{ ml: depth === 0 ? 0 : depth * 2 }}>
          <Box
            sx={{
              display: "flex",
              alignItems: "flex-start",
              gap: 1,
              py: 0.75,
              px: 1,
              borderRadius: 1,
              backgroundColor:
                node.type === "selected"
                  ? alpha(CustomPalette.PRIMARY, 0.08)
                  : "transparent",
              border:
                node.type === "selected"
                  ? `1px solid ${alpha(CustomPalette.PRIMARY, 0.18)}`
                  : "1px solid transparent",
              transition: "background-color 0.2s ease, border-color 0.2s ease"
            }}
          >
            {hasChildren ? (
              <IconButton
                size="small"
                onClick={() => handleToggleNode(node.id)}
                sx={{
                  width: 30,
                  height: 30,
                  color: CustomPalette.PRIMARY,
                  backgroundColor: alpha(CustomPalette.PRIMARY, 0.05),
                  "&:hover": {
                    backgroundColor: alpha(CustomPalette.PRIMARY, 0.12)
                  }
                }}
              >
                {isExpanded ? (
                  <ExpandMoreIcon fontSize="small" />
                ) : (
                  <ChevronRightIcon fontSize="small" />
                )}
              </IconButton>
            ) : (
              <Box sx={{ width: 30, height: 30 }} />
            )}
            <Box sx={{ flexGrow: 1 }}>{renderLabel(node)}</Box>
          </Box>

          {hasChildren && (
            <Collapse in={isExpanded} timeout="auto" unmountOnExit>
              <Box
                sx={{
                  mt: 0.5,
                  borderLeft: `1px dashed ${alpha(CustomPalette.GREY_600, 0.3)}`,
                  ml: 2,
                  pl: 1
                }}
              >
                {renderNodes(node.children, depth + 1)}
              </Box>
            </Collapse>
          )}
        </Box>
      );
    });

  if (!selectedTerm) {
    return (
      <Card
        sx={{
          borderRadius: 2,
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "column",
          gap: 2
        }}
      >
        <CardContent sx={{ textAlign: "center" }}>
          <AccountTreeIcon sx={{ fontSize: 42, color: CustomPalette.GREY_300 }} />
          <Typography variant="body2" sx={{ color: "text.secondary", mt: 1 }}>
            Select a term to explore its ontology hierarchy.
          </Typography>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card
        sx={{
          borderRadius: 2,
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center"
        }}
      >
        <Stack spacing={2} alignItems="center">
          <CircularProgress sx={{ color: CustomPalette.PRIMARY }} />
          <Typography variant="body2" sx={{ color: "text.secondary" }}>
            Loading hierarchy…
          </Typography>
        </Stack>
      </Card>
    );
  }

  if (errorMessage) {
    return (
      <Card
        sx={{
          borderRadius: 2,
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
          p: 3
        }}
      >
        <Stack spacing={1.5} alignItems="center">
          <Typography variant="h6" sx={{ color: CustomPalette.SECONDARY }}>
            Unable to load hierarchy
          </Typography>
          <Typography variant="body2" sx={{ color: "text.secondary" }}>
            {errorMessage}
          </Typography>
        </Stack>
      </Card>
    );
  }

  if (!hierarchyData || treeData.length === 0) {
    return (
      <Card
        sx={{
          borderRadius: 2,
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
          p: 3
        }}
      >
        <Stack spacing={1.5} alignItems="center">
          <AccountTreeIcon sx={{ fontSize: 42, color: CustomPalette.GREY_300 }} />
          <Typography variant="body2" sx={{ color: "text.secondary" }}>
            No hierarchy data available for this term.
          </Typography>
        </Stack>
      </Card>
    );
  }

  return (
    <Card
      sx={{
        height: "100%",
        borderRadius: 2,
        display: "flex",
        flexDirection: "column",
        boxShadow: "0 20px 40px rgba(16, 24, 40, 0.12)",
        border: `1px solid ${alpha(CustomPalette.PRIMARY, 0.12)}`
      }}
    >
      <CardHeader
        title="Ontology Hierarchy"
        subheader="Navigate ancestors, siblings, and subclasses"
        sx={{
          pb: 1,
          "& .MuiCardHeader-title": { fontWeight: 600, color: CustomPalette.PRIMARY },
          "& .MuiCardHeader-subheader": { fontSize: "0.85rem" }
        }}
      />
      <Divider />
      <CardContent sx={{ flexGrow: 1, overflow: "auto", pt: 2 }}>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 0.25 }}>
          {renderNodes(treeData)}
        </Box>
      </CardContent>
    </Card>
  );
};

export default OntologyTreeView;
