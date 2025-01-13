import { Link } from "react-router-dom";
import { MenuItem, Typography } from "@mui/material";
import SettingsIcon from "@mui/icons-material/Settings";

interface MosaicaMenuItemProps {
    label: string;
    path: string;
    handleMenuClose: () => void;
}

const MosaicaMenuItem: React.FC<MosaicaMenuItemProps> = ({ label, path, handleMenuClose }) => {
    return (
        <MenuItem component={Link} to={path} onClick={handleMenuClose}>
            {path === "/admin" ? (
                <>
                    <SettingsIcon />
                    <Typography>{label}</Typography>
                </>
            ) : (
                <Typography>{label}</Typography>
            )}
        </MenuItem>
    );
};

export default MosaicaMenuItem;
