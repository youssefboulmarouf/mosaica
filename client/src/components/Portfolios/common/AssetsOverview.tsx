import { useEffect, useState } from "react";
import { ethers } from "ethers";
import {
    Box,
    Button,
    Card,
    CardContent,
    CardHeader,
    Divider,
    IconButton,
    Stack,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableRow,
    Tooltip,
    Typography,
    useTheme,
} from "@mui/material";
import DeleteForeverIcon from "@mui/icons-material/DeleteForever";
import WarningIcon from "@mui/icons-material/Warning";
import { useWalletContext } from "../../../contexts/WalletContext";
import Erc20Service from "../../../services/Erc20Service";
import { AssetTransaction, DefaultAddresses } from "../../interfaces";

interface AssetsOverviewProps {
    assets: AssetTransaction[];
    actionLabel: string;
    allowanceAddress: string;
    removeAsset: (index: number) => void;
    portfolioAction: () => void;
}

const AssetsOverview: React.FC<AssetsOverviewProps> = ({
    assets,
    actionLabel,
    allowanceAddress,
    removeAsset,
    portfolioAction,
}) => {
    const theme = useTheme();
    const { account, address } = useWalletContext();
    const [disableCreatePortfolioButton, setDisableCreatePortfolioButton] = useState<boolean>(true);
    const [errorMessage, setErrorMessage] = useState<string>("");

    const hasEnoughBalance = (tokenAddress: string): boolean => {
        const tokenAmount = assets
            .filter((asset) => asset.srcAddress === tokenAddress)
            .reduce((acc, asset) => {
                acc += asset.amount;
                return acc;
            }, 0n);

        const walletBalance = assets.filter((asset) => asset.srcAddress === tokenAddress)[0].srcBalance;
        return walletBalance >= tokenAmount;
    };

    const hasEnoughAllowance = async (tokenAddress: string): Promise<boolean> => {
        if (account && address) {
            const tokenAmount = assets
                .filter((asset) => asset.srcAddress === tokenAddress)
                .reduce((acc, asset) => {
                    acc += asset.amount;
                    return acc;
                }, 0n);

            const erc20 = new Erc20Service(account, tokenAddress);
            const tokenAllowance = await erc20.allowance(address, allowanceAddress);
            return (
                tokenAllowance >= tokenAmount
            );
        }
        return false;
    };

    useEffect(() => {
        setDisableCreatePortfolioButton(false);
        assets.map(async (a) => {
            const enoughBalance = hasEnoughBalance(a.srcAddress);

            if (!enoughBalance) {
                setErrorMessage(`Not Enough ${a.srcSymbol} Balance`);
                setDisableCreatePortfolioButton(true);
            }

            if (a.srcAddress !== DefaultAddresses.ETH) {
                const enoughAllowance = await hasEnoughAllowance(a.srcAddress);

                if (!enoughAllowance) {
                    setErrorMessage(`Not Enough ${a.srcSymbol} Allowance.`);
                    setDisableCreatePortfolioButton(true);
                }
            }
        });
    }, [assets]);

    return (
        <Card sx={{ padding: 0, borderColor: (theme) => theme.palette.divider }} variant="outlined">
            <CardHeader title="Assets Overview" />
            <Divider />
            <CardContent>
                {assets.length > 0 ? (
                    <>
                        <Table size="small" sx={{ mt: 2 }}>
                            <TableHead>
                                <TableRow sx={{ backgroundColor: theme.palette.grey[100] }}>
                                    <TableCell>
                                        <Typography variant="body1">Base</Typography>
                                    </TableCell>
                                    <TableCell>
                                        <Typography variant="body1">Asset</Typography>
                                    </TableCell>
                                    <TableCell>
                                        <Typography variant="body1">Amount</Typography>
                                    </TableCell>
                                    <TableCell>
                                        <Typography variant="body1">Best Price</Typography>
                                    </TableCell>
                                    <TableCell>
                                        <Typography variant="body1">Dex</Typography>
                                    </TableCell>
                                    <TableCell />
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {assets.map((asset, i) => (
                                    <TableRow
                                        key={i}
                                        sx={{
                                            backgroundColor: disableCreatePortfolioButton
                                                ? theme.palette.error.light
                                                : "transparent",
                                        }}
                                    >
                                        <TableCell>
                                            <Typography color="textSecondary">{asset.srcSymbol}</Typography>
                                        </TableCell>
                                        <TableCell>
                                            <Typography color="textSecondary">{asset.destSymbol}</Typography>
                                        </TableCell>
                                        <TableCell>
                                            <Typography color="textSecondary">{ethers.formatEther(asset.amount.toString())}</Typography>
                                        </TableCell>
                                        <TableCell>
                                            <Typography color="textSecondary">
                                                {+ethers.formatEther(asset.price.toString())}
                                            </Typography>
                                        </TableCell>
                                        <TableCell>
                                            <Typography color="textSecondary">{asset.dexName}</Typography>
                                        </TableCell>
                                        <TableCell>
                                            <Tooltip title="Delete Connector">
                                                <IconButton color="error" onClick={() => removeAsset(i)}>
                                                    <DeleteForeverIcon width={22} />
                                                </IconButton>
                                            </Tooltip>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                        <Box display="flex" sx={{ mt: 2 }}>
                            <Button
                                variant="contained"
                                color="primary"
                                disabled={disableCreatePortfolioButton}
                                onClick={() => portfolioAction()}
                            >
                                {actionLabel}
                            </Button>
                        </Box>
                        {disableCreatePortfolioButton ? (
                            <Box display="flex" sx={{ mt: 2, justifyContent: "center" }}>
                                <Stack direction="row" spacing={2}>
                                    <WarningIcon sx={{ color: theme.palette.error.dark }} />
                                    <Typography sx={{ color: theme.palette.error.dark }} pt="5px">
                                        {errorMessage}
                                    </Typography>
                                </Stack>
                            </Box>
                        ) : (
                            ""
                        )}
                    </>
                ) : (
                    <Typography sx={{ mt: 2 }}>Select an asset to create a portfolio overview</Typography>
                )}
            </CardContent>
        </Card>
    );
};

export default AssetsOverview;
