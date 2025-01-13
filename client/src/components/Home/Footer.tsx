import React from "react";
import { Box, Typography, Container, Divider, Stack, Tooltip, Link } from "@mui/material";

const Footer: React.FC = () => {
    return (
        <Container maxWidth="lg" sx={{ pt: { xs: "30px", lg: "60px" } }}>
            <Divider />
            <Box py="40px" flexWrap="wrap" display="flex" justifyContent="space-between">
                <Stack direction="row" gap={1} alignItems="center">
                    <img src="/images/logos/logoIcon.svg" width={20} height={20} alt="logo" />
                    <Typography variant="body1" fontSize="15px">
                        All rights reserved by Mosaica.{" "}
                    </Typography>
                </Stack>
                <Stack direction="row" gap="20px">
                    <Tooltip title="Facebook">
                        <Link href="#">
                            <img src="/images/frontend-pages/icons/icon-facebook.svg" width={22} height={22} />
                        </Link>
                    </Tooltip>
                    <Tooltip title="Twitter">
                        <Link href="#">
                            <img src="/images/frontend-pages/icons/icon-twitter.svg" width={22} height={22} />
                        </Link>
                    </Tooltip>
                    <Tooltip title="Instagram">
                        <Link href="#">
                            <img src="/images/frontend-pages/icons/icon-instagram.svg" width={22} height={22} />
                        </Link>
                    </Tooltip>
                </Stack>
            </Box>
        </Container>
    );
};

export default Footer;
