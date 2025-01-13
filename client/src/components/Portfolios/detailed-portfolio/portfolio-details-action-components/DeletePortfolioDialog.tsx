import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button, Dialog, DialogActions, DialogContent, DialogTitle } from "@mui/material";
import { usePortfolioDetailsContext } from "../../../../contexts/PortfolioDetailsContext";
import { Erc20DataHolder } from "../../../../services/Erc20DataHolder";
import { useAppContext } from "../../../../contexts/AppContext";
import { Asset, PortfolioParam } from "../../../interfaces";

interface AdminDialogProps {
    openDeleteDialog: boolean;
    closeDialog: () => void;
}

const DeletePortfolioDialog: React.FC<AdminDialogProps> = ({ openDeleteDialog, closeDialog }) => {
    const navigate = useNavigate();
    const {portfolioFactoryService} = useAppContext();
    const { currentPortfolio, currentPortfolioServices } = usePortfolioDetailsContext();
    const [assets, setAssets] = useState<Asset[]>([]);

    useEffect(() => {
        if (currentPortfolio) {
            setAssets(currentPortfolio.assets);
        }
    }, [currentPortfolio]);

    const withdrawAndDeletePortfolio = async () => {
        const params: PortfolioParam[] = [];
        if (currentPortfolio && currentPortfolioServices) {
            currentPortfolio.assets.map((a: Asset) => {
                params.push({
                    srcToken: a.assetAddress,
                    destToken: a.assetAddress,
                    dexConnectorAddress: a.assetAddress,
                    amount: Erc20DataHolder.getInstance().normalizeAmount(a.assetAddress, a.balance),
                    slippage: 1,
                });
            });
    
            await currentPortfolioServices.withdrawAssets(params);
            await deletePortfolio();
        }
    };

    const deletePortfolio = async () => {
        if (currentPortfolio && currentPortfolioServices && portfolioFactoryService) {
            await portfolioFactoryService.deletePortfolio(currentPortfolioServices.contractAddress);
            navigate("/portfolios");
        }
    };

    return (
        <Dialog open={openDeleteDialog} onClose={() => closeDialog()}>
            <DialogTitle>Confirm Delete Portfolio</DialogTitle>
            <DialogContent>Are you sure you want to the portfolio?</DialogContent>
            <DialogActions>
                <Button variant="outlined" onClick={() => closeDialog()}>
                    Cancel
                </Button>

                {assets.length > 0 ? (
                    <Button color="error" onClick={() => withdrawAndDeletePortfolio()}>
                        Withdraw Assets & Delete Portfolio
                    </Button>
                ) : (
                    <Button color="error" onClick={() => deletePortfolio()}>
                        Delete Portfolio
                    </Button>
                )}
            </DialogActions>
        </Dialog>
    );
};

export default DeletePortfolioDialog;
