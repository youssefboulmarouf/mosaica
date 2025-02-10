import fs from 'fs';
import { ethers, network } from "hardhat";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import * as Contracts from "../typechain-types";
import * as dotenv from "dotenv";
import { JsonRpcProvider } from 'ethers';

dotenv.config();

const URL = process.env.MAINNET_RPC_URL || "";

const addresses = {
    UNISWAP_V2_ROUTER: "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D",
    SUSHISWAP_V2_ROUTER: "0xd9e1cE17f2641f24aE83637ab66a2cca9C378B9F",
    PANCAKE_V2_ROUTER: "0xEfF92A263d31888d860bD50809A8D171709b7b1c",
    KYBER_PROXY_NETWORK: "0x9AAb3f75489902f3a48495025729a0AF77d4b11e",
    ETH: "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE",
    WETH: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
    DAI: "0x6B175474E89094C44Da98b954EedeAC495271d0F",
    UNI: "0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984",
    USDC: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
    WETH_WHALE: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
    DAI_WHALE: "0x28C6c06298d514Db089934071355E5743bf21d60",
};

async function deployContract<T>(contractName: string, args: any[] = [], libraries: Record<string, string> = {}): Promise<T> {
    const contract = await ethers.deployContract(contractName, args, { libraries });
    await contract.waitForDeployment();
    return contract as T;
}

async function deployContracts() {
    const mosaicaLib = await deployContract<Contracts.MosaicaLib>("MosaicaLib");
    const mosaicaLibAddress = await mosaicaLib.getAddress();

    const dexConnectorStorage = await deployContract<Contracts.DexConnectorStorage>("DexConnectorStorage");

    const connectors = [
        { name: "Uniswap V2", router: addresses.UNISWAP_V2_ROUTER },
        { name: "Sushiswap V2", router: addresses.SUSHISWAP_V2_ROUTER },
        { name: "Pancakeswap V2", router: addresses.PANCAKE_V2_ROUTER },
    ];

    const deployedConnectors = await Promise.all(connectors.map(async ({ name, router }) => {
        const connector = await deployContract<Contracts.UniswapV2LikeConnector>("UniswapV2LikeConnector", [name, router], { MosaicaLib: mosaicaLibAddress } );
        await connector.enableConnector();
        return connector;
    }));

    const kyberConnector = await deployContract<Contracts.KyberConnector>("KyberConnector", [addresses.KYBER_PROXY_NETWORK], { MosaicaLib: mosaicaLibAddress });
    await kyberConnector.enableConnector();

    const portfolioFactory = await deployContract<Contracts.PortfolioFactory>("PortfolioFactory", [], { MosaicaLib: mosaicaLibAddress });

    await Promise.all(deployedConnectors.map(connector => dexConnectorStorage.addConnectorContract(connector.getAddress())));
    await dexConnectorStorage.addConnectorContract(await kyberConnector.getAddress());

    return { dexConnectorStorage, connectors: deployedConnectors, kyberConnector, portfolioFactory };
}

async function fundAccountWithToken(spender: string, account: HardhatEthersSigner, token: string, whale: string, amount: bigint) {
    const ercToken = await ethers.getContractAt("IERC20", token);
    await ethers.provider.send("hardhat_impersonateAccount", [whale]);
    const whaleSigner = await ethers.getSigner(whale);
    await ercToken.connect(whaleSigner).transfer(account, amount);
    await ercToken.connect(account).approve(spender, amount);
}

const createPortfolio = async (portfolioFactory: Contracts.PortfolioFactory, owner: HardhatEthersSigner, swaps: any[], value: bigint) => {
    await portfolioFactory.connect(owner).createPortfolio(swaps, { value });
    const portfolios = await portfolioFactory.getPortfolios(owner);
    return await ethers.getContractAt("Portfolio", portfolios[0]);
};

