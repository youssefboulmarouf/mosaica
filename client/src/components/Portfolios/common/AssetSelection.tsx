import { useEffect, useState } from "react";
import { ethers } from "ethers";
import {
    Autocomplete,
    Box,
    Button,
    Card,
    CardContent,
    CardHeader,
    CircularProgress,
    Divider,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableRow,
    TextField,
    Typography,
    useTheme,
} from "@mui/material";
import tokens from "../../../data/tokens.json";
import * as PriceAggregator from "../../../services/PriceAggregatorService";
import { useAppContext } from "../../../contexts/AppContext";
import { DexPrice, Token } from "../../interfaces";
import { Erc20DataHolder } from "../../../services/Erc20DataHolder";
import { useWalletContext } from "../../../contexts/WalletContext";

interface AssetSelectionProps {
    selectedSrcToken: Token;
    setSelectedSrcToken: (newValue: Token) => void;
    selectedDestToken: Token;
    setSelectedDestToken: (newValue: Token) => void;
    selectedSrcTokenBalance: bigint;
    amount: number;
    setAmount: (newValue: number) => void;
    addAsset: (dexEntry: [string, {dexName: string; price: bigint; }]) => void;
}

const AssetSelection: React.FC<AssetSelectionProps> = ({
    selectedSrcToken,
    setSelectedSrcToken,
    selectedDestToken,
    setSelectedDestToken,
    selectedSrcTokenBalance,
    amount,
    setAmount,
    addAsset
}) => {
    const theme = useTheme();
    const {account} = useWalletContext();
    const { dexConnectorServices } = useAppContext();
    const [disableAddAssetButton, setDisableAddAssetButton] = useState<boolean>(true);
    const [prices, setPrices] = useState<DexPrice>({});
    const [isLoadingPrices, setIsLoadingPrices] = useState<boolean>(true);
    const [formattedAmount, setFormattedAmount] = useState<bigint>(0n);
    const [formattedBalance, setFormattedBalance] = useState<string>("");

    const handleAddAsset = () => {
        const dexEntry = Object.entries(prices);
        if(dexEntry.length > 0) {
            addAsset(dexEntry[0])
        }
    }

    useEffect(() => {
        setFormattedAmount(Erc20DataHolder.getInstance().normalizeAmount(selectedSrcToken.address, amount.toString()))
    }, [amount]);

    useEffect(() => {
        const fetchPrices = async () => {
            setPrices({});
            setDisableAddAssetButton(true);

            if (account) {
                await Erc20DataHolder.getInstance().fetchErc20Data(account, selectedSrcToken.address);
                setFormattedAmount(Erc20DataHolder.getInstance().normalizeAmount(selectedSrcToken.address, amount.toString()))
                setFormattedBalance(Erc20DataHolder.getInstance().formatBalance(selectedSrcToken.address, selectedSrcTokenBalance))
            }          

            if (amount > 0) {
                setIsLoadingPrices(true);
                const bestPrice: DexPrice = await PriceAggregator.getCurrentPrices(
                    dexConnectorServices,
                    selectedSrcToken.address,
                    selectedDestToken.address,
                    formattedAmount
                );

                setPrices(bestPrice);

                if (Object.entries(bestPrice).length > 0) {
                    setDisableAddAssetButton(false);
                }
            }

            if (formattedAmount > selectedSrcTokenBalance) {
                setDisableAddAssetButton(true);
            }

            setIsLoadingPrices(false);
        };
        fetchPrices();
    }, [selectedSrcToken, selectedSrcTokenBalance, dexConnectorServices, selectedDestToken, formattedAmount]);

    return (
        <Card sx={{ padding: 0, borderColor: (theme) => theme.palette.divider }} variant="outlined">
            <CardHeader title="Asset Selection" />
            <Divider />
            <CardContent>
                {/* Base Token */}
                <Typography variant="subtitle1" fontWeight={600} component="label" sx={{ display: "flex" }}>
                    Base Token
                </Typography>
                <Autocomplete
                    
                    options={tokens}
                    fullWidth
                    getOptionKey={(options) => options.address}
                    getOptionLabel={(options) => options.symbol}
                    value={selectedSrcToken}
                    onChange={(event: React.SyntheticEvent, newValue: Token | null) =>
                        setSelectedSrcToken(newValue === null ? tokens[0] : newValue)
                    }
                    renderInput={(params) => <TextField {...params} placeholder="Choose Payment Token" />}
                />
                <Typography variant="caption" color="secondary" sx={{ display: "flex" }}>
                    {selectedSrcToken.symbol} Balance: {formattedBalance}
                </Typography>
                {/* End Base Token */}

                {/* Amount */}
                <Typography variant="subtitle1" fontWeight={600} component="label" sx={{ display: "flex", mt: 2 }}>
                    Amount
                </Typography>
                <TextField
                    fullWidth
                    value={amount}
                    onChange={(e: any) => setAmount(e.target.value === "" ? 0 : e.target.value)}
                    error={formattedAmount > selectedSrcTokenBalance}
                />
                {formattedAmount > selectedSrcTokenBalance ? (
                    <Typography variant="caption" color="error" sx={{ display: "flex" }}>
                        Not Enough Balance
                    </Typography>
                ) : (
                    ""
                )}
                {/* End Amount */}

                {/* Asset Token */}
                <Typography variant="subtitle1" fontWeight={600} component="label" sx={{ display: "flex", mt: 2 }}>
                    Asset
                </Typography>
                <Autocomplete
                    disablePortal
                    options={tokens}
                    fullWidth
                    getOptionKey={(options) => options.address}
                    getOptionLabel={(options) => options.symbol}
                    value={selectedDestToken}
                    onChange={(event: React.SyntheticEvent, newValue: Token | null) =>
                        setSelectedDestToken(newValue === null ? tokens[2] : newValue)
                    }
                    renderInput={(params) => <TextField {...params} placeholder="Choose Asset" />}
                />
                {/* End Asset Token */}

                {/* Add Asset Button */}
                <Button
                    variant="contained"
                    fullWidth
                    disabled={disableAddAssetButton}
                    color="primary"
                    sx={{ mt: 2 }}
                    onClick={() => {
                        handleAddAsset()
                    }}
                >
                    Add Asset
                </Button>
                {/* End Asset Button */}

                {/* Dex Prices */}
                {amount > 0 ? (
                    isLoadingPrices ? (
                        <Box sx={{ textAlign: "center" }}>
                            <CircularProgress />
                            <Typography variant="body1" sx={{ mt: 2 }}>
                                Loading prices from integrated third-party decentralized exchanges, please wait...
                            </Typography>
                        </Box>
                    ) : Object.entries(prices).length > 0 ? (
                        <Table size="small" sx={{ mt: 2 }}>
                            <TableHead>
                                <TableRow sx={{ backgroundColor: theme.palette.grey[100] }}>
                                    <TableCell>
                                        <Typography variant="body1">3rd Party Dex</Typography>
                                    </TableCell>
                                    <TableCell>
                                        <Typography variant="body1">Price</Typography>
                                    </TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {Object.values(prices).map((p, i) => (
                                    <TableRow
                                        key={p.dexName}
                                        sx={{
                                            backgroundColor: i === 0 ? theme.palette.primary.light : "transparent",
                                        }}
                                    >
                                        <TableCell>
                                            <Typography color="textSecondary">{p.dexName}</Typography>
                                        </TableCell>
                                        <TableCell>
                                            <Typography color="textSecondary">
                                                {ethers.formatEther(p.price.toString())} {selectedDestToken?.symbol}
                                            </Typography>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    ) : (
                        <Typography sx={{ mt: 2 }}>
                            The pair {selectedSrcToken.symbol}/{selectedDestToken.symbol} is not supported by any of the
                            currently integrated third-party decentralized exchanges.
                        </Typography>
                    )
                ) : (
                    ""
                )}
                {/* End Dex Prices */}
            </CardContent>
        </Card>
    );
};

export default AssetSelection;
