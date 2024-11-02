// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.24;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {MosaicaLib} from "../MosaicaUtils.sol";

/**
 * @title DexConnectorStorage
 * @dev This contract manages a list of decentralized exchange (DEX) connector contract addresses.
 * Only the contract owner can add or remove DEX connector addresses.
 * It maintains a list of these addresses and allows querying them, 
 * enabling the use of multiple DEX connectors for trading operations in a DeFi application.
 */
contract DexConnectorStorage is Ownable {
    
    // Mapping from DEX connector address to its index in the dexes array
    mapping (address => uint256) public dexIndexes;
    
    // Array holding all registered DEX connector addresses
    address[] public dexes;

    constructor() Ownable(msg.sender) {}

    /**
     * @dev Adds a new DEX connector contract address to the list of dexes.
     * Only callable by the contract owner. Ensures that the address is valid and not already registered.
     * Emits a {DexConnectorAddedEvent} event.
     *
     * @param connectorAddress The address of the DEX connector contract to add.
     *
     * Requirements:
     * - The `connectorAddress` must be a valid non-zero address.
     * - The `connectorAddress` must not already exist in the dexes list.
     */
    function addConnectorContract(address connectorAddress) 
        external 
        onlyOwner validAddress(connectorAddress) connectorContractNotFound(connectorAddress) 
        {
            dexes.push(connectorAddress);
            dexIndexes[connectorAddress] = dexes.length - 1;
            emit MosaicaLib.DexConnectorAddedEvent(connectorAddress);
        }

    /**
     * @dev Removes an existing DEX connector contract address from the list of dexes.
     * Only callable by the contract owner. Ensures the address exists before removal.
     * Emits a {DexConnectorRemovedEvent} event.
     *
     * @param connectorAddress The address of the DEX connector contract to remove.
     *
     * Requirements:
     * - The `connectorAddress` must exist in the dexes list.
     *
     * Note:
     * - The contract performs an optimized array deletion by swapping the last element with the one being removed.
     */
    function removeConnectorContract(address connectorAddress) 
        external 
        onlyOwner connectorContractFound(connectorAddress) 
        {
            uint256 indexToRemove = dexIndexes[connectorAddress];
            uint256 lastIndex = dexes.length - 1;

            if (indexToRemove != lastIndex) {
                address lastDex = dexes[lastIndex];
                dexes[indexToRemove] = lastDex;
                dexIndexes[lastDex] = indexToRemove;
            }

            dexes.pop();
            delete dexIndexes[connectorAddress];
            emit MosaicaLib.DexConnectorRemovedEvent(connectorAddress);
        }

    /**
     * @dev Returns the entire list of registered DEX connector addresses.
     *
     * @return An array of addresses of the registered DEX connectors.
     */
    function getDexes() 
        external view 
        returns(address[] memory) 
        {
            return dexes;
        }

    /**
     * @dev Modifier that requires the specified `connectorAddress` to be found in the dexes list.
     * Reverts if the address is not present in the list.
     *
     * @param connectorAddress The address of the DEX connector contract to verify.
     *
     * Requirements:
     * - The `connectorAddress` must be a valid entry in the dexes list.
     *
     * Reverts:
     * - If the `connectorAddress` does not exist in the dexes list, it reverts with a `DexConnectorNotFoundError`.
     */
    modifier connectorContractFound(address connectorAddress) {
        if(dexes.length == 0 || dexes[dexIndexes[connectorAddress]] != connectorAddress) {
            revert MosaicaLib.DexConnectorNotFoundError(connectorAddress);
        }
        _;
    }

    /**
     * @dev Modifier that requires the specified `connectorAddress` to not be found in the dexes list.
     * Reverts if the address is already present in the list.
     *
     * @param connectorAddress The address of the DEX connector contract to verify.
     *
     * Requirements:
     * - The `connectorAddress` must not be an entry in the dexes list.
     *
     * Reverts:
     * - If the `connectorAddress` is already registered, it reverts with a `DexConnectorFoundError`.
     */
    modifier connectorContractNotFound(address connectorAddress) {
        if(dexes.length > 0 && dexes[dexIndexes[connectorAddress]] == connectorAddress) {
            revert MosaicaLib.DexConnectorFoundError(connectorAddress);
        }
        _;
    }

    /**
     * @dev Modifier that ensures a valid (non-zero) `connectorAddress` is provided.
     * Reverts if the address is zero.
     *
     * @param connectorAddress The address of the DEX connector contract to validate.
     *
     * Requirements:
     * - `connectorAddress` must not be the zero address.
     *
     * Reverts:
     * - If `connectorAddress` is the zero address, it reverts with an `InvalidAddressError`.
     */
    modifier validAddress(address connectorAddress) {
        if(connectorAddress == address(0)) {
            revert MosaicaLib.InvalidAddressError();
        }
        _;
    }
}