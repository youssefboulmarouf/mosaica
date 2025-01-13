import { Signer } from 'ethers';
import Erc20Service from "./Erc20Service";
import { DefaultAddresses } from '../components/interfaces';

interface Erc20Data {
    erc20Address: string; 
    erc20Name: string; 
    erc20Symbol: string; 
    erc20Decimals: bigint;
}

interface Erc20DataMap {
    [erc20Address: string]: Erc20Data
}

export class Erc20DataHolder {
    private static instance: Erc20DataHolder | null = null;
    private erc20Data: Erc20DataMap=  {};

    public static getInstance(): Erc20DataHolder {
        if (!Erc20DataHolder.instance) {
            Erc20DataHolder.instance = new Erc20DataHolder();
        }
        return Erc20DataHolder.instance;
    }

    async fetchErc20Data(account: Signer, address: string): Promise<Erc20Data> {
        if (!this.erc20Data[address]) {
            if (address === DefaultAddresses.ETH) {
                this.erc20Data[DefaultAddresses.ETH] = {
                    erc20Address: DefaultAddresses.ETH,
                    erc20Name: "Ethereum",
                    erc20Symbol: "ETH",
                    erc20Decimals: BigInt(18)
                };
            } else {
                const tokenContract = new Erc20Service(account, address);
                const name = await tokenContract.getName();
                const symbol = await tokenContract.getSymbol();
                const decimals = await tokenContract.getDecimals();

                this.erc20Data[address] = {
                    erc20Address: address,
                    erc20Name: name,
                    erc20Symbol: symbol,
                    erc20Decimals: decimals
                };
            }
        }
        return this.erc20Data[address];
    }

    loadErc20Data(address: string): Erc20Data {
        return this.erc20Data[address];
    }
    
    normalizeAmount(address: string, amount: string): bigint {
        if (amount === "0") {
            return 0n;
        }

        if (!amount || isNaN(Number(amount))) {
            throw new Error("Invalid amount");
        }

        const ercData: Erc20Data = this.erc20Data[address];

        const [integerPart, fractionalPart = ""] = amount.split(".");
        const paddedFraction = fractionalPart.padEnd(Number(ercData.erc20Decimals), "0").slice(0, Number(ercData.erc20Decimals));
        const normalizedAmount = BigInt(integerPart + paddedFraction);
    
        return normalizedAmount;
    };

    formatBalance(address: string, balance: bigint): string {
        const ercData: Erc20Data = this.erc20Data[address];
        const divisor = BigInt(10) ** ercData.erc20Decimals;
        const integerPart = balance / divisor;
        const fractionalPart = balance % divisor;
        return `${integerPart.toString()}.${fractionalPart.toString()}`;
    };
}