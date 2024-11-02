import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { expect } from "chai";
import { ethers } from "hardhat";

const KYBER_PROXY_NETWORK = "0x9AAb3f75489902f3a48495025729a0AF77d4b11e";
const ETH = ethers.getAddress("0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE");
const DAI = "0x6B175474E89094C44Da98b954EedeAC495271d0F";
const UNI = "0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984";
const DAI_WHALE = "0x28C6c06298d514Db089934071355E5743bf21d60";

const amount = ethers.parseEther("10");

describe("Kyber Connector", function () {
    async function deployMosaicaLib() {    
        const MosaicaLib = await ethers.getContractFactory("MosaicaLib");
        const mosaicaLib = await MosaicaLib.deploy();
        await mosaicaLib.waitForDeployment();

        return mosaicaLib;
    }

    async function deployKyberConnector() {
        const mosaicaLib = await deployMosaicaLib();

        const KyberConnector = await ethers.getContractFactory("KyberConnector", {libraries: {MosaicaLib: await mosaicaLib.getAddress()}});
        const kyberConnector = await KyberConnector.deploy(KYBER_PROXY_NETWORK);
        await kyberConnector.waitForDeployment();

        return kyberConnector;
    }

    async function getPriceFromKyber(token1: string, token2: string, amount: bigint) {
        const kyberNetworkProxy = await ethers.getContractAt("IKyberNetworkProxy", KYBER_PROXY_NETWORK);
        const kyberPrice = await kyberNetworkProxy.getExpectedRate(token1, token2, amount);
        return kyberPrice[0];
    }

    describe("Get Prices", function () {
        it("Should Get Prices For Tokens", async function () {
            const kyberConnector = await loadFixture(deployKyberConnector);
            const price = await kyberConnector.getPrice(DAI, UNI, amount);
            const kyberPrice = await getPriceFromKyber(DAI, UNI, amount);
            expect(price).equals(kyberPrice);
        });

        it("Should Get Prices For Token When Source Is ETH", async function () {
            const kyberConnector = await loadFixture(deployKyberConnector);
            const price = await kyberConnector.getPrice(ETH, UNI, amount);
            const routerPrice = await getPriceFromKyber(ETH, UNI, amount);
            expect(price).equals(routerPrice);
        });

        it("Should Get Prices For ETH When Destination Is Token", async function () {
            const kyberConnector = await loadFixture(deployKyberConnector);
            const price = await kyberConnector.getPrice(UNI, ETH, amount);
            const routerPrice = await getPriceFromKyber(UNI, ETH, amount);
            expect(price).equals(routerPrice);
        });

        it("Should Not Get Prices When Identical Tokens", async function () {
            const kyberConnector = await loadFixture(deployKyberConnector);
            await expect(kyberConnector.getPrice(DAI, DAI, amount))
                .revertedWithCustomError(kyberConnector, "IdenticalTokens");
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
            const kyberConnector = await loadFixture(deployKyberConnector);
            const account = await fundAccountWithToken(await kyberConnector.getAddress(), DAI, DAI_WHALE, amount);

            const daiToken = await ethers.getContractAt("IERC20", DAI);
            const uniToken = await ethers.getContractAt("IERC20", UNI);
            
            const daiBalanceBefore = await daiToken.balanceOf(account);
            const uniBalanceBefore = await uniToken.balanceOf(account);

            await kyberConnector.connect(account).swapTokens(DAI, UNI, account.address, amount, 5);
        
            const daiBalanceAfter = await daiToken.balanceOf(account);
            const uniBalanceAfter = await uniToken.balanceOf(account);

            expect(daiBalanceBefore).greaterThan(daiBalanceAfter);
            expect(uniBalanceAfter).greaterThan(uniBalanceBefore);
        });

        it("Should Swap Eth For Tokens", async function () {            
            const kyberConnector = await loadFixture(deployKyberConnector);
            const [ account ] = await ethers.getSigners();

            const daiToken = await ethers.getContractAt("IERC20", DAI);
            
            const daiBalanceBefore = await daiToken.balanceOf(account);
            const ethBalanceBefore = await ethers.provider.getBalance(account);

            await kyberConnector.connect(account).swapTokens(ETH, DAI, account.address, amount, 5, {value: amount});
        
            const daiBalanceAfter = await daiToken.balanceOf(account);
            const ethBalanceAfter = await ethers.provider.getBalance(account);

            expect(daiBalanceAfter).greaterThan(daiBalanceBefore);
            expect(ethBalanceBefore).greaterThan(ethBalanceAfter);
        });

        it("Should Swap Token For Eth", async function () {            
            const kyberConnector = await loadFixture(deployKyberConnector);
            const account = await fundAccountWithToken(await kyberConnector.getAddress(), DAI, DAI_WHALE, amount);

            const daiToken = await ethers.getContractAt("IERC20", DAI);
            
            const daiBalanceBefore = await daiToken.balanceOf(account);
            const ethBalanceBefore = await ethers.provider.getBalance(account);

            await kyberConnector.connect(account).swapTokens(DAI, ETH, account, amount, 5);
        
            const daiBalanceAfter = await daiToken.balanceOf(account);
            const ethBalanceAfter = await ethers.provider.getBalance(account);

            expect(daiBalanceBefore).greaterThan(daiBalanceAfter);
            expect(ethBalanceAfter).greaterThan(ethBalanceBefore);
        });

        it("Should Not Swap Tokens When Identical Tokens", async function () {
            const kyberConnector = await loadFixture(deployKyberConnector);
            const [ account ] = await ethers.getSigners();
            await expect(kyberConnector.connect(account).swapTokens(DAI, DAI, account.address, amount, 5))
                .revertedWithCustomError(kyberConnector, "IdenticalTokens");
        });

        it("Should Not Swap Eth For Tokens With Different Value And Amount", async function () {
            const kyberConnector = await loadFixture(deployKyberConnector);
            const [ account ] = await ethers.getSigners();
            await expect(kyberConnector.connect(account).swapTokens(ETH, DAI, account.address, 1, 5, {value: amount}))
                .revertedWithCustomError(kyberConnector, "ReceivedDifferentEthValueAndAmount");
        });

        it("Should Not Swap Eth For Tokens With Zero Value", async function () {
            const kyberConnector = await loadFixture(deployKyberConnector);
            const [ account ] = await ethers.getSigners();
            await expect(kyberConnector.connect(account).swapTokens(ETH, DAI, account.address, 0, 5, {value: 0}))
                .revertedWithCustomError(kyberConnector, "MissingEthValue");
        });
    });
});