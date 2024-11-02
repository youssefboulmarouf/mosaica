import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { expect } from "chai";
import { ethers } from "hardhat";
import * as testUtils from "./TestUtils";

const amount = ethers.parseEther("10");

describe("Uniswap V2 Like Connector", function () {
    async function deployUniswapV2LikeConnector() {
        return await testUtils.deployUniswapV2LikeConnectorContract("Uniswap V2", testUtils.addresses.UNISWAP_V2_ROUTER);
    }

    async function getPriceFromUniswapV2(token1: string, token2: string, amount: bigint) {
        const uniswapV2Router02 = await ethers.getContractAt("IUniswapV2Router02", testUtils.addresses.UNISWAP_V2_ROUTER);
        const routerPrice = await uniswapV2Router02.getAmountsOut(amount, [token1, token2]);
        return routerPrice[routerPrice.length - 1];
    }

    describe("Get Prices", function () {
        it("Should Get Prices For Tokens", async function () {
            const uniswapV2LikeConnector = await loadFixture(deployUniswapV2LikeConnector);
            const price = await uniswapV2LikeConnector.getPrice(testUtils.addresses.DAI, testUtils.addresses.UNI, amount);
            const routerPrice = await getPriceFromUniswapV2(testUtils.addresses.DAI, testUtils.addresses.UNI, amount);
            expect(price).equals(routerPrice);
        });

        it("Should Get Prices For Token When Source Is ETH", async function () {
            const uniswapV2LikeConnector = await loadFixture(deployUniswapV2LikeConnector);
            const price = await uniswapV2LikeConnector.getPrice(testUtils.addresses.ETH, testUtils.addresses.UNI, amount);
            // Using WETH address here instead of ETH placeholder address since it;s not recognized by uniswap
            const routerPrice = await getPriceFromUniswapV2(testUtils.addresses.WETH, testUtils.addresses.UNI, amount);
            expect(price).equals(routerPrice);
        });

        it("Should Get Prices For ETH When Destination Is Token", async function () {
            const uniswapV2LikeConnector = await loadFixture(deployUniswapV2LikeConnector);
            const price = await uniswapV2LikeConnector.getPrice(testUtils.addresses.UNI, testUtils.addresses.ETH, amount);
            // Using WETH address here instead of ETH placeholder address since it;s not recognized by uniswap
            const routerPrice = await getPriceFromUniswapV2(testUtils.addresses.UNI, testUtils.addresses.WETH, amount);
            expect(price).equals(routerPrice);
        });

        it("Should Not Get Prices When Identical Tokens", async function () {
            const uniswapV2LikeConnector = await loadFixture(deployUniswapV2LikeConnector);
            await expect(uniswapV2LikeConnector.getPrice(testUtils.addresses.DAI, testUtils.addresses.DAI, amount))
                .revertedWithCustomError(uniswapV2LikeConnector, "IdenticalTokens");
        });
    });

    describe("Swap Tokens", function () {
        it("Should Swap Tokens For Tokens", async function () {            
            const uniswapV2LikeConnector = await loadFixture(deployUniswapV2LikeConnector);
            const [ account ] = await ethers.getSigners();
            await testUtils.fundAccountWithToken(await uniswapV2LikeConnector.getAddress(), account, testUtils.addresses.DAI, testUtils.addresses.DAI_WHALE, amount);

            const daiBalanceBefore = await testUtils.getErc20Balance(testUtils.addresses.DAI, account.address);
            const uniBalanceBefore = await testUtils.getErc20Balance(testUtils.addresses.UNI, account.address);

            await uniswapV2LikeConnector.connect(account).swapTokens(testUtils.addresses.DAI, testUtils.addresses.UNI, account.address, amount, 5);
        
            const daiBalanceAfter = await testUtils.getErc20Balance(testUtils.addresses.DAI, account.address);
            const uniBalanceAfter = await testUtils.getErc20Balance(testUtils.addresses.UNI, account.address);

            expect(daiBalanceBefore).greaterThan(daiBalanceAfter);
            expect(uniBalanceAfter).greaterThan(uniBalanceBefore);
        });

        it("Should Swap Eth For Tokens", async function () {            
            const uniswapV2LikeConnector = await loadFixture(deployUniswapV2LikeConnector);
            const [ account ] = await ethers.getSigners();
            
            const daiBalanceBefore = await testUtils.getErc20Balance(testUtils.addresses.DAI, account.address);
            const ethBalanceBefore = await ethers.provider.getBalance(account);

            await uniswapV2LikeConnector.connect(account).swapTokens(testUtils.addresses.ETH, testUtils.addresses.DAI, account.address, amount, 5, {value: amount});
        
            const daiBalanceAfter = await testUtils.getErc20Balance(testUtils.addresses.DAI, account.address);
            const ethBalanceAfter = await ethers.provider.getBalance(account);

            expect(daiBalanceAfter).greaterThan(daiBalanceBefore);
            expect(ethBalanceBefore).greaterThan(ethBalanceAfter);
        });

        it("Should Swap Token For Eth", async function () {            
            const uniswapV2LikeConnector = await loadFixture(deployUniswapV2LikeConnector);
            const [ account ] = await ethers.getSigners();
            await testUtils.fundAccountWithToken(await uniswapV2LikeConnector.getAddress(), account, testUtils.addresses.DAI, testUtils.addresses.DAI_WHALE, amount);
            
            const daiBalanceBefore = await testUtils.getErc20Balance(testUtils.addresses.DAI, account.address);
            const ethBalanceBefore = await ethers.provider.getBalance(account);

            await uniswapV2LikeConnector.connect(account).swapTokens(testUtils.addresses.DAI, testUtils.addresses.ETH, account.address, amount, 5);
        
            const daiBalanceAfter = await testUtils.getErc20Balance(testUtils.addresses.DAI, account.address);
            const ethBalanceAfter = await ethers.provider.getBalance(account);

            expect(daiBalanceBefore).greaterThan(daiBalanceAfter);
            expect(ethBalanceAfter).greaterThan(ethBalanceBefore);
        });

        it("Should Not Swap Tokens When Identical Tokens", async function () {
            const uniswapV2LikeConnector = await loadFixture(deployUniswapV2LikeConnector);
            const [ account ] = await ethers.getSigners();
            await expect(uniswapV2LikeConnector.connect(account).swapTokens(testUtils.addresses.DAI, testUtils.addresses.DAI, account.address, amount, 5))
                .revertedWithCustomError(uniswapV2LikeConnector, "IdenticalTokens");
        });

        it("Should Not Swap Eth For Tokens With Different Value And Amount", async function () {
            const uniswapV2LikeConnector = await loadFixture(deployUniswapV2LikeConnector);
            const [ account ] = await ethers.getSigners();
            await expect(uniswapV2LikeConnector.connect(account).swapTokens(testUtils.addresses.ETH, testUtils.addresses.DAI, account.address, 1, 5, {value: amount}))
                .revertedWithCustomError(uniswapV2LikeConnector, "ReceivedDifferentEthValueAndAmount");
        });

        it("Should Not Swap Eth For Tokens With Zero Value", async function () {
            const uniswapV2LikeConnector = await loadFixture(deployUniswapV2LikeConnector);
            const [ account ] = await ethers.getSigners();
            await expect(uniswapV2LikeConnector.connect(account).swapTokens(testUtils.addresses.ETH, testUtils.addresses.DAI, account.address, 0, 5, {value: 0}))
                .revertedWithCustomError(uniswapV2LikeConnector, "MissingEthValue");
        });
    }); 
});