import { useEffect, useState } from "react";
import { Box, Card, CardContent, CardHeader, Divider, Typography } from "@mui/material";
import {
    Timeline,
    TimelineItem,
    TimelineOppositeContent,
    TimelineSeparator,
    TimelineDot,
    TimelineConnector,
    TimelineContent,
    timelineOppositeContentClasses,
} from "@mui/lab";
import UpdateDisabledIcon from "@mui/icons-material/UpdateDisabled";
import PortfolioFactoryService from "../../../../services/PortfolioFactoryService";
import { Erc20DataHolder } from "../../../../services/Erc20DataHolder";
import { usePortfolioDetailsContext } from "../../../../contexts/PortfolioDetailsContext";
import { useWalletContext } from "../../../../contexts/WalletContext";
import { PortfolioActionEvent, PortfolioCreatedEvent, PortfolioEventType } from "../../../interfaces";
import LoadingComponent from "../../../ui-components/LoadingComponent";

interface PortfolioHistoryProps {
    portfolioFactoryService: PortfolioFactoryService | null;
}

const PortfolioHistory: React.FC<PortfolioHistoryProps> = ({ portfolioFactoryService }) => {
    const { account } = useWalletContext();
    const { currentPortfolio, currentPortfolioServices } = usePortfolioDetailsContext();
    const [portfolioCreatedEvent, setPortfolioCreatedEvent] = useState<PortfolioCreatedEvent | null>(null);
    const [portfolioActionEvents, setPortfolioActionEvents] = useState<PortfolioActionEvent[]>([]);
    const [isLoadingErcData, setIsLoadingErcData] = useState<boolean>(true);

    useEffect(() => {
        const loadPortfolioEvent = async () => {
            if (portfolioFactoryService && currentPortfolioServices && account) {
                setIsLoadingErcData(true);
                setPortfolioCreatedEvent(
                    await portfolioFactoryService.getPortfolioCreatedEvent(currentPortfolioServices.contractAddress),
                );
                setPortfolioActionEvents(
                    await currentPortfolioServices.getPortfolioActionEvents(currentPortfolioServices.contractAddress),
                );
            }
        };

        loadPortfolioEvent();
    }, [currentPortfolioServices, portfolioFactoryService, currentPortfolio]);

    useEffect(() => {
        const loadErc20Data = async () => {
            if (account) {
                setIsLoadingErcData(true);
                await Promise.all(
                    portfolioActionEvents.map(
                        async (e) => await Erc20DataHolder.getInstance().fetchErc20Data(account, e.assetAddress),
                    ),
                );
                setIsLoadingErcData(false);
            }
        };

        loadErc20Data();
    }, [portfolioActionEvents]);

    const formatDate = (timestamp: string) => {
        const date = new Date(parseInt(timestamp) * 1000);
        const day = date.getDate().toString().padStart(2, "0");
        const month = (date.getMonth() + 1).toString().padStart(2, "0");
        const year = date.getFullYear();
        return `${day}/${month}/${year}`;
    };

    const formatEventDetails = (event: PortfolioActionEvent) => {
        const erc20 = Erc20DataHolder.getInstance().loadErc20Data(event.assetAddress);
        const balance = Erc20DataHolder.getInstance().formatBalance(event.assetAddress, event.amount);
        return `${parseFloat(balance).toFixed(2)} of ${erc20.erc20Symbol}`;
    };

    const eventTypeColorMap: Record<PortfolioEventType, "secondary" | "success" | "warning"> = {
        [PortfolioEventType.AddAsset]: "success",
        [PortfolioEventType.BuyAsset]: "secondary",
        [PortfolioEventType.WithdrawAsset]: "warning",
    };

    return (
        <Card sx={{ padding: 0, borderColor: (theme) => theme.palette.divider }} variant="outlined">
            <CardHeader title="Portfolio Transaction History" />
            <Divider />
            <CardContent>
                {isLoadingErcData ? (
                    <LoadingComponent message={"Loading transaction history"} />
                ) : portfolioCreatedEvent ? (
                    <Timeline
                        sx={{
                            maxHeight: "290px",
                            overflow: "auto",
                            p: 0,
                            [`& .${timelineOppositeContentClasses.root}`]: { flex: 0.5, paddingLeft: 0 },
                        }}
                    >
                        <TimelineItem>
                            <TimelineOppositeContent>
                                {formatDate(portfolioCreatedEvent.timestamp.toString())}
                            </TimelineOppositeContent>
                            <TimelineSeparator>
                                <TimelineDot color="primary" variant="outlined" />
                                <TimelineConnector />
                            </TimelineSeparator>
                            <TimelineContent>Portfolio Created</TimelineContent>
                        </TimelineItem>

                        {portfolioActionEvents.length > 0
                            ? portfolioActionEvents.map((p) => (
                                  <TimelineItem>
                                      <TimelineOppositeContent>
                                          {formatDate(p.timestamp.toString())}
                                      </TimelineOppositeContent>
                                      <TimelineSeparator>
                                          <TimelineDot color={eventTypeColorMap[p.eventType]} variant="outlined" />
                                          <TimelineConnector />
                                      </TimelineSeparator>
                                      <TimelineContent>
                                          <Typography fontWeight="600">{p.eventType}</Typography>
                                          {formatEventDetails(p)}
                                      </TimelineContent>
                                  </TimelineItem>
                              ))
                            : ""}
                    </Timeline>
                ) : (
                    <Box sx={{ textAlign: "center" }}>
                        <UpdateDisabledIcon />
                        <Typography variant="body1" sx={{ mt: 2 }}>
                            No transaction found for portfolio with address: {currentPortfolio?.portfolioAddress}.
                        </Typography>
                    </Box>
                )}
            </CardContent>
        </Card>
    );
};

export default PortfolioHistory;
