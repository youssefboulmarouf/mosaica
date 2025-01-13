import { ethers, Contract, Signer, Interface, InterfaceAbi } from 'ethers';

export class MosaicaContract {
    public contract: Contract;
    public contractAddress: string;

    constructor(signer: Signer, abi: Interface | InterfaceAbi, contractAddress: string) {
        this.contract = new ethers.Contract(contractAddress, abi, signer);
        this.contractAddress = contractAddress;
    }

    getContractAddress(): string {
        return this.contractAddress;
    }

    async getOwnerAddress(): Promise<string> {
        return await this.contract.owner();
    }
}