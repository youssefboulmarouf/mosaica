import React, { useEffect, useState } from "react";

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
    Chip,
    Grid,
    Card,
    CardContent,
} from "@mui/material";
import DeleteForeverIcon from "@mui/icons-material/DeleteForever";
import PlayDisabledIcon from "@mui/icons-material/PlayDisabled";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";

import DexConnectorService from "../../services/DexConnectorService";
import { useAppContext } from "../../contexts/AppContext";
import { useWalletContext } from "../../contexts/WalletContext";
import TableSearch from "../ui-components/TableSearch";
import TableCallToActionButton from "../ui-components/TableCallToActionButton";
import AdminDrawer from "./AdminDrawer";
import AdminDialog from "./AdminDialog";

interface DexConnectorData {
    [address: string]: { dexName: string; state: boolean };
}

const DexConnectorList: React.FC = () => {
    const { account } = useWalletContext();
    const { dexConnectorStorageService, dexConnectorServices, refreshDexConnectors } = useAppContext();

    const [dexConnectordata, setDexConnectordata] = useState<DexConnectorData>({});
    const [searchTerm, setSearchTerm] = useState<string>("");
    const [connectorToDelete, setConnectorToDelete] = useState<string>("");
    const [connectorAddress, setconnectorAddress] = useState<string>("");
    const [openDeleteDialog, setOpenDeleteDialog] = useState<boolean>(false);
    const [openDrawer, setOpenDrawer] = useState<boolean>(false);

    const loadDcsData = async () => {
        const results = await Promise.all(
            dexConnectorServices.map(async (dcs) => {
                const address = await dcs.getContractAddress();
                const state = await dcs.isEnabled();
                const dexName = await dcs.getDexName();
                return { address, state, dexName };
            }),
        );

        const dcsData: DexConnectorData = {};
        results.forEach(({ address, state, dexName }) => {
            dcsData[address] = { dexName, state };
        });

        setDexConnectordata(dcsData);
    };

    useEffect(() => {
        loadDcsData();
    }, [dexConnectorServices]);

    const filteredDcs = Object.entries(dexConnectordata).filter(([address, { dexName }]) => {
        const lowerSearchTerm = searchTerm.toLowerCase();
        return address.toLowerCase().includes(lowerSearchTerm) || dexName.toLowerCase().includes(lowerSearchTerm);
    });

    const enableConnector = async (address: string) => {
        if (account) {
            const dcs = new DexConnectorService(account, address);
            await dcs.enableConnector();
            refreshDexConnectors();
            await loadDcsData();
        }
    };

    const disableConnector = async (address: string) => {
        if (account) {
            const dcs = new DexConnectorService(account, address);
            await dcs.disableConnector();
            refreshDexConnectors();
            await loadDcsData();
        }
    };

    const handleDeleteConnector = (address: string) => {
        setOpenDeleteDialog(true);
        setConnectorToDelete(address);
    };

    const deleteConnector = async () => {
        if (connectorToDelete !== "") {
            await dexConnectorStorageService?.removeConnectorContract(connectorToDelete);
            refreshDexConnectors();
        }
        setOpenDeleteDialog(false);
    };

    const addNewConnector = async () => {
        await dexConnectorStorageService?.addConnectorContract(connectorAddress);
        refreshDexConnectors();
        setOpenDrawer(false);
        setconnectorAddress("");
    };

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
                            callToActionText="Add New Dex Connector"
                            callToActionFunction={() => setOpenDrawer(true)}
                        />
                    </Stack>

                    <Box sx={{ overflowX: "auto" }} mt={3}>
                        <Table sx={{ whiteSpace: { xs: "nowrap", md: "unset" } }}>
                            <TableHead>
                                <TableRow>
                                    <TableCell>
                                        <Typography variant="h6" fontSize="14px">
                                            Connector Name
                                        </Typography>
                                    </TableCell>
                                    <TableCell>
                                        <Typography variant="h6" fontSize="14px">
                                            Connector Address
                                        </Typography>
                                    </TableCell>
                                    <TableCell>
                                        <Typography variant="h6" fontSize="14px">
                                            Status
                                        </Typography>
                                    </TableCell>
                                    <TableCell align="right">
                                        <Typography variant="h6" fontSize="14px">
                                            Action
                                        </Typography>
                                    </TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {filteredDcs.map(([address, { dexName, state }]) => (
                                    <TableRow key={address}>
                                        <TableCell>
                                            <Typography variant="body1" fontSize="14px">
                                                {dexName}
                                            </Typography>
                                        </TableCell>
                                        <TableCell>
                                            <Typography variant="body1">{address}</Typography>
                                        </TableCell>
                                        <TableCell>
                                            {state ? (
                                                <Chip color="success" label="Enabled" size="small" />
                                            ) : (
                                                <Chip color="warning" label="Disable" size="small" />
                                            )}
                                        </TableCell>
                                        <TableCell align="right">
                                            {state ? (
                                                <Tooltip title="Disable Connector">
                                                    <IconButton
                                                        color="warning"
                                                        onClick={() => {
                                                            disableConnector(address);
                                                        }}
                                                    >
                                                        <PlayDisabledIcon width={22} />
                                                    </IconButton>
                                                </Tooltip>
                                            ) : (
                                                <Tooltip title="Enable Connector">
                                                    <IconButton
                                                        color="success"
                                                        onClick={() => {
                                                            enableConnector(address);
                                                        }}
                                                    >
                                                        <PlayArrowIcon width={22} />
                                                    </IconButton>
                                                </Tooltip>
                                            )}
                                            <Tooltip title="Delete Connector">
                                                <IconButton
                                                    color="error"
                                                    onClick={() => {
                                                        handleDeleteConnector(address);
                                                    }}
                                                >
                                                    <DeleteForeverIcon width={22} />
                                                </IconButton>
                                            </Tooltip>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </Box>

                    <AdminDialog
                        openDeleteDialog={openDeleteDialog}
                        closeDialog={() => setOpenDeleteDialog(false)}
                        deleteConnector={deleteConnector}
                    />
                    <AdminDrawer
                        openDrawer={openDrawer}
                        closeDrawer={() => setOpenDrawer(false)}
                        connectorAddress={connectorAddress}
                        setconnectorAddress={setconnectorAddress}
                        addNewConnector={addNewConnector}
                    />
                </CardContent>
            </Card>
        </Grid>
    );
};
export default DexConnectorList;
