import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Box, Container, Grid } from "@mui/material";
import Breadcrumb from "../../ui-components/Breadcrumb";
import { PortfolioProvider } from "../../../contexts/PortfolioContext";
import tokens from "../../../data/tokens.json";
import { useAppContext } from "../../../contexts/AppContext";
import { useWalletContext } from "../../../contexts/WalletContext";
import Erc20Service from "../../../services/Erc20Service";
import AssetSelection from "../common/AssetSelection";
import AssetsOverview from "../common/AssetsOverview";
import { AssetTransaction, DefaultAddresses, PortfolioParam, Token } from "../../interfaces";
import { Erc20DataHolder } from "../../../services/Erc20DataHolder";

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
        title: "Create Portfolio",
    },
];

const CreatePortfolio: React.FC = () => {
    const navigate = useNavigate();
    const { provider, account, address } = useWalletContext();
    const { portfolioFactoryService } = useAppContext();
    const [selectedSrcToken, setSelectedSrcToken] = useState<Token>(tokens[0]);
    const [selectedSrcTokenBalance, setSelectedSrcTokenBalance] = useState<bigint>(0n);
    const [selectedDestToken, setSelectedDestToken] = useState<Token>(tokens[2]);
    const [amount, setAmount] = useState(0);
    const [assets, setAssets] = useState<AssetTransaction[]>([]);
    const [allowanceAddress, setAllowanceAddress] = useState<string>("");

    useEffect(() => {
        if (portfolioFactoryService) {
            setAllowanceAddress(portfolioFactoryService.contractAddress);
        }
    }, [portfolioFactoryService]);

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

    const addAsset = async (dexEntry: [string, { dexName: string; price: bigint }]) => {
        if (portfolioFactoryService && account && amount > 0 && dexEntry) {
            const [dexAddress, dexDetails] = dexEntry;

            if (selectedSrcToken.address !== DefaultAddresses.ETH) {
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
                    amountToApprove = Erc20DataHolder.getInstance().normalizeAmount(selectedSrcToken.address, amount.toString());
                }

                const erc20 = new Erc20Service(account, selectedSrcToken.address);
                await erc20.approve(
                    portfolioFactoryService.contractAddress,
                    amountToApprove
                );
            }

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
        }
    };

    const removeAsset = (index: number) => {
        setAssets((prevAssets) => prevAssets.filter((_, i) => i !== index));
    };

    const createPortfolio = async () => {
        const params: PortfolioParam[] = [];
        let ethAmount: bigint = 0n;

        if (account && portfolioFactoryService) {
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

            await portfolioFactoryService.createPortfolio(params, ethAmount);
            navigate("/portfolios");
        }
    };

    return (
        <Box pt={7}>
            <Container sx={{ maxWidth: "1400px !important", position: "relative" }}>
                <Breadcrumb title="Create Portfolio" items={BCrumb} />
                <PortfolioProvider>
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
                                portfolioAction={createPortfolio}
                                actionLabel="Create Portfolio"
                            />
                        </Grid>
                    </Grid>
                </PortfolioProvider>
            </Container>
        </Box>
    );
};

export default CreatePortfolio;
