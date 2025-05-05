import React from "react";
 import { Button } from "@mui/material";
 
 const UploadButton = ({isDisabled, uploadFunc}) => {
 
 
     return (
         <>
             <Button
             id="basic-button"
             color="button"
             variant="contained"
             disabled={isDisabled}
             onClick={uploadFunc}
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