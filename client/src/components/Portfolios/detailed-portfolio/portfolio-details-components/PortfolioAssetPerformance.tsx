import { useState } from "react";
import {
    Avatar,
    Box,
    Card,
    CardContent,
    CardHeader,
    Divider,
    IconButton,
    Stack,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Typography,
} from "@mui/material";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp";
import PercentageChip from "./PercentageChip";
import { usePortfolioDetailsContext } from "../../../../contexts/PortfolioDetailsContext";
import AssetChartTable from "./AssetChartTable";
import { Asset } from "../../../interfaces";
import LoadingComponent from "../../../ui-components/LoadingComponent";

const PortfolioAssetPerformance: React.FC = () => {
    const { currentPortfolio, assetsTotalValue, isLoadingHistoricValue } = usePortfolioDetailsContext();
    const [openRow, setOpenRow] = useState(false);
    const [rowToOpen, setRowToOpen] = useState<number>(0);

    const ratio = (asset: Asset) => {
        if (currentPortfolio) {
            return (parseFloat(asset.currentPriceEth) / parseFloat(currentPortfolio.totalValueEth)) * 100;
        }
        return 0;
    };

    const calculateUsdPercentage = (asset: Asset, days: number): number => {
        if (assetsTotalValue[asset.assetAddress]) {
            const tokenPrice: string[] = assetsTotalValue[asset.assetAddress].map((p) => p.tokenpriceWithUsd);
            return calculatePercentage(tokenPrice, days);
        }
        return 0;
    };

    const calculateEthPercentage = (asset: Asset, days: number): number => {
        if (assetsTotalValue[asset.assetAddress]) {
            const tokenPrice: string[] = assetsTotalValue[asset.assetAddress].map((p) => p.tokenPriceWithEth);
            return calculatePercentage(tokenPrice, days);
        }
        return 0;
    };

    const calculatePercentage = (tokenPrice: string[], days: number): number => {
        if (tokenPrice.length === 0 || tokenPrice.length < days) {
            return 0;
        }
    
        const latestPrice = parseFloat(tokenPrice[0]);
        const daysAgoPrice = parseFloat(tokenPrice[days - 1]);
    
        if (isNaN(latestPrice) || isNaN(daysAgoPrice)) {
            return 0;
        }
    
        if (daysAgoPrice === 0) {
            return latestPrice > 0 ? 100 : 0;
        }
        
        return ((latestPrice - daysAgoPrice) / daysAgoPrice) * 100;
    };
    

    return (
        <Card sx={{ padding: 0, borderColor: (theme) => theme.palette.divider }} variant="outlined">
            <CardHeader title="Portfolio Assets" />
            <Divider />
            <CardContent>
                <TableContainer>
                    {isLoadingHistoricValue ? (
                        <LoadingComponent message={"Loading portfolios and assets data"} />
                    ) : currentPortfolio ? (
                        <Table aria-label="simple table" sx={{ whiteSpace: "nowrap" }}>
                            <TableHead>
                                <TableRow>
                                    <TableCell />
                                    <TableCell>
                                        <Typography variant="subtitle2" fontWeight={600}>
                                            Asset Symbol
                                        </Typography>
                                    </TableCell>
                                    <TableCell>
                                        <Typography variant="subtitle2" fontWeight={600}>
                                            Balance
                                        </Typography>
                                    </TableCell>
                                    <TableCell>
                                        <Typography variant="subtitle2" fontWeight={600}>
                                            Ratio %
                                        </Typography>
                                    </TableCell>
                                    <TableCell>
                                        <Typography variant="subtitle2" fontWeight={600}>
                                            Value ($/ETH)
                                        </Typography>
                                    </TableCell>
                                    <TableCell>
                                        <Typography variant="subtitle2" fontWeight={600}>
                                            7 Days ($/ETH)
                                        </Typography>
                                    </TableCell>
                                    <TableCell>
                                        <Typography variant="subtitle2" fontWeight={600}>
                                            30 Days ($/ETH)
                                        </Typography>
                                    </TableCell>
                                    <TableCell>
                                        <Typography variant="subtitle2" fontWeight={600}>
                                            90 Days ($/ETH)
                                        </Typography>
                                    </TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {currentPortfolio.assets.map((a: Asset, i: number) => (
                                    <>
                                        <TableRow key={a.assetAddress}>
                                            <TableCell>
                                                <IconButton
                                                    aria-label="expand row"
                                                    size="small"
                                                    onClick={() => {
                                                        setOpenRow(!openRow);
                                                        setRowToOpen(i);
                                                    }}
                                                >
                                                    {openRow && rowToOpen === i ? (
                                                        <KeyboardArrowUpIcon />
                                                    ) : (
                                                        <KeyboardArrowDownIcon />
                                                    )}
                                                </IconButton>
                                            </TableCell>
                                            <TableCell>
                                                <Stack direction="row" spacing={2}>
                                                    <Avatar
                                                        src={a.imgPath}
                                                        variant="rounded"
                                                        sx={{ width: 48, height: 48 }}
                                                    />
                                                    <Box>
                                                        <Typography variant="subtitle2" fontWeight={600}>
                                                            {a.assetSymbol} ({a.assetName})
                                                        </Typography>
                                                        <Typography
                                                            color="textSecondary"
                                                            fontSize="12px"
                                                            variant="subtitle2"
                                                        >
                                                            {a.assetAddress}
                                                        </Typography>
                                                    </Box>
                                                </Stack>
                                            </TableCell>
                                            <TableCell>
                                                <Typography color="textSecondary" variant="subtitle2" fontWeight={400}>
                                                    {parseFloat(a.balance).toFixed(3)}
                                                </Typography>
                                            </TableCell>
                                            <TableCell>
                                                <Typography variant="subtitle2">{ratio(a).toFixed(2)} %</Typography>
                                            </TableCell>
                                            <TableCell>
                                                <Typography variant="subtitle2">
                                                    $ {parseFloat(a.currentPriceUsd).toFixed(3)} /{" "}
                                                    {parseFloat(a.currentPriceEth).toFixed(3)} ETH
                                                </Typography>
                                            </TableCell>
                                            <TableCell>
                                                <Stack direction="column" spacing={2}>
                                                    <PercentageChip
                                                        percentage={calculateUsdPercentage(a, 7)}
                                                        label="$"
                                                    />
                                                    <PercentageChip
                                                        percentage={calculateEthPercentage(a, 7)}
                                                        label="ETH"
                                                    />
                                                </Stack>
                                            </TableCell>
                                            <TableCell>
                                                <Stack direction="column" spacing={2}>
                                                    <PercentageChip
                                                        percentage={calculateUsdPercentage(a, 30)}
                                                        label="$"
                                                    />
                                                    <PercentageChip
                                                        percentage={calculateEthPercentage(a, 30)}
                                                        label="ETH"
                                                    />
                                                </Stack>
                                            </TableCell>
                                            <TableCell>
                                                <Stack direction="column" spacing={2}>
                                                    <PercentageChip
                                                        percentage={calculateUsdPercentage(a, 90)}
                                                        label="$"
                                                    />
                                                    <PercentageChip
                                                        percentage={calculateEthPercentage(a, 90)}
                                                        label="ETH"
                                                    />
                                                </Stack>
                                            </TableCell>
                                        </TableRow>
                                        <TableRow>
                                            <TableCell sx={{ paddingBottom: 0, paddingTop: 0 }} colSpan={12}>
                                                <AssetChartTable
                                                    openRow={openRow}
                                                    rowToOpen={rowToOpen}
                                                    rowIndex={i}
                                                    asset={a}
                                                />
                                            </TableCell>
                                        </TableRow>
                                    </>
                                ))}
                            </TableBody>
                        </Table>
                    ) : (
                        ""
                    )}
                </TableContainer>
            </CardContent>
        </Card>
    );
};

export default PortfolioAssetPerformance;
