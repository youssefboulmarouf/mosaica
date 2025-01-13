import { Link } from "react-router-dom";
import { Grid, Typography, Breadcrumbs, Theme } from "@mui/material";

interface BreadCrumbType {
    items?: any[];
    title: string;
}

const Breadcrumb = ({ items, title }: BreadCrumbType) => (
    <Grid
        container
        sx={{
            backgroundColor: "primary.light",
            borderRadius: (theme: Theme) => theme.shape.borderRadius / 4,
            p: "30px 25px 20px",
            position: "relative",
            overflow: "hidden",
        }}
    >
        <Grid item xs={12} sm={6} lg={8} mb={1}>
            <Typography variant="h4" align="left">
                {title}
            </Typography>
            <Breadcrumbs
                separator="/"
                sx={{ alignItems: "center", mt: items ? "10px" : "" }}
                aria-label="breadcrumb"
            >
                {items
                    ? items.map((item) => (
                          <div key={item.title}>
                              {item.to ? (
                                  <Link to={item.to}>
                                      <Typography color="textSecondary">{item.title}</Typography>
                                  </Link>
                              ) : (
                                  <Typography color="textPrimary">{item.title}</Typography>
                              )}
                          </div>
                      ))
                    : ""}
            </Breadcrumbs>
        </Grid>
    </Grid>
);

export default Breadcrumb;
