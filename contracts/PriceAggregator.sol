// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.24;

import {DexConnector} from "./dex-connector/connectors/DexConnector.sol";
import {DexConnectorStorage} from "./dex-connector/DexConnectorStorage.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import "hardhat/console.sol";

contract PriceAggregator is Ownable {
    struct DexPrice {
        address connectorAddress;
        uint price;
    }

    DexConnectorStorage dexConnectorStorage;
    
    constructor(address _dexConnectorStorageAddress) Ownable(msg.sender) {
        dexConnectorStorage = DexConnectorStorage(_dexConnectorStorageAddress);
    }

    function getPrices(address asset, address baseToken, uint256 amount) external view returns (DexPrice[] memory dexPrices) {
        address[] memory dexes = dexConnectorStorage.getDexes();
        uint count = enabledDexesCount(dexes);
        dexPrices = new DexPrice[](count);

        uint dexPricesIndex;
        for (uint dexesIndex = 0; dexesIndex < dexes.length; dexesIndex++) {
            DexConnector dex = DexConnector(dexes[dexesIndex]);
            if (dex.enabled()) {
                dexPrices[dexPricesIndex] = DexPrice(
                    dexes[dexesIndex],
                    fetchPrice(dex, asset, baseToken, amount)
                );
                dexPricesIndex++;
            }
        }
    }

    function enabledDexesCount(address[] memory dexes) internal view returns(uint count) {
        for (uint i = 0; i < dexes.length; i++) {
            DexConnector dex = DexConnector(dexes[i]);
            if (dex.enabled()) {
                count++;
            }
        }
    }

    function fetchPrice(DexConnector dex, address asset, address baseToken, uint256 amount) internal view returns(uint256) {
        try dex.getPrice(asset, baseToken, amount) returns (uint256 price) {
            return price;
        } catch  {
            return 0;
        }
    }
}