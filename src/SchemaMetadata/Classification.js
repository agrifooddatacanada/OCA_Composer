import React, { useContext, useEffect, useMemo } from "react";
import MenuItem from "@mui/material/MenuItem";
import FormControl from "@mui/material/FormControl";
import Select from "@mui/material/Select";
import { Box, Tooltip, Typography } from "@mui/material";
import HelpOutlineIcon from "@mui/icons-material/HelpOutline";
import { useTranslation } from "react-i18next";
import { CustomPalette } from "../constants/customPalette";
import {
  classification,
  parseClassificationCode,
  groupCodes,
  divisionCodes,
  TOOLTIP_ICON_GAP
} from "../constants/constants";
import { Context } from "../App";
import { useMultiSchema } from "../schema/schemaContext";

const Classification = () => {
  const { t } = useTranslation();
  const { divisionGroup, setDivisionGroup } = useContext(Context);
  const { getSchema, updateSchema } = useMultiSchema();
  const schemaState = getSchema();

  // Initialize divisionGroup from schema metadata on mount
  useEffect(() => {
    const classificationCode = schemaState?.metadata?.classification;
    if (classificationCode) {
      const parsed = parseClassificationCode(classificationCode);
      if (
        parsed &&
        (divisionGroup.division !== parsed.division ||
          divisionGroup.group !== parsed.group)
      ) {
        setDivisionGroup(parsed);
      }
    }
  }, [schemaState?.metadata?.classification]);

  // Update schema metadata when divisionGroup changes
  useEffect(() => {
    if (divisionGroup.division) {
      // Prefer group code if group is selected, otherwise use division code
      const code =
        (divisionGroup.group && groupCodes[divisionGroup.group]) ||
        divisionCodes[divisionGroup.division];

      const st = getSchema() || {};
      const prevMeta = st.metadata || {};

      if (code && prevMeta.classification !== code) {
        updateSchema({
          metadata: {
            ...prevMeta,
            classification: code
          }
        });
      }
    }
  }, [divisionGroup.division, divisionGroup.group]);

  const divisionsDropdown = useMemo(
    () =>
      Object.keys(classification).map((division) => (
        <MenuItem sx={{ height: "38px" }} key={division} value={division}>
          {t(division, { defaultValue: division })}
        </MenuItem>
      )),
    [t]
  );

  const groupsDropdown = useMemo(
    () =>
      classification[divisionGroup.division].map((group) => (
        <MenuItem sx={{ height: "38px" }} key={group} value={group}>
          {t(group, { defaultValue: group })}
        </MenuItem>
      )),
    [divisionGroup.division, t]
  );

  return (
    <Box sx={{ textAlign: "left", marginBottom: "1rem", width: "22rem" }}>
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: TOOLTIP_ICON_GAP,
          marginBottom: "0.35rem",
          color: CustomPalette.GREY_600
        }}
      >
        <Typography
          sx={{
            fontSize: 15,
            fontWeight: "bold",
            textAlign: "left",
            flexShrink: 0,
            color: CustomPalette.BLACK
          }}
        >
          {t("Schema Classification")}
        </Typography>
        <Tooltip
          title={t(
            "Select the division and group that best reflects how you would classify your schema"
          )}
          placement="right"
          arrow
        >
          <HelpOutlineIcon sx={{ fontSize: 15 }} />
        </Tooltip>
      </Box>
      <Box sx={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
        <FormControl variant="standard" sx={{ minWidth: 120, width: "100%" }}>
          <Typography variant="body2">{t("Division")}</Typography>
          <Select
            value={divisionGroup.division}
            onChange={(e) =>
              setDivisionGroup((prev) => ({ ...prev, division: e.target.value }))
            }
            displayEmpty
            MenuProps={{ disableScrollLock: true }}
          >
            {divisionsDropdown}
          </Select>
        </FormControl>
        <FormControl
          variant="standard"
          sx={{ minWidth: 120, width: "100%", marginBottom: "0.5rem" }}
        >
          <Typography variant="body2">{t("Group")}</Typography>
          <Select
            value={divisionGroup.group}
            onChange={(e) =>
              setDivisionGroup((prev) => ({ ...prev, group: e.target.value }))
            }
            displayEmpty
            MenuProps={{ disableScrollLock: true }}
          >
            {groupsDropdown}
          </Select>
        </FormControl>
      </Box>
    </Box>
  );
};

export default Classification;
