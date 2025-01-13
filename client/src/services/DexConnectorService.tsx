import { Signer } from 'ethers';
import { MosaicaContract } from "./MosaicaContract";
import ErrorHandlerService from "./ErrorHandlerService"
import DexConnector from "../artifacts/contracts/dex-connector/connectors/DexConnector.sol/DexConnector.json"

export default class DexConnectorService extends MosaicaContract {

    constructor(signer: Signer, contractAddress: string) {
        super(signer, DexConnector.abi, contractAddress);
    }

    async getDexName(): Promise<string> {
        return await this.contract.dexName();
    }

    async isEnabled(): Promise<boolean> {
        return await this.contract.enabled();
    }

    async getPrice(srcToken: string, destToken: string, amount: bigint): Promise<bigint> {
        let price: bigint = BigInt(0);
        try {
            price =  await this.contract.getPrice(srcToken, destToken, amount);
        } catch (e) {
            console.error(e);
            ErrorHandlerService.handleError(e);
            throw e;
        }
        return price;
    }

    async swapTokens(srcToken: string, destToken: string, to: string, amount: bigint, slippage: bigint) {
        try {
            const tx =  await this.contract.swapTokens(srcToken, destToken, to, amount, slippage);
            await tx.wait();
        } catch (e) {
            console.error(e);
            ErrorHandlerService.handleError(e);
            throw e;
        }
    }

    async enableConnector() {
        try {
            const tx =  await this.contract.enableConnector();
            await tx.wait();
        } catch (e) {
            console.error(e);
            ErrorHandlerService.handleError(e);
            throw e;
        }
    }

    async disableConnector() {
        try {
            const tx =  await this.contract.disableConnector();
            await tx.wait();
        } catch (e) {
            console.error(e);
            ErrorHandlerService.handleError(e);
            throw e;
        }
    }
}