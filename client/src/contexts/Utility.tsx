import { ethers, Signer } from "ethers";
import PortfolioService from "../services/PortfolioService";
import { Asset, DefaultAddresses, DexPrice } from "../components/interfaces";
import { Erc20DataHolder } from "../services/Erc20DataHolder";
import { getCurrentPrices } from "../services/PriceAggregatorService";
import DexConnectorService from "../services/DexConnectorService";

export const fetchAssetData = async (
    account: Signer,
    dexConnectorServices: DexConnectorService[],
    service: PortfolioService,
    assetAddress: string,
): Promise<Asset> => {
    const erc20Data = await Erc20DataHolder.getInstance().fetchErc20Data(account, assetAddress);
    const balance = await service.getAssetBalance(assetAddress);

    const assetPricedWithEth =
        assetAddress === DefaultAddresses.ETH || assetAddress === DefaultAddresses.WETH
            ? Erc20DataHolder.getInstance().formatBalance(assetAddress, balance)
            : await fetchAssetEthPrice(dexConnectorServices, assetAddress, balance);

    const ethUsdPrice = await fetchEthDaiPrice(dexConnectorServices);
    const currentPriceUsd = (+ethUsdPrice * +assetPricedWithEth).toString();

    return {
        assetAddress,
        assetSymbol: erc20Data.erc20Symbol,
        assetName: erc20Data.erc20Name,
        balance: Erc20DataHolder.getInstance().formatBalance(assetAddress, balance),
        currentPriceEth: assetPricedWithEth,
        currentPriceUsd: currentPriceUsd,
        imgPath: `/images/tokens/${erc20Data.erc20Symbol.toLowerCase()}.webp`,
    };
};

const fetchAssetEthPrice = async (
    dexConnectorServices: DexConnectorService[],
    assetAddress: string,
    assetBalance: bigint,
): Promise<string> => {
    const bestPrice: DexPrice = await getCurrentPrices(
        dexConnectorServices,
        assetAddress,
        DefaultAddresses.ETH,
        assetBalance,
    );

    if (Object.entries(bestPrice).length > 0) {
        return ethers.formatEther(Object.values(bestPrice)[0].price);
    }
    return "0";
};

const fetchEthDaiPrice = async (dexConnectorServices: DexConnectorService[]): Promise<string> => {
    const bestPrice: DexPrice = await getCurrentPrices(
        dexConnectorServices,
        DefaultAddresses.WETH,
        DefaultAddresses.DAI,
        ethers.parseEther("1"),
    );

    if (Object.entries(bestPrice).length > 0) {
        return ethers.formatEther(Object.values(bestPrice)[0].price);
    }
    return "0";
};
