import React, { useState } from "react";
import { Box, Stack, Typography, IconButton } from "@mui/material";
import ClearIcon from '@mui/icons-material/Clear';

const HeaderAlert: React.FC = () => {
    // State to track if the div should be shown or hidden
    const [isAlertVisible, setIsAlertVisible] = useState(true);

    // Function to toggle the visibility
    const handleAlert = () => {
        setIsAlertVisible(false); // Hides the div when the button is clicked
    };

    return (
        <>
            {isAlertVisible ? (
                <Box bgcolor="primary.main" borderRadius={0} textAlign="center" py="11px" position="relative">
                    <Stack
                        direction={{ xs: "column", sm: "row" }}
                        spacing="16px"
                        justifyContent="center"
                        alignItems="center"
                    >
                        <Typography
                            variant="body1"
                            color="white"
                            fontWeight={500}
                            sx={{
                                opacity: "0.8",
                            }}
                            fontSize="13px"
                        >
                            Deployed In Test Network
                        </Typography>
                    </Stack>
                    <IconButton
                        onClick={handleAlert}
                        color="secondary"
                        sx={{
                            zIndex: 1,
                            position: "absolute",
                            right: "6px",
                            top: "6px",
                        }}
                    >
                        <ClearIcon sx={{color: "white"}}/>
                    </IconButton>
                </Box>
            ) : null}
        </>
    );
};

export default HeaderAlert;
