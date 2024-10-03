import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { expect } from "chai";
import { ethers } from "hardhat";
import { DexConnectorStorage } from "../typechain-types/contracts/dex-connector/DexConnectorStorage";

const UNISWAP_V2_ROUTER = "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D";
const SUSHISWAP_V2_ROUTER = "0xd9e1cE17f2641f24aE83637ab66a2cca9C378B9F";
const KYBER_PROXY_NETWORK = "0x9AAb3f75489902f3a48495025729a0AF77d4b11e";

const WETH = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2";
const DAI = "0x6B175474E89094C44Da98b954EedeAC495271d0F";
const PEPE = "0x6982508145454Ce325dDbE47a25d4ec3d2311933";

describe("Price Aggregator", function () {
    const amount = ethers.parseUnits("1", "ether");

    async function deployDexConnectorStorage() {
        const DexConnectorStorage = await ethers.getContractFactory("DexConnectorStorage");
        const dexConnectorStorage = await DexConnectorStorage.deploy();
        await dexConnectorStorage.waitForDeployment();

        return dexConnectorStorage;
    }

    async function addUniswapV2LikeConnectorContract(dexConnectorStorage: DexConnectorStorage, name: string, address: string) {
        const UniswapV2LikeDex = await ethers.getContractFactory("UniswapV2LikeConnector");
        const uniswapV2LikeDex = await UniswapV2LikeDex.deploy(name, address);
        await uniswapV2LikeDex.waitForDeployment();

        await dexConnectorStorage.addConnectorContract(await uniswapV2LikeDex.getAddress());

        return uniswapV2LikeDex;
    }

    async function addKyberConnectorContract(dexConnectorStorage: DexConnectorStorage) {
        const KyberConnectorContract = await ethers.getContractFactory("KyberConnector");
        const kyberConnectorContract = await KyberConnectorContract.deploy(KYBER_PROXY_NETWORK);
        await kyberConnectorContract.waitForDeployment();

        await dexConnectorStorage.addConnectorContract(await kyberConnectorContract.getAddress());

        return kyberConnectorContract;
    }

    async function deployPriceAggregator() {
        const dexConnectorStorage = await deployDexConnectorStorage();
        const dexConnectorStorageAddress = await dexConnectorStorage.getAddress();        
        const PriceAggregator = await ethers.getContractFactory("PriceAggregator");
        const priceAggregator = await PriceAggregator.deploy(dexConnectorStorageAddress);
        await priceAggregator.waitForDeployment();

        return { dexConnectorStorage, priceAggregator }
    }

    async function getPriceFromRouterContract(routerAddress: string, path: string[], amount: bigint) {
        const v2Router02 = await ethers.getContractAt("IUniswapV2Router02", routerAddress);
        const routerPrice = await v2Router02.getAmountsOut(amount, path);
        return routerPrice[routerPrice.length - 1];
    }

    async function getPriceFromKyberNetwork(token1: string, token2: string, amount: bigint) {
        const kyberNetworkProxy = await ethers.getContractAt("IKyberNetworkProxy", KYBER_PROXY_NETWORK);
        return await kyberNetworkProxy.getExpectedRateAfterFee(token1, token2, amount, 25, "0x");
    }

    describe("Get Prices", function () {
        it("Should Get Empty Prices When No Connector Contract Enabled", async function () {
            const { priceAggregator } = await loadFixture(deployPriceAggregator);
            const dexPrices = await priceAggregator.getPrices(DAI, WETH, 1);
            expect(dexPrices.length).equals(0);
        });
        
        it("Should Get Prices Only from Enabled Connector Contract", async function () {
            const { dexConnectorStorage, priceAggregator } = await loadFixture(deployPriceAggregator);
            const uniswapV2 = await addUniswapV2LikeConnectorContract(dexConnectorStorage, "Uniswap V2", UNISWAP_V2_ROUTER);
            await uniswapV2.enableConnector();
            let dexPrices = await priceAggregator.getPrices(WETH, DAI, amount);
            
            expect(dexPrices.length).equals(1);
            expect(dexPrices[0].connectorAddress).equals(await uniswapV2.getAddress());

            const sushiswap = await addUniswapV2LikeConnectorContract(dexConnectorStorage, "Sushiswap", SUSHISWAP_V2_ROUTER);
            await sushiswap.enableConnector();
            dexPrices = await priceAggregator.getPrices(WETH, DAI, amount);
            
            expect(dexPrices.length).equals(2);
            expect(dexPrices[0].connectorAddress).equals(await uniswapV2.getAddress());
            expect(dexPrices[1].connectorAddress).equals(await sushiswap.getAddress());
        });

        it("Should Get Correct Prices For [WETH, DAI] From Uniswap V2", async function () {
            const { dexConnectorStorage, priceAggregator } = await loadFixture(deployPriceAggregator);
            const uniswapV2 = await addUniswapV2LikeConnectorContract(dexConnectorStorage, "Uniswap V2", UNISWAP_V2_ROUTER);
            await uniswapV2.enableConnector();
            const connectorContract = await priceAggregator.getPrices(WETH, DAI, amount);
            const routerPrice = await getPriceFromRouterContract(UNISWAP_V2_ROUTER, [WETH, DAI], amount);
            expect(connectorContract[0].price).equals(routerPrice);
        });

        it("Should Get Correct Prices For [DAI, WETH, PEPE] From Uniswap V2", async function () {
            const { dexConnectorStorage, priceAggregator } = await loadFixture(deployPriceAggregator);
            const uniswapV2 = await addUniswapV2LikeConnectorContract(dexConnectorStorage, "Uniswap V2", UNISWAP_V2_ROUTER);
            await uniswapV2.enableConnector();
            const connectorContract = await priceAggregator.getPrices(DAI, PEPE, amount);
            const routerPrice = await getPriceFromRouterContract(UNISWAP_V2_ROUTER, [DAI, WETH, PEPE], amount);
            expect(connectorContract[0].price).equals(routerPrice);
        });

        it("Should Get '0' Price For Non Existing Path [0, WETH] From Uniswap V2", async function () {
            const { dexConnectorStorage, priceAggregator } = await loadFixture(deployPriceAggregator);
            const uniswapV2 = await addUniswapV2LikeConnectorContract(dexConnectorStorage, "Uniswap V2", UNISWAP_V2_ROUTER);
            await uniswapV2.enableConnector();
            const connectorContract = await priceAggregator.getPrices(ethers.ZeroAddress, WETH, amount);
            expect(connectorContract[0].price).equals(0);
        });

        it("Should Get Correct Prices For [WETH, DAI] From Sushiswap", async function () {
            const { dexConnectorStorage, priceAggregator } = await loadFixture(deployPriceAggregator);
            const sushiswap = await addUniswapV2LikeConnectorContract(dexConnectorStorage, "Sushiswap", SUSHISWAP_V2_ROUTER);
            await sushiswap.enableConnector();
            const connectorContract = await priceAggregator.getPrices(WETH, DAI, amount);
            const routerPrice = await getPriceFromRouterContract(SUSHISWAP_V2_ROUTER, [WETH, DAI], amount);
            expect(connectorContract[0].price).equals(routerPrice);
        });
        
        it("Should Get '0' Price For Non Existing Path [0, WETH] From Sushiswap", async function () {
            const { dexConnectorStorage, priceAggregator } = await loadFixture(deployPriceAggregator);
            const sushiswap = await addUniswapV2LikeConnectorContract(dexConnectorStorage, "Sushiswap", SUSHISWAP_V2_ROUTER);
            await sushiswap.enableConnector();
            const connectorContract = await priceAggregator.getPrices(ethers.ZeroAddress, WETH, amount);
            expect(connectorContract[0].price).equals(0);
        });

        it("Should Get Correct Prices For [WETH, DAI] From Kyber", async function () {
            const { dexConnectorStorage, priceAggregator } = await loadFixture(deployPriceAggregator);
            const kyber = await addKyberConnectorContract(dexConnectorStorage);
            await kyber.enableConnector();
            const connectorContract = await priceAggregator.getPrices(WETH, DAI, amount);
            const kyberPrice = await getPriceFromKyberNetwork(WETH, DAI, amount);
            expect(connectorContract[0].price).equals(kyberPrice);
        });
    });
});