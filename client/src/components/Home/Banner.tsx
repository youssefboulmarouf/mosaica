import { useNavigate } from "react-router-dom";
import { Box, Stack, Typography, Container, Grid, Button } from "@mui/material";
import useMediaQuery from "@mui/material/useMediaQuery";
import Tooltip from "@mui/material/Tooltip";
import { useWalletContext } from "../../contexts/WalletContext";

const Frameworks = [
    {
        name: "Uniswap",
        icon: "/images/svgs/uniswap-logo.png",
    },
    {
        name: "Sushiswap",
        icon: "/images/svgs/sushi-logo.png",
    },
    {
        name: "Kyber Network",
        icon: "/images/svgs/kyber-logo.png",
    },
    {
        name: "Pancakeswap",
        icon: "/images/svgs/cake-logo.png",
    },
    {
        name: "Graph",
        icon: "/images/svgs/the-graph-logo.png",
    }
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
                                        <img src={fw.icon} width={26} height={26} />
                                    </Box>
                                </Tooltip>
                            ))}
                        </Stack>
                    </Grid>
                    
                    {lgUp ? (
                        <img
                            src="/images/svgs/bottom-part-v2.svg"
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
