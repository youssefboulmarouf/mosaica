import { Box, Typography } from "@mui/material";

interface DrawerTitleProps {
    title: string;
}

const DrawerTitle: React.FC<DrawerTitleProps> = ({title}) => {
    return (
        <Box p={3} px={3}>
            <Typography variant="h3">{title}</Typography>
        </Box>
    );
}

export default DrawerTitle;