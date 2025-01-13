import { createContext, useContext, useEffect, useState } from "react";
import { Portfolio } from "../components/interfaces";
import { useWalletContext } from "./WalletContext";
import { usePortfolioContext } from "./PortfolioContext";

interface AssetView {
    assetAddress: string;
    assetSymbol: string;
    assetName: string;
    balance: string;
    currentPriceEth: string;
    currentPriceUsd: string;
    imgPath: string;
    portfolios: Portfolio[];
}

interface DashboardAssetView {
    [assetAddress: string]: AssetView;
}

interface DashboardContextType {
    assetsView: DashboardAssetView
}

const DashboardContext = createContext<DashboardContextType | undefined>(undefined);

export const useDashboardContext = () => {
    const context = useContext(DashboardContext);
    if (context === undefined) {
        throw new Error("useDashboardContext must be used within a DashboardProvider");
    }
    return context;
};

export const DashboardProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { address } = useWalletContext();
    const { portfolioMap, isLoading } = usePortfolioContext();
    const [assetsView, setAssetsView] = useState<DashboardAssetView>({});

    useEffect(() => {
        if (isLoading) return;

        const view: DashboardAssetView = {};
        Object.values(portfolioMap).forEach((portfolio) => {
            portfolio.assets.forEach((asset) => {
                if (view[asset.assetAddress]) {
                    view[asset.assetAddress].balance = (
                        parseFloat(view[asset.assetAddress].balance) + parseFloat(asset.balance)
                    ).toString();

                    view[asset.assetAddress].currentPriceEth = (
                        parseFloat(view[asset.assetAddress].currentPriceEth) + parseFloat(asset.currentPriceEth)
                    ).toString();

                    view[asset.assetAddress].currentPriceUsd = (
                        parseFloat(view[asset.assetAddress].currentPriceUsd) + parseFloat(asset.currentPriceUsd)
                    ).toString();
                    view[asset.assetAddress].portfolios.push(portfolio);
                } else {
                    view[asset.assetAddress] = {
                        ...asset,
                        portfolios: [portfolio],
                    };
                }
            });
        });

        const sortedDashboardAssetView: DashboardAssetView = {};
        Object.entries(view)
            .sort(([, assetA], [, assetB]) => parseFloat(assetB.currentPriceEth) - parseFloat(assetA.currentPriceEth))
            .forEach(([assetAddress, assetView]) => {
                sortedDashboardAssetView[assetAddress] = assetView;
            });

        setAssetsView(sortedDashboardAssetView);
    }, [portfolioMap, isLoading, address]);

    return (
        <DashboardContext.Provider value={{ assetsView }}>
            {children}
        </DashboardContext.Provider>
    );
}