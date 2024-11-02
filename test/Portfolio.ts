import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import { expect } from "chai";
import { ethers } from "hardhat";

const UNISWAP_V2_ROUTER = "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D";

const ETH = ethers.getAddress("0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE");
const WETH = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2";
const DAI = "0x6B175474E89094C44Da98b954EedeAC495271d0F";
const UNI = "0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984";
const USDC = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48";
const WETH_WHALE = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2";

async function deployMosaicaLib() {    
    const MosaicaLib = await ethers.getContractFactory("MosaicaLib");
    const mosaicaLib = await MosaicaLib.deploy();
    await mosaicaLib.waitForDeployment();

    return mosaicaLib;
}

async function deployUniswapV2LikeConnector() {
    const mosaicaLib = await deployMosaicaLib();

    const UniswapV2LikeConnector = await ethers.getContractFactory(
        "UniswapV2LikeConnector", 
        { libraries: { MosaicaLib: await mosaicaLib.getAddress() } }
    );
    const uniswapV2LikeConnector = await UniswapV2LikeConnector.deploy("Uniswap V2", UNISWAP_V2_ROUTER);
    await uniswapV2LikeConnector.waitForDeployment();

    return { uniswapV2LikeConnector, mosaicaLib};
}

async function deployPortfolioFactory() {
    const [owner, otherAccount] = await ethers.getSigners();
    const { uniswapV2LikeConnector, mosaicaLib} = await deployUniswapV2LikeConnector();

    const PortfolioFactory = await ethers.getContractFactory(
        "PortfolioFactory",
        { libraries: { MosaicaLib: await mosaicaLib.getAddress() } }
    );
    const portfolioFactory = await PortfolioFactory.deploy();
    await portfolioFactory.waitForDeployment();

    return { portfolioFactory, uniswapV2LikeConnector, mosaicaLib, owner, otherAccount };
}

async function createEmptyPortfolio() {
    const { portfolioFactory, uniswapV2LikeConnector, mosaicaLib, owner, otherAccount } = await deployPortfolioFactory();
    await portfolioFactory.createPortfolio([]);
    const porfolios = await portfolioFactory.getPortfolios(owner.address);

    return { portfolioFactory, uniswapV2LikeConnector, mosaicaLib, owner, otherAccount, porfolios };
}

async function createPortfolioWithAssets() {
    const { portfolioFactory, uniswapV2LikeConnector, mosaicaLib, owner, otherAccount } = await deployPortfolioFactory();
    const uniswapConnectorAddress = await uniswapV2LikeConnector.getAddress();

    const params = [
        {
            srcToken: ETH,
            dexConnectorAddress: uniswapConnectorAddress,
            destToken: DAI,
            amount: ethers.parseEther("0.5"),
            slippage: 5
        },
        {
            srcToken: ETH,
            dexConnectorAddress: uniswapConnectorAddress,
            destToken: UNI,
            amount: ethers.parseEther("2"),
            slippage: 5
        },
        {
            srcToken: ETH,
            dexConnectorAddress: uniswapConnectorAddress,
            destToken: USDC,
            amount: ethers.parseEther("1"),
            slippage: 5
        }
    ];

    await portfolioFactory.createPortfolio(params, {value: ethers.parseEther("3.5")});
    const porfolios = await portfolioFactory.getPortfolios(owner.address);

    return { portfolioFactory, uniswapV2LikeConnector, mosaicaLib, owner, otherAccount };
}

async function fundAccountWithToken(spender: string, account: HardhatEthersSigner, token: string, whale: string, amount: bigint) {
    const ercToken = await ethers.getContractAt("IERC20", token);

    await ethers.provider.send("hardhat_impersonateAccount", [whale]); 
    const whaleSigner = await ethers.getSigner(whale);
    
    await ercToken.connect(whaleSigner).transfer(account, amount);
    await ercToken.connect(account).approve(spender, amount);
}

async function getErc20Balance(erc20Address: string, account: string) {
    const ercToken = await ethers.getContractAt("ERC20", erc20Address);
    return await ercToken.balanceOf(account);
}

