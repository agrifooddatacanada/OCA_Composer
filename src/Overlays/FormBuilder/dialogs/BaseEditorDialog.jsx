import React from "react";
import { Dialog, DialogTitle, DialogContent, DialogActions, Button } from "@mui/material";
import { CustomPalette } from "../../../constants/customPalette";
import { useTranslation } from "react-i18next";

const BaseEditorDialog = ({ 
  open, 
  onClose, 
  title, 
  onSave, 
  children,
  maxWidth = "md",
  fullWidth = true 
}) => {
  const { t } = useTranslation();

  return (
    <Dialog open={open} onClose={onClose} maxWidth={maxWidth} fullWidth={fullWidth}>
      <DialogTitle sx={{ backgroundColor: CustomPalette.GREY_200, color: CustomPalette.GREY_800 }}>
        {title}
      </DialogTitle>
      <DialogContent>
        {children}
      </DialogContent>
      <DialogActions sx={{ backgroundColor: CustomPalette.GREY_200, px: 3, py: 2 }}>
        <Button 
          onClick={onClose}
          sx={{ color: CustomPalette.GREY_600 }}
        >
          {t("Cancel")}
        </Button>
        <Button 
          onClick={onSave} 
          variant="contained" 
          color="button"
          sx={{ 
            backgroundColor: CustomPalette.PRIMARY,
            '&:hover': {
              backgroundColor: CustomPalette.DARK
            }
          }}
        >
          {t("Save")}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default BaseEditorDialog;
