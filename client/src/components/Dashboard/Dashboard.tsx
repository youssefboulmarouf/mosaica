import { Box, Container, Grid } from "@mui/material";
import { PortfolioProvider } from "../../contexts/PortfolioContext";
import DashboardTopCards from "./DashboardTopCards";
import DashboardTable from "./DashboardTable";
import DashboardRatio from "./DashboardRatio";
import { DashboardProvider, useDashboardContext } from "../../contexts/DashboardContext";

const Dashboard: React.FC = () => {
    return (
        <Box pt={7}>
            <Container sx={{ maxWidth: "1400px !important", position: "relative" }}>
                <PortfolioProvider>
                    <DashboardProvider>
                        <Grid container spacing={3}>
                            <DashboardTopCards />
                        </Grid>

                        <Grid container spacing={3} mt={2}>
                            <Grid item xs={12} sm={12} md={9} lg={8}>
                                <DashboardTable />
                            </Grid>

                            <Grid item xs={12} sm={12} md={3} lg={4}>
                                <DashboardRatio />
                            </Grid>
                        </Grid>
                    </DashboardProvider>
                </PortfolioProvider>
            </Container>
        </Box>
    );
};

export default Dashboard;
