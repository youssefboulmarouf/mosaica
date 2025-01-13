import { Box, Button, Drawer, Stack, TextField, Typography } from "@mui/material";
import DrawerTitle from "../ui-components/DrawerTitle";

interface AdminDrawerProps {
    openDrawer: boolean;
    closeDrawer: () => void;
    connectorAddress: string;
    setconnectorAddress: (value: string) => void;
    addNewConnector: () => void;
}

const AdminDrawer: React.FC<AdminDrawerProps> = ({openDrawer, closeDrawer, connectorAddress, setconnectorAddress, addNewConnector}) => {
    return (
        <Drawer anchor="bottom" open={openDrawer} variant="temporary" onClose={() => closeDrawer()}>
            <DrawerTitle title="Add New Connector"/>
            <Box p={3}>
                <Stack direction="column" spacing={2}>
                    <TextField
                        id="connectorAddress"
                        type="text"
                        size="small"
                        variant="outlined"
                        placeholder="Connector Address"
                        value={connectorAddress}
                        onChange={(e: any) => setconnectorAddress(e.target.value)}
                    />

                    <Button variant="contained" color="primary" onClick={() => addNewConnector()}>
                        Add New Dex Connector
                    </Button>
                </Stack>
            </Box>
        </Drawer>
    );
};

export default AdminDrawer;
