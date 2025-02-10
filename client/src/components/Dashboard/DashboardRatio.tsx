import { Card, CardContent, CardHeader, Divider, useTheme } from "@mui/material";
import { ApexOptions } from "apexcharts";
import Chart from "react-apexcharts";
import { usePortfolioContext } from "../../contexts/PortfolioContext";
import { useDashboardContext } from "../../contexts/DashboardContext";
import LoadingComponent from "../ui-components/LoadingComponent";
import { useEffect, useState } from "react";

const DashboardRatio: React.FC = () => {
    const theme = useTheme();
    const { isLoading } = usePortfolioContext();
    const { assetsView } = useDashboardContext(); 
    const [pieChartOptions, setPieChartOptions] = useState<ApexOptions>({});
    const [pieSerie, setPieSerie] = useState<number[]>([]);
    
    useEffect(() => {
        const symbols: string[] = [];
        const serie: number[] = [];
        let othersSum: number = 0;

        Object.values(assetsView).forEach((a, i) => {
            if (i < 4) {
                symbols.push(a.assetSymbol)
                serie.push(parseFloat(a.currentPriceEth))
            } else {
                othersSum += parseFloat(a.currentPriceEth);
            }
        });

        if (othersSum > 0) {
            symbols.push("Others")
            serie.push(othersSum);
        }

        setPieChartOptions({
            chart: {
                id: "pie-chart",
                foreColor: "#adb0bb",
                toolbar: {
                    show: false,
                },
            },
            dataLabels: {
                enabled: false,
            },
            plotOptions: {
                pie: {
                    donut: {
                        size: "70px",
                    },
                },
            },
            labels: symbols,
            legend: {
                show: true,
                position: "bottom",
                horizontalAlign: "center"
            },
            colors: [
                theme.palette.primary.main, 
                theme.palette.primary.light, 
                theme.palette.secondary.main, 
                theme.palette.secondary.light, 
                theme.palette.warning.main
            ],
            tooltip: {
                fillSeriesColor: false,
            }
        });
        setPieSerie(serie)
    }, [assetsView]);

    return (
        <Card sx={{ padding: 0, borderColor: (theme) => theme.palette.divider }} variant="outlined">
            <CardHeader title="Assets Ratio (ETH)" />
            <Divider />
            <CardContent>
                {isLoading ? (
                    <LoadingComponent message={"Loading assets ratio"} />
                ) : (
                    <Chart options={pieChartOptions} series={pieSerie} type="pie" height="300px" width={"100%"} />
                )}
            </CardContent>
        </Card>
    );
};

export default DashboardRatio;
