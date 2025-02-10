import React from "react";
import { Box, Typography, Container, Divider, Stack, Tooltip, Link } from "@mui/material";

const Footer: React.FC = () => {
    return (
        <Container maxWidth="lg" sx={{ pt: { xs: "30px", lg: "60px" } }}>
            <Divider />
            <Box py="40px" flexWrap="wrap" display="flex" justifyContent="space-between">
                <Stack direction="row" gap={1} alignItems="center">
                    <img src="/images/logos/footer-logo.svg" width={20} height={20} alt="logo" />
                    <Typography variant="body1" fontSize="15px">
                        All rights reserved by Mosaica.{" "}
                    </Typography>
                </Stack>
                <Stack direction="row" gap="20px">
                    <Tooltip title="Github">
                        <Link href="https://github.com/youssefboulmarouf/mosaica">
                            <img src="/images/svgs/github.svg" width={22} height={22} />
                        </Link>
                    </Tooltip>
                </Stack>
            </Box>
        </Container>
    );
};

export default Footer;
