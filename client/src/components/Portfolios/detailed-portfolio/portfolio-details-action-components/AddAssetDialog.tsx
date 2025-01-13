import { useEffect, useState } from "react";
import { ethers } from "ethers";
import { Autocomplete, Button, Dialog, DialogActions, DialogContent, DialogTitle, Stack, TextField, Typography } from "@mui/material";
import tokens from "../../../../data/tokens.json";
import { useWalletContext } from "../../../../contexts/WalletContext";
import Erc20Service from "../../../../services/Erc20Service";
import { usePortfolioDetailsContext } from "../../../../contexts/PortfolioDetailsContext";
import { DefaultAddresses, Token } from "../../../interfaces";
import { Erc20DataHolder } from "../../../../services/Erc20DataHolder";

interface AddAssetDialogProps {
    openDialog: boolean;
    closeDialog: () => void;
}

const AddAssetDialog: React.FC<AddAssetDialogProps> = ({ openDialog, closeDialog }) => {
    const { provider, account, address } = useWalletContext();
    const { currentPortfolioServices, refreshPortolio } = usePortfolioDetailsContext();
    const [selectedSrcToken, setSelectedSrcToken] = useState<Token>(tokens[0]);
    const [selectedSrcTokenBalance, setSelectedSrcTokenBalance] = useState<bigint>(0n);
    const [amount, setAmount] = useState(0);
    const [disableAddAssetButton, setDisableAddAssetButton] = useState<boolean>(true);

    useEffect(() => {
        const fetchBalance = async () => {
            let balance: bigint = 0n;
            if (provider && account && address) {

                await Erc20DataHolder.getInstance().fetchErc20Data(account, selectedSrcToken.address);

                if (selectedSrcToken.address === DefaultAddresses.ETH) {
                    balance = await provider.getBalance(address);
                } else {
                    const erc20Token = new Erc20Service(account, selectedSrcToken.address);
                    balance = await erc20Token.getBalance(address);
                }
            }

            if (Erc20DataHolder.getInstance().normalizeAmount(selectedSrcToken.address, amount.toString()) > balance) {
                setDisableAddAssetButton(true);
            } else {
                setDisableAddAssetButton(false);
            }

            setSelectedSrcTokenBalance(balance);
        };
        fetchBalance();
    }, [selectedSrcToken, provider, account, address]);

    const handleAddAsset = async () => {
        if (currentPortfolioServices && account) {
            
            let ethAmount = 0n;

            if (selectedSrcToken.address === DefaultAddresses.ETH) {
                ethAmount = ethers.parseEther(amount.toString());
            } else {
                const erc20 = new Erc20Service(account, selectedSrcToken.address);
                await erc20.approve(
                    currentPortfolioServices.contractAddress, 
                    Erc20DataHolder.getInstance().normalizeAmount(selectedSrcToken.address, amount.toString())
                );
            }

            await currentPortfolioServices.addAsset(
                selectedSrcToken.address, 
                Erc20DataHolder.getInstance().normalizeAmount(selectedSrcToken.address, amount.toString()), 
                ethAmount
            );
            
            refreshPortolio();
            handleCloseDialog();
        }
    };

    const handleCloseDialog = () => {
        setAmount(0);
        setSelectedSrcToken(tokens[0]);
        closeDialog();
    }

    return (
        <Dialog open={openDialog} onClose={() => handleCloseDialog()}>
            <DialogTitle sx={{ width: "500px", mt: 2 }}>Add Asset</DialogTitle>
            <DialogContent>
                <Stack direction="column" spacing={2}>
                    <Typography variant="subtitle1" fontWeight={600} component="label" sx={{ display: "flex" }}>
                        Choose Asset
                    </Typography>
                    <Autocomplete
                        options={tokens}
                        getOptionKey={(options) => options.address}
                        getOptionLabel={(options) => options.symbol}
                        value={selectedSrcToken}
                        onChange={(event: React.SyntheticEvent, newValue: Token | null) =>
                            setSelectedSrcToken(newValue === null ? tokens[0] : newValue)
                        }
                        renderInput={(params) => <TextField {...params} placeholder="Choose Token" />}
                    />
                    <Typography variant="caption" color="secondary" sx={{ display: "flex" }}>
                        {selectedSrcToken.symbol} Balance: {ethers.formatEther(selectedSrcTokenBalance)}
                    </Typography>

                    <Typography variant="subtitle1" fontWeight={600} component="label" sx={{ display: "flex", mt: 2 }}>
                        Amount
                    </Typography>
                    <TextField
                        fullWidth
                        value={amount}
                        onChange={(e: any) => setAmount(e.target.value === "" ? 0 : e.target.value)}
                        error={ethers.parseEther(amount.toString()) > selectedSrcTokenBalance}
                    />
                    {Erc20DataHolder.getInstance().normalizeAmount(selectedSrcToken.address, amount.toString()) > selectedSrcTokenBalance ? (
                        <Typography variant="caption" color="error" sx={{ display: "flex" }}>
                            Not Enough Balance
                        </Typography>
                    ) : (
                        ""
                    )}
                </Stack>
            </DialogContent>
            <DialogActions>
                <Button color="error" variant="outlined" onClick={() => closeDialog()}>
                    Cancel
                </Button>
                <Button
                    variant="contained"
                    disabled={disableAddAssetButton}
                    color="primary"
                    onClick={() => handleAddAsset()}
                >
                    Add Asset
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default AddAssetDialog;
