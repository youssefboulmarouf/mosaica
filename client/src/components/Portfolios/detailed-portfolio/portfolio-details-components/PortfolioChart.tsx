import { useEffect, useState } from "react";
import Chart from "react-apexcharts";
import { Card, CardContent, CardHeader, Divider } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { ApexOptions } from "apexcharts";
import { usePortfolioDetailsContext } from "../../../../contexts/PortfolioDetailsContext";
import LoadingComponent from "../../../ui-components/LoadingComponent";

const PortfolioChart: React.FC = () => {
    const theme = useTheme();
    const { portfolioHistoricValue, isLoadingHistoricValue } = usePortfolioDetailsContext();
    const [areaChartOptions, setAreaChartOptions] = useState<ApexOptions>({});
    const [areaSerie, setAreaSerie] = useState<number[]>([]);

    useEffect(() => {
        setAreaChartOptions({
            chart: {
                id: "area-chart",
                fontFamily: "inherit",
                foreColor: "#adb0bb",
                zoom: {
                    enabled: true,
                },
                toolbar: {
                    show: false,
                },
            },
            dataLabels: {
                enabled: false,
            },
            stroke: {
                width: 3,
                curve: "smooth",
            },
            colors: [theme.palette.primary.main],
            xaxis: {
                type: "datetime",
                categories: portfolioHistoricValue.map((h) => h.date),
                labels: {
                    formatter: (value: string) => {
                        const date = new Date(parseInt(value) * 1000);
                        const day = date.getDate().toString().padStart(2, "0");
                        const month = (date.getMonth() + 1).toString().padStart(2, "0");
                        return `${day}/${month}`;
                    },
                },
            },
            yaxis: {
                opposite: false,
                labels: {
                    show: true,
                    formatter: (value: number) => value.toFixed(5),
                },
            },
            legend: {
                show: true,
                position: "bottom",
                width: 50,
            },
            grid: {
                show: false,
            },
            tooltip: {
                theme: "dark",
                fillSeriesColor: false,
                y: {
                    formatter: (value: number) => `${value.toFixed(5)} ETH`,
                },
            },
        });
        setAreaSerie(portfolioHistoricValue.map((h) => parseFloat(h.tokenPriceWithEth)));
    }, [portfolioHistoricValue]);

    const seriesareachart = [
        {
            name: "Portfolio Value (ETH)",
            data: areaSerie,
        },
    ];

    return (
        <Card sx={{ padding: 0, borderColor: (theme) => theme.palette.divider }} variant="outlined">
            <CardHeader title="90 Days Value Variation (ETH)" />
            <Divider />
            <CardContent>
                {isLoadingHistoricValue ? (
                    <LoadingComponent message={"Loading assets ratio"} />
                ) : (
                    <Chart
                        options={areaChartOptions}
                        series={seriesareachart}
                        type="area"
                        height="300px"
                        width={"100%"}
                    />
                )}
            </CardContent>
        </Card>
    );
};

export default PortfolioChart;
