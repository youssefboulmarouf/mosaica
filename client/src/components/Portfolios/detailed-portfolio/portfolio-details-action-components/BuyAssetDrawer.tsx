import { useEffect, useState } from "react";
import { Box, Drawer, Grid, Typography } from "@mui/material";
import tokens from "../../../../data/tokens.json";
import AssetSelection from "../../common/AssetSelection";
import AssetsOverview from "../../common/AssetsOverview";
import { useWalletContext } from "../../../../contexts/WalletContext";
import Erc20Service from "../../../../services/Erc20Service";
import { usePortfolioDetailsContext } from "../../../../contexts/PortfolioDetailsContext";
import { AssetTransaction, DefaultAddresses, PortfolioParam, Token } from "../../../interfaces";
import { Erc20DataHolder } from "../../../../services/Erc20DataHolder";
import DrawerTitle from "../../../ui-components/DrawerTitle";

interface BuyAssetDrawerProps {
    openDrawer: boolean;
    closeDrawer: () => void;
}

const BuyAssetDrawer: React.FC<BuyAssetDrawerProps> = ({ openDrawer, closeDrawer }) => {
    const { provider, account, address } = useWalletContext();
    const { currentPortfolioServices, refreshPortolio } = usePortfolioDetailsContext();
    const [selectedSrcToken, setSelectedSrcToken] = useState<Token>(tokens[0]);
    const [selectedSrcTokenBalance, setSelectedSrcTokenBalance] = useState<bigint>(0n);
    const [selectedDestToken, setSelectedDestToken] = useState<Token>(tokens[2]);
    const [amount, setAmount] = useState(0);
    const [assets, setAssets] = useState<AssetTransaction[]>([]);
    const [allowanceAddress, setAllowanceAddress] = useState<string>("");

    useEffect(() => {
        if (currentPortfolioServices) {
            setAllowanceAddress(currentPortfolioServices.contractAddress);
        }
    }, [currentPortfolioServices]);

    useEffect(() => {
        const fetchBalance = async () => {
            let balance: bigint = 0n;
            if (provider && account && address) {
                if (selectedSrcToken.address === DefaultAddresses.ETH) {
                    balance = await provider.getBalance(address);
                } else {
                    const erc20Token = new Erc20Service(account, selectedSrcToken.address);
                    balance = await erc20Token.getBalance(address);
                }
            }
            setSelectedSrcTokenBalance(balance);
        };
        fetchBalance();
    }, [selectedSrcToken, provider, account, address]);

    const approveAsset = async () => {
        if (currentPortfolioServices && account && selectedSrcToken.address !== DefaultAddresses.ETH) {
            const tokenAmount = assets
                .filter((asset) => asset.srcAddress === selectedSrcToken.address)
                .reduce((acc, asset) => {
                    acc += asset.amount;
                    return acc;
                }, 0n);

            let amountToApprove = 0n;
            if (tokenAmount) {
                amountToApprove = tokenAmount;
            } else {
                amountToApprove = Erc20DataHolder.getInstance().normalizeAmount(selectedSrcToken.address, amount.toString());;
            }

            await Erc20DataHolder.getInstance().fetchErc20Data(account, selectedSrcToken.address);

            const erc20 = new Erc20Service(account, selectedSrcToken.address);
            await erc20.approve(
                currentPortfolioServices.contractAddress,
                amountToApprove
            );
        }
    }

    const addAsset = async (dexEntry: [string, { dexName: string; price: bigint }]) => {
        if (currentPortfolioServices && account && amount > 0 && dexEntry) {
            const [dexAddress, dexDetails] = dexEntry;

            try {
                await approveAsset();
                setAssets((prevAssets) => {
                    const updatedAssets = [
                        ...prevAssets,
                        {
                            srcSymbol: selectedSrcToken.symbol,
                            srcAddress: selectedSrcToken.address,
                            srcBalance: selectedSrcTokenBalance,
                            destSymbol: selectedDestToken.symbol,
                            destAddress: selectedDestToken.address,
                            amount: Erc20DataHolder.getInstance().normalizeAmount(selectedSrcToken.address, amount.toString()),
                            dexAddress: dexAddress,
                            dexName: dexDetails.dexName,
                            price: dexDetails.price,
                        },
                    ];
                    updatedAssets.sort((a, b) => (a.srcSymbol > b.srcSymbol ? 1 : a.srcSymbol < b.srcSymbol ? -1 : 0));
                    return updatedAssets;
                });    
            } catch (error) {
                console.log("error: ", error)
            }
        }
    };

    const removeAsset = (index: number) => {
        setAssets((prevAssets) => prevAssets.filter((_, i) => i !== index));
    };

    const buyAssets = async () => {
        const params: PortfolioParam[] = [];
        let ethAmount: bigint = 0n;

        if (account && currentPortfolioServices) {
            assets.forEach((asset) => {
                if (asset.srcAddress === DefaultAddresses.ETH) {
                    ethAmount += asset.amount;
                }

                params.push({
                    srcToken: asset.srcAddress,
                    destToken: asset.destAddress,
                    dexConnectorAddress: asset.dexAddress,
                    amount: asset.amount,
                    slippage: 1,
                });
            });

            await currentPortfolioServices.buyAssets(params, ethAmount);

            setAssets([]);
            setAmount(0);

            refreshPortolio();
            closeDrawer();
        }
    };

    const handleCloseDrawer = () => {
        setAmount(0);
        setSelectedSrcToken(tokens[0]);
        closeDrawer();
    };

    return (
        <Drawer anchor="bottom" open={openDrawer} onClose={() => handleCloseDrawer()}>
            <DrawerTitle title="Buy Assets"/>
            <Box p={3}>
                <Grid container spacing={3} mt={3}>
                    <Grid item xs={12} lg={6} sm={6} display="flex" alignItems="stretch">
                        <AssetSelection
                            selectedSrcToken={selectedSrcToken}
                            setSelectedSrcToken={setSelectedSrcToken}
                            selectedDestToken={selectedDestToken}
                            setSelectedDestToken={setSelectedDestToken}
                            selectedSrcTokenBalance={selectedSrcTokenBalance}
                            amount={amount}
                            setAmount={setAmount}
                            addAsset={addAsset}
                        />
                    </Grid>
                    <Grid item xs={12} lg={6} sm={6} display="flex" alignItems="stretch">
                        <AssetsOverview
                            assets={assets}
                            allowanceAddress={allowanceAddress}
                            removeAsset={removeAsset}
                            portfolioAction={buyAssets}
                            actionLabel="Buy Assets"
                        />
                    </Grid>
                </Grid>
            </Box>
        </Drawer>
    );
};

export default BuyAssetDrawer;
