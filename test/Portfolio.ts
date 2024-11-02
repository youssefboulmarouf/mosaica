import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { expect } from "chai";
import { ethers } from "hardhat";
import * as testUtils from "./TestUtils";

async function createEmptyPortfolio() {
    const [owner, otherAccount] = await ethers.getSigners();
    const portfolioFactory = await testUtils.deployPortfolioFactory();
    
    await portfolioFactory.createPortfolio([]);
    const porfolios = await portfolioFactory.getPortfolios(owner.address);

    return { portfolioFactory, owner, otherAccount, porfolios };
}

async function createPortfolioWithAssets() {
    const [owner, otherAccount] = await ethers.getSigners();
    const portfolioFactory = await testUtils.deployPortfolioFactory();
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
            srcToken: testUtils.addresses.ETH,
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
        }
    ];

    await portfolioFactory.createPortfolio(params, {value: ethers.parseEther("3.5")});
    return { portfolioFactory, uniswapConnectorAddress, owner, otherAccount };
}

describe("Portfolio", function () {
    describe("Add Assets", function () {
        it("Should Add Token Assets", async function () {
            const { owner, porfolios } = await loadFixture(createEmptyPortfolio);
            
            const porfolioContract = await ethers.getContractAt("Portfolio", porfolios[0]);
            let assetAddresses = await porfolioContract.getAssetAddresses();
            expect(assetAddresses.length).equals(0);

            await testUtils.fundAccountWithToken(porfolios[0], owner, testUtils.addresses.WETH, testUtils.addresses.WETH_WHALE, ethers.parseEther("2"));
            await porfolioContract.addAsset(testUtils.addresses.WETH, ethers.parseEther("2"));
            
            assetAddresses = await porfolioContract.getAssetAddresses();
            expect(assetAddresses.length).equals(1);
            expect(assetAddresses).contain(testUtils.addresses.WETH);

            const portfolioWethBalance = await porfolioContract.getAssetBalance(testUtils.addresses.WETH);
            expect(portfolioWethBalance).equals(ethers.parseEther("2"));

            const wethBalance = await testUtils.getErc20Balance(testUtils.addresses.WETH, porfolios[0]);
            expect(wethBalance).equals(portfolioWethBalance);
        });

        it("Should Add ETH Assets", async function () {
            const { porfolios } = await loadFixture(createEmptyPortfolio);
            
            const porfolioContract = await ethers.getContractAt("Portfolio", porfolios[0]);
            let assetAddresses = await porfolioContract.getAssetAddresses();
            expect(assetAddresses.length).equals(0);

            await porfolioContract.addAsset(testUtils.addresses.ETH, ethers.parseEther("2"), {value: ethers.parseEther("2")});
            
            assetAddresses = await porfolioContract.getAssetAddresses();
            expect(assetAddresses.length).equals(1);
            expect(assetAddresses).contain(testUtils.addresses.ETH);

            const portfolioEthBalance = await porfolioContract.getAssetBalance(testUtils.addresses.ETH);
            expect(portfolioEthBalance).equals(ethers.parseEther("2"));

            const ethBalance = await ethers.provider.getBalance(porfolios[0]);
            expect(ethBalance).equals(portfolioEthBalance);
        });

        it("Should Not Add Assets When Not Owner", async function () {
            const { otherAccount, porfolios } = await loadFixture(createEmptyPortfolio);

            const porfolioContract = await ethers.getContractAt("Portfolio", porfolios[0]);
            await expect(porfolioContract.connect(otherAccount).addAsset(testUtils.addresses.ETH, ethers.parseEther("2"), {value: ethers.parseEther("2")}))
                .revertedWithCustomError(porfolioContract, "OwnableUnauthorizedAccount")
            
        });

        it("Should Not Add Assets With Different ETH Value And Amount", async function () {
            const { porfolios } = await loadFixture(createEmptyPortfolio);

            const porfolioContract = await ethers.getContractAt("Portfolio", porfolios[0]);
            await expect(porfolioContract.addAsset(testUtils.addresses.ETH, 0, {value: ethers.parseEther("2")}))
                .revertedWithCustomError(porfolioContract, "ReceivedDifferentEthValueAndAmount");
        });

        it("Should Not Add Assets When Low Token Balance", async function () {
            const { porfolios } = await loadFixture(createEmptyPortfolio);

            const porfolioContract = await ethers.getContractAt("Portfolio", porfolios[0]);
            await expect(porfolioContract.addAsset(testUtils.addresses.WETH, ethers.parseEther("2")))
                .revertedWithCustomError(porfolioContract, "NotEnoughBalance")
                .withArgs(testUtils.addresses.WETH);
        });
    });

    describe("Buy Assets", function () {
        it("Should Buy Token Assets", async function () {
            const { owner, porfolios } = await loadFixture(createEmptyPortfolio);
            const uniswapConnectorAddress = await testUtils.getUniswapConnectorAddress();
            
            const porfolioContract = await ethers.getContractAt("Portfolio", porfolios[0]);
            let assetAddresses = await porfolioContract.getAssetAddresses();
            expect(assetAddresses.length).equals(0);

            await testUtils.fundAccountWithToken(porfolios[0], owner, testUtils.addresses.WETH, testUtils.addresses.WETH_WHALE, ethers.parseEther("3"));

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
                }
            ]

            await porfolioContract.buyAssets(params, {value: ethers.parseEther("2")});
            
            assetAddresses = await porfolioContract.getAssetAddresses();
            expect(assetAddresses.length).equals(4);
            expect(assetAddresses).contain(testUtils.addresses.DAI);
            expect(assetAddresses).contain(testUtils.addresses.UNI);
            expect(assetAddresses).contain(testUtils.addresses.USDC);
            expect(assetAddresses).contain(testUtils.addresses.ETH);

            const daiBalance = await testUtils.getErc20Balance(testUtils.addresses.DAI, porfolios[0]);
            expect(daiBalance).greaterThan(0);

            const uniBalance = await testUtils.getErc20Balance(testUtils.addresses.UNI, porfolios[0]);
            expect(uniBalance).greaterThan(0);

            const usdcBalance = await testUtils.getErc20Balance(testUtils.addresses.USDC, porfolios[0]);
            expect(usdcBalance).greaterThan(0);

            const ethBalance = await ethers.provider.getBalance(porfolios[0]);
            expect(ethBalance).equals(ethers.parseEther("0.5"));

            const wethBalance = await testUtils.getErc20Balance(testUtils.addresses.WETH, porfolios[0]);
            expect(wethBalance).equals(0);
        });

        it("Should Not Buy Assets When Not Authorized", async function () {
            const { otherAccount, porfolios } = await loadFixture(createEmptyPortfolio);
            
            const porfolioContract = await ethers.getContractAt("Portfolio", porfolios[0]);
            await expect(porfolioContract.connect(otherAccount).buyAssets([]))
                .revertedWithCustomError(porfolioContract, "OwnableUnauthorizedAccount");
        });

        it("Should Not Buy Assets When Not Enough Eth Balance", async function () {
            const { porfolios } = await loadFixture(createEmptyPortfolio);
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
                    srcToken: testUtils.addresses.ETH,
                    dexConnectorAddress: uniswapConnectorAddress,
                    destToken: testUtils.addresses.USDC,
                    amount: ethers.parseEther("1"),
                    slippage: 5
                }
            ]

            const porfolioContract = await ethers.getContractAt("Portfolio", porfolios[0]);
            await expect(porfolioContract.buyAssets(params, {value: ethers.parseEther("0.5")}))
                .revertedWithCustomError(porfolioContract, "ReceivedDifferentEthValueAndAmount");
        });

        it("Should Not Buy Assets When Not Enough Token Balance", async function () {
            const { porfolios } = await loadFixture(createEmptyPortfolio);
            const uniswapConnectorAddress = await testUtils.getUniswapConnectorAddress();

            const params = [
                {
                    srcToken: testUtils.addresses.WETH,
                    dexConnectorAddress: uniswapConnectorAddress,
                    destToken: testUtils.addresses.DAI,
                    amount: ethers.parseEther("0.5"),
                    slippage: 5
                },
                {
                    srcToken: testUtils.addresses.WETH,
                    dexConnectorAddress: uniswapConnectorAddress,
                    destToken: testUtils.addresses.USDC,
                    amount: ethers.parseEther("1"),
                    slippage: 5
                }
            ]

            const porfolioContract = await ethers.getContractAt("Portfolio", porfolios[0]);
            await expect(porfolioContract.buyAssets(params))
                .revertedWithCustomError(porfolioContract, "NotEnoughBalance")
                .withArgs(testUtils.addresses.WETH);
        });
    });

    describe("Withdraw Assets", function () {
        it("Should Withdraw Assets As Tokens", async function () {
            const { portfolioFactory, uniswapConnectorAddress, owner } = await loadFixture(createPortfolioWithAssets);

            const porfolios = await portfolioFactory.getPortfolios(owner.address);
            const porfolioContract = await ethers.getContractAt("Portfolio", porfolios[0]);
            
            const ownerDaiBalance = await testUtils.getErc20Balance(testUtils.addresses.DAI, owner.address);
            const ownerUniBalance = await testUtils.getErc20Balance(testUtils.addresses.UNI, owner.address);
            const ownerUsdcBalance = await testUtils.getErc20Balance(testUtils.addresses.USDC, owner.address);

            const portfolioDaiBalance = await porfolioContract.getAssetBalance(testUtils.addresses.DAI);
            const portfolioUniBalance = await porfolioContract.getAssetBalance(testUtils.addresses.UNI);
            const portfolioUsdcBalance = await porfolioContract.getAssetBalance(testUtils.addresses.USDC);

            const params = [
                {
                    srcToken: testUtils.addresses.DAI,
                    dexConnectorAddress: uniswapConnectorAddress,
                    destToken: testUtils.addresses.DAI,
                    amount: portfolioDaiBalance,
                    slippage: 5
                },
                {
                    srcToken: testUtils.addresses.UNI,
                    dexConnectorAddress: uniswapConnectorAddress,
                    destToken: testUtils.addresses.UNI,
                    amount: portfolioUniBalance,
                    slippage: 5
                },
                {
                    srcToken: testUtils.addresses.USDC,
                    dexConnectorAddress: uniswapConnectorAddress,
                    destToken: testUtils.addresses.USDC,
                    amount: portfolioUsdcBalance,
                    slippage: 5
                }
            ];

            await porfolioContract.withdrawAssets(params);

            const ownerDaiBalanceAfter = await testUtils.getErc20Balance(testUtils.addresses.DAI, owner.address);
            expect(ownerDaiBalanceAfter).equals(ownerDaiBalance + portfolioDaiBalance);

            const ownerUniBalanceAfter = await testUtils.getErc20Balance(testUtils.addresses.UNI, owner.address);
            expect(ownerUniBalanceAfter).equals(ownerUniBalance + portfolioUniBalance);

            const ownerUsdcBalanceAfter = await testUtils.getErc20Balance(testUtils.addresses.USDC, owner.address);
            expect(ownerUsdcBalanceAfter).equals(ownerUsdcBalance + portfolioUsdcBalance);
        });

        it("Should Withdraw Assets As ETH", async function () {
            const { portfolioFactory, uniswapConnectorAddress, owner } = await loadFixture(createPortfolioWithAssets);

            const porfolios = await portfolioFactory.getPortfolios(owner.address);
            const porfolioContract = await ethers.getContractAt("Portfolio", porfolios[0]);
            
            const ethBalance = await ethers.provider.getBalance(owner);

            const portfolioDaiBalance = await porfolioContract.getAssetBalance(testUtils.addresses.DAI);
            const portfolioUniBalance = await porfolioContract.getAssetBalance(testUtils.addresses.UNI);
            const portfolioUsdcBalance = await porfolioContract.getAssetBalance(testUtils.addresses.USDC);

            const params = [
                {
                    srcToken: testUtils.addresses.DAI,
                    dexConnectorAddress: uniswapConnectorAddress,
                    destToken: testUtils.addresses.ETH,
                    amount: portfolioDaiBalance,
                    slippage: 5
                },
                {
                    srcToken: testUtils.addresses.UNI,
                    dexConnectorAddress: uniswapConnectorAddress,
                    destToken: testUtils.addresses.ETH,
                    amount: portfolioUniBalance,
                    slippage: 5
                },
                {
                    srcToken: testUtils.addresses.USDC,
                    dexConnectorAddress: uniswapConnectorAddress,
                    destToken: testUtils.addresses.ETH,
                    amount: portfolioUsdcBalance,
                    slippage: 5
                }
            ];

            await porfolioContract.withdrawAssets(params);

            const ethBalanceAfter = await ethers.provider.getBalance(owner);
            expect(ethBalanceAfter).greaterThan(ethBalance);
        });

        it("Should Not Withdraw Asset When No Owner ", async function () {
            const { portfolioFactory, owner, otherAccount } = await loadFixture(createPortfolioWithAssets);
            const porfolios = await portfolioFactory.getPortfolios(owner.address);
            const porfolioContract = await ethers.getContractAt("Portfolio", porfolios[0]);
            
            await expect(porfolioContract.connect(otherAccount).withdrawAssets([]))
                .revertedWithCustomError(porfolioContract, "OwnableUnauthorizedAccount");
        });

        it("Should Withdraw Assets As Tokens", async function () {
            const { portfolioFactory, uniswapConnectorAddress, owner } = await loadFixture(createPortfolioWithAssets);

            const porfolios = await portfolioFactory.getPortfolios(owner.address);
            const porfolioContract = await ethers.getContractAt("Portfolio", porfolios[0]);

            const daiBalance = await porfolioContract.getAssetBalance(testUtils.addresses.DAI);

            const params = [
                {
                    srcToken: testUtils.addresses.DAI,
                    dexConnectorAddress: uniswapConnectorAddress,
                    destToken: testUtils.addresses.DAI,
                    amount: daiBalance + BigInt(1),
                    slippage: 5
                }
            ];

            await expect(porfolioContract.withdrawAssets(params))
                .revertedWithCustomError(porfolioContract, "NotEnoughBalance")
                .withArgs(testUtils.addresses.DAI);

        });
    });
});