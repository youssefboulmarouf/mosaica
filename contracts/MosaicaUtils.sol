// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.24;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

interface IKyberNetworkProxy {
    function getExpectedRate(
        ERC20 src,
        ERC20 dest,
        uint256 srcQty
    ) external view returns (uint256 expectedRate, uint256 worstRate);

    function tradeWithHint(
        IERC20 srcToken,
        uint256 srcAmount,
        IERC20 destToken,
        address payable destAddress,
        uint256 maxDestAmount,
        uint256 minConversionRate,
        address walletId,
        bytes calldata hint
    ) external payable returns (uint256);
}

/**
 * @title MosaicaLib
 * @dev Library providing utilities, data structures, constants, events, and error definitions for DEX interactions.
 * Contains helper functions, symbolic ETH addresses, and custom errors for handling DEX-related operations in a unified manner.
 */
library MosaicaLib {

    /**
     * @dev Data structure defining parameters for portfolio actions involving asset swaps.
     * Used for specifying source and destination tokens, DEX connectors, and swap details.
     * @param srcToken The address of the source token to be swapped.
     * @param dexConnectorAddress The address of the DEX connector to use for the swap.
     * @param destToken The address of the destination token to receive after the swap.
     * @param amount The amount of the source token to swap.
     * @param slippage The maximum allowable slippage percentage for the swap.
     */
    struct PortfolioParam {
        address srcToken;
        address dexConnectorAddress;
        address destToken;
        uint256 amount;
        uint256 slippage;
    }
    
    /**
     * @dev Symbolic address representing ETH in contracts. This address is purely symbolic and is not a real account.
     * ETH_ADDRESS is used as a placeholder for ETH to differentiate it from ERC20 tokens.
     */
    address public constant ETH_ADDRESS = address(0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE);
    
    /**
     * @dev Kyber-specific symbolic address used to represent ETH in Kyber contracts.
     * Used for interactions with Kyber DEX connectors where ETH requires a unique placeholder address.
     */
    address public constant KYBER_ETH_ADDRESS = address(0x00eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee);
    
    /**
     * @dev The address of the Wrapped Ether (WETH) contract.
     * Used when wrapping or unwrapping ETH for compatibility with ERC20 token functions.
     */
    address public constant WETH_ADDRESS = 0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2;

    // Events

    /**
     * @dev Emitted when a DEX connector contract is enabled.
     * @param connectorContractAddress The address of the enabled DEX connector contract.
     */
    event DexConnectorEnabledEvent(address connectorContractAddress);

    /**
     * @dev Emitted when a DEX connector contract is disabled.
     * @param connectorContractAddress The address of the disabled DEX connector contract.
     */
    event DexConnectorDisabledEvent(address connectorContractAddress);

    /**
     * @dev Emitted when a new DEX connector is added.
     * @param connectorContractAddress The address of the newly added DEX connector contract.
     */
    event DexConnectorAddedEvent(address connectorContractAddress);

    /**
     * @dev Emitted when a DEX connector is removed.
     * @param connectorContractAddress The address of the removed DEX connector contract.
     */
    event DexConnectorRemovedEvent(address connectorContractAddress);

    /**
     * @dev Emitted when a token swap is completed.
     * @param srcToken The address of the source token swapped.
     * @param destToken The address of the destination token received.
     * @param amount The amount of the source token that was swapped.
     */
    event TokenSwapEvent(address srcToken, address destToken, uint256 amount);

    /**
     * @dev Emitted when a new portfolio is created.
     * @param portfolioAddress The address of the newly created portfolio contract.
     * @param owner The address of the owner of the new portfolio.
     * @param timestamp block timestamp.
     */
    event PortfolioCreated(address indexed portfolioAddress, address owner, uint256 timestamp);

    /**
     * @dev Emitted when an asset is added to a portfolio.
     * @param portfolioAddress The address of the portfolio contract.
     * @param assetAddress The address of the added asset.
     * @param amount The amount of the added asset.
     * @param timestamp block timestamp.
     */
    event AddAsset(address indexed portfolioAddress, address assetAddress, uint256 amount, uint256 timestamp);

    /**
     * @dev Emitted when an asset is bought for a given portfolio.
     * @param portfolioAddress The address of the portfolio contract.
     * @param assetAddress The address of the bought asset.
     * @param amount The amount of the bought asset.
     * @param timestamp block timestamp.
     */
    event BuyAsset(address indexed portfolioAddress, address assetAddress, uint256 amount, uint256 timestamp);

    /**
     * @dev Emitted when an asset is withdrawn to owner wallet.
     * @param portfolioAddress The address of the portfolio contract.
     * @param assetAddress The address of the withdrawn asset.
     * @param amount The amount of the withdrawn asset.
     * @param timestamp block timestamp.
     */
    event WithdrawAsset(address indexed portfolioAddress, address assetAddress, uint256 amount, uint256 timestamp);

    // Errors

    /**
     * @dev Error indicating that a DEX connector has already been added and cannot be added again.
     * @param connectorContractAddress The address of the existing DEX connector contract.
     */
    error DexConnectorFoundError(address connectorContractAddress);
    
    /**
     * @dev Error indicating that a specified DEX connector could not be found in the registry.
     * @param connectorContractAddress The address of the DEX connector contract not found.
     */
    error DexConnectorNotFoundError(address connectorContractAddress);
    
    /**
     * @dev Error indicating that a DEX connector is disabled and cannot be used.
     * @param connectorContractAddress The address of the disabled DEX connector.
     */
    error DexConnectorDisabledError(address connectorContractAddress);
    
    /**
     * @dev Error indicating that a DEX connector is enabled and cannot be modified in a way that requires it to be disabled.
     * @param connectorContractAddress The address of the enabled DEX connector.
     */
    error DexConnectorEnabledError(address connectorContractAddress);
    
    /**
     * @dev Error indicating that the user does not have enough balance of a specified token.
     * @param tokenAddress The address of the token with insufficient balance.
     */
    error NotEnoughBalance(address tokenAddress);
    
    /**
     * @dev Error indicating that the source and destination tokens are identical, which is invalid for swaps.
     */
    error IdenticalTokens();
    
    /**
     * @dev Error indicating that ETH value is missing for a function that requires it.
     */
    error MissingEthValue();
    
    /**
     * @dev Error indicating a mismatch between the ETH amount sent in `msg.value` and the required ETH amount.
     */
    error ReceivedDifferentEthValueAndAmount();
    
    /**
     * @dev Error indicating an invalid address, typically used for zero address checks.
     */
    error InvalidAddressError();

    error PortfolioDoesNotExists(address portfolioAddress);

    error PortfolioNotEmpty(address portfolioAddress);

    // Functions

    /**
     * @dev Checks if a token address represents ETH.
     *
     * @param tokenAddress The address to check.
     * @return `true` if the token address is the symbolic ETH address (`ETH_ADDRESS`), `false` otherwise.
     */
    function isEth(address tokenAddress) public pure returns(bool) {
        return tokenAddress == ETH_ADDRESS;
    }
}