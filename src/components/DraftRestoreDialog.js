import React, { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
} from "@mui/material";
import RestoreIcon from "@mui/icons-material/Restore";
import { loadDraft, clearDraft } from "../hooks/useSessionDraft";
import { useMultiSchema } from "../schema/schemaContext";
import { Context } from "../App";
import { CustomPalette } from "../constants/customPalette";

function formatTimestamp(ts) {
  try {
    return new Date(ts).toLocaleString();
  } catch {
    return "unknown time";
  }
}

export default function DraftRestoreDialog() {
  const [draft, setDraft] = useState(null);
  const [open, setOpen] = useState(false);
  const { restoreDraft } = useMultiSchema();
  const { setCurrentPage } = useContext(Context);
  const navigate = useNavigate();

  useEffect(() => {
    const saved = loadDraft();
    if (saved) {
      setDraft(saved);
      setOpen(true);
    }
  }, []);

  const handleRestore = () => {
    if (draft) {
      restoreDraft(draft);
      const page = draft.currentPage || "View";
      setCurrentPage(page);
      navigate("/start");
    }
    setOpen(false);
  };

  const handleDiscard = () => {
    clearDraft();
    setOpen(false);
  };

  if (!draft) return null;

  return (
    <Dialog
      open={open}
      onClose={handleDiscard}
      PaperProps={{
        sx: {
          borderRadius: "0.5rem",
          border: "1px solid",
          borderColor: CustomPalette.PRIMARY,
          minWidth: 400,
        },
      }}
    >
      <DialogTitle
        sx={{
          backgroundColor: CustomPalette.GREY_200,
          color: CustomPalette.GREY_800,
          display: "flex",
          alignItems: "center",
          gap: 1,
        }}
      >
        <RestoreIcon sx={{ color: CustomPalette.PRIMARY }} />
        Restore unsaved work?
      </DialogTitle>
      <DialogContent sx={{ mt: 2 }}>
        <DialogContentText sx={{ color: CustomPalette.GREY_800 }}>
          We found an unsaved session from{" "}
          <strong>{formatTimestamp(draft.timestamp)}</strong>. Would you like to
          restore it?
        </DialogContentText>
      </DialogContent>
      <DialogActions sx={{ backgroundColor: CustomPalette.GREY_200, px: 3, py: 2 }}>
        <Button
          variant="outlined"
          color="navButton"
          onClick={handleDiscard}
          sx={{
            color: CustomPalette.PRIMARY,
            borderColor: CustomPalette.PRIMARY,
            ":hover": {
              borderColor: CustomPalette.SECONDARY,
              color: CustomPalette.SECONDARY,
            },
          }}
        >
          Discard
        </Button>
        <Button
          variant="contained"
          color="navButton"
          onClick={handleRestore}
          autoFocus
          sx={{
            backgroundColor: CustomPalette.PRIMARY,
            ":hover": { backgroundColor: CustomPalette.SECONDARY },
          }}
        >
          Restore
        </Button>
      </DialogActions>
    </Dialog>
  );
}
