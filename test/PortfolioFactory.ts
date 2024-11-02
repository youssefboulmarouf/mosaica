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

async function fundAccountWithToken(spender: string, account: HardhatEthersSigner, token: string, whale: string, amount: bigint) {
    const ercToken = await ethers.getContractAt("IERC20", token);

    await ethers.provider.send("hardhat_impersonateAccount", [whale]); 
    const whaleSigner = await ethers.getSigner(whale);
    
    await ercToken.connect(whaleSigner).transfer(account, amount);
    await ercToken.connect(account).approve(spender, amount);
}

describe("Portfolio Factory", function () {
    describe("Create Portfolio", function () {
        it("Should Create Portfolio With Assets", async function () {
            const { portfolioFactory, uniswapV2LikeConnector, owner } = await loadFixture(deployPortfolioFactory);

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
                },
                {
                    srcToken: WETH,
                    dexConnectorAddress: uniswapConnectorAddress,
                    destToken: USDC,
                    amount: ethers.parseEther("2"),
                    slippage: 5
                }
            ]

            await fundAccountWithToken(await portfolioFactory.getAddress(), owner, WETH, WETH_WHALE, ethers.parseEther("4"));
            await portfolioFactory.createPortfolio(params, {value: ethers.parseEther("1.5")});

            const porfolios = await portfolioFactory.getPortfolios(owner.address)
            const porfolioContract = await ethers.getContractAt("Portfolio", porfolios[0]);
            const assetAddresses = await porfolioContract.getAssetAddresses();

            expect(assetAddresses.length).equals(3);
            expect(assetAddresses).contain(DAI);
            expect(assetAddresses).contain(UNI);
            expect(assetAddresses).contain(USDC);

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
            expect(ethBalance).equals(0);

            const wethToken = await ethers.getContractAt("IERC20", WETH);
            const wethBalance = await wethToken.balanceOf(porfolios[0]);
            expect(wethBalance).equals(0);
        });

        it("Should Create Portfolio With Empty Assets", async function () {
            const { portfolioFactory, owner } = await loadFixture(deployPortfolioFactory);

            await portfolioFactory.createPortfolio([]);
            const porfolios = await portfolioFactory.getPortfolios(owner.address)
            
            const porfolioContract = await ethers.getContractAt("Portfolio", porfolios[0]);
            const assetAddresses = await porfolioContract.getAssetAddresses();
            expect(assetAddresses.length).equals(0);
        });

        it("Should Not Create Portfolio With Less Eth Value Than Amount", async function () {
            const { portfolioFactory, uniswapV2LikeConnector } = await loadFixture(deployPortfolioFactory);

            const uniswapConnectorAddress = await uniswapV2LikeConnector.getAddress();
            const params = [
                {
                    srcToken: ETH,
                    dexConnectorAddress: uniswapConnectorAddress,
                    destToken: DAI,
                    amount: ethers.parseEther("1.5"),
                    slippage: 5
                }
            ]

            await expect(portfolioFactory.createPortfolio(params, {value: ethers.parseEther("0.5")}))
                .revertedWithCustomError(portfolioFactory, "ReceivedDifferentEthValueAndAmount");
        });

        it("Should Not Create Portfolio With Less Token Balance", async function () {
            const { portfolioFactory, uniswapV2LikeConnector, owner } = await loadFixture(deployPortfolioFactory);

            const uniswapConnectorAddress = await uniswapV2LikeConnector.getAddress();
            const params = [
                {
                    srcToken: WETH,
                    dexConnectorAddress: uniswapConnectorAddress,
                    destToken: DAI,
                    amount: ethers.parseEther("10"),
                    slippage: 5
                }
            ]
            
            await fundAccountWithToken(await portfolioFactory.getAddress(), owner, WETH, WETH_WHALE, ethers.parseEther("0.5"));
            await expect(portfolioFactory.createPortfolio(params))
                .revertedWithCustomError(portfolioFactory, "NotEnoughBalance")
                .withArgs(WETH);
        });
    });
});

