import { Grid } from "@mui/material";
import DashboardCard from "./DashboardCard";
import { usePortfolioContext } from "../../contexts/PortfolioContext";
import { useEffect, useState } from "react";

const DashboardTopCards: React.FC = () => {
    const { portfolioMap, isLoading } = usePortfolioContext();

    const [portfoliosCount, setPortfoliosCount] = useState<number>(0);
    const [assetsCount, setAssetsCount] = useState<number>(0);
    const [usdValue, setUsdValue] = useState<number>(0);
    const [ethValue, setEthValue] = useState<number>(0);

    useEffect(() => {
        if (isLoading) return;

        let assets = 0;
        let usd = 0;
        let eth = 0;

        setPortfoliosCount(Object.entries(portfolioMap).length);

        Object.values(portfolioMap).forEach((portfolio) => {
            assets += portfolio.assets.length;
            usd += parseFloat(portfolio.totalValueUsd);
            eth += parseFloat(portfolio.totalValueEth);
        });

        setAssetsCount(assets);
        setUsdValue(usd);
        setEthValue(eth);
    }, [portfolioMap, isLoading]);

    return (
        <>
            <Grid item xs={12} sm={6} md={3} lg={3}>
                <DashboardCard title="Protfolios" body={portfoliosCount} color="warning" imgPath="images/svgs/icon-briefcase.svg" isLoading={isLoading}/>
            </Grid>

            <Grid item xs={12} sm={6} md={3} lg={3}>
                <DashboardCard title="Assets" body={assetsCount} color="error" imgPath="images/svgs/icon-favorites.svg" isLoading={isLoading}/>
            </Grid>

            <Grid item xs={12} sm={6} md={3} lg={3}>
                <DashboardCard title="Total USD Value" body={"$ " + usdValue.toFixed(2)} color="success" imgPath="images/svgs/dollar.svg" isLoading={isLoading}/>
            </Grid>

            <Grid item xs={12} sm={6} md={3} lg={3}>
                <DashboardCard title="Total ETH Value" body={ethValue.toFixed(2) + " ETH"} color="info" imgPath="images/svgs/ethereum.svg" isLoading={isLoading}/>
            </Grid>
        </>
    );
};

export default DashboardTopCards;
