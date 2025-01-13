import _ from "lodash";
import { createTheme } from "@mui/material/styles";
import { Theme } from "@mui/material/styles";
import * as locales from "@mui/material/locale";

const darkThemeColors = {
    palette: {
        primary: {
            main: "#5D87FF",
            light: "#253662",
            dark: "#4570EA",
            contrastText: "#ffffff",
        },
        secondary: {
            main: "#49BEFF",
            light: "#1C455D",
            dark: "#23afdb",
            contrastText: "#ffffff",
        },
        background: {
            default: "#2A3447",
            dark: "#2A3547",
            paper: "#2A3447",
        },
    },
};

const darkshadows = [
    "none",
    "0px 2px 3px rgba(0,0,0,0.10)",
    "0 0 1px 0 rgba(0,0,0,0.31), 0 2px 2px -2px rgba(0,0,0,0.25)",
    "0 0 1px 0 rgba(0,0,0,0.31), 0 3px 4px -2px rgba(0,0,0,0.25)",
    "0 0 1px 0 rgba(0,0,0,0.31), 0 3px 4px -2px rgba(0,0,0,0.25)",
    "0 0 1px 0 rgba(0,0,0,0.31), 0 4px 6px -2px rgba(0,0,0,0.25)",
    "0 0 1px 0 rgba(0,0,0,0.31), 0 4px 6px -2px rgba(0,0,0,0.25)",
    "0 0 1px 0 rgba(0,0,0,0.31), 0 4px 8px -2px rgba(0,0,0,0.25)",
    "0 9px 17.5px rgb(0,0,0,0.05)",
    "rgb(145 158 171 / 30%) 0px 0px 2px 0px, rgb(145 158 171 / 2%) 0px 12px 24px -4px",
    "0 0 1px 0 rgba(0,0,0,0.31), 0 7px 12px -4px rgba(0,0,0,0.25)",
    "0 0 1px 0 rgba(0,0,0,0.31), 0 6px 16px -4px rgba(0,0,0,0.25)",
    "0 0 1px 0 rgba(0,0,0,0.31), 0 7px 16px -4px rgba(0,0,0,0.25)",
    "0 0 1px 0 rgba(0,0,0,0.31), 0 8px 18px -8px rgba(0,0,0,0.25)",
    "0 0 1px 0 rgba(0,0,0,0.31), 0 9px 18px -8px rgba(0,0,0,0.25)",
    "0 0 1px 0 rgba(0,0,0,0.31), 0 10px 20px -8px rgba(0,0,0,0.25)",
    "0 0 1px 0 rgba(0,0,0,0.31), 0 11px 20px -8px rgba(0,0,0,0.25)",
    "0 0 1px 0 rgba(0,0,0,0.31), 0 12px 22px -8px rgba(0,0,0,0.25)",
    "0 0 1px 0 rgba(0,0,0,0.31), 0 13px 22px -8px rgba(0,0,0,0.25)",
    "0 0 1px 0 rgba(0,0,0,0.31), 0 14px 24px -8px rgba(0,0,0,0.25)",
    "0 0 1px 0 rgba(0,0,0,0.31), 0 16px 28px -8px rgba(0,0,0,0.25)",
    "0 0 1px 0 rgba(0,0,0,0.31), 0 18px 30px -8px rgba(0,0,0,0.25)",
    "0 0 1px 0 rgba(0,0,0,0.31), 0 20px 32px -8px rgba(0,0,0,0.25)",
    "0 0 1px 0 rgba(0,0,0,0.31), 0 22px 34px -8px rgba(0,0,0,0.25)",
    "0 0 1px 0 rgba(0,0,0,0.31), 0 24px 36px -8px rgba(0,0,0,0.25)",
];

