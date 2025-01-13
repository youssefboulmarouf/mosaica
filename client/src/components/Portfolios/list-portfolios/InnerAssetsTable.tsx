import { Collapse, Table, TableBody, TableCell, TableHead, TableRow, Typography } from "@mui/material";
import { Asset } from "../../interfaces";

interface InnerAssetsTableProps {
    openRow: boolean;
    rowToOpen: number;
    rowIndex: number;
    assetData: Asset[];
}

const InnerAssetsTable: React.FC<InnerAssetsTableProps> = ({ openRow, rowToOpen, rowIndex, assetData }) => {
    return (
        <Collapse in={openRow && rowToOpen === rowIndex} timeout="auto">
            <Typography
                gutterBottom
                variant="h4"
                sx={{
                    backgroundColor: (theme) => theme.palette.grey[100],
                    p: "5px 15px",
                }}
            >
                Assets
            </Typography>
            <Table size="small">
                <TableHead>
                    <TableRow>
                        <TableCell>
                            <Typography variant="body1">Asset Symbol</Typography>
                        </TableCell>
                        <TableCell>
                            <Typography variant="body1">Asset Name</Typography>
                        </TableCell>
                        <TableCell>
                            <Typography variant="body1">Balance</Typography>
                        </TableCell>
                        <TableCell>
                            <Typography variant="body1">Estimated Value ($/Eth)</Typography>
                        </TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {assetData.map((data) => (
                        <TableRow key={data.assetAddress}>
                            <TableCell>
                                <Typography color="textSecondary" fontWeight="400">
                                    {data.assetSymbol}
                                </Typography>
                            </TableCell>
                            <TableCell>
                                <Typography color="textSecondary" fontWeight="400">
                                    {data.assetName}
                                </Typography>
                            </TableCell>
                            <TableCell>
                                <Typography color="textSecondary" fontWeight="400">
                                    {data.balance}
                                </Typography>
                            </TableCell>
                            <TableCell>
                                <Typography color="textSecondary" fontWeight="400">
                                    $ {parseFloat(data.currentPriceUsd).toFixed(2)} /{" "}
                                    {parseFloat(data.currentPriceEth).toFixed(2)} ETH
                                </Typography>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </Collapse>
    );
};

export default InnerAssetsTable;
