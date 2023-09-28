import { Box, Card, CardContent, Typography } from '@mui/material';
import React from 'react';
import { CustomPalette } from '../constants/customPalette';
import LoopIcon from "@mui/icons-material/Loop";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";

const LandingDropZone = ({ loading, dropDisabled, dropMessage, spinningAnimation, downloadIconColor, getRootProps, getInputProps, hover, handleHover, handleHoverLeave, handleDragOver, handleDragLeave }) => {
  return (
    <Box
      sx={{ width: '100%', display: 'flex', flexDirection: 'row', justifyContent: 'center', alignItems: 'center' }}
      {...getRootProps({ className: "dropzone" })}
    >
      <input {...getInputProps()} />
      <Card
        sx={{ border: 1, padding: '8px', paddingLeft: '20px', paddingRight: '20px', height: '60px', width: '300px', marginTop: 3, display: 'flex', flexDirection: 'row', justifyContent: 'center', alignItems: 'center', backgroundColor: '#CDCDCD', alignSelf: 'center', cursor: 'pointer' }}
        onMouseOver={handleHover}
        onMouseLeave={handleHoverLeave}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        {/* {dropMessage?.message.length > 0 && (
          <Alert
            severity={dropMessage?.type}
            style={{
              position: "absolute",
              zIndex: 9999,
              left: "70%",
              transform: "translate(-50%, -110%)",
            }}
          >
            {dropMessage?.message}
          </Alert>
        )} */}

        <CardContent>
          {loading === true ? (
            <LoopIcon
              sx={{
                color: CustomPalette.GREY_300,
                m: 2,
                fontSize: "60px",
                animation: spinningAnimation,
                transition: "all 0.2s ease-in-out",
              }}
            />
          ) : dropDisabled === true ? (
            <CheckCircleOutlineIcon
              sx={{
                m: 2,
                fontSize: "60px",
                color: CustomPalette.PRIMARY,
              }}
            />
          ) : (
            <Typography sx={{ fontSize: '18px', fontWeight: '700' }}>Upload schema bundle (.zip)
              Or drag and drop one
            </Typography>
          )}
        </CardContent>
      </Card>

    </Box>
  );
};

export default LandingDropZone;