const baseDarkTheme = {
    direction: "ltr",
    palette: {
        primary: {
            main: "#5D87FF",
            light: "#ECF2FF",
            dark: "#4570EA",
        },
        secondary: {
            main: "#777e89",
            light: "#1C455D",
            dark: "#173f98",
        },
        success: {
            main: "#13DEB9",
            light: "#1B3C48",
            dark: "#02b3a9",
            contrastText: "#ffffff",
        },
        info: {
            main: "#539BFF",
            light: "#223662",
            dark: "#1682d4",
            contrastText: "#ffffff",
        },
        error: {
            main: "#FA896B",
            light: "#4B313D",
            dark: "#f3704d",
            contrastText: "#ffffff",
        },
        warning: {
            main: "#FFAE1F",
            light: "#4D3A2A",
            dark: "#ae8e59",
            contrastText: "#ffffff",
        },
        purple: {
            A50: "#EBF3FE",
            A100: "#6610f2",
            A200: "#557fb9",
        },
        grey: {
            100: "#333F55",
            200: "#465670",
            300: "#7C8FAC",
            400: "#DFE5EF",
            500: "#EAEFF4",
            600: "#F2F6FA",
        },
        text: {
            primary: "#EAEFF4",
            secondary: "#7C8FAC",
        },
        action: {
            disabledBackground: "rgba(73,82,88,0.12)",
            hoverOpacity: 0.02,
            hover: "#333F55",
        },
        divider: "#333F55",
        background: {
            default: "#171c23",
            dark: "#171c23",
            paper: "#171c23",
        },
    },
};

