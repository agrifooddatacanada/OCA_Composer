import { Accordion } from "@mui/material";
import React from "react";
import { CustomPalette } from "../constants/customPalette";

const AccordionStyle = {
  // borderBottom: `3px solid ${CustomPalette.PRIMARY}`,
  marginTop: 5,
  "&.MuiAccordion-root:before": {
    backgroundColor: "white"
  },
  "& .MuiButtonBase-root": {
    display: "",
    borderBottom: `3px solid ${CustomPalette.PRIMARY}`
  }
};

const AccordionItemWrapper = ({ children }) => (
  <Accordion elevation={0} sx={AccordionStyle}>
    {children}
  </Accordion>
);

export default AccordionItemWrapper;
