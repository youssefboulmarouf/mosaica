import fs from 'fs';
import { ethers } from "hardhat";
import * as Contracts from "../typechain-types";

const addresses = {
    UNISWAP_V2_ROUTER: "0xeE567Fe1712Faf6149d80dA1E6934E354124CfE3",
    SUSHISWAP_V2_ROUTER: "0xeaBcE3E74EF41FB40024a21Cc2ee2F5dDc615791"
};

async function deployContract<T>(contractName: string, args: any[] = [], libraries: Record<string, string> = {}): Promise<T> {
    console.log("Deploy Contract: ", contractName);

    const signer = (await ethers.getSigners())[0];
    const nonce = await signer.getNonce();

    const feeData = await ethers.provider.getFeeData();
    const gasPrice = feeData.gasPrice ? feeData.gasPrice * BigInt(2) : undefined;
    
    const contract = await ethers.deployContract(contractName, args, { libraries, nonce: nonce, gasPrice: gasPrice});
    await contract.waitForDeployment();
    
    console.log(contractName, " Contract Address: ", await contract.getAddress());

    return contract as T;
}

async function deployContracts() {
    console.log("Deploy Contracts...");

    const mosaicaLib = await deployContract<Contracts.MosaicaLib>("MosaicaLib");
    const mosaicaLibAddress = await mosaicaLib.getAddress();
    const dexConnectorStorage = await deployContract<Contracts.DexConnectorStorage>("DexConnectorStorage");
    
    console.log("Deploying uniswap: ");
    const uniswapV2 = await deployContract<Contracts.UniswapV2LikeConnector>("UniswapV2LikeConnector", ["Uniswap V2", addresses.UNISWAP_V2_ROUTER], { MosaicaLib: mosaicaLibAddress } )
    await uniswapV2.enableConnector();
    await dexConnectorStorage.addConnectorContract(await uniswapV2.getAddress());

    console.log("Deploying sushiswap: ");
    const sushiswap = await deployContract<Contracts.UniswapV2LikeConnector>("UniswapV2LikeConnector", ["Sushiswap V2", addresses.SUSHISWAP_V2_ROUTER], { MosaicaLib: mosaicaLibAddress } )
    await sushiswap.enableConnector();
    await dexConnectorStorage.addConnectorContract(await sushiswap.getAddress());

    const portfolioFactory = await deployContract<Contracts.PortfolioFactory>("PortfolioFactory", [], { MosaicaLib: mosaicaLibAddress });

    return { dexConnectorStorage, uniswapV2, sushiswap, portfolioFactory };
}

async function main() {
    const { dexConnectorStorage, uniswapV2, sushiswap, portfolioFactory } = await deployContracts();
    
    const contractAddresses = {
        dexConnectorStorage: await dexConnectorStorage.getAddress(),
        uniswapV2: await uniswapV2.getAddress(),
        sushiswap: await sushiswap.getAddress(),
        portfolioFactory: await portfolioFactory.getAddress()
    };

    fs.writeFileSync('client/src/data/contract-addresses-sepolia.json', JSON.stringify(contractAddresses), { flag: 'w' });
    console.log("contractAddresses: ", contractAddresses);
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});