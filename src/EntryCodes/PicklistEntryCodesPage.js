import React, { useContext, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useMultiSchema } from "../schema/schemaContext";
import {
  Box,
  Button,
  Card,
  CardActions,
  CardContent,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  InputAdornment,
  TextField,
  Typography,
  Link
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import BackNextSkeleton from "../components/BackNextSkeleton";
import { Context } from "../App";
import { CustomPalette } from "../constants/customPalette";
import entryCodePicklists from "../constants/entry_code_picklists";
import { codesToLanguages, languageCodesObject } from "../constants/isoCodes";

function normalizeString(value) {
  return (value ?? "").toString().toLowerCase();
}

function getPicklistText(obj, uiLang2, fallback = "") {
  if (!obj) return fallback;
  if (typeof obj === "string") return obj;
  if (obj[uiLang2]) return obj[uiLang2];
  if (obj.en) return obj.en;
  const first = Object.values(obj)[0];
  return first || fallback;
}

function getUiLang2(i18nLanguage) {
  // i18next may return "en", "en-US", etc.
  const lang = (i18nLanguage || "en").toLowerCase();
  return lang.includes("-") ? lang.split("-")[0] : lang;
}

/** 2-letter language keys for picklist rows, order from picklist.languages when present. */
function getPicklistLanguageColumns(picklist) {
  if (Array.isArray(picklist?.languages) && picklist.languages.length > 0) {
    return [...picklist.languages];
  }
  const first = picklist?.rows?.[0];
  if (first && typeof first === "object") {
    return Object.keys(first).filter((k) => k !== "Code");
  }
  return ["en"];
}

function languageColumnLabel(code) {
  const name = codesToLanguages?.[code];
  return name ? `${name} (${code})` : code;
}

function PicklistDetailsModal({ open, onClose, picklist }) {
  const { t, i18n } = useTranslation();
  const uiLang2 = getUiLang2(i18n.language);

  if (!picklist) return null;

  const title = getPicklistText(picklist.name, uiLang2, "");
  const description = getPicklistText(picklist.description, uiLang2, "");
  const keywords = picklist.keywords?.[uiLang2] ?? picklist.keywords?.en ?? [];
  const codesCount = Array.isArray(picklist.rows) ? picklist.rows.length : 0;
  const langColumns = getPicklistLanguageColumns(picklist);
  const gridTemplateColumns = `minmax(88px, auto) repeat(${langColumns.length}, minmax(120px, 1fr))`;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      slotProps={{ backdrop: { sx: { backdropFilter: "blur(5px)" } } }}
      sx={{
        "& .MuiDialog-paper": {
          borderRadius: "0.5rem",
          backgroundColor: CustomPalette.WHITE
        }
      }}
      maxWidth="md"
      fullWidth
    >
      <DialogTitle sx={{ color: CustomPalette.PRIMARY }}>{title}</DialogTitle>
      <DialogContent>
        <Typography sx={{ textAlign: "left", mb: 1 }}>{description}</Typography>
        <Divider sx={{ my: 2 }} />
        <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap", mb: 2 }}>
          <Typography sx={{ fontSize: 14, color: "text.secondary" }}>
            {t("Category")}: {picklist.category || "-"}
          </Typography>
          <Typography sx={{ fontSize: 14, color: "text.secondary" }}>
            {t("Codes")}: {codesCount}
          </Typography>
          {picklist.source ? (
            <Typography sx={{ fontSize: 14, color: "text.secondary" }}>
              {t("Source")}: {picklist.source}
            </Typography>
          ) : null}
        </Box>
        {Array.isArray(keywords) && keywords.length > 0 ? (
          <Typography sx={{ textAlign: "left", mb: 2 }}>
            <strong>{t("Keywords")}:</strong> {keywords.join(", ")}
          </Typography>
        ) : null}

        <Typography sx={{ fontWeight: "bold", textAlign: "left", mb: 1 }}>
          {t("Codes")}
        </Typography>
        <Box
          sx={{
            maxHeight: "45vh",
            overflow: "auto",
            border: "1px solid",
            borderColor: "rgba(0,0,0,0.12)",
            borderRadius: "8px"
          }}
        >
          <Box sx={{ minWidth: "min-content" }}>
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns,
                gap: 1,
                p: 2,
                alignItems: "start"
              }}
            >
              <Typography sx={{ fontWeight: "bold", textAlign: "left" }}>
                {t("Code")}
              </Typography>
              {langColumns.map((code) => (
                <Typography
                  key={code}
                  sx={{ fontWeight: "bold", textAlign: "left", wordBreak: "break-word" }}
                >
                  {languageColumnLabel(code)}
                </Typography>
              ))}

              {(picklist.rows || []).map((row, idx) => (
                // eslint-disable-next-line react/no-array-index-key
                <React.Fragment key={`${row?.Code ?? "code"}-${idx}`}>
                  <Typography sx={{ fontFamily: "monospace", textAlign: "left" }}>
                    {row?.Code ?? ""}
                  </Typography>
                  {langColumns.map((code) => (
                    <Typography
                      key={code}
                      sx={{ textAlign: "left", wordBreak: "break-word" }}
                    >
                      {row?.[code] ?? ""}
                    </Typography>
                  ))}
                </React.Fragment>
              ))}
            </Box>
          </Box>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} sx={{ color: CustomPalette.PRIMARY }}>
          {t("Close")}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default function PicklistEntryCodesPage() {
  const { t, i18n } = useTranslation();
  const uiLang2 = getUiLang2(i18n.language);

  const { setCurrentPage, chosenEntryCodeIndex } = useContext(Context);
  const { getSchema, updateSchema, getLanguages } = useMultiSchema();
  const languages = getLanguages();

  const [query, setQuery] = useState("");
  const [viewPicklist, setViewPicklist] = useState(null);

  const languageTo2Letter = useMemo(() => {
    const map = {};
    (languages || []).forEach((langName) => {
      const code = languageCodesObject?.[langName.toLowerCase()];
      if (code) map[langName] = code;
    });
    return map;
  }, [languages]);

  const filteredPicklists = useMemo(() => {
    const q = normalizeString(query).trim();
    if (!q) return entryCodePicklists;

    return entryCodePicklists.filter((p) => {
      const name = normalizeString(getPicklistText(p.name, uiLang2, ""));
      const description = normalizeString(getPicklistText(p.description, uiLang2, ""));
      const category = normalizeString(p.category);

      const keywordsArr = p.keywords?.[uiLang2] ?? p.keywords?.en ?? p.keywords?.fr ?? [];
      const keywords = normalizeString((keywordsArr || []).join(" "));

      return (
        name.includes(q) ||
        description.includes(q) ||
        keywords.includes(q) ||
        category.includes(q)
      );
    });
  }, [query, uiLang2]);

  const applyPicklist = (picklist) => {
    const rows = Array.isArray(picklist?.rows) ? picklist.rows : [];
    const newRows = rows.map((row) => {
      const newObj = { Code: row?.Code ?? "" };
      (languages || []).forEach((langName) => {
        const lang2 = languageTo2Letter[langName];
        newObj[langName] = lang2 ? (row?.[lang2] ?? "") : "";
      });
      return newObj;
    });

    const schema = getSchema() || {};
    const attrsWithList = (schema.attributes || [])
      .filter((a) => a.List)
      .map((a) => a.Attribute);
    const attrName = attrsWithList[chosenEntryCodeIndex];
    if (attrName && newRows.length > 0) {
      const prevEntryCodes = schema.entryCodes || {};
      updateSchema({
        entryCodes: {
          ...prevEntryCodes,
          [attrName]: newRows
        }
      });
    }

    setCurrentPage("Codes");
  };

  return (
    <>
      <BackNextSkeleton
        isBack
        pageBack={() => setCurrentPage("Codes")}
        isForward={false}
      />

      <Box sx={{ width: "90%", margin: "auto", pb: 6 }}>
        <Typography
          sx={{
            fontSize: 22,
            fontWeight: "bold",
            textAlign: "left",
            color: CustomPalette.PRIMARY,
            mt: 2,
            mb: 2
          }}
        >
          {t("Entry Codes")}
        </Typography>

        <TextField
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t("Search entry codes")}
          fullWidth
          sx={{
            mb: 3,
            "& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline": {
              borderColor: CustomPalette.PRIMARY
            }
          }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon sx={{ color: "text.secondary" }} />
              </InputAdornment>
            )
          }}
        />

        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
            gap: 2
          }}
        >
          {filteredPicklists.map((picklist) => {
            const title = getPicklistText(picklist.name, uiLang2, "");
            const description = getPicklistText(picklist.description, uiLang2, "");
            const keywords = picklist.keywords?.[uiLang2] ?? picklist.keywords?.en ?? [];
            const subtitleParts = [
              picklist.category ? `${t("Category")}: ${picklist.category}` : null,
              Array.isArray(picklist.rows)
                ? `${t("Codes")}: ${picklist.rows.length}`
                : null
            ].filter(Boolean);

            return (
              <Card
                key={picklist.id}
                sx={{
                  border: "1px solid rgba(0,0,0,0.08)",
                  boxShadow: 0,
                  borderRadius: 2
                }}
              >
                <CardContent>
                  <Typography
                    sx={{
                      fontWeight: "bold",
                      color: CustomPalette.PRIMARY,
                      textAlign: "left"
                    }}
                  >
                    {title}
                  </Typography>
                  {subtitleParts.length > 0 ? (
                    <Typography
                      sx={{ fontSize: 13, color: "text.secondary", textAlign: "left" }}
                    >
                      {subtitleParts.join(" • ")}
                    </Typography>
                  ) : null}
                  <Typography sx={{ mt: 1, textAlign: "left" }}>{description}</Typography>
                  {Array.isArray(keywords) && keywords.length > 0 ? (
                    <Typography
                      sx={{
                        mt: 1,
                        fontSize: 13,
                        color: "text.secondary",
                        textAlign: "left"
                      }}
                    >
                      <strong>{t("Keywords")}:</strong> {keywords.join(", ")}
                    </Typography>
                  ) : null}
                </CardContent>
                <CardActions sx={{ justifyContent: "flex-end", pr: 2, pb: 2 }}>
                  <Button
                    variant="outlined"
                    color="navButton"
                    onClick={() => setViewPicklist(picklist)}
                    sx={{
                      color: CustomPalette.PRIMARY,
                      borderColor: CustomPalette.PRIMARY,
                      ":hover": {
                        borderColor: CustomPalette.SECONDARY,
                        color: CustomPalette.SECONDARY
                      }
                    }}
                  >
                    {t("View")}
                  </Button>
                  <Button
                    variant="contained"
                    color="navButton"
                    onClick={() => applyPicklist(picklist)}
                    sx={{
                      backgroundColor: CustomPalette.PRIMARY,
                      ":hover": { backgroundColor: CustomPalette.SECONDARY }
                    }}
                  >
                    {t("Select")}
                  </Button>
                </CardActions>
              </Card>
            );
          })}
        </Box>
        <Box
          sx={{
            width: "80%",
            marginTop: "2rem",
            marginLeft: "auto",
            marginRight: "auto"
          }}
        >
          {t("All entry codes are documented in the")}{" "}
          <Link
            href="https://github.com/agrifooddatacanada/picklists_for_schemas"
            target="_blank"
            rel="noreferrer"
          >
            {t("Picklist GitHub repository")}
          </Link>
          . {t("Request a new Picklist to be added by")}{" "}
          <Link
            href="https://github.com/agrifooddatacanada/picklists_for_schemas/issues"
            rel="noreferrer"
            target="_blank"
          >
            {t("raising an issue in the repository")}
          </Link>{" "}
          {t("or email us at")} <Link href="mailto:adc@uoguelph.ca">adc@uoguelph.ca</Link>
          .
        </Box>
      </Box>

      <PicklistDetailsModal
        open={!!viewPicklist}
        picklist={viewPicklist}
        onClose={() => setViewPicklist(null)}
      />
    </>
  );
}
