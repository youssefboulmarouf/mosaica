import { Box, Button } from "@mui/material";

interface TableCallToActionButtonProps {
    callToActionText: string;
    callToActionFunction: () => void;
}

const TableCallToActionButton: React.FC<TableCallToActionButtonProps> = ({
    callToActionText,
    callToActionFunction,
}) => {
    return (
        <Box display="flex" gap={1}>
            <Button variant="contained" color="primary" onClick={() => callToActionFunction()}>
                {callToActionText}
            </Button>
        </Box>
    );
};

export default TableCallToActionButton;
