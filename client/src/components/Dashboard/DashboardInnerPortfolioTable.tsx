import { Collapse, Table, TableBody, TableCell, TableHead, TableRow, Typography } from "@mui/material";
import { Portfolio } from "../interfaces";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";

interface DashboardInnerPortfolioTableProps {
    openRow: boolean;
    rowToOpen: number;
    rowIndex: number;
    portfolioData: Portfolio[];
    assetAddress: string;
}

const DashboardInnerPortfolioTable: React.FC<DashboardInnerPortfolioTableProps> = ({
    openRow,
    rowToOpen,
    rowIndex,
    portfolioData,
    assetAddress,
}) => {
    const navigate = useNavigate();
    
    const handleViewProtfolio = (portfolioAddress: string) => {
        navigate(`/portfolios/details/${portfolioAddress}`, { state: { portfolioAddress } });
    };

    const deduceBalance = (portfolioAddress: string) => {
        const balance = portfolioData
            .filter((p) => p.portfolioAddress === portfolioAddress)
            .at(0)
            ?.assets.filter((a) => a.assetAddress === assetAddress)
            .at(0)?.balance;

        return (balance) ? parseFloat(balance).toFixed(3) : 0;
    };

    return (
        <Collapse in={openRow && rowToOpen === rowIndex} timeout="auto">
            <Table size="small">
                <TableHead>
                    <TableRow>
                        <TableCell>
                            <Typography variant="body1">Portfolio Address</Typography>
                        </TableCell>
                        <TableCell>
                            <Typography variant="body1">Estimated Portfolio Value ($/Eth)</Typography>
                        </TableCell>
                        <TableCell>
                            <Typography variant="body1">Asset Balance</Typography>
                        </TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {portfolioData.map((data) => (
                        <TableRow
                            key={data.portfolioAddress}
                            onClick={() => handleViewProtfolio(data.portfolioAddress)}
                        >
                            <TableCell>
                                <Typography color="textSecondary" fontWeight="400">
                                    {data.portfolioAddress}
                                </Typography>
                            </TableCell>
                            <TableCell>
                                <Typography color="textSecondary" fontWeight="400">
                                    $ {parseFloat(data.totalValueUsd).toFixed(2)} /{" "}
                                    {parseFloat(data.totalValueEth).toFixed(2)} ETH
                                </Typography>
                            </TableCell>
                            <TableCell>
                                <Typography color="textSecondary" fontWeight="400">
                                    {deduceBalance(data.portfolioAddress)}
                                </Typography>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </Collapse>
    );
};

export default DashboardInnerPortfolioTable;
