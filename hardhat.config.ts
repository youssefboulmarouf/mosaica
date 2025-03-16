import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import * as dotenv from "dotenv";

dotenv.config();

const MAINNET_RPC_URL = process.env.MAINNET_RPC_URL || "";
const SEPOLIA_RPC_URL = process.env.SEPOLIA_RPC_URL || "";
const PRIVATE_KEY = process.env.PRIVATE_KEY || "";

const config: HardhatUserConfig = {
  networks: {
    hardhat: {
      forking: {
        url: MAINNET_RPC_URL,
        //blockNumber: 21457857,
      },
      gas: 300_000,
      initialBaseFeePerGas: 1_000_000,
      mining: {
        auto: true,
      },
    },
    sepolia: {
      url: SEPOLIA_RPC_URL,
      accounts: [PRIVATE_KEY],
    },
  },
  paths: {
    artifacts: 'client/src/artifacts'
  },
  solidity: "0.8.27",
};

export default config;
