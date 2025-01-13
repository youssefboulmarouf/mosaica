import { useNavigate } from "react-router-dom";
import { Box, Stack, Typography, Container, Grid, Button } from "@mui/material";
import useMediaQuery from "@mui/material/useMediaQuery";
import Tooltip from "@mui/material/Tooltip";
import { useWalletContext } from "../../contexts/WalletContext";

const Frameworks = [
    {
        name: "React",
        icon: "/images/frontend-pages/icons/icon-react.svg",
    },
    {
        name: "Material Ui",
        icon: "/images/frontend-pages/icons/icon-mui.svg",
    },
    {
        name: "Next.js",
        icon: "/images/frontend-pages/icons/icon-next.svg",
    },
];
const Banner = () => {
    const navigate = useNavigate();
    const { address, connectWallet } = useWalletContext();
    const lgUp = useMediaQuery((theme: any) => theme.breakpoints.up("lg"));

    const handleRedirect = () => {
        navigate("/dashboard");
    };

    return (
        <Box bgcolor="primary.light" pt={7}>
            <Container sx={{ maxWidth: "1400px !important", position: "relative" }}>
                <>
                    <Grid container spacing={3} justifyContent="center" mb={4}>
                        {lgUp ? (
                            <Grid item xs={12} lg={2} alignItems="end" display="flex">
                                <img
                                    src="/images/frontend-pages/homepage/banner-top-left.svg"
                                    className="animted-img-2"
                                    alt="banner"
                                    width={360}
                                    height={200}
                                    style={{
                                        borderRadius: "16px",
                                        position: "absolute",
                                        left: "24px",
                                        boxShadow: "0px 6px 12px rgba(127, 145, 156, 0.12)",
                                        height: "auto",
                                        width: "auto",
                                    }}
                                />
                            </Grid>
                        ) : null}

                        <Grid item xs={12} lg={7} textAlign="center">
                            <Box mb={4}>
                                <Typography
                                    variant="h1"
                                    fontWeight={700}
                                    lineHeight="1.2"
                                    sx={{
                                        fontSize: {
                                            xs: "40px",
                                            sm: "56px",
                                        },
                                    }}
                                >
                                    All-In-One{" "}
                                    <Typography
                                        variant="h1"
                                        sx={{
                                            fontSize: {
                                                xs: "40px",
                                                sm: "56px",
                                            },
                                        }}
                                        fontWeight={700}
                                        component="span"
                                        color="primary.main"
                                    >
                                        Portfolio Manager
                                    </Typography>
                                </Typography>
                            </Box>
                            <Box alignItems="center" mb={4} justifyContent="center">
                                {address ? (
                                    <Button color="primary" size="large" variant="contained" onClick={handleRedirect}>
                                        Go To App
                                    </Button>
                                ) : (
                                    <Button color="primary" size="large" variant="contained" onClick={connectWallet}>
                                        Connect Wallet
                                    </Button>
                                )}
                            </Box>
                            <Stack
                                direction="row"
                                flexWrap="wrap"
                                alignItems="center"
                                spacing={3}
                                mb={8}
                                justifyContent="center"
                            >
                                {Frameworks.map((fw, i) => (
                                    <Tooltip title={fw.name} key={i}>
                                        <Box
                                            width="54px"
                                            height="54px"
                                            display="flex"
                                            sx={{
                                                backgroundColor: "#1f2c4f",
                                            }}
                                            alignItems="center"
                                            justifyContent="center"
                                            borderRadius="16px"
                                        >
                                            <img src={fw.icon} alt={fw.icon} width={26} height={26} />
                                        </Box>
                                    </Tooltip>
                                ))}
                            </Stack>
                        </Grid>

                        {lgUp ? (
                            <Grid item xs={12} lg={2} alignItems="end" display="flex">
                                <img
                                    src="/images/frontend-pages/homepage/banner-top-right.svg"
                                    className="animted-img-2"
                                    alt="banner"
                                    width={350}
                                    height={220}
                                    style={{
                                        borderRadius: "16px",
                                        position: "absolute",
                                        right: "24px",
                                        boxShadow: "0px 6px 12px rgba(127, 145, 156, 0.12)",
                                        height: "auto",
                                        width: "auto",
                                    }}
                                />
                            </Grid>
                        ) : null}
                    </Grid>

                    {lgUp ? (
                        <img
                            src="/images/frontend-pages/homepage/bottom-part.svg"
                            alt="banner"
                            width={500}
                            height={300}
                            style={{
                                width: "100%",
                                marginBottom: "-11px",
                            }}
                        />
                    ) : null}
                </>
            </Container>
        </Box>
    );
};

export default Banner;
