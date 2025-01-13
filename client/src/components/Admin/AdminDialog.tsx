import { Button, Dialog, DialogActions, DialogContent, DialogTitle } from "@mui/material";

interface AdminDialogProps {
    openDeleteDialog: boolean;
    closeDialog: () => void;
    deleteConnector: () => void;
}

const AdminDialog: React.FC<AdminDialogProps> = ({openDeleteDialog, closeDialog, deleteConnector}) => {
    return (
        <Dialog open={openDeleteDialog} onClose={() => closeDialog()}>
            <DialogTitle>Confirm Delete</DialogTitle>
            <DialogContent>Are you sure you want to delete selected connector?</DialogContent>
            <DialogActions>
                <Button variant="contained" onClick={() => closeDialog()}>
                    Cancel
                </Button>
                <Button color="error" variant="outlined" onClick={() => deleteConnector()}>
                    Delete
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default AdminDialog;
