import React, { createContext, useContext, useState, useEffect } from "react";
import { ethers, Signer, BrowserProvider } from "ethers";

interface WalletContextProps {
    provider: BrowserProvider | null;
    account: Signer | null;
    address: string | null;
    connectWallet: () => Promise<void>;
}

const WalletContext = createContext<WalletContextProps | undefined>(undefined);

export const useWalletContext = () => {
    const context = useContext(WalletContext);
    if (context === undefined) {
        throw new Error("useWalletContext must be used within an WalletProvider");
    }
    return context;
};

export const WalletProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [provider, setProvider] = useState<BrowserProvider | null>(null);
    const [account, setAccount] = useState<Signer | null>(null);
    const [address, setAddress] = useState<string | null>(null);

    const connectWallet = async () => {
        try {
            if (!window.ethereum) {
                alert("MetaMask is not installed!");
            }

            const connectedProvider = new ethers.BrowserProvider(window.ethereum);
            setProvider(connectedProvider);
            const signer = await connectedProvider.getSigner();
            setAccount(signer);
            const accoutnAddress = await signer.getAddress();
            setAddress(accoutnAddress);
        } catch (error) {
            console.error("Error connecting wallet:", error);
        }
    };

    useEffect(() => {
        if (window.ethereum) {
            connectWallet();
            window.ethereum.on("accountsChanged", async (accounts: string[]) => {
                if (accounts.length > 0) {
                    const connectedProvider = new ethers.BrowserProvider(window.ethereum);
                    setProvider(connectedProvider);
                    const signer = await connectedProvider.getSigner();
                    setAccount(signer);
                    const accountAddress = await signer.getAddress();
                    setAddress(accountAddress);
                }
            });
        }
    }, []);

    return (
        <WalletContext.Provider value={{ provider, account, address, connectWallet }}>
            {children}
        </WalletContext.Provider>
    );
};
