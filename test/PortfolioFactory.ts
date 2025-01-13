import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { expect } from "chai";
import { ethers } from "hardhat";
import * as testUtils from "./TestUtils";

describe("Portfolio Factory", function () {
    describe("Create Portfolio", function () {
        it("Should Create Portfolio With Assets", async function () {
            const [ owner ] = await ethers.getSigners();
            const portfolioFactory = await loadFixture(testUtils.deployPortfolioFactory);
            const uniswapConnectorAddress = await testUtils.getUniswapConnectorAddress();

            const params = [
                {
                    srcToken: testUtils.addresses.ETH,
                    dexConnectorAddress: uniswapConnectorAddress,
                    destToken: testUtils.addresses.DAI,
                    amount: ethers.parseEther("0.5"),
                    slippage: 5
                },
                {
                    srcToken: testUtils.addresses.WETH,
                    dexConnectorAddress: uniswapConnectorAddress,
                    destToken: testUtils.addresses.UNI,
                    amount: ethers.parseEther("2"),
                    slippage: 5
                },
                {
                    srcToken: testUtils.addresses.ETH,
                    dexConnectorAddress: uniswapConnectorAddress,
                    destToken: testUtils.addresses.USDC,
                    amount: ethers.parseEther("1"),
                    slippage: 5
                },
                {
                    srcToken: testUtils.addresses.WETH,
                    dexConnectorAddress: uniswapConnectorAddress,
                    destToken: testUtils.addresses.USDC,
                    amount: ethers.parseEther("2"),
                    slippage: 5
                }
            ]

            await testUtils.fundAccountWithToken(await portfolioFactory.getAddress(), owner, testUtils.addresses.WETH, testUtils.addresses.WETH_WHALE, ethers.parseEther("4"));
            await portfolioFactory.createPortfolio(params, {value: ethers.parseEther("1.5")});

            const porfolios = await portfolioFactory.getPortfolios(owner.address)
            const porfolioContract = await ethers.getContractAt("Portfolio", porfolios[0]);
            const assetAddresses = await porfolioContract.getAssetAddresses();

            expect(assetAddresses.length).equals(3);
            expect(assetAddresses).contain(testUtils.addresses.DAI);
            expect(assetAddresses).contain(testUtils.addresses.UNI);
            expect(assetAddresses).contain(testUtils.addresses.USDC);

            const daiBalance = await testUtils.getErc20Balance(testUtils.addresses.DAI, porfolios[0]);
            expect(daiBalance).greaterThan(0);

            const uniBalance = await testUtils.getErc20Balance(testUtils.addresses.UNI, porfolios[0]);
            expect(uniBalance).greaterThan(0);

            const usdcBalance = await testUtils.getErc20Balance(testUtils.addresses.USDC, porfolios[0]);
            expect(usdcBalance).greaterThan(0);

            const ethBalance = await ethers.provider.getBalance(porfolios[0]);
            expect(ethBalance).equals(0);

            const wethBalance = await testUtils.getErc20Balance(testUtils.addresses.WETH, porfolios[0]);
            expect(wethBalance).equals(0);
        });

        it("Should Create Portfolio With Empty Assets", async function () {
            const [ owner ] = await ethers.getSigners();
            const portfolioFactory = await loadFixture(testUtils.deployPortfolioFactory);

            await portfolioFactory.createPortfolio([]);
            const porfolios = await portfolioFactory.getPortfolios(owner.address)
            
            const porfolioContract = await ethers.getContractAt("Portfolio", porfolios[0]);
            const assetAddresses = await porfolioContract.getAssetAddresses();
            expect(assetAddresses.length).equals(0);
        });

        it("Should Not Create Portfolio With Less Eth Value Than Amount", async function () {
            const portfolioFactory = await loadFixture(testUtils.deployPortfolioFactory);
            const uniswapConnectorAddress = await testUtils.getUniswapConnectorAddress();

            const params = [
                {
                    srcToken: testUtils.addresses.ETH,
                    dexConnectorAddress: uniswapConnectorAddress,
                    destToken: testUtils.addresses.DAI,
                    amount: ethers.parseEther("1.5"),
                    slippage: 5
                }
            ]

            await expect(portfolioFactory.createPortfolio(params, {value: ethers.parseEther("0.5")}))
                .revertedWithCustomError(portfolioFactory, "ReceivedDifferentEthValueAndAmount");
        });

        it("Should Not Create Portfolio With Less Token Balance", async function () {
            const [ owner ] = await ethers.getSigners();
            const portfolioFactory = await loadFixture(testUtils.deployPortfolioFactory);
            const uniswapConnectorAddress = await testUtils.getUniswapConnectorAddress();

            const params = [
                {
                    srcToken: testUtils.addresses.WETH,
                    dexConnectorAddress: uniswapConnectorAddress,
                    destToken: testUtils.addresses.DAI,
                    amount: ethers.parseEther("10"),
                    slippage: 5
                }
            ]
            
            await testUtils.fundAccountWithToken(await portfolioFactory.getAddress(), owner, testUtils.addresses.WETH, testUtils.addresses.WETH_WHALE, ethers.parseEther("0.5"));
            await expect(portfolioFactory.createPortfolio(params))
                .revertedWithCustomError(portfolioFactory, "NotEnoughBalance")
                .withArgs(testUtils.addresses.WETH);
        });
    });
});

