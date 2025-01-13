import React, { createContext, useContext, useState, useEffect, useMemo } from "react";
import { useWalletContext } from "./WalletContext";
import DexConnectorStorageService from "../services/DexConnectorStorageService";
import PortfolioFactoryService from "../services/PortfolioFactoryService";
import ca from "../data/contract-addresses.json";
import DexConnectorService from "../services/DexConnectorService";

interface AppContextType {
    dexConnectorStorageService: DexConnectorStorageService | null;
    portfolioFactoryService: PortfolioFactoryService | null;
    dexConnectorServices: DexConnectorService[];
    isAdmin: boolean;
    refreshDexConnectors: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const useAppContext = () => {
    const context = useContext(AppContext);
    if (context === undefined) {
        throw new Error("useAppContext must be used within an AppProvider");
    }
    return context;
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { account, address } = useWalletContext();
    const [dexConnectorStorageService, setDexConnectorStorageService] = useState<DexConnectorStorageService | null>(
        null,
    );
    const [portfolioFactoryService, setPortfolioFactoryService] = useState<PortfolioFactoryService | null>(null);
    const [dexConnectorServices, setDexConnectorServices] = useState<DexConnectorService[]>([]);

    const [owner, setOwner] = useState<string>();

    const isAdmin = useMemo(() => owner === address, [owner, address]);

    const refreshDexConnectors = async () => {
        if (dexConnectorStorageService && account) {
            const dcsAddresses: string[] = await dexConnectorStorageService.getDexes();
            const services = await Promise.all(dcsAddresses.map((dex) => new DexConnectorService(account, dex)));
            setDexConnectorServices(services);
        }
    };

    useEffect(() => {
        const loadOwner = async (dexStorage: DexConnectorStorageService) => {
            const owner: string = await dexStorage.getOwnerAddress();
            setOwner(owner);
        };

        if (account) {
            const dexStorage = new DexConnectorStorageService(account, ca.dexConnectorStorage);
            setDexConnectorStorageService(dexStorage);
            loadOwner(dexStorage);

            setPortfolioFactoryService(new PortfolioFactoryService(account, ca.portfolioFactory));
            refreshDexConnectors();
        }
    }, [account]);

    return (
        <AppContext.Provider
            value={{
                dexConnectorStorageService,
                portfolioFactoryService,
                dexConnectorServices,
                isAdmin,
                refreshDexConnectors,
            }}
        >
            {children}
        </AppContext.Provider>
    );
};
