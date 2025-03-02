# Mosaica - Decentralized Portfolio Management dApp 🎨📈

Mosaica is a Web3 decentralized application (dApp) that allows users to create, manage, and track crypto portfolios.  
By integrating multiple decentralized exchanges (DEXs), users can buy, add, and withdraw assets while getting the best prices across platforms like Uniswap and Kyber.

## 🚀 Features
✅ Multi-DEX Integration – Swap tokens via Uniswap, Kyber, and more \
✅ Create & Manage Portfolios – Buy, add, and withdraw assets securely \
✅ Real-time Portfolio Tracking – Monitor value changes with live charts \
✅ Best Price Execution – Aggregates prices from multiple DEXs \
✅ Admin Control Panel – Enable/disable DEX connectors dynamically

## 🏗 Tech Stack
**Smart Contracts:** Solidity, Hardhat \
**Frontend:** React, TypeScript, Material UI \
**Blockchain Interaction:** Ethers.js, The Graph API \
**Testing:** Hardhat, Chai, Mocha

## 🔧 Installation

### Project Structure
Mosaica consists of two main parts: \
📂 Root folder (/) → Contains the smart contracts and Hardhat setup \
📂 Client folder (/client) → Contains the React UI

### Clone the Repository
```
git clone https://github.com/youssefboulmarouf/mosaica.git
cd Mosaica
```

### Install Dependencies

#### Smart Contract Dependencies
Run the following command in the root folder (/):
```
npm install
```

#### Frontend (UI) Dependencies
Navigate to the client folder (/client) and run:
```
cd client
npm install
```

### 📜 Environment Variables Setup

#### Smart Contract Configuration (/.env)
Create a .env file in the root folder (/) and add your Alchemy or Infura RPC URL:
```
MAINNET_RPC_URL=<YOUR_ALCHEMY_OR_INFURA_URL>
```

#### Frontend Configuration (/client/.env)
Create a .env file in the client folder (/client) and add your Graph API Key:
```
REACT_APP_GRAPH_API_KEY=<YOUR_GRAPH_API_KEY>
```

## 🚀 Starting the Project
#### 1️⃣ Deploying Smart Contracts
1. Compile the contracts:
```
npx hardhat compile
```
2. Run a local Hardhat node (forking mainnet):
```
npx hardhat node
```
3. Deploy the contracts on localhost, in another terminal, run:
```
npx hardhat run ./scripts/deploy.ts --network localhost
```
#### 2️⃣ Starting the Frontend
Navigate to the client folder (/client) and run:
```
cd client
npm start
```

## 📜 Smart Contracts Overview
**DexConnector:**	Abstract base contract for DEX interactions \
**KyberConnector:**	Executes swaps & price retrieval via Kyber \
**UniswapV2LikeConnector:**	Executes swaps & price retrieval via UniswapV2 \
**DexConnectorStorage:**	Stores and manages available DEX connectors \
**PortfolioFactory:**	Creates and stores user portfolios \
**Portfolio:**	Manages assets, allowing buy/add/withdraw

## 📊 Architecture Diagram

## 🎥 Live Demo
Coming soon

## 🌟 Future Enhancements
🔹 **More Asset Types:** Support for NFTs, ENS domains, and Real-World Assets (RWA) \
🔹 **NFT-Based Portfolios:** Convert portfolios into tradeable NFTs, allowing users to buy and sell entire portfolios \
🔹 **More DEX Integrations:** Expanding to Curve, Balancer, and other liquidity sources \
🔹 **Cross-Chain Token Support:** Enable users to manage assets across multiple blockchains, integrating bridges for seamless token transfers

