import { DexPrice } from "../components/interfaces";
import DexConnectorService from "./DexConnectorService";

export const getCurrentPrices = async (
    dexConnectorServices: DexConnectorService[],
    assetAddress: string,
    baseAssetAddress: string,
    amount: bigint,
): Promise<DexPrice> => {
    const fetchedPrices: DexPrice = {};
    await Promise.all(
        dexConnectorServices.map(async (dcs) => {
            const isEnabled = await dcs.isEnabled();
            if (isEnabled) {
                const dexName = await dcs.getDexName();
                const dexAddress = dcs.getContractAddress();
                let price = 0n;
                try {
                    price = await dcs.getPrice(assetAddress, baseAssetAddress, amount);
                } catch {
                    // TODO: Add console error here
                }
                fetchedPrices[dexAddress] = { dexName, price };
            }
        }),
    );

    const sortedDexPrices = Object.entries(fetchedPrices)
        .filter(([, details]) => details.price > 0n)
        .sort(([, a], [, b]) => (a.price > b.price ? -1 : a.price < b.price ? 1 : 0))
        .reduce<DexPrice>((acc, [address, details]) => {
            acc[address] = details;
            return acc;
        }, {});

    return sortedDexPrices;
};
