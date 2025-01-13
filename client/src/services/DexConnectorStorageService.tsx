import { Signer } from 'ethers';
import { MosaicaContract } from "./MosaicaContract";
import ErrorHandlerService from "./ErrorHandlerService"
import DexConnectorStorage from "../artifacts/contracts/dex-connector/DexConnectorStorage.sol/DexConnectorStorage.json";

export default class DexConnectorStorageService extends MosaicaContract {

    constructor(signer: Signer, contractAddress: string) {
        super(signer, DexConnectorStorage.abi, contractAddress);
    }

    async addConnectorContract(connectorAddress: string) {
        try {
            const tx =  await this.contract.addConnectorContract(connectorAddress);
            await tx.wait();
        } catch (e) {
            console.error(e);
            ErrorHandlerService.handleError(e);
            throw e;
        }
    }

    async removeConnectorContract(connectorAddress: string) {
        try {
            const tx =  await this.contract.removeConnectorContract(connectorAddress);
            await tx.wait();
        } catch (e) {
            console.error(e);
            ErrorHandlerService.handleError(e);
            throw e;
        }
    }

    async getDexes(): Promise<string[]> {
        let dexes: string[] = [];
        try {
            dexes = await this.contract.getDexes();
        } catch (e) {
            console.error(e);
            ErrorHandlerService.handleError(e);
            throw e;
        }

        return dexes;
    }
}