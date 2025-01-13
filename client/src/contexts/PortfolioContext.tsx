import { createContext, useContext, useEffect, useState } from "react";
import { useAppContext } from "./AppContext";
import { useWalletContext } from "./WalletContext";
import PortfolioService from "../services/PortfolioService";
import { PortfolioMap } from "../components/interfaces";
import { fetchAssetData } from "./Utility";

interface PortfolioContextType {
    portfolioServices: PortfolioService[];
    portfolioMap: PortfolioMap;
    isLoading: boolean;
    refreshPortolios: () => void;
}

const PortfolioContext = createContext<PortfolioContextType | undefined>(undefined);

export const usePortfolioContext = () => {
    const context = useContext(PortfolioContext);
    if (context === undefined) {
        throw new Error("usePortfolioContext must be used within an PortfolioProvider");
    }
    return context;
};

export const PortfolioProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { account, address } = useWalletContext();
    const { dexConnectorServices, portfolioFactoryService } = useAppContext();
    const [portfolioServices, setPortfolioServices] = useState<PortfolioService[]>([]);
    const [portfolioMap, setPortfolioMap] = useState<PortfolioMap>({});
    const [isLoading, setIsLoading] = useState<boolean>(true);
    
    const refreshPortolios = async () => {
        if (account) {
            const portfoliosData: PortfolioMap = {};
            setIsLoading(true);
            setPortfolioMap({});
        
            const results = await Promise.all(
                portfolioServices.map(async (ps) => {
                    const portfolioAddress = ps.contractAddress;
                    const portfolioOwner: string = await ps.getOwnerAddress();
                    const assetAddresses: string[] = await ps.getAssetAddresses();
                    const assetResult = await Promise.all(
                        assetAddresses.map((assetAddress) => fetchAssetData(account, dexConnectorServices, ps, assetAddress)),
                    );
                    return { portfolioAddress, portfolioOwner, assetResult };
                }),
            );
    
            results.forEach(({ portfolioAddress, portfolioOwner, assetResult }) => {
                const totalValueEth = assetResult.reduce((sum, asset) => sum + +asset.currentPriceEth, 0);
                const totalValueUsd = assetResult.reduce((sum, asset) => sum + +asset.currentPriceUsd, 0);
    
                portfoliosData[portfolioAddress] = {
                    portfolioAddress,
                    owner: portfolioOwner,
                    assets: assetResult,
                    totalValueEth: totalValueEth.toString(),
                    totalValueUsd: totalValueUsd.toString(),
                };
            });
    
            setPortfolioMap({ ...portfoliosData });
            setIsLoading(false);
        }
    };

    useEffect(() => {
        const initializePortoliosServices = async () => {
            if (portfolioFactoryService && account && address) {
                const portfoliosAddresses = await portfolioFactoryService.getPortfolios(address);
                const localPortfolioServices = portfoliosAddresses.map(pa => new PortfolioService(account, pa))
    
                setPortfolioServices(localPortfolioServices);
            }
        };
        initializePortoliosServices();
    }, [portfolioFactoryService, account, address]);

    useEffect(() => {
        refreshPortolios();
    }, [portfolioServices]);

    return (
        <PortfolioContext.Provider value={{ portfolioServices, portfolioMap, isLoading, refreshPortolios }}>
            {children}
        </PortfolioContext.Provider>
    );
};
