import { Box, Container } from "@mui/material";
import Breadcrumb from "../ui-components/Breadcrumb";
import PortfolioList from "./list-portfolios/PortfolioList";
import { PortfolioProvider } from "../../contexts/PortfolioContext";

const BCrumb = [
    {
        to: "/",
        title: "Home",
    },
    {
        title: "Portfolios",
    },
];

const Portfolios: React.FC = () => {
    return (
        <Box pt={7}>
            <Container sx={{ maxWidth: "1400px !important", position: "relative" }}>
                <Breadcrumb title="Portfolios" items={BCrumb} />
                <PortfolioProvider>
                    <PortfolioList />
                </PortfolioProvider>
            </Container>
        </Box>
    );
}

export default Portfolios;