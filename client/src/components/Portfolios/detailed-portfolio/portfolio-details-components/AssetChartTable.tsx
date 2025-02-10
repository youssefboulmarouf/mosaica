import { useEffect, useState } from "react";
import Chart from "react-apexcharts";
import { Collapse, useTheme } from "@mui/material";
import { ApexOptions } from "apexcharts";
import { usePortfolioDetailsContext } from "../../../../contexts/PortfolioDetailsContext";
import { Asset } from "../../../interfaces";

interface AssetChartTableProps {
    openRow: boolean;
    rowToOpen: number;
    rowIndex: number;
    asset: Asset;
}

const AssetChartTable: React.FC<AssetChartTableProps> = ({ openRow, rowToOpen, rowIndex, asset }) => {
    const theme = useTheme();
    const { assetsTotalValue } = usePortfolioDetailsContext();
    const [areaChartOptions, setAreaChartOptions] = useState<ApexOptions>({});
    const [assetValue, setAssetValue] = useState<number[]>([]);

    useEffect(() => {
        if (asset && assetsTotalValue[asset.assetAddress]) {
            setAreaChartOptions(
                {
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
                        categories: assetsTotalValue[asset.assetAddress].map((h) => h.date),
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
                }
            );

            const chartValue: number[] = [];
            
            assetsTotalValue[asset.assetAddress].forEach(av => {
                chartValue.push(parseFloat(av.tokenPriceWithEth))
            })

            setAssetValue(chartValue);
        }
    }, [asset, assetsTotalValue]);

    const seriesareachart: ApexOptions["series"] = [
        {
            name: asset.assetSymbol + " Balance Variation (ETH)",
            data: assetValue,
        },
    ];

    return (
        <Collapse in={openRow && rowToOpen === rowIndex} timeout="auto" unmountOnExit>
            <Chart options={areaChartOptions} series={seriesareachart} type="area" height="300px" width="100%" />
        </Collapse>
    );
};

export default AssetChartTable;
