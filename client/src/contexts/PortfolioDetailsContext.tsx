import { createContext, useContext, useEffect, useState } from "react";
import { usePortfolioContext } from "./PortfolioContext";
import PortfolioService from "../services/PortfolioService";
import { useWalletContext } from "./WalletContext";
import UniswapV2GraphClient from "../services/UniswapV2GraphClient";
import {
    DefaultAddresses,
    Portfolio,
    PortfolioActionEvent,
    PortfolioCreatedEvent,
    PortfolioEventType,
    Price,
} from "../components/interfaces";
import { fetchAssetData } from "./Utility";
import { useAppContext } from "./AppContext";
import { Erc20DataHolder } from "../services/Erc20DataHolder";

interface PortfolioDetailsContextType {
    currentPortfolio: Portfolio | undefined;
    currentPortfolioServices: PortfolioService | undefined;
    portfolioHistoricValue: Price[];
    isLoadingHistoricValue: boolean;
    assetsHistoricPrices: { [assetAddress: string]: Price[] };
    assetsTotalValue: { [assetAddress: string]: Price[] };
    portfolioCreatedEvent: PortfolioCreatedEvent | null;
    portfolioActionEvents: PortfolioActionEvent[];
    refreshPortolio: () => void;
}

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
    const { dexConnectorServices, portfolioFactoryService } = useAppContext();
    const { portfolioMap, portfolioServices } = usePortfolioContext();
    const [currentPortfolio, setCurrentPortfolio] = useState<Portfolio | undefined>(undefined);
    const [currentPortfolioServices, setCurrentPortfolioServices] = useState<PortfolioService | undefined>(undefined);
    const [portfolioHistoricValue, setPortfolioHistoricValue] = useState<Price[]>([]);
    const [assetsHistoricPrices, setAssetsHistoricPrices] = useState<{ [assetAddress: string]: Price[] }>({});
    const [assetsTotalValue, setAssetsTotalValue] = useState<{ [assetAddress: string]: Price[] }>({});
    const [portfolioCreatedEvent, setPortfolioCreatedEvent] = useState<PortfolioCreatedEvent | null>(null);
    const [portfolioActionEvents, setPortfolioActionEvents] = useState<PortfolioActionEvent[]>([]);
    const [isLoadingHistoricValue, setIsLoadingHistoriValues] = useState<boolean>(false);

    useEffect(() => {
        setIsLoadingHistoriValues(true);
        setCurrentPortfolio(portfolioMap[portfolioAddress]);
        setCurrentPortfolioServices(portfolioServices.filter((p) => p.contractAddress === portfolioAddress)[0]);
    }, [portfolioAddress, portfolioMap, portfolioServices]);

    useEffect(() => {
        loadHistoricPrices();
    }, [portfolioActionEvents]);

    useEffect(() => {
        computeProtfolioTotalValue();
        setIsLoadingHistoriValues(false);
    }, [assetsHistoricPrices]);

    useEffect(() => {
        const loadPortfolioEvent = async () => {
            if (portfolioFactoryService && currentPortfolioServices && account) {
                setPortfolioCreatedEvent(
                    await portfolioFactoryService.getPortfolioCreatedEvent(currentPortfolioServices.contractAddress),
                );
                const events = await currentPortfolioServices.getPortfolioActionEvents(
                    currentPortfolioServices.contractAddress,
                );
                setPortfolioActionEvents(events);
            }
        };

        loadPortfolioEvent();
    }, [currentPortfolioServices, portfolioFactoryService, currentPortfolio]);

    const loadHistoricPrices = async () => {
        const assetsPrices: { [assetAddress: string]: Price[] } = {};
        const assetsAddresses = Array.from(new Set(portfolioActionEvents.map((e) => e.assetAddress)));

        await Promise.all(
            assetsAddresses.map(async (a) => {
                assetsPrices[a] = await loadAssetHistoricPrices(a);
            }),
        );

        setAssetsHistoricPrices(assetsPrices);
    };

    const getDayStartAndEndTimestamps = (timestampInSeconds: number): { startOfDay: number; endOfDay: number } => {
        const date = new Date(timestampInSeconds * 1000);
        const startOfDay = new Date(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), 0, 0, 1);
        const endOfDay = new Date(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), 23, 59, 59);

        return {
            startOfDay: Math.floor(startOfDay.getTime() / 1000),
            endOfDay: Math.floor(endOfDay.getTime() / 1000),
        };
    };

    const computeProtfolioTotalValue = () => {
        if (!portfolioCreatedEvent || !currentPortfolio) {
            setPortfolioHistoricValue([]);
            return;
        }

        const datePriceMap: { [date: number]: Price } = {};
        const atv: { [assetAddress: string]: Price[] } = {};
        const assetsAddresses = Array.from(new Set(portfolioActionEvents.map((e) => e.assetAddress)));

        assetsAddresses.forEach((asset) => {
            const assetValue = computAssetTotalValue(asset);
            atv[asset] = assetValue;

            assetValue.forEach(av => {
                if (!datePriceMap[av.date]) {
                    datePriceMap[av.date] = {
                        date: av.date,
                        ethPriceWithToken: "0",
                        tokenPriceWithEth: "0",
                        tokenpriceWithUsd: "0",
                    };
                }

                datePriceMap[av.date].ethPriceWithToken = (
                    parseFloat(datePriceMap[av.date].ethPriceWithToken) + parseFloat(av.ethPriceWithToken)
                ).toString();

                datePriceMap[av.date].tokenPriceWithEth = (
                    parseFloat(datePriceMap[av.date].tokenPriceWithEth) + parseFloat(av.tokenPriceWithEth)
                ).toString();

                datePriceMap[av.date].tokenpriceWithUsd = (
                    parseFloat(datePriceMap[av.date].tokenpriceWithUsd) + parseFloat(av.tokenpriceWithUsd)
                ).toString();
            })
        });
        setAssetsTotalValue(atv)
        setPortfolioHistoricValue(Object.values(datePriceMap).sort((a, b) => a.date - b.date));
    };

    const computAssetTotalValue = (assetAddress: string): Price[] => {
        const assetEvents: PortfolioActionEvent[] = portfolioActionEvents.filter(
            (e) => e.assetAddress === assetAddress,
        );
        const assetValue: Price[] = [];
        
        assetsHistoricPrices[assetAddress].forEach((ahp) => {
            const startAndEnd = getDayStartAndEndTimestamps(ahp.date);
            const events = assetEvents.filter((e) => startAndEnd.endOfDay >= Number(e.timestamp));

            let av: Price = {
                date: startAndEnd.endOfDay,
                ethPriceWithToken: "0",
                tokenPriceWithEth: "0",
                tokenpriceWithUsd: "0",
            };

            events.forEach((e) => {
                const amount = Erc20DataHolder.getInstance().formatBalance(e.assetAddress, e.amount);
                av.date = startAndEnd.endOfDay;

                if (
                    e.eventType === PortfolioEventType.AddAsset ||
                    e.eventType === PortfolioEventType.BuyAsset
                ) {
                    av.ethPriceWithToken = (
                        parseFloat(av.ethPriceWithToken) +
                        parseFloat(ahp.ethPriceWithToken) * parseFloat(amount)
                    ).toString();

                    av.tokenPriceWithEth = (
                        parseFloat(av.tokenPriceWithEth) +
                        parseFloat(ahp.tokenPriceWithEth) * parseFloat(amount)
                    ).toString();

                    av.tokenpriceWithUsd = (
                        parseFloat(av.tokenpriceWithUsd) +
                        parseFloat(ahp.tokenpriceWithUsd) * parseFloat(amount)
                    ).toString();
                }
                if (e.eventType === PortfolioEventType.WithdrawAsset) {
                    av.ethPriceWithToken = (
                        parseFloat(av.ethPriceWithToken) -
                        parseFloat(ahp.ethPriceWithToken) * parseFloat(amount)
                    ).toString();

                    av.tokenPriceWithEth = (
                        parseFloat(av.tokenPriceWithEth) -
                        parseFloat(ahp.tokenPriceWithEth) * parseFloat(amount)
                    ).toString();

                    av.tokenpriceWithUsd = (
                        parseFloat(av.tokenpriceWithUsd) -
                        parseFloat(ahp.tokenpriceWithUsd) * parseFloat(amount)
                    ).toString();
                }
            });

            assetValue.push(av);
        });

        return assetValue;
    };
    

    const refreshPortolio = async () => {
        if (currentPortfolioServices && account) {
            setIsLoadingHistoriValues(true);
            const portfolioOwner: string = await currentPortfolioServices.getOwnerAddress();
            const assetAddresses: string[] = await currentPortfolioServices.getAssetAddresses();

            const assetResult = await Promise.all(
                assetAddresses.map((assetAddress) =>
                    fetchAssetData(account, dexConnectorServices, currentPortfolioServices, assetAddress),
                ),
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
                assetsTotalValue,
                isLoadingHistoricValue,
                portfolioCreatedEvent,
                portfolioActionEvents,
                refreshPortolio
            }}
        >
            {children}
        </PortfolioDetailsContext.Provider>
    );
};
