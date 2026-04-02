import React, { useContext, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
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
  Typography
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import BackNextSkeleton from "../components/BackNextSkeleton";
import { Context } from "../App";
import { CustomPalette } from "../constants/customPalette";
import entryCodePicklists from "../constants/entry_code_picklists";
import { languageCodesObject } from "../constants/isoCodes";

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

function PicklistDetailsModal({ open, onClose, picklist }) {
  const { t, i18n } = useTranslation();
  const uiLang2 = getUiLang2(i18n.language);

  if (!picklist) return null;

  const title = getPicklistText(picklist.name, uiLang2, "");
  const description = getPicklistText(picklist.description, uiLang2, "");
  const keywords = picklist.keywords?.[uiLang2] ?? picklist.keywords?.en ?? [];
  const codesCount = Array.isArray(picklist.rows) ? picklist.rows.length : 0;

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
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: "180px 1fr",
              gap: 1,
              p: 2
            }}
          >
            {(picklist.rows || []).map((row, idx) => {
              const label = row?.[uiLang2] ?? row?.en ?? "";
              return (
                // eslint-disable-next-line react/no-array-index-key
                <React.Fragment key={`${row?.Code ?? "code"}-${idx}`}>
                  <Typography sx={{ fontFamily: "monospace", textAlign: "left" }}>
                    {row?.Code ?? ""}
                  </Typography>
                  <Typography sx={{ textAlign: "left" }}>{label}</Typography>
                </React.Fragment>
              );
            })}
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

  const { setCurrentPage, chosenEntryCodeIndex, languages, setEntryCodeRowData } =
    useContext(Context);

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

    setEntryCodeRowData((prev) => {
      const next = [...(prev || [])];
      next[chosenEntryCodeIndex] = newRows.length ? newRows : next[chosenEntryCodeIndex];
      return next;
    });

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
      </Box>

      <PicklistDetailsModal
        open={!!viewPicklist}
        picklist={viewPicklist}
        onClose={() => setViewPicklist(null)}
      />
    </>
  );
}
