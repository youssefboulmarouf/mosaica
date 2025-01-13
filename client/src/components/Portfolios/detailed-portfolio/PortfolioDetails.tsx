import { useState } from "react";
import { useLocation } from "react-router-dom";
import { Box, Button, Card, CardContent, Container, Grid, Stack } from "@mui/material";
import Breadcrumb from "../../ui-components/Breadcrumb";
import { PortfolioProvider } from "../../../contexts/PortfolioContext";
import PortfolioChart from "./portfolio-details-components/PortfolioChart";
import PortfolioAssetPerformance from "./portfolio-details-components/PortfolioAssetPerformance";
import { useAppContext } from "../../../contexts/AppContext";
import AddAssetDialog from "./portfolio-details-action-components/AddAssetDialog";
import { PortfolioDetailsProvider } from "../../../contexts/PortfolioDetailsContext";
import WithdrawAssetDialog from "./portfolio-details-action-components/withdraw-component/WithdrawAssetDrawer";
import PortfolioHistory from "./portfolio-details-components/PortfolioHistory";
import BuyAssetDrawer from "./portfolio-details-action-components/BuyAssetDrawer";
import DeletePortfolioDialog from "./portfolio-details-action-components/DeletePortfolioDialog";

const BCrumb = [
    {
        to: "/",
        title: "Home",
    },
    {
        to: "/portfolios",
        title: "Portfolios",
    },
    {
        title: "Portfolio Details",
    },
];

const PortfolioDetails: React.FC = () => {
    const location = useLocation();
    const { portfolioFactoryService } = useAppContext();
    const { portfolioAddress } = location.state;
    const [openAddAssetDialog, setOpenAddAssetDialog] = useState<boolean>(false);
    const [openBuyAssetDrawer, setOpenBuyAssetDrawer] = useState<boolean>(false);
    const [openwithdrawAssetDrawer, setOpenwithdrawAssetDrawer] = useState<boolean>(false);
    const [openDeletePortfolioDialog, setDeletePortfolioDialog] = useState<boolean>(false);

    return (
        <Box pt={7}>
            <Container sx={{ maxWidth: "1400px !important", position: "relative" }}>
                <Breadcrumb title="Portfolio Details" items={BCrumb} />
                <PortfolioProvider>
                    <PortfolioDetailsProvider portfolioAddress={portfolioAddress}>
                        <Grid container mt={3}>
                            <Card sx={{ padding: 0, borderColor: (theme) => theme.palette.divider }} variant="outlined">
                                <CardContent>
                                    <Stack
                                        justifyContent="space-between"
                                        direction={{ xs: "column", sm: "row" }}
                                        spacing={{ xs: 1, sm: 2, md: 4 }}
                                    >
                                        <Button color="primary" onClick={() => setOpenAddAssetDialog(true)}>
                                            Add Asset
                                        </Button>
                                        <Button color="secondary" onClick={() => setOpenBuyAssetDrawer(true)}>
                                            Buy Asset
                                        </Button>
                                        <Button color="success" onClick={() => setOpenwithdrawAssetDrawer(true)}>
                                            Withdraw Assets
                                        </Button>
                                        <Button color="error" onClick={() => setDeletePortfolioDialog(true)}>
                                            Delete Portfolio
                                        </Button>
                                    </Stack>
                                </CardContent>
                            </Card>
                        </Grid>

                        <Grid container mt={2} spacing={3}>
                            <Grid item xs={12} lg={8}>
                                <PortfolioChart />
                            </Grid>

                            <Grid item xs={12} lg={4}>
                                <PortfolioHistory portfolioFactoryService={portfolioFactoryService} />
                            </Grid>

                            <Grid item xs={12} lg={12}>
                                <PortfolioAssetPerformance />
                            </Grid>
                        </Grid>

                        <AddAssetDialog
                            openDialog={openAddAssetDialog}
                            closeDialog={() => setOpenAddAssetDialog(false)}
                        />

                        <BuyAssetDrawer
                            openDrawer={openBuyAssetDrawer}
                            closeDrawer={() => setOpenBuyAssetDrawer(false)}
                        />

                        <WithdrawAssetDialog
                            openDrawer={openwithdrawAssetDrawer}
                            closeDrawer={() => setOpenwithdrawAssetDrawer(false)}
                        />

                        <DeletePortfolioDialog
                            openDeleteDialog={openDeletePortfolioDialog}
                            closeDialog={() => setDeletePortfolioDialog(false)}
                        />
                    </PortfolioDetailsProvider>
                </PortfolioProvider>
            </Container>
        </Box>
    );
};

export default PortfolioDetails;
