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
    FormControlLabel,
    Stack,
    Switch,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableRow,
    TextField,
    Typography,
    useTheme,
} from "@mui/material";
import tokens from "../../../../../data/tokens.json";
import { Asset, AssetTransaction, DexPrice, Token } from "../../../../interfaces";
import * as PriceAggregator from "../../../../../services/PriceAggregatorService";
import { useAppContext } from "../../../../../contexts/AppContext";
import { Erc20DataHolder } from "../../../../../services/Erc20DataHolder";

interface WithdrawAssetSelectionProps {
    assets: Asset[];
    selectedAsset: Asset | undefined;
    setSelectedAsset: (newAsset: Asset) => void;
    addToWithdrawList: (assetToWithdraw: AssetTransaction) => void;
}

const WithdrawAssetSelection: React.FC<WithdrawAssetSelectionProps> = ({ assets, selectedAsset, setSelectedAsset, addToWithdrawList }) => {
    const theme = useTheme();
    const { dexConnectorServices } = useAppContext();
    const [amount, setAmount] = useState<string>("0");
    const [formattedAmount, setFormattedAmount] = useState<bigint>(0n);
    const [swap, setSwap] = useState<boolean>(false);
    const [selectedDestToken, setSelectedDestToken] = useState<Token>(tokens[0]);
    const [hasEnoughBalance, setHasEnoughBalance] = useState<boolean>(false);
    const [prices, setPrices] = useState<DexPrice>({});
    const [isLoadingPrices, setIsLoadingPrices] = useState<boolean>(true);
    const [disableButton, setDisableButton] = useState<boolean>(true);

    useEffect(() => {
        setDisableButton((swap && Object.entries(prices).length === 0) || +amount === 0 || !hasEnoughBalance);
    }, [swap, hasEnoughBalance, prices, amount]);

    useEffect(() => {
        if (selectedAsset) {
            let hasBalance = false;
            if (selectedAsset) {
                hasBalance = parseFloat(selectedAsset.balance) >= +amount;
            }

            setHasEnoughBalance(hasBalance);

            if (parseFloat(amount) > 0) {
                setFormattedAmount(Erc20DataHolder.getInstance().normalizeAmount(selectedAsset.assetAddress, amount));
            }
        }
    }, [selectedAsset, amount]);

    useEffect(() => {
        const fetchPrices = async () => {
            setPrices({});
            if (swap && selectedAsset && parseFloat(amount) > 0) {
                setIsLoadingPrices(true);

                const bestPrice: DexPrice = await PriceAggregator.getCurrentPrices(
                    dexConnectorServices,
                    selectedAsset.assetAddress,
                    selectedDestToken.address,
                    formattedAmount,
                );

                setPrices(bestPrice);
            }

            setIsLoadingPrices(false);
        };
        fetchPrices();
    }, [swap, selectedDestToken, selectedAsset, formattedAmount]);

    const handleAddAsset = () => {
        if (selectedAsset) {
            if (swap) {
                const dexEntry = Object.entries(prices);
                const [dexAddress, dexDetails] = dexEntry[0];
                addToWithdrawList({
                    srcSymbol: selectedAsset.assetSymbol,
                    srcAddress: selectedAsset.assetAddress,
                    srcBalance: ethers.parseEther(selectedAsset.balance),
                    destSymbol: selectedDestToken.symbol,
                    destAddress: selectedDestToken.address,
                    amount: Erc20DataHolder.getInstance().normalizeAmount(selectedAsset.assetAddress, amount.toString()),
                    dexAddress: dexAddress,
                    dexName: dexDetails.dexName,
                    price: dexDetails.price,
                });
            } else {
                addToWithdrawList({
                    srcSymbol: selectedAsset.assetSymbol,
                    srcAddress: selectedAsset.assetAddress,
                    srcBalance: ethers.parseEther(selectedAsset.balance),
                    destSymbol: selectedAsset.assetSymbol,
                    destAddress: selectedAsset.assetAddress,
                    amount: Erc20DataHolder.getInstance().normalizeAmount(selectedAsset.assetAddress, amount.toString()),
                    dexAddress: selectedAsset.assetAddress,
                    dexName: "",
                    price: 0n,
                });
            }
        }
    };

    return (
        <Card sx={{ padding: 0, borderColor: (theme) => theme.palette.divider }} variant="outlined">
            <CardHeader title="Withdraw Asset Selection" />
            <Divider />
            <CardContent>
                <Typography variant="subtitle1" fontWeight={600} component="label" sx={{ display: "flex" }}>
                    Select Asset
                </Typography>

                <Autocomplete
                    options={assets}
                    fullWidth
                    getOptionKey={(options) => options.assetAddress}
                    getOptionLabel={(options) => options.assetSymbol}
                    value={selectedAsset}
                    onChange={(event: React.SyntheticEvent, newValue: Asset | null) =>
                        setSelectedAsset(newValue === null ? assets[0] : newValue)
                    }
                    renderInput={(params) => <TextField {...params} placeholder="Choose Payment Token" />}
                />
                <Typography variant="caption" color="secondary" sx={{ display: "flex" }}>
                    {selectedAsset?.balance}
                </Typography>

                <Typography variant="subtitle1" fontWeight={600} component="label" sx={{ display: "flex", mt: 2 }}>
                    Amount
                </Typography>
                <Stack direction="row" spacing={2}>
                    <TextField
                        fullWidth
                        value={amount}
                        onChange={(e: any) => setAmount(e.target.value === "" ? 0 : e.target.value)}
                        error={!hasEnoughBalance}
                    />
                    <Button onClick={() => setAmount(selectedAsset ? selectedAsset.balance : "0")}>Max</Button>
                </Stack>
                {!hasEnoughBalance ? (
                    <Typography variant="caption" color="error" sx={{ display: "flex" }}>
                        Not Enough Balance
                    </Typography>
                ) : (
                    ""
                )}

                <FormControlLabel
                    sx={{ display: "flex", mt: 2 }}
                    control={
                        <Switch
                            checked={swap}
                            onChange={(event: React.ChangeEvent<HTMLInputElement>, checked: boolean) =>
                                setSwap(checked)
                            }
                        />
                    }
                    label="Swap Token"
                />

                {swap ? (
                    <>
                        <Typography
                            variant="subtitle1"
                            fontWeight={600}
                            component="label"
                            sx={{ display: "flex", mt: 2 }}
                        >
                            Destination Token
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
                    </>
                ) : (
                    ""
                )}

                {/* Add Asset Button */}
                <Button
                    variant="contained"
                    fullWidth
                    disabled={disableButton}
                    color="primary"
                    sx={{ mt: 2 }}
                    onClick={() => handleAddAsset()}
                >
                    Add To Withdraw List
                </Button>
                {/* End Asset Button */}

                {/* Dex Prices */}
                {parseFloat(amount) > 0 && swap ? (
                    isLoadingPrices ? (
                        <Box sx={{ mt: 2, textAlign: "center" }}>
                            <CircularProgress />
                            <Typography variant="body1">
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
                            The pair {selectedAsset?.assetSymbol}/{selectedDestToken.symbol} is not supported by any of
                            the currently integrated third-party decentralized exchanges.
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

export default WithdrawAssetSelection;
