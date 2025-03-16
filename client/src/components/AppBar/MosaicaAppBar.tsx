import React from "react";
import AppBar from "@mui/material/AppBar";
import { styled } from "@mui/material/styles";
import Navigation from "./Navigation";

const MosaicaAppBar: React.FC = () => {
    const AppBarStyled = styled(AppBar)(({ theme }) => ({
        justifyContent: "center",
        [theme.breakpoints.up("lg")]: { minHeight: "100px" },
        backgroundColor: theme.palette.primary.light,
    }));

    return (
        <>
            <AppBarStyled position="sticky" color="default" elevation={8}>
                <Navigation />
            </AppBarStyled>
        </>
    );
};

export default MosaicaAppBar;
