import React, { useState } from "react";
import useMediaQuery from "@mui/material/useMediaQuery";
import Toolbar from "@mui/material/Toolbar";
import Drawer from "@mui/material/Drawer";
import MenuIcon from "@mui/icons-material/Menu";
import { styled } from "@mui/material/styles";
import { Box, Button, Container, IconButton, Stack, Typography } from "@mui/material";
import Logo from "./Logo";
import MosaicaMenuItem from "./MosaicaMenuItem";
import { useWalletContext } from "../../contexts/WalletContext";
import { useAppContext } from "../../contexts/AppContext";

const Navigation: React.FC = () => {
    const { address, connectWallet } = useWalletContext();
    const { isAdmin } = useAppContext();

    const lgDown = useMediaQuery((theme: any) => theme.breakpoints.down("md"));
    const [openDrawer, setOpenDrawer] = useState(false);

    const ToolbarStyled = styled(Toolbar)(({ theme }) => ({
        margin: "0 auto",
        width: "100%",
        color: `${theme.palette.text.secondary} !important`,
    }));

    const formatAddress = (addressToFormat: string) => {
        const firstPart = addressToFormat.slice(0, 7);
        const lastPart = addressToFormat.slice(-7);
        return `${firstPart}....${lastPart}`;
    };

    return (
        <>
            <Container sx={{ maxWidth: "1400px !important" }}>
                <ToolbarStyled>
                    <Box sx={{ width: lgDown ? "40px" : "auto", overflow: "hidden" }}>
                        <Logo handleMenuClose={() => {}} />
                    </Box>
                    {lgDown ? (
                        <>
                            <Box sx={{ flexGrow: 1 }}></Box>
                            <IconButton color="inherit" aria-label="menu" onClick={() => setOpenDrawer(true)}>
                                <MenuIcon />
                            </IconButton>
                        </>
                    ) : (
                        <>
                            {address ? (
                                <>
                                    <Box justifyContent="center" display="flex" sx={{ flexGrow: 1 }}>
                                        <MosaicaMenuItem
                                            label="Dashboard"
                                            path="/dashboard"
                                            handleMenuClose={() => {}}
                                        />
                                        <MosaicaMenuItem
                                            label="Portfolios"
                                            path="/portfolios"
                                            handleMenuClose={() => {}}
                                        />
                                        {isAdmin ? (
                                            <MosaicaMenuItem label="Admin" path="/admin" handleMenuClose={() => {}} />
                                        ) : (
                                            ""
                                        )}
                                    </Box>
                                    <Typography>{formatAddress(address)}</Typography>
                                </>
                            ) : (
                                <>
                                    <Box justifyContent="center" display="flex" sx={{ flexGrow: 1 }}></Box>
                                    <Button color="primary" variant="contained" onClick={connectWallet}>
                                        Connect Wallet
                                    </Button>
                                </>
                            )}
                        </>
                    )}
                </ToolbarStyled>
            </Container>

            <Drawer
                anchor="left"
                open={openDrawer}
                variant="temporary"
                onClose={() => setOpenDrawer(false)}
                PaperProps={{
                    sx: {
                        width: 270,
                        border: "0 !important",
                        boxShadow: (theme) => theme.shadows[8],
                    },
                }}
            >
                <Box px={3}>
                    <Logo handleMenuClose={() => setOpenDrawer(false)} />
                </Box>
                <Box p={3}>
                    <Stack direction="column" spacing={2}>
                        {address ? (
                            <>
                                <MosaicaMenuItem
                                    label="Dashboard"
                                    path="/dashboard"
                                    handleMenuClose={() => setOpenDrawer(false)}
                                />
                                <MosaicaMenuItem
                                    label="Portfolios"
                                    path="/portfolios"
                                    handleMenuClose={() => setOpenDrawer(false)}
                                />

                                {isAdmin ? (
                                    <MosaicaMenuItem
                                        label="Admin"
                                        path="/admin"
                                        handleMenuClose={() => setOpenDrawer(false)}
                                    />
                                ) : (
                                    ""
                                )}
                            </>
                        ) : (
                            <Button color="primary" variant="contained" onClick={connectWallet}>
                                Connect Wallet
                            </Button>
                        )}
                    </Stack>
                </Box>
            </Drawer>
        </>
    );
};

export default Navigation;
