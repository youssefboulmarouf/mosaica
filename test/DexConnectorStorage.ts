import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { expect } from "chai";
import { ethers } from "hardhat";

describe("Dex Connector Storage", function () {

    async function deployDexConnectorStorage() {
        const [owner, otherAccount] = await ethers.getSigners();
    
        const DexConnectorStorage = await ethers.getContractFactory("DexConnectorStorage");
        const dexConnectorStorage = await DexConnectorStorage.deploy();
        await dexConnectorStorage.waitForDeployment();

        return { dexConnectorStorage, owner, otherAccount };
    }

    async function AddRandomDex() {
        const { dexConnectorStorage, owner, otherAccount } = await deployDexConnectorStorage();

        const randomDexAddress = ethers.Wallet.createRandom();
        
        const UniswapV2LikeDex = await ethers.getContractFactory("UniswapV2LikeDex");
        const uniswapV2LikeDex = await UniswapV2LikeDex.deploy("Random Dex", randomDexAddress.address);
        await uniswapV2LikeDex.waitForDeployment();

        await dexConnectorStorage.addConnectorContract(await uniswapV2LikeDex.getAddress());

        return { dexConnectorStorage, uniswapV2LikeDex, randomDexAddress, owner, otherAccount };
    }

    describe("Add Connector Contract", function () {
        it("Should Add Connector Contract", async function () {
            const { dexConnectorStorage } = await loadFixture(deployDexConnectorStorage);
            const randomAddress = ethers.Wallet.createRandom();

            const UniswapV2LikeDex = await ethers.getContractFactory("UniswapV2LikeDex");
            const uniswapV2LikeDex = await UniswapV2LikeDex.deploy("Random Dex", randomAddress.address);
            await uniswapV2LikeDex.waitForDeployment();

            await expect(dexConnectorStorage.addConnectorContract(await uniswapV2LikeDex.getAddress()))
                .emit(dexConnectorStorage, "DexConnectorAddedEvent")
                .withArgs(await uniswapV2LikeDex.getAddress());
            
            const dexes = await dexConnectorStorage.getDexes();
            expect(dexes.length).equals(1);
            expect(dexes[0]).equals(await uniswapV2LikeDex.getAddress());

            const DexConnectorFromAddress = await ethers.getContractAt("UniswapV2LikeDex", dexes[0]);
            
            const dexName = await DexConnectorFromAddress.dexName();
            expect(dexName).equals("Random Dex");

            const isEnabled = await DexConnectorFromAddress.enabled();
            expect(isEnabled).equals(false);

            const dexAddress = await DexConnectorFromAddress.routerAddress();
            expect(dexAddress).equals(randomAddress.address);
        });

        it("Should Not Add Connector Contract When Not Owner", async function () {
            const { dexConnectorStorage, otherAccount } = await loadFixture(deployDexConnectorStorage);
            const randomAddress = ethers.Wallet.createRandom();
            
            await expect(dexConnectorStorage.connect(otherAccount).addConnectorContract(randomAddress.address))
                .revertedWithCustomError(dexConnectorStorage, "OwnableUnauthorizedAccount")
                .withArgs(otherAccount);
        });

        it("Should Not Add Connector Contract When Invalid Address", async function () {
            const { dexConnectorStorage } = await deployDexConnectorStorage();
            
            await expect(dexConnectorStorage.addConnectorContract(ethers.ZeroAddress))
                .revertedWithCustomError(dexConnectorStorage, "InvalidAddressError");
        });

        it("Should Not Add Connector Contract When Found", async function () {
            const { dexConnectorStorage } = await loadFixture(deployDexConnectorStorage);
            const randomAddress = ethers.Wallet.createRandom();
            
            const UniswapV2LikeDex = await ethers.getContractFactory("UniswapV2LikeDex");
            const uniswapV2LikeDex = await UniswapV2LikeDex.deploy("Random Dex", randomAddress.address);
            await uniswapV2LikeDex.waitForDeployment();
            
            await dexConnectorStorage.addConnectorContract(await uniswapV2LikeDex.getAddress());

            await expect(dexConnectorStorage.addConnectorContract(await uniswapV2LikeDex.getAddress()))
                .revertedWithCustomError(dexConnectorStorage, "DexConnectorFoundError")
                .withArgs(await uniswapV2LikeDex.getAddress());
        });
    });

    describe("Remove Connector Contract", function () {
        it("Should Remove Connector Contract", async function () {
            const { dexConnectorStorage } = await loadFixture(AddRandomDex);
            
            let dexes = await dexConnectorStorage.getDexes();
            expect(dexes.length).equals(1);

            await expect(dexConnectorStorage.removeConnectorContract(dexes[0]))
                .emit(dexConnectorStorage, "DexConnectorRemovedEvent")
                .withArgs(dexes[0])

            dexes = await dexConnectorStorage.getDexes();
            expect(dexes.length).equals(0);
        });

        it("Should Not Remove Connector Contract When Not Owner", async function () {
            const { dexConnectorStorage, randomDexAddress, otherAccount } = await loadFixture(AddRandomDex);
            
            await expect(dexConnectorStorage.connect(otherAccount).removeConnectorContract(randomDexAddress.address))
                .revertedWithCustomError(dexConnectorStorage, "OwnableUnauthorizedAccount")
                .withArgs(otherAccount);
        });

        it("Should Not Add Connector Contract When Invalid Address", async function () {
            const { dexConnectorStorage } = await loadFixture(AddRandomDex);
            
            await expect(dexConnectorStorage.removeConnectorContract(ethers.ZeroAddress))
                .revertedWithCustomError(dexConnectorStorage, "InvalidAddressError");
        });

        it("Should Not Remove Connector Contract When Dex Not Found", async function () {
            const { dexConnectorStorage } = await loadFixture(AddRandomDex);
            const randomDexAddress = ethers.Wallet.createRandom();
            
            await expect(dexConnectorStorage.removeConnectorContract(randomDexAddress.address))
                .revertedWithCustomError(dexConnectorStorage, "DexConnectorNotFoundError")
                .withArgs(randomDexAddress.address);
        })
    });
});