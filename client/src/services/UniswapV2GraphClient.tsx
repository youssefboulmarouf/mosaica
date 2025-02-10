import { cacheExchange, Client, createClient, fetchExchange, gql } from "urql";
import tokens from "../data/tokens.json";
import { DefaultAddresses, Price } from "../components/interfaces";

export default class UniswapV2GraphClient {
    private static instance: UniswapV2GraphClient | null = null;
    private client: Client;

    constructor(API_KEY: string) {
        this.client = createClient({
            url:
                "https://gateway.thegraph.com/api/" +
                API_KEY +
                "/subgraphs/id/A3Np3RQbaBA6oKJgiwDJeo5T3zrYfGHPWFYayMwtNDum",
            exchanges: [cacheExchange, fetchExchange],
        });
    }

    private static getInstance(): UniswapV2GraphClient {
        if (!UniswapV2GraphClient.instance) {
            const key = process.env.REACT_APP_GRAPH_API_KEY || "";
            UniswapV2GraphClient.instance = new UniswapV2GraphClient(key);
        }
        return UniswapV2GraphClient.instance;
    }

    private static isStable(tokenAddress: string): boolean {
        const token = tokens.filter(t => t.address === tokenAddress).at(0);
        return !!token?.stable;
    }

    public static async fetchPrices(token: string): Promise<Price[]> {
        const QUERY = gql`
            query($tokenA: String!, $tokenB: String!) {
                pairDayDatas(
                    first: 90
                    orderBy: date
                    orderDirection: desc
                    where: {
                        or: [
                            { and: [{ token0: $tokenA }, { token1: $tokenB }] }
                            { and: [{ token0: $tokenB }, { token1: $tokenA }] }
                        ]
                    }
                ) {
                    id
                    date
                    token0 {
                        id
                        symbol
                    }
                    token1 {
                        id
                        symbol
                    }
                    reserve0
                    reserve1
                    reserveUSD
                }
            }
        `;

        const variables = {
            tokenA: token.toLowerCase(),
            tokenB: DefaultAddresses.WETH.toLowerCase()
        };
        
        try {
            const response = await UniswapV2GraphClient.getInstance().client.query(QUERY, variables).toPromise();
            
            const prices: Price[] = response.data.pairDayDatas.map((data: any) => {
                let tokenPriceWithEth = (parseFloat(data.reserve1) / parseFloat(data.reserve0)).toString();
                let ethPriceWithToken = (parseFloat(data.reserve0) / parseFloat(data.reserve1)).toString();
                let tokenpriceWithUsd = "1";

                if (!this.isStable(token)) {
                    tokenpriceWithUsd = (parseFloat(data.reserveUSD) / parseFloat(data.reserve0)).toString();
                }

                return {
                    date: data.date,
                    tokenPriceWithEth,
                    ethPriceWithToken,
                    tokenpriceWithUsd,
                };
            });

            return prices;
        } catch (error: any) {
            console.error("Error fetching prices:", error.message);
            throw error;
        }
    }
}
