import { useEffect, useState } from "react";
import { usePortfolioContext } from "../../contexts/PortfolioContext";
import { Portfolio } from "../interfaces";
import {
    Avatar,
    Box,
    Card,
    CardContent,
    CardHeader,
    CircularProgress,
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
import WorkOffIcon from "@mui/icons-material/WorkOff";
import { useWalletContext } from "../../contexts/WalletContext";
import { Link } from "react-router-dom";
import LoadingComponent from "../ui-components/LoadingComponent";
import DashboardInnerPortfolioTable from "./DashboardInnerPortfolioTable";
import { useDashboardContext } from "../../contexts/DashboardContext";

const DashboardTable: React.FC = () => {
    const { address } = useWalletContext();
    const { isLoading } = usePortfolioContext();
    const { assetsView } = useDashboardContext();    
    const [openRow, setOpenRow] = useState(false);
    const [rowToOpen, setRowToOpen] = useState<number>(0);


    return (
        <Card sx={{ padding: 0, borderColor: (theme) => theme.palette.divider}} variant="outlined">
            <CardHeader title="All Assets" />
            <Divider />
            <CardContent>
                <TableContainer sx={{ maxHeight: "400px", overflow: "auto" }} >
                    {isLoading ? (
                        <LoadingComponent message={"Loading portfolios and assets data"} />
                    ) : Object.values(assetsView).length > 0 ? (
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
                                            Total Balance
                                        </Typography>
                                    </TableCell>
                                    <TableCell>
                                        <Typography variant="subtitle2" fontWeight={600}>
                                            Estimated Value ($/ETH)
                                        </Typography>
                                    </TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {Object.values(assetsView).map((asset, i) => (
                                    <>
                                        <TableRow key={asset.assetAddress}>
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
                                                        src={asset.imgPath}
                                                        variant="rounded"
                                                        sx={{ width: 48, height: 48 }}
                                                    />
                                                    <Box>
                                                        <Typography variant="subtitle2" fontWeight={600}>
                                                            {asset.assetSymbol} ({asset.assetName})
                                                        </Typography>
                                                        <Typography
                                                            color="textSecondary"
                                                            fontSize="12px"
                                                            variant="subtitle2"
                                                        >
                                                            {asset.assetAddress}
                                                        </Typography>
                                                    </Box>
                                                </Stack>
                                            </TableCell>
                                            <TableCell>
                                                <Typography color="textSecondary" variant="subtitle2" fontWeight={400}>
                                                    {parseFloat(asset.balance).toFixed(3)}
                                                </Typography>
                                            </TableCell>
                                            <TableCell>
                                                <Typography variant="subtitle2">
                                                    $ {parseFloat(asset.currentPriceUsd).toFixed(3)} /{" "}
                                                    {parseFloat(asset.currentPriceEth).toFixed(3)} ETH
                                                </Typography>
                                            </TableCell>
                                        </TableRow>
                                        <TableRow>
                                            <TableCell sx={{ paddingBottom: 0, paddingTop: 0 }} colSpan={12}>
                                                <DashboardInnerPortfolioTable
                                                    openRow={openRow}
                                                    rowToOpen={rowToOpen}
                                                    rowIndex={i}
                                                    portfolioData={asset.portfolios}
                                                    assetAddress={asset.assetAddress}
                                                />
                                            </TableCell>
                                        </TableRow>
                                    </>
                                ))}
                            </TableBody>
                        </Table>
                    ) : (
                        <Box sx={{ textAlign: "center" }}>
                            <WorkOffIcon />
                            <Typography variant="body1" sx={{ mt: 2 }}>
                                No portfolio found for for the address {address}.
                            </Typography>
                            <Typography variant="body1" sx={{ mt: 2 }}>
                                Please create a portfolio
                                <Link to={"/portfolios/create"}> here</Link>
                            </Typography>
                        </Box>
                    )}
                </TableContainer>
            </CardContent>
        </Card>
    );
};

export default DashboardTable;
