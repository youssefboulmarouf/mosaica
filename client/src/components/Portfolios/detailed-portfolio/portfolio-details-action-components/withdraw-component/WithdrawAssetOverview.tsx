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
import WarningIcon from "@mui/icons-material/Warning";
import DeleteForeverIcon from "@mui/icons-material/DeleteForever";
import { AssetTransaction } from "../../../../interfaces";


interface WithdrawAssetOverviewProps {
    assets: AssetTransaction[];
    removeAsset: (index: number) => void;
    withdraw: () => void;
}

const WithdrawAssetOverview: React.FC<WithdrawAssetOverviewProps> = ({ assets, removeAsset, withdraw }) => {
    const theme = useTheme();
    const [disableWithdrawButton, setDisableWithdrawButton] = useState<boolean>(true);
    const [errorMessage, setErrorMessage] = useState<string>("");

    const hasEnoughBalance = (tokenAddress: string): boolean => {
        const tokenAmount = assets
            .filter((asset) => asset.srcAddress === tokenAddress)
            .reduce((acc, asset) => {
                acc += asset.amount;
                return acc;
            }, 0n);

        const portfolioBalance = assets.filter((asset) => asset.srcAddress === tokenAddress)[0].srcBalance;
        return portfolioBalance >= tokenAmount;
    };

    useEffect(() => {
        setDisableWithdrawButton(false);
        assets.map(async (a) => {
            const enoughBalance = hasEnoughBalance(a.srcAddress);

            if (!enoughBalance) {
                setErrorMessage(`Not Enough ${a.srcSymbol} Balance`);
                setDisableWithdrawButton(true);
            }
        });
    }, [assets]);

    return (
        <Card sx={{ padding: 0, borderColor: (theme) => theme.palette.divider }} variant="outlined">
            <CardHeader title="Withdraw Assets Overview" />
            <Divider />
            <CardContent>
                {assets.length > 0 ? (
                    <>
                        <Table size="small" sx={{ mt: 2 }}>
                            <TableHead>
                                <TableRow sx={{ backgroundColor: theme.palette.grey[100] }}>
                                    <TableCell>
                                        <Typography variant="body1">Type</Typography>
                                    </TableCell>
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
                                            backgroundColor: disableWithdrawButton
                                                ? theme.palette.error.light
                                                : "transparent",
                                        }}
                                    >
                                        <TableCell>
                                            <Typography color="textSecondary">
                                                {asset.srcAddress === asset.destAddress
                                                    ? "Withdraw"
                                                    : "Swap & Withdraw"}
                                            </Typography>
                                        </TableCell>
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
                                                {asset.srcAddress === asset.destAddress
                                                    ? "-"
                                                    : +ethers.formatEther(asset.price.toString())}
                                            </Typography>
                                        </TableCell>
                                        <TableCell>
                                            <Typography color="textSecondary">
                                                {asset.srcAddress === asset.destAddress ? "-" : asset.dexName}
                                            </Typography>
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
                                disabled={disableWithdrawButton}
                                onClick={() => withdraw()}
                            >
                                Withdraw
                            </Button>
                        </Box>
                        {disableWithdrawButton ? (
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
                    <Typography sx={{ mt: 2 }}>Select assets to withdraw (or swap & withdraw)</Typography>
                )}
            </CardContent>
        </Card>
    );
};

export default WithdrawAssetOverview;
