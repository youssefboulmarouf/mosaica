import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { expect } from "chai";
import { ethers } from "hardhat";
import * as testUtils from "./TestUtils";

const amount = ethers.parseEther("10");

describe("Kyber Connector", function () {
    async function getPriceFromKyber(token1: string, token2: string, amount: bigint) {
        const kyberNetworkProxy = await ethers.getContractAt("IKyberNetworkProxy", testUtils.addresses.KYBER_PROXY_NETWORK);
        const kyberPrice = await kyberNetworkProxy.getExpectedRate(token1, token2, amount);
        return kyberPrice[0];
    }

    describe("Get Prices", function () {
        it("Should Get Prices For Tokens", async function () {
            const kyberConnector = await loadFixture(testUtils.deployKyberConnector);
            const price = await kyberConnector.getPrice(testUtils.addresses.DAI, testUtils.addresses.UNI, amount);
            const kyberPrice = await getPriceFromKyber(testUtils.addresses.DAI, testUtils.addresses.UNI, amount);
            expect(price).equals(kyberPrice);
        });

        it("Should Get Prices For Token When Source Is ETH", async function () {
            const kyberConnector = await loadFixture(testUtils.deployKyberConnector);
            const price = await kyberConnector.getPrice(testUtils.addresses.ETH, testUtils.addresses.UNI, amount);
            const routerPrice = await getPriceFromKyber(testUtils.addresses.ETH, testUtils.addresses.UNI, amount);
            expect(price).equals(routerPrice);
        });

        it("Should Get Prices For ETH When Destination Is Token", async function () {
            const kyberConnector = await loadFixture(testUtils.deployKyberConnector);
            const price = await kyberConnector.getPrice(testUtils.addresses.UNI, testUtils.addresses.ETH, amount);
            const routerPrice = await getPriceFromKyber(testUtils.addresses.UNI, testUtils.addresses.ETH, amount);
            expect(price).equals(routerPrice);
        });

        it("Should Not Get Prices When Identical Tokens", async function () {
            const kyberConnector = await loadFixture(testUtils.deployKyberConnector);
            await expect(kyberConnector.getPrice(testUtils.addresses.DAI, testUtils.addresses.DAI, amount))
                .revertedWithCustomError(kyberConnector, "IdenticalTokens");
        });
    });

    describe("Swap Tokens", function () {
        it("Should Swap Tokens For Tokens", async function () {            
            const kyberConnector = await loadFixture(testUtils.deployKyberConnector);
            const [ account ] = await ethers.getSigners();
            await testUtils.fundAccountWithToken(await kyberConnector.getAddress(), account, testUtils.addresses.DAI, testUtils.addresses.DAI_WHALE, amount);

            const daiBalanceBefore = await testUtils.getErc20Balance(testUtils.addresses.DAI, account.address);
            const uniBalanceBefore = await testUtils.getErc20Balance(testUtils.addresses.UNI, account.address);;

            await kyberConnector.connect(account).swapTokens(testUtils.addresses.DAI, testUtils.addresses.UNI, account.address, amount, 5);
        
            const daiBalanceAfter = await testUtils.getErc20Balance(testUtils.addresses.DAI, account.address);
            const uniBalanceAfter = await testUtils.getErc20Balance(testUtils.addresses.UNI, account.address);;

            expect(daiBalanceBefore).greaterThan(daiBalanceAfter);
            expect(uniBalanceAfter).greaterThan(uniBalanceBefore);
        });

        it("Should Swap Eth For Tokens", async function () {            
            const kyberConnector = await loadFixture(testUtils.deployKyberConnector);
            const [ account ] = await ethers.getSigners();
            
            const daiBalanceBefore = await testUtils.getErc20Balance(testUtils.addresses.DAI, account.address);
            const ethBalanceBefore = await ethers.provider.getBalance(account);

            await kyberConnector.connect(account).swapTokens(testUtils.addresses.ETH, testUtils.addresses.DAI, account.address, amount, 5, {value: amount});
        
            const daiBalanceAfter = await testUtils.getErc20Balance(testUtils.addresses.DAI, account.address);
            const ethBalanceAfter = await ethers.provider.getBalance(account);

            expect(daiBalanceAfter).greaterThan(daiBalanceBefore);
            expect(ethBalanceBefore).greaterThan(ethBalanceAfter);
        });

        it("Should Swap Token For Eth", async function () {            
            const kyberConnector = await loadFixture(testUtils.deployKyberConnector);
            const [ account ] = await ethers.getSigners();
            await testUtils.fundAccountWithToken(await kyberConnector.getAddress(), account, testUtils.addresses.DAI, testUtils.addresses.DAI_WHALE, amount);
            
            const daiBalanceBefore = await testUtils.getErc20Balance(testUtils.addresses.DAI, account.address);
            const ethBalanceBefore = await ethers.provider.getBalance(account);

            await kyberConnector.connect(account).swapTokens(testUtils.addresses.DAI, testUtils.addresses.ETH, account, amount, 5);
        
            const daiBalanceAfter = await testUtils.getErc20Balance(testUtils.addresses.DAI, account.address);
            const ethBalanceAfter = await ethers.provider.getBalance(account);

            expect(daiBalanceBefore).greaterThan(daiBalanceAfter);
            expect(ethBalanceAfter).greaterThan(ethBalanceBefore);
        });

        it("Should Not Swap Tokens When Identical Tokens", async function () {
            const kyberConnector = await loadFixture(testUtils.deployKyberConnector);
            const [ account ] = await ethers.getSigners();
            await expect(kyberConnector.connect(account).swapTokens(testUtils.addresses.DAI, testUtils.addresses.DAI, account.address, amount, 5))
                .revertedWithCustomError(kyberConnector, "IdenticalTokens");
        });

        it("Should Not Swap Eth For Tokens With Different Value And Amount", async function () {
            const kyberConnector = await loadFixture(testUtils.deployKyberConnector);
            const [ account ] = await ethers.getSigners();
            await expect(kyberConnector.connect(account).swapTokens(testUtils.addresses.ETH, testUtils.addresses.DAI, account.address, 1, 5, {value: amount}))
                .revertedWithCustomError(kyberConnector, "ReceivedDifferentEthValueAndAmount");
        });

        it("Should Not Swap Eth For Tokens With Zero Value", async function () {
            const kyberConnector = await loadFixture(testUtils.deployKyberConnector);
            const [ account ] = await ethers.getSigners();
            await expect(kyberConnector.connect(account).swapTokens(testUtils.addresses.ETH, testUtils.addresses.DAI, account.address, 0, 5, {value: 0}))
                .revertedWithCustomError(kyberConnector, "MissingEthValue");
        });
    });
});