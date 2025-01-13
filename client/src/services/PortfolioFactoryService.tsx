import { EventLog, Signer } from "ethers";
import { MosaicaContract } from "./MosaicaContract";
import ErrorHandlerService from "./ErrorHandlerService";
import PortfolioFactory from "../artifacts/contracts/portfolio/PortfolioFactory.sol/PortfolioFactory.json";
import { PortfolioCreatedEvent, PortfolioParam } from "../components/interfaces";

export default class PortfolioFactoryService extends MosaicaContract {
    constructor(signer: Signer, contractAddress: string) {
        super(signer, PortfolioFactory.abi, contractAddress);
    }

    async createPortfolio(params: PortfolioParam[], ethAmount: bigint) {
        try {
            const tx = await this.contract.createPortfolio(params, { value: ethAmount });
            await tx.wait();
        } catch (e) {
            console.error(e);
            ErrorHandlerService.handleError(e);
            throw e;
        }
    }

    async deletePortfolio(portfolioAddress: string) {
        try {
            const tx = await this.contract.deletePortfolio(portfolioAddress);
            await tx.wait();
        } catch (e) {
            console.error(e);
            ErrorHandlerService.handleError(e);
            throw e;
        }
    }

    async getPortfolios(address: string): Promise<string[]> {
        let portfolios: string[] = [];
        try {
            portfolios = await this.contract.getPortfolios(address);
        } catch (e) {
            console.error(e);
            ErrorHandlerService.handleError(e);
            throw e;
        }

        return portfolios;
    }

    async getPortfolioCreatedEvent(portfolioAddress: string): Promise<PortfolioCreatedEvent | null> {
        try {
            const filter = this.contract.filters.PortfolioCreated(portfolioAddress);
            const events = await this.contract.queryFilter(filter);
            if (events.length > 0) {
                const event = events[0] as EventLog;
                return {
                    portfolioAddress: event.args.portfolioAddress,
                    owner: event.args.owner,
                    timestamp: event.args.timestamp,
                };
            }

            return null;
        } catch (e) {
            console.error(e);
            ErrorHandlerService.handleError(e);
            throw e;
        }
    }
}
