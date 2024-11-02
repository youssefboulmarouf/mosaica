import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { expect } from "chai";
import { ethers } from "hardhat";
import * as testUtils from "./TestUtils";

describe("Dex Connector Storage", function () {

    async function AddRandomConnectorContract() {
        const randomDexAddress = ethers.Wallet.createRandom();
        const [owner, otherAccount] = await ethers.getSigners();
        const dexConnectorStorage = await testUtils.deployDexConnectorStorage();
        const uniswapV2LikeConnector = await testUtils.deployUniswapV2LikeConnectorContract("Random Dex", randomDexAddress.address);

        await dexConnectorStorage.addConnectorContract(await uniswapV2LikeConnector.getAddress());

        return { dexConnectorStorage, uniswapV2LikeConnector, randomDexAddress, owner, otherAccount };
    }

    describe("Add Connector Contract", function () {
        it("Should Add Connector Contract", async function () {
            const dexConnectorStorage = await loadFixture(testUtils.deployDexConnectorStorage);
            const uniswapV2LikeConnector = await testUtils.deployUniswapV2LikeConnectorContract("Random Dex", ethers.Wallet.createRandom().address);

            await expect(dexConnectorStorage.addConnectorContract(await uniswapV2LikeConnector.getAddress()))
                .emit(dexConnectorStorage, "DexConnectorAddedEvent")
                .withArgs(await uniswapV2LikeConnector.getAddress());
            
            const dexes = await dexConnectorStorage.getDexes();
            expect(dexes.length).equals(1);
            expect(dexes[0]).equals(await uniswapV2LikeConnector.getAddress());

            const DexConnectorFromAddress = await ethers.getContractAt("UniswapV2LikeConnector", dexes[0]);
            
            const dexName = await DexConnectorFromAddress.dexName();
            expect(dexName).equals("Random Dex");

            const isEnabled = await DexConnectorFromAddress.enabled();
            expect(isEnabled).equals(false);
        });

        it("Should Not Add Connector Contract When Not Owner", async function () {
            const { dexConnectorStorage, otherAccount } = await loadFixture(AddRandomConnectorContract);
            
            await expect(dexConnectorStorage.connect(otherAccount).addConnectorContract(ethers.Wallet.createRandom().address))
                .revertedWithCustomError(dexConnectorStorage, "OwnableUnauthorizedAccount")
                .withArgs(otherAccount);
        });

        it("Should Not Add Connector Contract With Invalid Address", async function () {
            const { dexConnectorStorage } = await loadFixture(AddRandomConnectorContract);
            
            await expect(dexConnectorStorage.addConnectorContract(ethers.ZeroAddress))
                .revertedWithCustomError(dexConnectorStorage, "InvalidAddressError");
        });

        it("Should Not Add Connector Contract When Found", async function () {
            const { dexConnectorStorage, uniswapV2LikeConnector } = await loadFixture(AddRandomConnectorContract);

            await expect(dexConnectorStorage.addConnectorContract(await uniswapV2LikeConnector.getAddress()))
                .revertedWithCustomError(dexConnectorStorage, "DexConnectorFoundError")
                .withArgs(await uniswapV2LikeConnector.getAddress());
        });
    });

    describe("Remove Connector Contract", function () {
        it("Should Remove Connector Contract", async function () {
            const { dexConnectorStorage } = await loadFixture(AddRandomConnectorContract);
            
            let dexes = await dexConnectorStorage.getDexes();
            expect(dexes.length).equals(1);

            await expect(dexConnectorStorage.removeConnectorContract(dexes[0]))
                .emit(dexConnectorStorage, "DexConnectorRemovedEvent")
                .withArgs(dexes[0])

            dexes = await dexConnectorStorage.getDexes();
            expect(dexes.length).equals(0);
        });

        it("Should Not Remove Connector Contract When Not Owner", async function () {
            const { dexConnectorStorage, otherAccount } = await loadFixture(AddRandomConnectorContract);
            
            await expect(dexConnectorStorage.connect(otherAccount).removeConnectorContract(ethers.Wallet.createRandom().address))
                .revertedWithCustomError(dexConnectorStorage, "OwnableUnauthorizedAccount")
                .withArgs(otherAccount);
        });

        it("Should Not Remove Connector Contract When Dex Not Found", async function () {
            const { dexConnectorStorage } = await loadFixture(AddRandomConnectorContract);
            const randomDexAddress = ethers.Wallet.createRandom();
            
            await expect(dexConnectorStorage.removeConnectorContract(randomDexAddress.address))
                .revertedWithCustomError(dexConnectorStorage, "DexConnectorNotFoundError")
                .withArgs(randomDexAddress.address);
        })
    });
});