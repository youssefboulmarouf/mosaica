// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.24;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {MosaicaLib} from "../../MosaicaUtils.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/**
 * @title DexConnector
 * @dev Abstract contract providing a base interface for a decentralized exchange (DEX) connector.
 * Enables functionality for token swaps and price retrieval for tokens on integrated DEXs.
 * The contract includes a mechanism to enable or disable the connector and enforces various rules on swap operations.
 * Only the contract owner can enable or disable the connector.
 */
abstract contract DexConnector is Ownable {
    // Name of the DEX connected through this contract
    string public dexName;

    // Boolean indicating if this connector is currently enabled
    bool public enabled;

    /**
     * @dev Retrieves the price of `amount` of `srcToken` in terms of `destToken`.
     * Abstract function to be implemented by inheriting contracts.
     *
     * @param srcToken The address of the source token.
     * @param destToken The address of the destination token.
     * @param amount The amount of the source token to get the price for.
     * @return The price of the specified amount of `srcToken` in terms of `destToken`.
     */
    function getPrice(address srcToken, address destToken, uint256 amount) 
        public view virtual
        returns(uint);

    /**
     * @dev Swaps ETH for a specified token and transfers to the specified address.
     * Abstract internal function to be implemented by inheriting contracts.
     *
     * @param destToken The address of the token to receive in exchange for ETH.
     * @param to The address to receive the tokens.
     * @param amount The amount of ETH to swap.
     * @param slippage The maximum acceptable slippage percentage.
     * @return The amount of `destToken` received from the swap.
     */
    function swapEthForTokens(address destToken, address to, uint256 amount, uint slippage) 
        internal virtual
        returns (uint256);
    
    /**
     * @dev Swaps a specified token for ETH and transfers to the specified address.
     * Abstract internal function to be implemented by inheriting contracts.
     *
     * @param srcToken The address of the token to exchange for ETH.
     * @param to The address to receive ETH.
     * @param amount The amount of `srcToken` to swap.
     * @param slippage The maximum acceptable slippage percentage.
     * @return The amount of ETH received from the swap.
     */
    function swapTokensForEth(address srcToken, address to, uint256 amount, uint slippage) 
        internal virtual
        returns (uint256);

    /**
     * @dev Swaps a specified amount of one token for another and transfers to the specified address.
     * Abstract internal function to be implemented by inheriting contracts.
     *
     * @param srcToken The address of the token to swap.
     * @param destToken The address of the token to receive.
     * @param to The address to receive `destToken`.
     * @param amount The amount of `srcToken` to swap.
     * @param slippage The maximum acceptable slippage percentage.
     * @return The amount of `destToken` received from the swap.
     */
    function swapTokensForTokens(address srcToken, address destToken, address to, uint256 amount, uint256 slippage) 
        internal virtual
        returns (uint256);

    /**
     * @dev Calculates the minimum amount expected after applying slippage.
     * Calls the `getPrice` function to fetch the current price of the tokens.
     *
     * @param srcToken The address of the source token.
     * @param destToken The address of the destination token.
     * @param amount The amount of the source token.
     * @param slippage The acceptable slippage percentage.
     * @return The minimum amount expected after slippage.
     */
    function getMinAmountExpected(address srcToken, address destToken, uint256 amount, uint256 slippage) 
        internal view
        returns (uint256) 
        {
            uint256 expectedRate = getPrice(srcToken, destToken, amount);
            return expectedRate - ((expectedRate * slippage) / 100);
        }
    
    /**
     * @dev Transfers tokens from the caller and approves a specified address to spend them.
     *
     * @param token The address of the token to transfer.
     * @param to The address to approve for spending.
     * @param amount The amount of tokens to transfer and approve.
     *
     * Requirements:
     * - The caller must have approved this contract to spend `amount` tokens on their behalf.
     */
    function transferAndApprove(address token, address to, uint256 amount)
        internal 
        {
            IERC20(token).transferFrom(msg.sender, address(this), amount);
            IERC20(token).approve(to, amount);
        }

    /**
     * @dev Executes a token swap between two tokens or between a token and ETH.
     * Emits a `TokenSwapEvent` on a successful swap.
     *
     * @param srcToken The address of the source token.
     * @param destToken The address of the destination token.
     * @param to The address to receive the destination token.
     * @param amount The amount of the source token to swap.
     * @param slippage The maximum acceptable slippage percentage.
     *
     * Requirements:
     * - The `srcToken` and `destToken` must not be the same.
     * - If `srcToken` is ETH, `msg.value` must equal `amount` and be greater than 0.
     * - The function reverts if the swap fails or returns zero.
     */
    function swapTokens(address srcToken, address destToken, address to, uint256 amount, uint256 slippage) 
        external payable 
        differentTokens(srcToken, destToken) equalsEthValueAndAmount(srcToken, amount) positiveEthValue(srcToken)
        returns(uint256 destAmount)
        {
            if (MosaicaLib.isEth(srcToken)) {
                destAmount = swapEthForTokens(destToken, to, amount, slippage);
            } else if (MosaicaLib.isEth(destToken)) {
                destAmount = swapTokensForEth(srcToken, to, amount, slippage);
            } else {
                destAmount = swapTokensForTokens(srcToken, destToken, to, amount, slippage);
            }
            require(destAmount > 0, "Trade failed");
            emit MosaicaLib.TokenSwapEvent(srcToken, destToken, amount);
        }

    /**
     * @dev Enables the connector, allowing it to be used for swaps.
     * Only callable by the owner when the connector is disabled.
     * Emits a `DexConnectorEnabledEvent`.
     */
    function enableConnector() 
        external 
        onlyOwner connectorDisabled 
        {
            enabled = true;
            emit MosaicaLib.DexConnectorEnabledEvent(address(this));
        }

    /**
     * @dev Disables the connector, preventing its use for swaps.
     * Only callable by the owner when the connector is enabled.
     * Emits a `DexConnectorDisabledEvent`.
     */
    function disableConnector() 
        external 
        onlyOwner connectorEnabled 
        {
            enabled = false;
            emit MosaicaLib.DexConnectorDisabledEvent(address(this));
        }

     /**
     * @dev Modifier that requires the connector to be disabled.
     * Reverts with `DexConnectorEnabledError` if the connector is already enabled.
     */
    modifier connectorDisabled() {
        if(enabled) {
            revert MosaicaLib.DexConnectorEnabledError(address(this));
        } 
        _;
    }

    /**
     * @dev Modifier that requires the connector to be enabled.
     * Reverts with `DexConnectorDisabledError` if the connector is disabled.
     */
    modifier connectorEnabled() {
        if(!enabled) {
            revert MosaicaLib.DexConnectorDisabledError(address(this));
        }
        _;
    }

    /**
     * @dev Modifier that requires `srcToken` and `destToken` to be different.
     * Reverts with `IdenticalTokens` if the tokens are the same.
     */
    modifier differentTokens(address srcToken, address destToken) {
        if (srcToken == destToken) {
            revert MosaicaLib.IdenticalTokens();
        }
        _;
    }

    /**
     * @dev Modifier that requires `msg.value` to be positive when `srcToken` to be ETH.
     * Reverts with `MissingEthValue` if `msg.value` is zero when `srcToken` is ETH.
     */
    modifier positiveEthValue(address srcToken) {
        if (MosaicaLib.isEth(srcToken) && msg.value == 0) {
            revert MosaicaLib.MissingEthValue();
        }
        _;
    }

    /**
     * @dev Modifier that requires `msg.value` to equal `amount` when `srcToken` is ETH.
     * Reverts with `ReceivedDifferentEthValueAndAmount` if the values do not match.
     */
    modifier equalsEthValueAndAmount(address srcToken, uint256 amount) {
        if (MosaicaLib.isEth(srcToken) && msg.value != amount) {
            revert MosaicaLib.ReceivedDifferentEthValueAndAmount();
        }
        _;
    }
}