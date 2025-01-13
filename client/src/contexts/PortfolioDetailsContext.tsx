import { createContext, useContext, useEffect, useState } from "react";
import { usePortfolioContext } from "./PortfolioContext";
import PortfolioService from "../services/PortfolioService";
import { useWalletContext } from "./WalletContext";
import UniswapV2GraphClient from "../services/UniswapV2GraphClient";
import { Asset, DefaultAddresses, Portfolio, Price } from "../components/interfaces";
import { fetchAssetData } from "./Utility";
import { useAppContext } from "./AppContext";

interface PortfolioDetailsContextType {
    currentPortfolio: Portfolio | undefined;
    currentPortfolioServices: PortfolioService | undefined;
    portfolioHistoricValue: Price[];
    isLoadingHistoricValue: boolean;
    assetsHistoricPrices: { [assetAddress: string]: Price[] };
    refreshPortolio: () => void;
};

const PortfolioDetailsContext = createContext<PortfolioDetailsContextType | undefined>(undefined);

export const usePortfolioDetailsContext = () => {
    const context = useContext(PortfolioDetailsContext);
    if (context === undefined) {
        throw new Error("PortfolioDetailsContext must be used within an PortfolioDetailsProvider");
    }
    return context;
};

export const PortfolioDetailsProvider: React.FC<{ children: React.ReactNode; portfolioAddress: string }> = ({
    children,
    portfolioAddress,
}) => {
    const { account } = useWalletContext();
    const { dexConnectorServices } = useAppContext();
    const { portfolioMap, portfolioServices } = usePortfolioContext();
    const [currentPortfolio, setCurrentPortfolio] = useState<Portfolio | undefined>(undefined);
    const [currentPortfolioServices, setCurrentPortfolioServices] = useState<PortfolioService | undefined>(undefined);
    const [portfolioHistoricValue, setPortfolioHistoricValue] = useState<Price[]>([]);
    const [assetsHistoricPrices, setAssetsHistoricPrices] = useState<{ [assetAddress: string]: Price[] }>({});
    const [isLoadingHistoricValue, setIsLoadingHistoriValues] = useState<boolean>(false);

    useEffect(() => {
        setIsLoadingHistoriValues(true);
        setCurrentPortfolio(portfolioMap[portfolioAddress]);
        setCurrentPortfolioServices(portfolioServices.filter((p) => p.contractAddress === portfolioAddress)[0]);
    }, [portfolioAddress, portfolioMap, portfolioServices]);

    useEffect(() => {
        loadHistoricPrices();
    }, [currentPortfolio]);

    useEffect(() => {
        computeProtfolioTotalValue();
        setIsLoadingHistoriValues(false);
    }, [assetsHistoricPrices]);

    const loadHistoricPrices = async () => {
        
        const assetsPrices: { [assetAddress: string]: Price[] } = {};

        if (currentPortfolio) {
            await Promise.all(
                currentPortfolio.assets.map(async (a) => {
                    assetsPrices[a.assetAddress] = await loadAssetHistoricPrices(a.assetAddress);
                }),
            );
        }

        setAssetsHistoricPrices(assetsPrices);
    };

    const computeProtfolioTotalValue = () => {
        const datePriceMap: { [date: number]: Price } = {};

        currentPortfolio?.assets.forEach(async (asset) => {
            if (assetsHistoricPrices[asset.assetAddress]) {
                assetsHistoricPrices[asset.assetAddress].forEach((price) => {
                    if (!datePriceMap[price.date]) {
                        datePriceMap[price.date] = {
                            date: price.date,
                            ethPriceWithToken: "0",
                            tokenPriceWithEth: "0",
                            tokenpriceWithUsd: "0",
                        };
                    }

                    datePriceMap[price.date].ethPriceWithToken = (
                        parseFloat(datePriceMap[price.date].ethPriceWithToken) +
                        parseFloat(price.ethPriceWithToken) * parseFloat(asset.balance)
                    ).toString();

                    datePriceMap[price.date].tokenPriceWithEth = (
                        parseFloat(datePriceMap[price.date].tokenPriceWithEth) +
                        parseFloat(price.tokenPriceWithEth) * parseFloat(asset.balance)
                    ).toString();

                    datePriceMap[price.date].tokenpriceWithUsd = (
                        parseFloat(datePriceMap[price.date].tokenpriceWithUsd) +
                        parseFloat(price.tokenpriceWithUsd) * parseFloat(asset.balance)
                    ).toString();
                });
            }
        });

        setPortfolioHistoricValue(Object.values(datePriceMap).sort((a, b) => a.date - b.date));
    };

    const refreshPortolio = async () => {
        if (currentPortfolioServices && account) {
            setIsLoadingHistoriValues(true);
            const portfolioOwner: string = await currentPortfolioServices.getOwnerAddress();
            const assetAddresses: string[] = await currentPortfolioServices.getAssetAddresses();

            const assetResult = await Promise.all(
                assetAddresses.map((assetAddress) => fetchAssetData(account, dexConnectorServices, currentPortfolioServices, assetAddress)),
            );

            const totalValueEth = assetResult.reduce((sum, asset) => sum + +asset.currentPriceEth, 0);
            const totalValueUsd = assetResult.reduce((sum, asset) => sum + +asset.currentPriceUsd, 0);

            setCurrentPortfolio({
                portfolioAddress,
                owner: portfolioOwner,
                assets: assetResult,
                totalValueEth: totalValueEth.toString(),
                totalValueUsd: totalValueUsd.toString(),
            });

            await loadHistoricPrices();
            computeProtfolioTotalValue();
            setIsLoadingHistoriValues(false);
        }
    };

    const loadAssetHistoricPrices = async (assetAddress: string): Promise<Price[]> => {
        let historicPrices: Price[] = [];
        if (assetAddress === DefaultAddresses.ETH || assetAddress === DefaultAddresses.WETH) {
            historicPrices = mapEthPrices(await UniswapV2GraphClient.fetchPrices(DefaultAddresses.DAI));
        } else {
            historicPrices = await UniswapV2GraphClient.fetchPrices(assetAddress);
        }
        return historicPrices;
    };

    const mapEthPrices = (historicPrices: Price[]): Price[] => {
        return historicPrices.map((price) => ({
            ...price,
            tokenpriceWithUsd: price.ethPriceWithToken,
            ethPriceWithToken: "1",
            tokenPriceWithEth: "1",
        }));
    };

    return (
        <PortfolioDetailsContext.Provider
            value={{
                currentPortfolio,
                currentPortfolioServices,
                portfolioHistoricValue,
                assetsHistoricPrices,
                isLoadingHistoricValue,
                refreshPortolio,
            }}
        >
            {children}
        </PortfolioDetailsContext.Provider>
    );
};
