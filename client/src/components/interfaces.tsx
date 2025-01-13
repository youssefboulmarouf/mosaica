import { ethers } from "ethers";

export interface Token {
    symbol: string;
    address: string;
    stable: boolean;
}

export interface AssetTransaction {
    srcSymbol: string;
    srcAddress: string;
    srcBalance: bigint;
    destSymbol: string;
    destAddress: string;
    amount: bigint;
    dexAddress: string;
    dexName: string;
    price: bigint;
}

export interface PortfolioParam {
    srcToken: string;
    dexConnectorAddress: string;
    destToken: string;
    amount: bigint;
    slippage: number;
}

export interface Price {
    date: number;
    ethPriceWithToken: string;
    tokenPriceWithEth: string;
    tokenpriceWithUsd: string;
}

export interface Asset {
    assetAddress: string;
    assetSymbol: string;
    assetName: string;
    balance: string;
    currentPriceEth: string;
    currentPriceUsd: string;
    imgPath: string;
}

export interface Portfolio {
    portfolioAddress: string;
    owner: string;
    assets: Asset[];
    totalValueUsd: string;
    totalValueEth: string;
}

export interface PortfolioMap {
    [portfolioAddress: string]: Portfolio;
}

export enum PortfolioEventType {
    AddAsset = "Add Asset",
    BuyAsset = "Buy Asset",
    WithdrawAsset = "Withdraw Asset",
}

export enum DefaultAddresses {
    ETH = "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE",
    WETH = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
    DAI = "0x6B175474E89094C44Da98b954EedeAC495271d0F"
}

export interface PortfolioActionEvent {
    eventType: PortfolioEventType,
    portfolioAddress: string,
    assetAddress: string,
    amount: bigint,
    timestamp: bigint
}

export interface PortfolioCreatedEvent {
    portfolioAddress: string,
    owner: string,
    timestamp: bigint
}

export interface DexPrice {
    [address: string]: { dexName: string; price: bigint };
}