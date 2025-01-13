import { Box, Container } from "@mui/material";
import DexConnectorList from "./DexConnectorList";
import Breadcrumb from "../ui-components/Breadcrumb";

const BCrumb = [
    {
        to: "/",
        title: "Home",
    },
    {
        title: "Admin",
    },
];

const Admin: React.FC = () => {
    return (
        <Box pt={7}>
            <Container sx={{ maxWidth: "1400px !important", position: "relative" }}>
                <Breadcrumb title="Admin" items={BCrumb} />
                <DexConnectorList />
            </Container>
        </Box>
    );
};

export default Admin;
