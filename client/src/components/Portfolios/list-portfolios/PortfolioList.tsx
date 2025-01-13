import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
    Table,
    Tooltip,
    IconButton,
    TableHead,
    TableRow,
    TableCell,
    TableBody,
    Box,
    Typography,
    Stack,
    AvatarGroup,
    Avatar,
    TableFooter,
    TablePagination,
    Card,
    CardContent,
    Grid,
    CircularProgress,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import VisibilityIcon from "@mui/icons-material/Visibility";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp";
import WorkOffIcon from "@mui/icons-material/WorkOff";
import { usePortfolioContext } from "../../../contexts/PortfolioContext";
import InnerAssetsTable from "./InnerAssetsTable";
import TableSearch from "../../ui-components/TableSearch";
import TableCallToActionButton from "../../ui-components/TableCallToActionButton";
import { useWalletContext } from "../../../contexts/WalletContext";
import LoadingComponent from "../../ui-components/LoadingComponent";

const PortfolioList: React.FC = () => {
    const theme = useTheme();
    const navigate = useNavigate();
    const { address } = useWalletContext();
    const { portfolioMap, isLoading } = usePortfolioContext();
    const [openRow, setOpenRow] = useState(false);
    const [rowToOpen, setRowToOpen] = useState<number>(0);
    const [searchTerm, setSearchTerm] = useState("");
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(5);

    const handleChangePage = (event: any, newPage: number) => {
        setPage(newPage);
    };

    const handleChangeRowsPerPage = (event: any) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
    };

    const handleViewProtfolio = (portfolioAddress: string) => {
        navigate(`/portfolios/details/${portfolioAddress}`, { state: { portfolioAddress } });
    };

    const handleNewProtfolio = () => {
        navigate("/portfolios/create");
    };

    const filteredPortfolios = Object.entries(portfolioMap).filter(([portfolioAddress]) => {
        const lowerSearchTerm = searchTerm.toLowerCase();
        return portfolioAddress.toLowerCase().includes(lowerSearchTerm);
    });

    return (
        <Grid container mt={3}>
            <Card sx={{ padding: 0, borderColor: (theme) => theme.palette.divider }} variant="outlined">
                <CardContent>
                    <Stack
                        justifyContent="space-between"
                        direction={{ xs: "column", sm: "row" }}
                        spacing={{ xs: 1, sm: 2, md: 4 }}
                    >
                        <TableSearch searchTerm={searchTerm} setSearchTerm={setSearchTerm} />
                        <TableCallToActionButton
                            callToActionText="Create New Portfolio"
                            callToActionFunction={() => handleNewProtfolio()}
                        />
                    </Stack>

                    <Box sx={{ overflowX: "auto" }} mt={3}>
                        {isLoading ? (
                            <LoadingComponent message={"Loading portfolios and assets data"}/>
                        ) : Object.values(portfolioMap).length > 0 ? (
                            <Table>
                                <TableHead>
                                    <TableRow>
                                        <TableCell />
                                        <TableCell>
                                            <Typography variant="h6" fontSize="14px">
                                                Portfolio Address
                                            </Typography>
                                        </TableCell>
                                        <TableCell>
                                            <Typography variant="h6" fontSize="14px">
                                                Assets
                                            </Typography>
                                        </TableCell>
                                        <TableCell>
                                            <Typography variant="h6" fontSize="14px">
                                                Estimated Total Value
                                            </Typography>
                                        </TableCell>
                                        <TableCell align="right">
                                            <Typography variant="h6" fontSize="14px">
                                                Portfolio Details
                                            </Typography>
                                        </TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {(rowsPerPage > 0
                                        ? filteredPortfolios.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                                        : filteredPortfolios
                                    ).map(([portfolioAddress, portfolio], i) => (
                                        <>
                                            <TableRow key={portfolioAddress}>
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
                                                    <Typography variant="body1" fontSize="14px">
                                                        {portfolioAddress}
                                                    </Typography>
                                                </TableCell>
                                                <TableCell>
                                                    <AvatarGroup sx={{ justifyContent: "start" }}>
                                                        {portfolio.assets.map((data) => (
                                                            <Avatar
                                                                src={data.imgPath}
                                                                key={data.assetAddress}
                                                                sx={{
                                                                    width: "35px",
                                                                    height: "35px",
                                                                    bgcolor: theme.palette.primary.contrastText,
                                                                }}
                                                            />
                                                        ))}
                                                    </AvatarGroup>
                                                </TableCell>
                                                <TableCell>
                                                    <Typography variant="body1">
                                                        $ {portfolio.totalValueUsd} / {portfolio.totalValueEth} ETH
                                                    </Typography>
                                                </TableCell>
                                                <TableCell align="right">
                                                    <Tooltip title="View Portfolio">
                                                        <IconButton
                                                            color="primary"
                                                            onClick={() => handleViewProtfolio(portfolioAddress)}
                                                        >
                                                            <VisibilityIcon width={22} />
                                                        </IconButton>
                                                    </Tooltip>
                                                </TableCell>
                                            </TableRow>
                                            <TableRow>
                                                <TableCell sx={{ paddingBottom: 0, paddingTop: 0 }} colSpan={6}>
                                                    <InnerAssetsTable
                                                        openRow={openRow}
                                                        rowToOpen={rowToOpen}
                                                        rowIndex={i}
                                                        assetData={portfolio.assets}
                                                    />
                                                </TableCell>
                                            </TableRow>
                                        </>
                                    ))}
                                </TableBody>
                                <TableFooter>
                                    <TableRow>
                                        <TablePagination
                                            rowsPerPageOptions={[5, 10, 25, { label: "All", value: -1 }]}
                                            colSpan={6}
                                            count={filteredPortfolios.length}
                                            rowsPerPage={rowsPerPage}
                                            page={page}
                                            onPageChange={handleChangePage}
                                            onRowsPerPageChange={handleChangeRowsPerPage}
                                        />
                                    </TableRow>
                                </TableFooter>
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
                    </Box>
                </CardContent>
            </Card>
        </Grid>
    );
};
export default PortfolioList;
