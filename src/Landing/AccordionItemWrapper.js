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

// Extra props (e.g. defaultExpanded, TransitionProps) are forwarded to the
// Accordion, and sx overrides are merged over the default style.
const AccordionItemWrapper = ({ children, sx, ...rest }) => (
  <Accordion elevation={0} sx={{ ...AccordionStyle, ...sx }} {...rest}>
    {children}
  </Accordion>
);

export default AccordionItemWrapper;
