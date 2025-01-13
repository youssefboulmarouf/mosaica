import { useEffect, useState } from "react";
import { Box, Drawer, Grid, Typography } from "@mui/material";
import { usePortfolioDetailsContext } from "../../../../../contexts/PortfolioDetailsContext";
import WithdrawAssetSelection from "./WithdrawAssetSelection";
import { Asset, AssetTransaction, PortfolioParam } from "../../../../interfaces";
import WithdrawAssetOverview from "./WithdrawAssetOverview";
import DrawerTitle from "../../../../ui-components/DrawerTitle";

interface WithdrawAssetDrawerProps {
    openDrawer: boolean;
    closeDrawer: () => void;
}

const WithdrawAssetDrawer: React.FC<WithdrawAssetDrawerProps> = ({ openDrawer, closeDrawer }) => {
    const { currentPortfolio, currentPortfolioServices, refreshPortolio } = usePortfolioDetailsContext();
    const [assets, setAssets] = useState<Asset[]>([]);
    const [asset, setAsset] = useState<Asset | undefined>(undefined);
    const [withdrawList, setWithdrawList] = useState<AssetTransaction[]>([]);

    useEffect(() => {
        if (currentPortfolio) {
            setAssets(currentPortfolio.assets);
            setAsset(currentPortfolio.assets[0]);
        }
    }, [currentPortfolio]);

    const addToWithdrawList = (assetToWithdraw: AssetTransaction) => {
        setWithdrawList((prevAssets) => {
            const updatedAssets = [
                ...prevAssets,
                {
                    srcSymbol: assetToWithdraw.srcSymbol,
                    srcAddress: assetToWithdraw.srcAddress,
                    srcBalance: assetToWithdraw.srcBalance,
                    destSymbol: assetToWithdraw.destSymbol,
                    destAddress: assetToWithdraw.destAddress,
                    amount: assetToWithdraw.amount,
                    dexAddress: assetToWithdraw.dexAddress,
                    dexName: assetToWithdraw.dexName,
                    price: assetToWithdraw.price,
                },
            ];
            updatedAssets.sort((a, b) => (a.srcSymbol > b.srcSymbol ? 1 : a.srcSymbol < b.srcSymbol ? -1 : 0));

            return updatedAssets;
        });
    };

    const removeAsset = (index: number) => {
        setWithdrawList((prevAssets) => prevAssets.filter((_, i) => i !== index));
    };

    const withdraw = async () => {
        const params: PortfolioParam[] = [];

        if (currentPortfolioServices) {
            withdrawList.forEach((wa) => {
                params.push({
                    srcToken: wa.srcAddress,
                    destToken: wa.destAddress,
                    dexConnectorAddress: wa.dexAddress,
                    amount: wa.amount,
                    slippage: 1,
                });
            });

            await currentPortfolioServices.withdrawAssets(params);
            closeDrawer();
            setWithdrawList([]);
            refreshPortolio();
        }
    }

    return (
        <Drawer anchor="bottom" open={openDrawer} onClose={() => closeDrawer()}>
            <DrawerTitle title="Withdraw Asset"/>
            <Box p={3}>
                <Grid container spacing={3} mt={3}>
                    <Grid item xs={12} lg={6} sm={6} display="flex" alignItems="stretch">
                        <WithdrawAssetSelection
                            assets={assets}
                            selectedAsset={asset}
                            setSelectedAsset={setAsset}
                            addToWithdrawList={addToWithdrawList}
                        />
                    </Grid>
                    <Grid item xs={12} lg={6} sm={6} display="flex" alignItems="stretch">
                        <WithdrawAssetOverview assets={withdrawList} removeAsset={removeAsset} withdraw={withdraw}/>
                    </Grid>
                </Grid>
            </Box>
        </Drawer>
    );
};

export default WithdrawAssetDrawer;