const components: any = (theme: Theme) => {
    return {
        MuiCssBaseline: {
            styleOverrides: {
                "*": {
                    boxSizing: "border-box",
                },
                html: {
                    height: "100%",
                    width: "100%",
                },
                a: {
                    textDecoration: "none",
                },
                body: {
                    height: "100%",
                    margin: 0,
                    padding: 0,
                },
                "#root": {
                    height: "100%",
                },
                "*[dir='rtl'] .buyNowImg": {
                    transform: "scaleX(-1)",
                },
                ".border-none": {
                    border: "0px",
                    td: {
                        border: "0px",
                    },
                },
                ".btn-xs": {
                    minWidth: "30px !important",
                    width: "30px",
                    height: "30px",
                    borderRadius: "6px !important",
                    padding: "0px !important",
                },
                ".hover-text-primary:hover .text-hover": {
                    color: theme.palette.primary.main,
                },
                ".hoverCard:hover": {
                    scale: "1.01",
                    transition: " 0.1s ease-in",
                },
                ".signup-bg": {
                    position: "absolute",
                    top: 0,
                    right: 0,
                    height: "100%",
                },
                ".MuiBox-root": {
                    borderRadius: theme.shape.borderRadius,
                },
                ".MuiCardHeader-action": {
                    alignSelf: "center !important",
                },
                ".emoji-picker-react .emoji-scroll-wrapper": {
                    overflowX: "hidden",
                },
                ".scrollbar-container": {
                    borderRight: "0 !important",
                },
                ".theme-timeline .MuiTimelineOppositeContent-root": {
                    minWidth: "90px",
                },
                ".MuiAlert-root .MuiAlert-icon": {
                    color: "inherit!important",
                },
                ".MuiTimelineConnector-root": {
                    width: "1px !important",
                },
                " .simplebar-scrollbar:before": {
                    background: `${theme.palette.grey[300]} !important`,
                },
                "@keyframes gradient": {
                    "0%": {
                        backgroundPosition: "0% 50%",
                    },
                    "50%": {
                        backgroundPosition: " 100% 50%",
                    },
                    "100% ": {
                        backgroundPosition: " 0% 50%",
                    },
                },
                ".rounded-bars .apexcharts-bar-series.apexcharts-plot-series .apexcharts-series path": {
                    clipPath: "inset(0 0 5% 0 round 20px)",
                },
            },
        },
        MuiButtonGroup: {
            styleOverrides: {
                root: {
                    boxShadow: "none",
                },
            },
        },
        MuiAccordion: {
            styleOverrides: {
                root: {
                    ":before": {
                        backgroundColor: theme.palette.grey[100],
                    },
                },
            },
        },
        MuiPaper: {
            styleOverrides: {
                root: {
                    backgroundImage: "none",
                },
            },
        },
        MuiStepConnector: {
            styleOverrides: {
                line: {
                    borderColor: theme.palette.divider,
                },
            },
        },
        MuiFab: {
            styleOverrides: {
                root: {
                    boxShadow: "none",
                },
                sizeSmall: {
                    width: 30,
                    height: 30,
                    minHeight: 30,
                },
            },
        },
        MuiIconButton: {
            styleOverrides: {
                root: {
                    "&:hover": {
                        backgroundColor: theme.palette.primary.light,
                        color: theme.palette.primary.main,
                    },
                },
                colorPrimary: {
                    "&:hover": {
                        backgroundColor: theme.palette.primary.main,
                        color: "white",
                    },
                },
                colorSecondary: {
                    "&:hover": {
                        backgroundColor: theme.palette.secondary.main,
                        color: "white",
                    },
                },
                colorSuccess: {
                    "&:hover": {
                        backgroundColor: theme.palette.success.main,
                        color: "white",
                    },
                },
                colorError: {
                    "&:hover": {
                        backgroundColor: theme.palette.error.main,
                        color: "white",
                    },
                },
                colorWarning: {
                    "&:hover": {
                        backgroundColor: theme.palette.warning.main,
                        color: "white",
                    },
                },
                colorInfo: {
                    "&:hover": {
                        backgroundColor: theme.palette.info.main,
                        color: "white",
                    },
                },
            },
        },
        MuiButton: {
            styleOverrides: {
                root: {
                    textTransform: "none",
                    boxShadow: "none",
                },
                text: {
                    padding: "5px 15px",
                    "&:hover": {
                        backgroundColor: theme.palette.primary.light,
                        color: theme.palette.primary.main,
                    },
                },
                textPrimary: {
                    backgroundColor: theme.palette.primary.light,
                    "&:hover": {
                        backgroundColor: theme.palette.primary.main,
                        color: "white",
                    },
                },
                textSecondary: {
                    backgroundColor: theme.palette.secondary.light,
                    "&:hover": {
                        backgroundColor: theme.palette.secondary.main,
                        color: "white",
                    },
                },
                textSuccess: {
                    backgroundColor: theme.palette.success.light,
                    "&:hover": {
                        backgroundColor: theme.palette.success.main,
                        color: "white",
                    },
                },
                textError: {
                    backgroundColor: theme.palette.error.light,
                    "&:hover": {
                        backgroundColor: theme.palette.error.main,
                        color: "white",
                    },
                },
                textInfo: {
                    backgroundColor: theme.palette.info.light,
                    "&:hover": {
                        backgroundColor: theme.palette.info.main,
                        color: "white",
                    },
                },
                textWarning: {
                    backgroundColor: theme.palette.warning.light,
                    "&:hover": {
                        backgroundColor: theme.palette.warning.main,
                        color: "white",
                    },
                },
                outlinedPrimary: {
                    "&:hover": {
                        backgroundColor: theme.palette.primary.main,
                        color: "white",
                    },
                },
                outlinedSecondary: {
                    "&:hover": {
                        backgroundColor: theme.palette.secondary.main,
                        color: "white",
                    },
                },
                outlinedError: {
                    "&:hover": {
                        backgroundColor: theme.palette.error.main,
                        color: "white",
                    },
                },
                outlinedSuccess: {
                    "&:hover": {
                        backgroundColor: theme.palette.success.main,
                        color: "white",
                    },
                },
                outlinedInfo: {
                    "&:hover": {
                        backgroundColor: theme.palette.info.main,
                        color: "white",
                    },
                },
                outlinedWarning: {
                    "&:hover": {
                        backgroundColor: theme.palette.warning.main,
                        color: "white",
                    },
                },
            },
        },
        MuiCardHeader: {
            styleOverrides: {
                root: {
                    padding: "16px 24px",
                },
                title: {
                    fontSize: "1.125rem",
                },
            },
        },
        MuiCard: {
            styleOverrides: {
                root: {
                    width: "100%",
                    padding: "15px",
                    backgroundImage: "none",
                },
            },
        },
        MuiCardContent: {
            styleOverrides: {
                root: {
                    padding: "24px",
                },
            },
        },
        MuiTableCell: {
            styleOverrides: {
                root: {
                    borderBottom: `1px solid ${theme.palette.divider}`,
                },
            },
        },
        MuiTableRow: {
            styleOverrides: {
                root: {
                    "&:last-child td": {
                        borderBottom: 0,
                    },
                },
            },
        },
        MuiGridItem: {
            styleOverrides: {
                root: {
                    paddingTop: "30px",
                    paddingLeft: "30px !important",
                },
            },
        },
        MuiLinearProgress: {
            styleOverrides: {
                root: {
                    backgroundColor: theme.palette.grey[200],
                    borderRadius: "6px",
                },
            },
        },
        MuiTimelineConnector: {
            styleOverrides: {
                root: {
                    backgroundColor: theme.palette.divider,
                },
            },
        },
        MuiDivider: {
            styleOverrides: {
                root: {
                    borderColor: theme.palette.divider,
                },
            },
        },
        MuiChip: {
            styleOverrides: {
                root: {
                    fontWeight: 600,
                    fontSize: "0.75rem",
                },
            },
        },
        MuiAlert: {
            styleOverrides: {
                filledSuccess: {
                    color: "white",
                },
                filledInfo: {
                    color: "white",
                },
                filledError: {
                    color: "white",
                },
                filledWarning: {
                    color: "white",
                },
                standardSuccess: {
                    backgroundColor: theme.palette.success.light,
                    color: theme.palette.success.main,
                },
                standardError: {
                    backgroundColor: theme.palette.error.light,
                    color: theme.palette.error.main,
                },
                standardWarning: {
                    backgroundColor: theme.palette.warning.light,
                    color: theme.palette.warning.main,
                },
                standardInfo: {
                    backgroundColor: theme.palette.info.light,
                    color: theme.palette.info.main,
                },
                outlinedSuccess: {
                    borderColor: theme.palette.success.main,
                    color: theme.palette.success.main,
                },
                outlinedWarning: {
                    borderColor: theme.palette.warning.main,
                    color: theme.palette.warning.main,
                },
                outlinedError: {
                    borderColor: theme.palette.error.main,
                    color: theme.palette.error.main,
                },
                outlinedInfo: {
                    borderColor: theme.palette.info.main,
                    color: theme.palette.info.main,
                },
                successIcon: {
                    color: theme.palette.info.main,
                },
            },
        },
        MuiOutlinedInput: {
            styleOverrides: {
                root: {
                    "& .MuiOutlinedInput-notchedOutline": {
                        borderColor: theme.palette.mode === "dark" ? theme.palette.grey[200] : theme.palette.grey[300],
                    },
                    "&:hover .MuiOutlinedInput-notchedOutline": {
                        borderColor: theme.palette.grey[300],
                    },
                },
                input: {
                    padding: "12px 14px",
                },
                inputSizeSmall: {
                    padding: "8px 14px",
                },
            },
        },
        MuiTooltip: {
            styleOverrides: {
                tooltip: {
                    color: theme.palette.background.paper,
                    background: theme.palette.text.primary,
                },
            },
        },
        MuiDrawer: {
            styleOverrides: {
                paper: {
                    borderColor: `${theme.palette.divider}`,
                },
            },
        },
        MuiDialogTitle: {
            styleOverrides: {
                root: {
                    fontSize: "1.25rem",
                },
            },
        },
        MuiPopover: {
            styleOverrides: {
                paper: {
                    boxShadow: "rgb(145 158 171 / 30%) 0px 0px 2px 0px, rgb(145 158 171 / 12%) 0px 12px 24px -4px",
                },
            },
        },
    };
};

