import { Box, CircularProgress, Typography } from "@mui/material";

interface LoadingComponentProps {
    message: string;
}

const LoadingComponent: React.FC<LoadingComponentProps> = ({message}) => {
    return (
        <Box sx={{ textAlign: "center" }}>
            <CircularProgress />
            <Typography variant="body1" sx={{ mt: 2 }}>
                {message}, please wait...
            </Typography>
        </Box>
    );
};

export default LoadingComponent;
