import { Box, Grid, Container, Typography } from "@mui/material";
import FeatureBox from "./FeatureBox";

const Features: React.FC = () => {
    return (
        <Box pt={7}>
            <Container sx={{ maxWidth: "1400px !important", position: "relative" }}>
                <Box mb={4}>
                    <Typography
                        variant="h1"
                        fontWeight={700}
                        lineHeight="1.2"
                        sx={{ fontSize: { xs: "40px", sm: "56px" } }}
                    >
                        <Typography
                            variant="h1"
                            fontWeight={700}
                            component="span"
                            color="primary.main"
                            sx={{ fontSize: { xs: "40px", sm: "56px" } }}
                        >
                            Mosaica{" "}
                        </Typography>
                        Features
                    </Typography>
                </Box>
                <Grid container spacing={3} mt={3}>
                    <Grid item xs sm={6} lg>
                        <FeatureBox
                            bgcolor="secondary.light"
                            imgSrc="/images/svgs/icon-briefcase.svg"
                            boxTitle="Portfolio Manager"
                            boxBodyText="Create & manage custom token portfolios, and define the percentage ratio for each token."
                        />
                        <FeatureBox
                            bgcolor="success.light"
                            imgSrc="/images/svgs/price_aggregator2.svg"
                            boxTitle="Price Aggregator"
                            boxBodyText="Buy & Sell portfolio assets with the best price on the market."
                        />
                    </Grid>
                    <Grid item xs sm={6} lg>
                        <FeatureBox
                            bgcolor="warning.light"
                            imgSrc="/images/svgs/performance-increase.svg"
                            boxTitle="Performance & Tracking"
                            boxBodyText="Provides real-time tracking of the performance of each portfolio."
                        />
                        <FeatureBox
                            bgcolor="error.light"
                            imgSrc="/images/svgs/balance-scale.svg"
                            boxTitle="Rebalancing"
                            boxBodyText="Manually adjusting the token ratios to maintain the desired asset allocation."
                        />
                    </Grid>
                </Grid>
            </Container>
        </Box>
    );
};

export default Features;
