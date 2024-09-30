// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.24;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

abstract contract DexConnector is Ownable {
    string public dexName;
    bool public enabled;

    event DexConnectorEnabledEvent(address connectorContractAddress);
    event DexConnectorDisabledEvent(address connectorContractAddress);

    error DexConnectorDisabledError(address connectorContractAddress);
    error DexConnectorEnabledError(address connectorContractAddress);

    function getPrice(address token1, address token2, uint256 amount) external view virtual returns(uint);
    function swapTokens(address token1, address token2, uint256 amount, uint256 minReturn) external virtual;

    function enableConnector() external onlyOwner connectorDisabled {
        enabled = true;
        emit DexConnectorEnabledEvent(address(this));
    }

    function disableConnector() external onlyOwner connectorEnabled {
        enabled = false;
        emit DexConnectorDisabledEvent(address(this));
    }

    modifier connectorDisabled() {
        if(enabled) {
            revert DexConnectorEnabledError(address(this));
        } 
        _;
    }

    modifier connectorEnabled() {
        if(! enabled) {
            revert DexConnectorDisabledError(address(this));
        }
        _;
    }
}