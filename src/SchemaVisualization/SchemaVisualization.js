/**
 * Main Schema Visualization Component
 * Displays hierarchical OCA schemas using React Flow
 * Now uses SchemaVisualizationEmbed for consistency with the embedded version
 * This ensures both the standalone page and embedded visualization have the same
 * edit buttons and behavior, avoiding code duplication.
 */
import React, { useState, useEffect, useContext } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Box, Button, Typography, ToggleButton, ToggleButtonGroup } from "@mui/material";

import { Context } from "../App";
import Header from "../Header/Header";
import Footer from "../Footer/Footer";
import SchemaVisualizationEmbed from "./SchemaVisualizationEmbed";
import CustomPalette from "../constants/customPalette";
import "./SchemaVisualization.css";

/**
 * Schema Visualization Component
 */
const SchemaVisualization = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { OCAPackage, setOCAPackage, setCurrentPage } = useContext(Context);

  const [loadedSchema, setLoadedSchema] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [visualizationMode, setVisualizationMode] = useState("detailed");

  // Effect to handle file reading from navigation state
  useEffect(() => {
    const navigationState = location.state;

    if (navigationState?.rawFile && !loadedSchema) {
      const file = navigationState.rawFile;
      const reader = new FileReader();

      reader.onload = (e) => {
        try {
          const jsonData = JSON.parse(e.target.result);
          setLoadedSchema(jsonData);
        } catch (error) {
          // Error parsing JSON file
          // Fallback to regular navigation
          navigate("/");
        }
      };

      reader.onerror = () => {
        // Error reading file
        navigate("/");
      };

      reader.readAsText(file);
    } else if (navigationState?.OCAPackage) {
      // Direct OCA package from navigation state
      setLoadedSchema(navigationState.OCAPackage);
    }
  }, [location.state, loadedSchema, navigate]);

  // Initialize visualization on component mount
  useEffect(() => {
    setCurrentPage("SchemaVisualization");

    // Use loaded schema from file or context OCAPackage
    const currentSchema = loadedSchema || OCAPackage;

    // Don't redirect if we're still loading from navigation state
    const navigationState = location.state;
    const hasFileToLoad = navigationState?.rawFile && !loadedSchema;

    if (!currentSchema && !hasFileToLoad) {
      // No schema available and no file to load, redirect to landing
      navigate("/");
      return;
    }

    // If we have a schema, process it
    if (currentSchema) {
      const hasHierarchy =
        currentSchema.dependencies && currentSchema.dependencies.length > 0;

      if (!hasHierarchy) {
        // No hierarchical structure, redirect to regular View Schema page (step 6)
        // Ensure the OCA package is set in context if we loaded from navigation state
        if (loadedSchema && !OCAPackage) {
          setOCAPackage(loadedSchema);
        }
        // Set the page to "View" to go directly to step 6
        setCurrentPage("View");
        navigate("/start");
        return;
      }

      setIsLoading(false);
    }
  }, [OCAPackage, loadedSchema, navigate, setCurrentPage, setOCAPackage, location.state]);

  // Handle schema switching for edit functionality
  const handleSchemaSwitch = (schemaId) => {
    if (!schemaId) return;

    // Navigate to the editor with the selected schema
    setCurrentPage("Details");
    navigate("/start");
  };

  if (isLoading) {
    return (
      <>
        <Header currentPage="SchemaVisualization" />
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
            height: "100vh",
            gap: 2
          }}
        >
          <Typography>{t("Loading schema visualization...")}</Typography>
        </Box>
        <Footer currentPage="SchemaVisualization" />
      </>
    );
  }

  const currentSchema = loadedSchema || OCAPackage;

  return (
    <>
      <Header currentPage="SchemaVisualization" />
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          height: "calc(100vh - 120px)"
        }}
      >
        {/* Title Bar */}
        <Box
          sx={{
            backgroundColor: CustomPalette.PRIMARY,
            color: "white",
            padding: 2,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: 2
          }}
        >
          <Box>
            <Typography variant="h5" component="h1">
              {t("Schema Visualization")}
            </Typography>
            <Typography variant="body2">
              {t("Hierarchical structure detected")}
            </Typography>
          </Box>

          <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
            <Button
              variant="outlined"
              size="small"
              onClick={() => navigate("/start")}
              sx={{
                color: "white",
                borderColor: "white",
                transition: "all 0.2s ease",
                "&:hover": {
                  backgroundColor: "rgba(255, 255, 255, 0.1)",
                  borderColor: "white"
                }
              }}
            >
              {t("Back to Editor")}
            </Button>
            <Button
              variant="outlined"
              size="small"
              onClick={() => navigate("/")}
              sx={{
                color: "white",
                borderColor: "white",
                transition: "all 0.2s ease",
                "&:hover": {
                  backgroundColor: "rgba(255, 255, 255, 0.1)",
                  borderColor: "white"
                }
              }}
            >
              {t("Back to Home")}
            </Button>
          </Box>
        </Box>

        {/* View Mode Toggle */}
        <Box sx={{ p: 2, backgroundColor: CustomPalette.GREY_100 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <Typography
              variant="body2"
              sx={{ fontWeight: 500, color: CustomPalette.GREY_700 }}
            >
              View:
            </Typography>
            <ToggleButtonGroup
              value={visualizationMode}
              exclusive
              onChange={(e, newMode) => {
                if (newMode !== null) {
                  setVisualizationMode(newMode);
                }
              }}
              size="small"
              sx={{
                "& .MuiToggleButton-root": {
                  borderColor: CustomPalette.GREY_400,
                  color: CustomPalette.GREY_700,
                  "&:hover": {
                    backgroundColor: CustomPalette.GREY_200
                  }
                },
                "& .MuiToggleButton-root.Mui-selected": {
                  color: CustomPalette.WHITE,
                  backgroundColor: CustomPalette.PRIMARY,
                  "&:hover": {
                    backgroundColor: CustomPalette.SECONDARY
                  }
                }
              }}
            >
              <ToggleButton value="detailed">Attribute-to-Schema</ToggleButton>
              <ToggleButton value="tree">Schema-to-Schema</ToggleButton>
            </ToggleButtonGroup>
          </Box>
        </Box>

        {/* Visualization Container */}
        <Box sx={{ flex: 1, position: "relative" }}>
          <SchemaVisualizationEmbed
            attributeRowData={[]}
            schemaDescription={{}}
            languages={["eng", "fra"]}
            OCAPackage={currentSchema}
            viewMode={visualizationMode}
            height="100%"
            currentSchemaId="root"
            setCurrentSchemaId={handleSchemaSwitch}
            showDebug={false}
          />
        </Box>
      </Box>
      <Footer currentPage="SchemaVisualization" />
    </>
  );
};

export default SchemaVisualization;
