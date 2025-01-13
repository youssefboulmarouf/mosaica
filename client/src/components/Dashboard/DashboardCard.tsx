import { Box, CardContent, CircularProgress, Typography } from "@mui/material";

interface DashboardCardProps {
    title: string;
    body: string | number;
    color: string;
    imgPath: string;
    isLoading: boolean;
}

const DashboardCard: React.FC<DashboardCardProps> = ({ title, body, color, imgPath, isLoading }) => {
    return (
        <Box bgcolor={color + ".light"} textAlign="center">
            <CardContent>
                {isLoading ? (
                    <CircularProgress />
                ) : (
                    <>
                        <img src={imgPath} width="50" height="50" />
                        <Typography color={color + ".main"} mt={1} variant="subtitle1" fontWeight={600}>
                            {title}
                        </Typography>
                        <Typography color={color + ".main"} variant="h4" fontWeight={600}>
                            {body}
                        </Typography>
                    </>
                )}
            </CardContent>
        </Box>
    );
};
export default DashboardCard;
