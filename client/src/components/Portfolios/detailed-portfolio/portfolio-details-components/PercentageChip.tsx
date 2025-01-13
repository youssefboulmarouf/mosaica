import { Chip, PaletteColor, useTheme } from "@mui/material";

interface PercentageChipPorps {
    percentage: number, 
    label: string
}

const PercentageChip: React.FC<PercentageChipPorps> = ({percentage, label}) => {
    const theme = useTheme();

    const dedueColor = (variation: number): PaletteColor => {
        let color: PaletteColor = theme.palette.warning;
        if (variation > 0) {
            color = theme.palette.success;
        }
        if (variation < 0) {
            color = theme.palette.error;
        }
        return color;
    }

    return (
        <Chip
            sx={{
                bgcolor: dedueColor(percentage).light,
                color: dedueColor(percentage).main,
                borderRadius: "6px",
                width: 100,
            }}
            size="small"
            label={label + ": " + percentage.toFixed(2) + "%"}
        />
    );
};

export default PercentageChip;