const typography: any = {
    h1: {
        fontWeight: 600,
        fontSize: "2.25rem",
        lineHeight: "2.75rem",
    },
    h2: {
        fontWeight: 600,
        fontSize: "1.875rem",
        lineHeight: "2.25rem",
    },
    h3: {
        fontWeight: 600,
        fontSize: "1.5rem",
        lineHeight: "1.75rem",
    },
    h4: {
        fontWeight: 600,
        fontSize: "1.3125rem",
        lineHeight: "1.6rem",
    },
    h5: {
        fontWeight: 600,
        fontSize: "1.125rem",
        lineHeight: "1.6rem",
    },
    h6: {
        fontWeight: 600,
        fontSize: "1rem",
        lineHeight: "1.2rem",
    },
    button: {
        textTransform: "capitalize",
        fontWeight: 400,
    },
    body1: {
        fontSize: "0.875rem",
        fontWeight: 400,
        lineHeight: "1.334rem",
    },
    body2: {
        fontSize: "0.75rem",
        letterSpacing: "0rem",
        fontWeight: 400,
        lineHeight: "1rem",
    },
    subtitle1: {
        fontSize: "0.875rem",
        fontWeight: 400,
    },
    subtitle2: {
        fontSize: "0.875rem",
        fontWeight: 400,
    },
};

export const ThemeSettings = () => {
    const baseMode = {
        palette: { mode: "dark" },
        shape: { borderRadius: 7 },
        shadows: darkshadows,
        typography: typography,
    };
    const theme = createTheme(_.merge({}, baseMode, baseDarkTheme, locales, darkThemeColors, { direction: "ltr" }));
    theme.components = components(theme);

    return theme;
};
