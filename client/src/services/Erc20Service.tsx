import { ethers, Contract, Signer } from 'ethers';
import ERC20 from "../artifacts/@openzeppelin/contracts/token/ERC20/ERC20.sol/ERC20.json"
import ErrorHandlerService from './ErrorHandlerService';

export default class Erc20Service {
    private contract: Contract;
    
    constructor(signer: Signer, assetAddress: string) {
        this.contract = new ethers.Contract(assetAddress, ERC20.abi, signer);
    }

    async getName(): Promise<string> {
        let name: string = "";
        try {
            name = await this.contract.name();
        } catch (e) {
            console.error(e);
            ErrorHandlerService.handleError(e);
            throw e;
        }

        return name;
    }

    async getSymbol(): Promise<string> {
        let symbol: string = "";
        try {
            symbol = await this.contract.symbol();
        } catch (e) {
            console.error(e);
            ErrorHandlerService.handleError(e);
            throw e;
        }

        return symbol;
    }

    async getDecimals(): Promise<bigint> {
        let decimals: bigint = BigInt(0);
        try {
            decimals = await this.contract.decimals();
        } catch (e) {
            console.error(e);
            ErrorHandlerService.handleError(e);
            throw e;
        }

        return decimals;
    }

    async getBalance(address: string): Promise<bigint> {
        let balance: bigint = BigInt(0);
        try {
            balance = await this.contract.balanceOf(address);
        } catch (e) {
            console.error(e);
            ErrorHandlerService.handleError(e);
            throw e;
        }

        return balance;
    }

    async approve(spender: string, amount: bigint) {
        try {
            const tx = await this.contract.approve(spender, amount);
            await tx.wait();
        } catch (e) {
            console.error(e);
            ErrorHandlerService.handleError(e);
            throw e;
        }
    }

    async allowance(owner: string, spender: string): Promise<bigint> {
        let value: bigint = BigInt(0);
        try {
            value = await this.contract.allowance(owner, spender);
        } catch (e) {
            console.error(e);
            ErrorHandlerService.handleError(e);
            throw e;
        }
        return value;
    }
}