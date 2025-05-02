import React from "react";
 import { Button } from "@mui/material";
 
 const UploadButton = ({isDisabled}) => {
 
 
     return (
         <>
             <Button
             id="basic-button"
             color="button"
             variant="contained"
             disabled={isDisabled}
             sx={{
                 alignSelf: "flex-end",
                 display: "flex",
                 justifyContent: "space-around",
                 padding: "0.5rem 1rem",
                 margin: "0rem 0.5rem"
             }}>
                 Upload Data
             </Button>
         </>
     );
 };
 
 export default UploadButton;