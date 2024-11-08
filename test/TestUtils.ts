import { ethers } from "hardhat";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import * as Contracts from "../typechain-types";

export const addresses = {
    UNISWAP_V2_ROUTER: "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D",
    KYBER_PROXY_NETWORK: "0x9AAb3f75489902f3a48495025729a0AF77d4b11e",
    ETH: ethers.getAddress("0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE"),
    WETH: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
    DAI: "0x6B175474E89094C44Da98b954EedeAC495271d0F",
    UNI: "0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984",
    USDC: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
    WETH_WHALE: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
    DAI_WHALE: "0x28C6c06298d514Db089934071355E5743bf21d60",
}

export async function deployMosaicaLib(): Promise<Contracts.MosaicaLib> {
    const Contract = await ethers.getContractFactory("MosaicaLib");
    const contract = await Contract.deploy();
    await contract.waitForDeployment();

    return contract;
}

export async function deployDexConnectorStorage(): Promise<Contracts.DexConnectorStorage> {
    const DexConnectorStorage = await ethers.getContractFactory("DexConnectorStorage");
    const dexConnectorStorage = await DexConnectorStorage.deploy();
    await dexConnectorStorage.waitForDeployment();

    return dexConnectorStorage;
}

export async function deployUniswapV2LikeConnectorContract(name: string, address: string): Promise<Contracts.UniswapV2LikeConnector> {
    const mosaicaLib = await deployMosaicaLib();

    const UniswapV2LikeConnector = await ethers.getContractFactory("UniswapV2LikeConnector", {libraries: {MosaicaLib: await mosaicaLib.getAddress()}});
    const uniswapV2LikeConnector = await UniswapV2LikeConnector.deploy(name, address);
    await uniswapV2LikeConnector.waitForDeployment();

    return uniswapV2LikeConnector;
}

export async function deployKyberConnector(): Promise<Contracts.KyberConnector> {
    const mosaicaLib = await deployMosaicaLib();

    const KyberConnector = await ethers.getContractFactory("KyberConnector", {libraries: {MosaicaLib: await mosaicaLib.getAddress()}});
    const kyberConnector = await KyberConnector.deploy(addresses.KYBER_PROXY_NETWORK);
    await kyberConnector.waitForDeployment();

    return kyberConnector;
}

export async function getErc20Balance(tokenAddress: string, account: string): Promise<bigint> {
    const token = await ethers.getContractAt("IERC20", tokenAddress);
    return await token.balanceOf(account);
}

export async function fundAccountWithToken(spender: string, account: HardhatEthersSigner, token: string, whale: string, amount: bigint) {
    const ercToken = await ethers.getContractAt("IERC20", token);

    await ethers.provider.send("hardhat_impersonateAccount", [whale]); 
    const whaleSigner = await ethers.getSigner(whale);
    
    await ercToken.connect(whaleSigner).transfer(account, amount);
    await ercToken.connect(account).approve(spender, amount);
}

export async function deployPortfolioFactory(): Promise<Contracts.PortfolioFactory> {
    const mosaicaLib = await deployMosaicaLib();
    const PortfolioFactory = await ethers.getContractFactory("PortfolioFactory", {libraries: { MosaicaLib: await mosaicaLib.getAddress()}});
    const portfolioFactory = await PortfolioFactory.deploy();
    await portfolioFactory.waitForDeployment();

    return portfolioFactory;
}

export async function getUniswapConnectorAddress(): Promise<string> {
    const uniswapV2LikeConnector = await deployUniswapV2LikeConnectorContract("Uniswap V2", addresses.UNISWAP_V2_ROUTER)
    return await uniswapV2LikeConnector.getAddress();
}