describe("Portfolio", function () {
    describe("Add Assets", function () {
        it("Should Add Token Assets", async function () {
            const { owner, porfolios } = await loadFixture(createEmptyPortfolio);
            
            const porfolioContract = await ethers.getContractAt("Portfolio", porfolios[0]);
            let assetAddresses = await porfolioContract.getAssetAddresses();
            expect(assetAddresses.length).equals(0);

            await fundAccountWithToken(porfolios[0], owner, WETH, WETH_WHALE, ethers.parseEther("2"));
            await porfolioContract.addAsset(WETH, ethers.parseEther("2"));
            
            assetAddresses = await porfolioContract.getAssetAddresses();
            expect(assetAddresses.length).equals(1);
            expect(assetAddresses).contain(WETH);

            const portfolioWethBalance = await porfolioContract.getAssetBalance(WETH);
            expect(portfolioWethBalance).equals(ethers.parseEther("2"));

            const wethToken = await ethers.getContractAt("IERC20", WETH);
            const wethBalance = await wethToken.balanceOf(porfolios[0]);
            expect(wethBalance).equals(portfolioWethBalance);
        });

        it("Should Add ETH Assets", async function () {
            const { porfolios } = await loadFixture(createEmptyPortfolio);
            
            const porfolioContract = await ethers.getContractAt("Portfolio", porfolios[0]);
            let assetAddresses = await porfolioContract.getAssetAddresses();
            expect(assetAddresses.length).equals(0);

            await porfolioContract.addAsset(ETH, ethers.parseEther("2"), {value: ethers.parseEther("2")});
            
            assetAddresses = await porfolioContract.getAssetAddresses();
            expect(assetAddresses.length).equals(1);
            expect(assetAddresses).contain(ETH);

            const portfolioEthBalance = await porfolioContract.getAssetBalance(ETH);
            expect(portfolioEthBalance).equals(ethers.parseEther("2"));

            const ethBalance = await ethers.provider.getBalance(porfolios[0]);
            expect(ethBalance).equals(portfolioEthBalance);
        });

        it("Should Not Add Assets When Not Owner", async function () {
            const { otherAccount, porfolios } = await loadFixture(createEmptyPortfolio);

            const porfolioContract = await ethers.getContractAt("Portfolio", porfolios[0]);
            await expect(porfolioContract.connect(otherAccount).addAsset(ETH, ethers.parseEther("2"), {value: ethers.parseEther("2")}))
                .revertedWithCustomError(porfolioContract, "OwnableUnauthorizedAccount")
            
        });

        it("Should Not Add Assets With Different ETH Value And Amount", async function () {
            const { porfolios } = await loadFixture(createEmptyPortfolio);

            const porfolioContract = await ethers.getContractAt("Portfolio", porfolios[0]);
            await expect(porfolioContract.addAsset(ETH, 0, {value: ethers.parseEther("2")}))
                .revertedWithCustomError(porfolioContract, "ReceivedDifferentEthValueAndAmount");
        });

        it("Should Not Add Assets When Low Token Balance", async function () {
            const { porfolios } = await loadFixture(createEmptyPortfolio);

            const porfolioContract = await ethers.getContractAt("Portfolio", porfolios[0]);
            await expect(porfolioContract.addAsset(WETH, ethers.parseEther("2")))
                .revertedWithCustomError(porfolioContract, "NotEnoughBalance")
                .withArgs(WETH);
        });
    });

    describe("Buy Assets", function () {
        it("Should Buy Token Assets", async function () {
            const { uniswapV2LikeConnector, owner, porfolios } = await loadFixture(createEmptyPortfolio);
            
            const porfolioContract = await ethers.getContractAt("Portfolio", porfolios[0]);
            let assetAddresses = await porfolioContract.getAssetAddresses();
            expect(assetAddresses.length).equals(0);

            await fundAccountWithToken(porfolios[0], owner, WETH, WETH_WHALE, ethers.parseEther("3"));
            const uniswapConnectorAddress = await uniswapV2LikeConnector.getAddress();

            const params = [
                {
                    srcToken: ETH,
                    dexConnectorAddress: uniswapConnectorAddress,
                    destToken: DAI,
                    amount: ethers.parseEther("0.5"),
                    slippage: 5
                },
                {
                    srcToken: WETH,
                    dexConnectorAddress: uniswapConnectorAddress,
                    destToken: UNI,
                    amount: ethers.parseEther("2"),
                    slippage: 5
                },
                {
                    srcToken: ETH,
                    dexConnectorAddress: uniswapConnectorAddress,
                    destToken: USDC,
                    amount: ethers.parseEther("1"),
                    slippage: 5
                }
            ]

            await porfolioContract.buyAssets(params, {value: ethers.parseEther("2")});
            
            assetAddresses = await porfolioContract.getAssetAddresses();
            expect(assetAddresses.length).equals(4);
            expect(assetAddresses).contain(DAI);
            expect(assetAddresses).contain(UNI);
            expect(assetAddresses).contain(USDC);
            expect(assetAddresses).contain(ETH);

            const daiToken = await ethers.getContractAt("IERC20", DAI);
            const daiBalance = await daiToken.balanceOf(porfolios[0]);
            expect(daiBalance).greaterThan(0);

            const uniToken = await ethers.getContractAt("IERC20", UNI);
            const uniBalance = await uniToken.balanceOf(porfolios[0]);
            expect(uniBalance).greaterThan(0);

            const usdcToken = await ethers.getContractAt("IERC20", USDC);
            const usdcBalance = await usdcToken.balanceOf(porfolios[0]);
            expect(usdcBalance).greaterThan(0);

            const ethBalance = await ethers.provider.getBalance(porfolios[0]);
            expect(ethBalance).equals(ethers.parseEther("0.5"));

            const wethToken = await ethers.getContractAt("IERC20", WETH);
            const wethBalance = await wethToken.balanceOf(porfolios[0]);
            expect(wethBalance).equals(0);
        });

        it("Should Not Buy Assets When Not Authorized", async function () {
            const { otherAccount, porfolios } = await loadFixture(createEmptyPortfolio);
            
            const porfolioContract = await ethers.getContractAt("Portfolio", porfolios[0]);
            await expect(porfolioContract.connect(otherAccount).buyAssets([]))
                .revertedWithCustomError(porfolioContract, "OwnableUnauthorizedAccount");
        });

        it("Should Not Buy Assets When Not Enough Eth Balance", async function () {
            const { uniswapV2LikeConnector, porfolios } = await loadFixture(createEmptyPortfolio);
            const uniswapConnectorAddress = await uniswapV2LikeConnector.getAddress();

            const params = [
                {
                    srcToken: ETH,
                    dexConnectorAddress: uniswapConnectorAddress,
                    destToken: DAI,
                    amount: ethers.parseEther("0.5"),
                    slippage: 5
                },
                {
                    srcToken: ETH,
                    dexConnectorAddress: uniswapConnectorAddress,
                    destToken: USDC,
                    amount: ethers.parseEther("1"),
                    slippage: 5
                }
            ]

            const porfolioContract = await ethers.getContractAt("Portfolio", porfolios[0]);
            await expect(porfolioContract.buyAssets(params, {value: ethers.parseEther("0.5")}))
                .revertedWithCustomError(porfolioContract, "ReceivedDifferentEthValueAndAmount");
        });

        it("Should Not Buy Assets When Not Enough Token Balance", async function () {
            const { uniswapV2LikeConnector, porfolios } = await loadFixture(createEmptyPortfolio);
            const uniswapConnectorAddress = await uniswapV2LikeConnector.getAddress();

            const params = [
                {
                    srcToken: WETH,
                    dexConnectorAddress: uniswapConnectorAddress,
                    destToken: DAI,
                    amount: ethers.parseEther("0.5"),
                    slippage: 5
                },
                {
                    srcToken: WETH,
                    dexConnectorAddress: uniswapConnectorAddress,
                    destToken: USDC,
                    amount: ethers.parseEther("1"),
                    slippage: 5
                }
            ]

            const porfolioContract = await ethers.getContractAt("Portfolio", porfolios[0]);
            await expect(porfolioContract.buyAssets(params))
                .revertedWithCustomError(porfolioContract, "NotEnoughBalance")
                .withArgs(WETH);
        });
    });

    describe("Withdraw Assets", function () {
        it("Should Withdraw Assets As Tokens", async function () {
            const { portfolioFactory, uniswapV2LikeConnector, owner } = await loadFixture(createPortfolioWithAssets);
            const uniswapConnectorAddress = await uniswapV2LikeConnector.getAddress();

            const porfolios = await portfolioFactory.getPortfolios(owner.address);
            const porfolioContract = await ethers.getContractAt("Portfolio", porfolios[0]);
            
            const ownerDaiBalance = await getErc20Balance(DAI, owner.address);
            const ownerUniBalance = await getErc20Balance(UNI, owner.address);
            const ownerUsdcBalance = await getErc20Balance(USDC, owner.address);

            const portfolioDaiBalance = await porfolioContract.getAssetBalance(DAI);
            const portfolioUniBalance = await porfolioContract.getAssetBalance(UNI);
            const portfolioUsdcBalance = await porfolioContract.getAssetBalance(USDC);

            const params = [
                {
                    srcToken: DAI,
                    dexConnectorAddress: uniswapConnectorAddress,
                    destToken: DAI,
                    amount: portfolioDaiBalance,
                    slippage: 5
                },
                {
                    srcToken: UNI,
                    dexConnectorAddress: uniswapConnectorAddress,
                    destToken: UNI,
                    amount: portfolioUniBalance,
                    slippage: 5
                },
                {
                    srcToken: USDC,
                    dexConnectorAddress: uniswapConnectorAddress,
                    destToken: USDC,
                    amount: portfolioUsdcBalance,
                    slippage: 5
                }
            ];

            await porfolioContract.withdrawAssets(params);

            const ownerDaiBalanceAfter = await getErc20Balance(DAI, owner.address);
            expect(ownerDaiBalanceAfter).equals(ownerDaiBalance + portfolioDaiBalance);

            const ownerUniBalanceAfter = await getErc20Balance(UNI, owner.address);
            expect(ownerUniBalanceAfter).equals(ownerUniBalance + portfolioUniBalance);

            const ownerUsdcBalanceAfter = await getErc20Balance(USDC, owner.address);
            expect(ownerUsdcBalanceAfter).equals(ownerUsdcBalance + portfolioUsdcBalance);
        });

        it("Should Withdraw Assets As ETH", async function () {
            const { portfolioFactory, uniswapV2LikeConnector, owner } = await loadFixture(createPortfolioWithAssets);
            const uniswapConnectorAddress = await uniswapV2LikeConnector.getAddress();

            const porfolios = await portfolioFactory.getPortfolios(owner.address);
            const porfolioContract = await ethers.getContractAt("Portfolio", porfolios[0]);
            
            const ethBalance = await ethers.provider.getBalance(owner);

            const portfolioDaiBalance = await porfolioContract.getAssetBalance(DAI);
            const portfolioUniBalance = await porfolioContract.getAssetBalance(UNI);
            const portfolioUsdcBalance = await porfolioContract.getAssetBalance(USDC);

            const params = [
                {
                    srcToken: DAI,
                    dexConnectorAddress: uniswapConnectorAddress,
                    destToken: ETH,
                    amount: portfolioDaiBalance,
                    slippage: 5
                },
                {
                    srcToken: UNI,
                    dexConnectorAddress: uniswapConnectorAddress,
                    destToken: ETH,
                    amount: portfolioUniBalance,
                    slippage: 5
                },
                {
                    srcToken: USDC,
                    dexConnectorAddress: uniswapConnectorAddress,
                    destToken: ETH,
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
            const { portfolioFactory, uniswapV2LikeConnector, owner } = await loadFixture(createPortfolioWithAssets);
            const uniswapConnectorAddress = await uniswapV2LikeConnector.getAddress();

            const porfolios = await portfolioFactory.getPortfolios(owner.address);
            const porfolioContract = await ethers.getContractAt("Portfolio", porfolios[0]);

            const daiBalance = await porfolioContract.getAssetBalance(DAI);

            const params = [
                {
                    srcToken: DAI,
                    dexConnectorAddress: uniswapConnectorAddress,
                    destToken: DAI,
                    amount: daiBalance + BigInt(1),
                    slippage: 5
                }
            ];

            await expect(porfolioContract.withdrawAssets(params))
                .revertedWithCustomError(porfolioContract, "NotEnoughBalance")
                .withArgs(DAI);

        });
    });
});