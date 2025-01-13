import { Signer } from "ethers";
import { MosaicaContract } from "./MosaicaContract";
import ErrorHandlerService from "./ErrorHandlerService";
import Portfolio from "../artifacts/contracts/portfolio/Portfolio.sol/Portfolio.json";
import { PortfolioActionEvent, PortfolioEventType, PortfolioParam } from "../components/interfaces";

export default class PortfolioService extends MosaicaContract {
    constructor(signer: Signer, contractAddress: string) {
        super(signer, Portfolio.abi, contractAddress);
    }

    async getAssetBalance(asset: string): Promise<bigint> {
        let assetBalance: bigint = BigInt(0);
        try {
            assetBalance = await this.contract.getAssetBalance(asset);
        } catch (e) {
            console.error(e);
            ErrorHandlerService.handleError(e);
            throw e;
        }

        return assetBalance;
    }

    async getAssetAddresses(): Promise<string[]> {
        let addresses: string[] = [];
        try {
            addresses = await this.contract.getAssetAddresses();
        } catch (e) {
            console.error(e);
            ErrorHandlerService.handleError(e);
            throw e;
        }

        return addresses;
    }

    async addAsset(asset: string, amount: bigint, ethAmount: bigint) {
        try {
            const tx = await this.contract.addAsset(asset, amount, { value: ethAmount });
            await tx.wait();
        } catch (e) {
            console.error(e);
            ErrorHandlerService.handleError(e);
            throw e;
        }
    }

    async buyAssets(params: PortfolioParam[], ethAmount: bigint) {
        try {
            const tx = await this.contract.buyAssets(params, { value: ethAmount });
            await tx.wait();
        } catch (e) {
            console.error(e);
            ErrorHandlerService.handleError(e);
            throw e;
        }
    }

    async withdrawAssets(params: PortfolioParam[]) {
        try {
            const tx = await this.contract.withdrawAssets(params);
            await tx.wait();
        } catch (e) {
            console.error(e);
            ErrorHandlerService.handleError(e);
            throw e;
        }
    }

    async getPortfolioActionEvents(portfolioAddress: string): Promise<PortfolioActionEvent[]> {
        try {
            const addAssetFilter = this.contract.filters.AddAsset(portfolioAddress);
            const buyAssetFilter = this.contract.filters.BuyAsset(portfolioAddress);
            const withdrawAssetFilter = this.contract.filters.WithdrawAsset(portfolioAddress);

            const [addAssetEvents, buyAssetEvents, withdrawAssetEvents] = await Promise.all([
                this.contract.queryFilter(addAssetFilter),
                this.contract.queryFilter(buyAssetFilter),
                this.contract.queryFilter(withdrawAssetFilter),
            ]);

            const mappedEvents: PortfolioActionEvent[] = [
                ...addAssetEvents.map((event: any) => ({
                    eventType: PortfolioEventType.AddAsset,
                    portfolioAddress: event.args.portfolioAddress,
                    assetAddress: event.args.assetAddress,
                    amount: event.args.amount,
                    timestamp: event.args.timestamp
                })),
                ...buyAssetEvents.map((event: any) => ({
                    eventType: PortfolioEventType.BuyAsset,
                    portfolioAddress: event.args.portfolioAddress,
                    assetAddress: event.args.assetAddress,
                    amount: event.args.amount,
                    timestamp: event.args.timestamp
                })),
                ...withdrawAssetEvents.map((event: any) => ({
                    eventType: PortfolioEventType.WithdrawAsset,
                    portfolioAddress: event.args.portfolioAddress,
                    assetAddress: event.args.assetAddress,
                    amount: event.args.amount,
                    timestamp: event.args.timestamp
                })),
            ];

            return mappedEvents.sort((a, b) => parseFloat(a.timestamp.toString()) - parseFloat(b.timestamp.toString()));
        } catch (e) {
            console.error(e);
            ErrorHandlerService.handleError(e);
            throw e;
        }
    }
}
