import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { expect } from "chai";
import { ethers } from "hardhat";
import * as testUtils from "./TestUtils";

describe("Dex Connector", function () {

    async function deployRandomConnectorContract() {
        const [owner, otherAccount] = await ethers.getSigners();
        const randomDexAddress = ethers.Wallet.createRandom();
        const uniswapV2LikeConnector = await testUtils.deployUniswapV2LikeConnectorContract("Random Dex", randomDexAddress.address);

        return { uniswapV2LikeConnector, randomDexAddress, owner, otherAccount };
    }

    describe("Enable Connector Contract", function () {
        it("Should Enable Connector Contract", async function () {
            const { uniswapV2LikeConnector } = await loadFixture(deployRandomConnectorContract);
            
            const dexName = await uniswapV2LikeConnector.dexName();
            expect(dexName).equals("Random Dex");

            let isEnabled = await uniswapV2LikeConnector.enabled();
            expect(isEnabled).equals(false);

            await expect(uniswapV2LikeConnector.enableConnector())
                .emit(uniswapV2LikeConnector, "DexConnectorEnabledEvent")
                .withArgs(await uniswapV2LikeConnector.getAddress());

            isEnabled = await uniswapV2LikeConnector.enabled();
            expect(isEnabled).equals(true);
        });

        it("Should Not Enable Connector Contract When Not Owner", async function () {
            const { uniswapV2LikeConnector, otherAccount } = await loadFixture(deployRandomConnectorContract);
            
            await expect(uniswapV2LikeConnector.connect(otherAccount).enableConnector())
                .revertedWithCustomError(uniswapV2LikeConnector, "OwnableUnauthorizedAccount")
                .withArgs(otherAccount);
        });

        it("Should Not Enable Connector Contract When Enabled", async function () {
            const { uniswapV2LikeConnector } = await loadFixture(deployRandomConnectorContract);
            
            await uniswapV2LikeConnector.enableConnector();
            await expect(uniswapV2LikeConnector.enableConnector())
                .revertedWithCustomError(uniswapV2LikeConnector, "DexConnectorEnabledError")
                .withArgs(await uniswapV2LikeConnector.getAddress());
        });
    });

    describe("Disable Connector Contract", function () {
        async function EnableConnectorContract() {
            const { uniswapV2LikeConnector, randomDexAddress, owner, otherAccount } = await deployRandomConnectorContract();
            await uniswapV2LikeConnector.enableConnector();
            return { uniswapV2LikeConnector, randomDexAddress, owner, otherAccount };
        }

        it("Should Disable Connector Contract", async function () {
            const { uniswapV2LikeConnector } = await loadFixture(EnableConnectorContract);

            const dexName = await uniswapV2LikeConnector.dexName();
            expect(dexName).equals("Random Dex");

            let isEnabled = await uniswapV2LikeConnector.enabled();
            expect(isEnabled).equals(true);

            await expect(uniswapV2LikeConnector.disableConnector())
                .emit(uniswapV2LikeConnector, "DexConnectorDisabledEvent")
                .withArgs(await uniswapV2LikeConnector.getAddress());

            isEnabled = await uniswapV2LikeConnector.enabled();
            expect(isEnabled).equals(false);
        })

        it("Should Not Disable Connector Contract When Not Owner", async function () {
            const { uniswapV2LikeConnector, otherAccount } = await loadFixture(EnableConnectorContract);
            
            await expect(uniswapV2LikeConnector.connect(otherAccount).disableConnector())
                .revertedWithCustomError(uniswapV2LikeConnector, "OwnableUnauthorizedAccount")
                .withArgs(otherAccount);
        })

        it("Should Not Disable Connector Contract When Disabled", async function () {
            const { uniswapV2LikeConnector } = await loadFixture(EnableConnectorContract);
            
            await uniswapV2LikeConnector.disableConnector();
            await expect(uniswapV2LikeConnector.disableConnector())
                .revertedWithCustomError(uniswapV2LikeConnector, "DexConnectorDisabledError")
                .withArgs(await uniswapV2LikeConnector.getAddress());
        })
    })
});