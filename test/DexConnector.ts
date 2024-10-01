import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { expect } from "chai";
import { ethers } from "hardhat";

describe("Dex Connector", function () {

    async function deployRandomConnectorContract() {
        const [owner, otherAccount] = await ethers.getSigners();
        const randomDexAddress = ethers.Wallet.createRandom();
        
        const UniswapV2LikeDex = await ethers.getContractFactory("UniswapV2LikeDex");
        const uniswapV2LikeDex = await UniswapV2LikeDex.deploy("Random Dex", randomDexAddress.address);
        await uniswapV2LikeDex.waitForDeployment();

        return { uniswapV2LikeDex, randomDexAddress, owner, otherAccount };
    }

    describe("Enable Connector Contract", function () {
        it("Should Enable Connector Contract", async function () {
            const { uniswapV2LikeDex, randomDexAddress } = await loadFixture(deployRandomConnectorContract);
            
            const dexName = await uniswapV2LikeDex.dexName();
            expect(dexName).equals("Random Dex");

            const routerAddress = await uniswapV2LikeDex.routerAddress();
            expect(routerAddress).equals(randomDexAddress.address);

            let isEnabled = await uniswapV2LikeDex.enabled();
            expect(isEnabled).equals(false);

            await expect(uniswapV2LikeDex.enableConnector())
                .emit(uniswapV2LikeDex, "DexConnectorEnabledEvent")
                .withArgs(await uniswapV2LikeDex.getAddress());

            isEnabled = await uniswapV2LikeDex.enabled();
            expect(isEnabled).equals(true);
        });

        it("Should Not Enable Connector Contract When Not Owner", async function () {
            const { uniswapV2LikeDex, otherAccount } = await loadFixture(deployRandomConnectorContract);
            
            await expect(uniswapV2LikeDex.connect(otherAccount).enableConnector())
                .revertedWithCustomError(uniswapV2LikeDex, "OwnableUnauthorizedAccount")
                .withArgs(otherAccount);
        });

        it("Should Not Enable Connector Contract When Enabled", async function () {
            const { uniswapV2LikeDex, randomDexAddress, owner, otherAccount } = await loadFixture(deployRandomConnectorContract);
            
            await uniswapV2LikeDex.enableConnector();
            await expect(uniswapV2LikeDex.enableConnector())
                .revertedWithCustomError(uniswapV2LikeDex, "DexConnectorEnabledError")
                .withArgs(await uniswapV2LikeDex.getAddress());
        });
    });

    describe("Disable Connector Contract", function () {

        async function EnableConnectorContract() {
            const { uniswapV2LikeDex, randomDexAddress, owner, otherAccount } = await deployRandomConnectorContract();
            await uniswapV2LikeDex.enableConnector();
            return { uniswapV2LikeDex, randomDexAddress, owner, otherAccount };
        }

        it("Should Disable Connector Contract", async function () {
            const { uniswapV2LikeDex, randomDexAddress } = await loadFixture(EnableConnectorContract);

            const dexName = await uniswapV2LikeDex.dexName();
            expect(dexName).equals("Random Dex");

            const routerAddress = await uniswapV2LikeDex.routerAddress();
            expect(routerAddress).equals(randomDexAddress.address);

            let isEnabled = await uniswapV2LikeDex.enabled();
            expect(isEnabled).equals(true);

            await expect(uniswapV2LikeDex.disableConnector())
                .emit(uniswapV2LikeDex, "DexConnectorDisabledEvent")
                .withArgs(await uniswapV2LikeDex.getAddress());

            isEnabled = await uniswapV2LikeDex.enabled();
            expect(isEnabled).equals(false);
        })

        it("Should Not Disable Connector Contract When Not Owner", async function () {
            const { uniswapV2LikeDex, otherAccount } = await loadFixture(EnableConnectorContract);
            
            await expect(uniswapV2LikeDex.connect(otherAccount).disableConnector())
                .revertedWithCustomError(uniswapV2LikeDex, "OwnableUnauthorizedAccount")
                .withArgs(otherAccount);
        })

        it("Should Not Disable Connector Contract When Disabled", async function () {
            const { uniswapV2LikeDex } = await loadFixture(EnableConnectorContract);
            
            await uniswapV2LikeDex.disableConnector();
            await expect(uniswapV2LikeDex.disableConnector())
                .revertedWithCustomError(uniswapV2LikeDex, "DexConnectorDisabledError")
                .withArgs(await uniswapV2LikeDex.getAddress());
        })
    })
});