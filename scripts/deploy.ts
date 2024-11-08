import fs from 'fs';
import { ethers } from "hardhat";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import * as Contracts from "../typechain-types";

const addresses = {
    UNISWAP_V2_ROUTER: "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D",
    SUSHISWAP_V2_ROUTER: "0xd9e1cE17f2641f24aE83637ab66a2cca9C378B9F",
    KYBER_PROXY_NETWORK: "0x9AAb3f75489902f3a48495025729a0AF77d4b11e",
    ETH: ethers.getAddress("0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE"),
    WETH: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
    DAI: "0x6B175474E89094C44Da98b954EedeAC495271d0F",
    UNI: "0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984",
    USDC: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
    WETH_WHALE: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
    DAI_WHALE: "0x28C6c06298d514Db089934071355E5743bf21d60",
}

async function deployMosaicaLib(): Promise<Contracts.MosaicaLib> {
    const mosaicaLib = await ethers.deployContract("MosaicaLib");
    await mosaicaLib.waitForDeployment();
    return mosaicaLib;
}

async function deployDexConnectorStorage(): Promise<Contracts.DexConnectorStorage> {
    const dexConnectorStorage = await ethers.deployContract("DexConnectorStorage");
    await dexConnectorStorage.waitForDeployment();
    return dexConnectorStorage;
}

async function deployUniswapV2LikeConnector(mosaicaLibAddress: string, name: string, routerAddress: string): Promise<Contracts.UniswapV2LikeConnector> {
    const uniswapV2LikeConnector = await ethers.deployContract("UniswapV2LikeConnector", [name, routerAddress], {libraries: {MosaicaLib: mosaicaLibAddress}} );
    await uniswapV2LikeConnector.waitForDeployment();
    return uniswapV2LikeConnector;
}

async function deployKyberConnector(mosaicaLibAddress: string): Promise<Contracts.KyberConnector> {
    const kyberConnector = await ethers.deployContract("KyberConnector", [addresses.KYBER_PROXY_NETWORK], {libraries: {MosaicaLib: mosaicaLibAddress}} );
    await kyberConnector.waitForDeployment();
    return kyberConnector;
}

async function deployPortfolioFactory(mosaicaLibAddress: string): Promise<Contracts.PortfolioFactory> {
    const portfolioFactory = await ethers.deployContract("PortfolioFactory", {libraries: {MosaicaLib: mosaicaLibAddress}} );
    await portfolioFactory.waitForDeployment();
    return portfolioFactory;
}

export async function fundAccountWithToken(spender: string, account: HardhatEthersSigner, token: string, whale: string, amount: bigint) {
    const ercToken = await ethers.getContractAt("IERC20", token);

    await ethers.provider.send("hardhat_impersonateAccount", [whale]); 
    const whaleSigner = await ethers.getSigner(whale);
    
    await ercToken.connect(whaleSigner).transfer(account, amount);
    await ercToken.connect(account).approve(spender, amount);

}

async function main() {
    const mosaicaLib = await deployMosaicaLib();
    const mosaicaLibAddress = await mosaicaLib.getAddress()

    const dexConnectorStorage = await deployDexConnectorStorage();
    const uniswapV2 = await deployUniswapV2LikeConnector(mosaicaLibAddress, "Uniswap V2", addresses.UNISWAP_V2_ROUTER);
    const sushiswap = await deployUniswapV2LikeConnector(mosaicaLibAddress, "Sushiswap V2", addresses.SUSHISWAP_V2_ROUTER);
    const kyber = await deployKyberConnector(mosaicaLibAddress);

    const portfolioFactory = await deployPortfolioFactory(mosaicaLibAddress);

    await dexConnectorStorage.addConnectorContract(await uniswapV2.getAddress());
    await dexConnectorStorage.addConnectorContract(await kyber.getAddress());

    const [owner, portfolioOwner1, portfolioOwner2] = await ethers.getSigners();    
    
    // USER 1 Portfolio
    await portfolioFactory.connect(portfolioOwner1).createPortfolio(
        [{
            srcToken: addresses.ETH,
            dexConnectorAddress: await uniswapV2.getAddress(),
            destToken: addresses.USDC,
            amount: ethers.parseEther("1"),
            slippage: 5
        },{
            srcToken: addresses.ETH,
            dexConnectorAddress: await kyber.getAddress(),
            destToken: addresses.UNI,
            amount: ethers.parseEther("1"),
            slippage: 5
        }],
        {value: ethers.parseEther("3")}
    );

    // USER 2 Portfolio
    await portfolioFactory.connect(portfolioOwner2).createPortfolio([]);
    const portfolios2 = await portfolioFactory.getPortfolios(portfolioOwner2);
    await fundAccountWithToken(portfolios2[0], portfolioOwner2, addresses.WETH, addresses.WETH_WHALE, ethers.parseEther("5"));
    const portfolioContract2: Contracts.Portfolio = await ethers.getContractAt("Portfolio", portfolios2[0]);    
    await portfolioContract2.connect(portfolioOwner2).addAsset(addresses.WETH, ethers.parseEther("2"));
    
    const contractAddresses = {
        dexConnectorStorage: await dexConnectorStorage.getAddress(),
        uniswapV2: await uniswapV2.getAddress(),
        sushiswap: await sushiswap.getAddress(),
        kyber: await kyber.getAddress(),
        portfolioFactory: await portfolioFactory.getAddress()
    };

    fs.writeFileSync(
        'client/src/contract-addresses.json', 
        JSON.stringify(contractAddresses), 
        { flag: 'w' }
    );

    console.log("contractAddresses: ", contractAddresses);
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});