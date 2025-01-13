import { Box, Stack, Typography } from "@mui/material";

interface FeatureBoxProps {
    bgcolor: string;
    imgSrc: string;
    boxTitle: string;
    boxBodyText: string;
}

const FeatureBox: React.FC<FeatureBoxProps> = ({bgcolor, imgSrc, boxTitle, boxBodyText}) => {
    return (
        <>
            <Box mb={3} bgcolor={bgcolor} borderRadius="24px">
                <Box px={4} py="65px">
                    <Stack direction="column" spacing={2} textAlign="center">
                        <Box textAlign="center">
                            <img src={imgSrc} width={40} height={40} />
                        </Box>
                        <Typography variant="h6" fontWeight={700}>
                            {boxTitle}
                        </Typography>
                        <Typography variant="body1">
                            {boxBodyText}
                        </Typography>
                    </Stack>
                </Box>
            </Box>
        </>
    );
};

export default FeatureBox;