async function setupPortfolios(portfolioFactory: Contracts.PortfolioFactory, uniSwapV2: Contracts.UniswapV2LikeConnector, kyber: Contracts.KyberConnector) {
    const [owner, portfolioOwner1, portfolioOwner2] = await ethers.getSigners();

    const portfolio1 = await createPortfolio(
        portfolioFactory, 
        portfolioOwner1, 
        [{ 
            srcToken: addresses.ETH, 
            dexConnectorAddress: await uniSwapV2.getAddress(), 
            destToken: addresses.USDC, 
            amount: ethers.parseEther("1"), 
            slippage: 5 
        }, { 
            srcToken: addresses.ETH, 
            dexConnectorAddress: await kyber.getAddress(), 
            destToken: addresses.UNI, 
            amount: ethers.parseEther("1"), 
            slippage: 5 
        }], 
        ethers.parseEther("2")
    );

    await increaseTime(5);
    await fundAccountWithToken(await portfolio1.getAddress(), portfolioOwner1, addresses.WETH, addresses.WETH_WHALE, ethers.parseEther("5"));
    await portfolio1.connect(portfolioOwner1).addAsset(addresses.WETH, ethers.parseEther("2"));
    await increaseTime(5);
    await portfolio1.connect(portfolioOwner1).addAsset(addresses.ETH, ethers.parseEther("2"), { value: ethers.parseEther("2") });
    await increaseTime(5);
    await portfolio1.connect(portfolioOwner1).buyAssets(
        [{ 
            srcToken: addresses.ETH, 
            dexConnectorAddress: await uniSwapV2.getAddress(), 
            destToken: addresses.DAI, 
            amount: ethers.parseEther("1"), 
            slippage: 5 
        }, { 
            srcToken: addresses.ETH, 
            dexConnectorAddress: await kyber.getAddress(), 
            destToken: addresses.UNI, 
            amount: ethers.parseEther("1"), 
            slippage: 5 
        }], 
        { value: ethers.parseEther("2") }
    );

    const portfolio2 = await createPortfolio(portfolioFactory, portfolioOwner2, [], 0n);
    await fundAccountWithToken(await portfolio2.getAddress(), portfolioOwner2, addresses.WETH, addresses.WETH_WHALE, ethers.parseEther("5"));
    await portfolio2.connect(portfolioOwner2).addAsset(addresses.WETH, ethers.parseEther("2"));
}

async function mineBlocks(batchSize: number, blocksToMine: number) {
    for (let i = 0; i < blocksToMine; i += batchSize) {
        await Promise.all(Array(Math.min(batchSize, blocksToMine - i)).fill(null).map(() => network.provider.send("evm_mine")));
        console.log(`🔄 Mined ${Math.min(i + batchSize, blocksToMine)}/${blocksToMine} blocks`);
    }
}

async function increaseTime(days: number) {
    const averageBlocksPerDay = 7200;
    const batchSize = 1000;
    const blocksToMine = days * averageBlocksPerDay;
    const timeToIncrease = days * 86400; // 86400 seconds in a day

    await ethers.provider.send("evm_increaseTime", [timeToIncrease]);
    await mineBlocks(batchSize, blocksToMine);
}

async function resetEVMTime() {
    const currentTimestamp = Math.floor(Date.now() / 1000); // Current real-world time in seconds

    // Set the timestamp for the next block
    await ethers.provider.send("evm_setNextBlockTimestamp", [currentTimestamp]);

    // Mine a new block to apply the timestamp
    await ethers.provider.send("evm_mine", []);

    console.log(`🕒 Reset EVM time to current timestamp: ${currentTimestamp}`);
}

async function main() {
    if (!URL) throw new Error("Missing MAINNET_RPC_URL in .env file");

    const { dexConnectorStorage, connectors, kyberConnector, portfolioFactory } = await deployContracts();
    await setupPortfolios(portfolioFactory, connectors[0], kyberConnector);

    const latestBlock = await new JsonRpcProvider(URL).getBlockNumber();
    const currentBlock = await ethers.provider.getBlockNumber();
    await mineBlocks(1000, latestBlock - currentBlock);

    await resetEVMTime();

    
    const contractAddresses = {
        dexConnectorStorage: await dexConnectorStorage.getAddress(),
        uniswapV2: await connectors[0].getAddress(),
        sushiswap: await connectors[1].getAddress(),
        pancakeswap: await connectors[2].getAddress(),
        kyber: await kyberConnector.getAddress(),
        portfolioFactory: await portfolioFactory.getAddress()
    };

    fs.writeFileSync('client/src/data/contract-addresses.json', JSON.stringify(contractAddresses), { flag: 'w' });
    console.log("contractAddresses: ", contractAddresses);
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});