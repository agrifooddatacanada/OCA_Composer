import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Typography
} from "@mui/material";
import React from "react";
import { useTranslation } from "react-i18next";
import { useForm } from "react-hook-form";
import CustomFormInput from "../components/CustomFormInput";
import { catalogueInfoFormFields, catalogueScenarios } from "../constants/catalogueInfo";
import CustomSelect from "../components/CustomSelect";

function CatalogueInfoForm({ catalogueData, isOpen, handleClose, saveToLocalStorage }) {
  const { t } = useTranslation();
  const {
    control,
    handleSubmit,
    watch,
    reset,
    formState: { errors }
  } = useForm({
    defaultValues: catalogueData
  });

  function resetScenarioFormFields(scenario) {
    if (catalogueData && scenario === catalogueData.scenario) {
      reset(catalogueData);
      return;
    }
    const formValues = catalogueInfoFormFields[scenario].reduce(
      (currentFormValues, formField) => {
        currentFormValues[formField.name] = formField.defaultValue;
        return currentFormValues;
      },
      { scenario }
    );
    reset(formValues);
  }

  const selectedScenario = watch("scenario");

  const onSubmit = (data) => {
    if (!selectedScenario) return;
    saveToLocalStorage(data);
    handleClose();
  };

  return (
    <div>
      <Dialog open={isOpen} onClose={handleClose} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ pb: 0 }}>{t("Catalogue Information")}</DialogTitle>
        <Typography sx={{ px: "24px" }}>
          {t("Include catalogue information in markdown readme")}
        </Typography>
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogContent>
            <CustomSelect
              control={control}
              name="scenario"
              label="Scenario"
              placeholder="Please select"
              options={catalogueScenarios}
              errorMessage={errors.scenario?.message || ""}
              onChange={(e) => {
                resetScenarioFormFields(e.target.value);
              }}
            />
            {selectedScenario &&
              catalogueInfoFormFields[selectedScenario].map((formField) => {
                if (formField.type === "select") {
                  return (
                    <CustomSelect
                      key={formField.name}
                      control={control}
                      name={formField.name}
                      label={formField.label}
                      placeholder={formField.placeholder}
                      options={formField.options}
                      defaultValue={formField.defaultValue}
                    />
                  );
                }
                return (
                  <CustomFormInput
                    key={formField.name}
                    control={control}
                    name={formField.name}
                    label={formField.label}
                    placeholder={formField.placeholder}
                    defaultValue={formField.defaultValue}
                  />
                );
              })}
          </DialogContent>
          <DialogActions sx={{ px: "24px", pb: "20px", pt: 0 }}>
            <Button variant="outlined" color="navButton" onClick={handleClose}>
              {t("Cancel")}
            </Button>
            <Button
              type="submit"
              variant="contained"
              color="navButton"
              disabled={!selectedScenario}
            >
              {t("Save")}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </div>
  );
}

export default CatalogueInfoForm;
