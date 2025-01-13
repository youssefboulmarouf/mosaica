import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";

const config: HardhatUserConfig = {
  paths: {
    artifacts: 'client/src/artifacts'
  },
  solidity: "0.8.27",
};

export default config;
