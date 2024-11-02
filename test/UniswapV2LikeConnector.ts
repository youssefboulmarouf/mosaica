import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { expect } from "chai";
import { ethers } from "hardhat";

const UNISWAP_V2_ROUTER = "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D";

const ETH = ethers.getAddress("0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE");
const WETH = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2";
const DAI = "0x6B175474E89094C44Da98b954EedeAC495271d0F";
const UNI = "0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984";
const DAI_WHALE = "0x28C6c06298d514Db089934071355E5743bf21d60";

const amount = ethers.parseEther("1");

describe("Uniswap V2 Like Connector", function () {

    async function deployMosaicaLib() {    
        const MosaicaLib = await ethers.getContractFactory("MosaicaLib");
        const mosaicaLib = await MosaicaLib.deploy();
        await mosaicaLib.waitForDeployment();

        return mosaicaLib;
    }

    async function deployUniswapV2LikeConnector() {
        const mosaicaLib = await deployMosaicaLib();

        const UniswapV2LikeConnector = await ethers.getContractFactory("UniswapV2LikeConnector", {libraries: {MosaicaLib: await mosaicaLib.getAddress()}});
        const uniswapV2LikeConnector = await UniswapV2LikeConnector.deploy("Uniswap V2", UNISWAP_V2_ROUTER);
        await uniswapV2LikeConnector.waitForDeployment();

        return uniswapV2LikeConnector;
    }

    async function getPriceFromUniswapV2(token1: string, token2: string, amount: bigint) {
        const uniswapV2Router02 = await ethers.getContractAt("IUniswapV2Router02", UNISWAP_V2_ROUTER);
        const routerPrice = await uniswapV2Router02.getAmountsOut(amount, [token1, token2]);
        return routerPrice[routerPrice.length - 1];
    }

    describe("Get Prices", function () {
        it("Should Get Prices For Tokens", async function () {
            const uniswapV2LikeConnector = await loadFixture(deployUniswapV2LikeConnector);
            const price = await uniswapV2LikeConnector.getPrice(DAI, UNI, amount);
            const routerPrice = await getPriceFromUniswapV2(DAI, UNI, amount);
            expect(price).equals(routerPrice);
        });

        it("Should Get Prices For Token When Source Is ETH", async function () {
            const uniswapV2LikeConnector = await loadFixture(deployUniswapV2LikeConnector);
            const price = await uniswapV2LikeConnector.getPrice(ETH, UNI, amount);
            // Using WETH address here instead of ETH placeholder address since it;s not recognized by uniswap
            const routerPrice = await getPriceFromUniswapV2(WETH, UNI, amount);
            expect(price).equals(routerPrice);
        });

        it("Should Get Prices For ETH When Destination Is Token", async function () {
            const uniswapV2LikeConnector = await loadFixture(deployUniswapV2LikeConnector);
            const price = await uniswapV2LikeConnector.getPrice(UNI, ETH, amount);
            // Using WETH address here instead of ETH placeholder address since it;s not recognized by uniswap
            const routerPrice = await getPriceFromUniswapV2(UNI, WETH, amount);
            expect(price).equals(routerPrice);
        });

        it("Should Not Get Prices When Identical Tokens", async function () {
            const uniswapV2LikeConnector = await loadFixture(deployUniswapV2LikeConnector);
            await expect(uniswapV2LikeConnector.getPrice(DAI, DAI, amount))
                .revertedWithCustomError(uniswapV2LikeConnector, "IdenticalTokens");
        });
    });

    describe("Swap Tokens", function () {
        async function fundAccountWithToken(connectorAddress: string, token: string, whale: string, amount: bigint) {
            const ercToken = await ethers.getContractAt("IERC20", token);
            const [ account ] = await ethers.getSigners();

            await ethers.provider.send("hardhat_impersonateAccount", [whale]); 
            const whaleSigner = await ethers.getSigner(whale);
            
            await ercToken.connect(whaleSigner).transfer(account, amount);
            await ercToken.connect(account).approve(connectorAddress, amount);

            return account;
        }

        it("Should Swap Tokens For Tokens", async function () {            
            const uniswapV2LikeConnector = await loadFixture(deployUniswapV2LikeConnector);
            const account = await fundAccountWithToken(await uniswapV2LikeConnector.getAddress(), DAI, DAI_WHALE, amount);

            const daiToken = await ethers.getContractAt("IERC20", DAI);
            const uniToken = await ethers.getContractAt("IERC20", UNI);
            
            const daiBalanceBefore = await daiToken.balanceOf(account);
            const uniBalanceBefore = await uniToken.balanceOf(account);

            await uniswapV2LikeConnector.connect(account).swapTokens(DAI, UNI, account.address, amount, 5);
        
            const daiBalanceAfter = await daiToken.balanceOf(account);
            const uniBalanceAfter = await uniToken.balanceOf(account);

            expect(daiBalanceBefore).greaterThan(daiBalanceAfter);
            expect(uniBalanceAfter).greaterThan(uniBalanceBefore);
        });

        it("Should Swap Eth For Tokens", async function () {            
            const uniswapV2LikeConnector = await loadFixture(deployUniswapV2LikeConnector);
            const [ account ] = await ethers.getSigners();

            const daiToken = await ethers.getContractAt("IERC20", DAI);
            
            const daiBalanceBefore = await daiToken.balanceOf(account);
            const ethBalanceBefore = await ethers.provider.getBalance(account);

            await uniswapV2LikeConnector.connect(account).swapTokens(ETH, DAI, account.address, amount, 5, {value: amount});
        
            const daiBalanceAfter = await daiToken.balanceOf(account);
            const ethBalanceAfter = await ethers.provider.getBalance(account);

            expect(daiBalanceAfter).greaterThan(daiBalanceBefore);
            expect(ethBalanceBefore).greaterThan(ethBalanceAfter);
        });

        it("Should Swap Token For Eth", async function () {            
            const uniswapV2LikeConnector = await loadFixture(deployUniswapV2LikeConnector);
            const account = await fundAccountWithToken(await uniswapV2LikeConnector.getAddress(), DAI, DAI_WHALE, amount);

            const daiToken = await ethers.getContractAt("IERC20", DAI);
            
            const daiBalanceBefore = await daiToken.balanceOf(account);
            const ethBalanceBefore = await ethers.provider.getBalance(account);

            await uniswapV2LikeConnector.connect(account).swapTokens(DAI, ETH, account.address, amount, 5);
        
            const daiBalanceAfter = await daiToken.balanceOf(account);
            const ethBalanceAfter = await ethers.provider.getBalance(account);

            expect(daiBalanceBefore).greaterThan(daiBalanceAfter);
            expect(ethBalanceAfter).greaterThan(ethBalanceBefore);
        });

        it("Should Not Swap Tokens When Identical Tokens", async function () {
            const uniswapV2LikeConnector = await loadFixture(deployUniswapV2LikeConnector);
            const [ account ] = await ethers.getSigners();
            await expect(uniswapV2LikeConnector.connect(account).swapTokens(DAI, DAI, account.address, amount, 5))
                .revertedWithCustomError(uniswapV2LikeConnector, "IdenticalTokens");
        });

        it("Should Not Swap Eth For Tokens With Different Value And Amount", async function () {
            const uniswapV2LikeConnector = await loadFixture(deployUniswapV2LikeConnector);
            const [ account ] = await ethers.getSigners();
            await expect(uniswapV2LikeConnector.connect(account).swapTokens(ETH, DAI, account.address, 1, 5, {value: amount}))
                .revertedWithCustomError(uniswapV2LikeConnector, "ReceivedDifferentEthValueAndAmount");
        });

        it("Should Not Swap Eth For Tokens With Zero Value", async function () {
            const uniswapV2LikeConnector = await loadFixture(deployUniswapV2LikeConnector);
            const [ account ] = await ethers.getSigners();
            await expect(uniswapV2LikeConnector.connect(account).swapTokens(ETH, DAI, account.address, 0, 5, {value: 0}))
                .revertedWithCustomError(uniswapV2LikeConnector, "MissingEthValue");
        });
    }); 
});