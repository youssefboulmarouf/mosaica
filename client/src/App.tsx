import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { CssBaseline } from "@mui/material";
import { ThemeProvider } from "@mui/material/styles";
import MosaicaAppBar from "./components/AppBar/MosaicaAppBar";
import Home from "./components/Home/Home";
import Dashboard from "./components/Dashboard/Dashboard";
import Portfolios from "./components/Portfolios/Portfolios";
import PortfolioDetails from "./components/Portfolios/detailed-portfolio/PortfolioDetails";
import Admin from "./components/Admin/Admin";
import { WalletProvider } from "./contexts/WalletContext";
import { AppProvider } from "./contexts/AppContext";
import CreatePortfolio from "./components/Portfolios/create-portfolio/CreatePortfolio";
import { ThemeSettings } from "./theme/Theme";
import "./App.css";

const App: React.FC = () => {
    const theme = ThemeSettings();

    return (
        <ThemeProvider theme={theme}>
            <CssBaseline />
            <div className="App">
                <Router>
                    <WalletProvider>
                        <AppProvider>
                            <MosaicaAppBar />

                            <Routes>
                                <Route path="/" element={<Home />} />
                                <Route path="/dashboard" element={<Dashboard />} />
                                <Route path="/portfolios" element={<Portfolios />} />
                                <Route path="/portfolios/details/:portfolioAddress" element={<PortfolioDetails />} />
                                <Route path="/portfolios/create" element={<CreatePortfolio />} />
                                <Route path="/admin" element={<Admin />} />
                            </Routes>
                        </AppProvider>
                    </WalletProvider>
                </Router>
            </div>
        </ThemeProvider>
    );
};

export default App;
