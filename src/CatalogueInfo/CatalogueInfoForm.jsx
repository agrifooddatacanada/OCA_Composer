import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
} from "@mui/material";
import React from "react";
import { useForm } from "react-hook-form";
import useGenerateMarkdownReadMe from "../ViewSchema/useGenerateMarkdownReadMe";
import useGenerateMarkdownReadMeFromJson from "../ViewSchema/useGenerateMarkdownReadMeFromJson";
import { CustomPalette } from "../constants/customPalette";
import CustomFormInput from "../components/CustomFormInput";

function CatalogueInfoForm({ isOpen, jsonData, zipData, handleClose }) {
  const { control, handleSubmit } = useForm({
    defaultValues: { author: "", researchGroup: "" },
  });
  const { generateMarkdownReadMe } = useGenerateMarkdownReadMe();
  const { generateMarkdownReadMeFromJson } =
    useGenerateMarkdownReadMeFromJson();

  const onSubmit = (data) => {
    console.log(data);
    const jsonSchemaIsUploaded = Object.keys(jsonData).length > 0;
    if (jsonSchemaIsUploaded) {
      generateMarkdownReadMeFromJson(jsonData);
      return;
    }
    if (zipData.length > 0) {
      generateMarkdownReadMe(zipData);
    }
  };

  return (
    <div>
      <Dialog open={isOpen} onClose={handleClose} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ pb: 0 }}>Catalogue Information</DialogTitle>
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogContent>
            <CustomFormInput control={control} label="Author" name="author" />
            <CustomFormInput
              control={control}
              label="Research Group"
              name="researchGroup"
            />
          </DialogContent>
          <DialogActions sx={{ px: "24px", pb: "20px", pt: 0 }}>
            <Button variant="outlined" color="navButton" onClick={handleClose}>
              Cancel
            </Button>
            <Button type="submit" variant="contained" color="navButton">
              Generate Readme
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </div>
  );
}

export default CatalogueInfoForm;
