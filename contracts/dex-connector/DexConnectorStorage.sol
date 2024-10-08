// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.24;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import "hardhat/console.sol";

contract DexConnectorStorage is Ownable {

    event DexConnectorAddedEvent(address connectorContractAddress);
    event DexConnectorRemovedEvent(address connectorContractAddress);

    error DexConnectorFoundError(address connectorContractAddress);
    error DexConnectorNotFoundError(address connectorContractAddress);
    error InvalidAddressError();

    // Maps the `Connector Address` to the `index` of the entry in dexes list
    mapping (address => uint256) public dexIndexes;
    address[] public dexes;

    constructor() Ownable(msg.sender) {}

    function addConnectorContract(address _connectorAddress) external onlyOwner validAddress(_connectorAddress) connectorContractNotFound(_connectorAddress) {
        dexes.push(_connectorAddress);
        dexIndexes[_connectorAddress] = dexes.length - 1;
        emit DexConnectorAddedEvent(_connectorAddress);
    }

    function removeConnectorContract(address _connectorAddress) external onlyOwner validAddress(_connectorAddress) connectorContractFound(_connectorAddress) {
        uint256 indexToRemove = dexIndexes[_connectorAddress];
        uint256 lastIndex = dexes.length - 1;

        if (indexToRemove != lastIndex) {
            address lastDex = dexes[lastIndex];
            dexes[indexToRemove] = lastDex;
            dexIndexes[lastDex] = indexToRemove;
        }

        dexes.pop();
        delete dexIndexes[_connectorAddress];
        emit DexConnectorRemovedEvent(_connectorAddress);
    }

    function getDexes() external view returns(address[] memory) {
        return dexes;
    }

    modifier connectorContractFound(address _connectorAddress) {
        if(dexes.length == 0 || dexes[dexIndexes[_connectorAddress]] != _connectorAddress) {
            revert DexConnectorNotFoundError(_connectorAddress);
        }
        _;
    }

    modifier connectorContractNotFound(address _connectorAddress) {
        if(dexes.length > 0 && dexes[dexIndexes[_connectorAddress]] == _connectorAddress) {
            revert DexConnectorFoundError(_connectorAddress);
        }
        _;
    }

    modifier validAddress(address _connectorAddress) {
        if(_connectorAddress == address(0)) {
            revert InvalidAddressError();
        }
        _;
    }
}