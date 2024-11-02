// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.24;

import {IUniswapV2Router02} from "@uniswap/v2-periphery/contracts/interfaces/IUniswapV2Router02.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {DexConnector} from "./DexConnector.sol";
import {MosaicaLib} from "../../MosaicaUtils.sol";
import {IKyberNetworkProxy} from "../../MosaicaUtils.sol";

/**
 * @title KyberConnector
 * @dev DEX connector for interacting with the Kyber Network for token swaps and price retrieval.
 * Inherits from DexConnector to provide a unified interface for swapping ETH, ERC20 tokens, and retrieving prices.
 * The contract includes functions for getting exchange rates, swapping ETH for tokens, tokens for ETH, and tokens for tokens.
 */
contract KyberConnector is DexConnector {
    
    // Interface to interact with the Kyber Network Proxy contract
    IKyberNetworkProxy public kyberNetworkProxy;

    /**
     * @dev Sets up the KyberConnector with a specified Kyber Network Proxy address.
     * The connector is initialized as disabled, and the dexName is set to "Kyber".
     *
     * @param _kyberNetwork The address of the Kyber Network Proxy contract.
     */
    constructor(address _kyberNetwork) Ownable(msg.sender) {
        dexName = "Kyber";
        enabled = false;
        kyberNetworkProxy = IKyberNetworkProxy(_kyberNetwork);
    }

    /**
     * @dev Retrieves the expected price for swapping a specific amount of `srcToken` to `destToken` on Kyber.
     * Uses the Kyber Network Proxy to fetch the expected rate for the token pair.
     *
     * @param srcToken The address of the source token.
     * @param destToken The address of the destination token.
     * @param amount The amount of the source token to get the price for.
     * @return The expected rate for converting `amount` of `srcToken` to `destToken`.
     *
     * Requirements:
     * - `srcToken` and `destToken` must be different.
     */
    function getPrice(address srcToken, address destToken, uint256 amount) 
        public view override 
        differentTokens(srcToken, destToken)
        returns(uint) 
        {
            ERC20 ercSrcToken = MosaicaLib.isEth(srcToken) ? ERC20(MosaicaLib.KYBER_ETH_ADDRESS) : ERC20(srcToken); 
            ERC20 ercDestToken = MosaicaLib.isEth(destToken) ? ERC20(MosaicaLib.KYBER_ETH_ADDRESS) : ERC20(destToken); 
            (uint256 expectedRate, ) = kyberNetworkProxy.getExpectedRate(ercSrcToken, ercDestToken, amount);
            return expectedRate;
        }

    /**
     * @dev Swaps ETH for a specified token using Kyber Network and transfers the tokens to a recipient.
     *
     * @param destToken The address of the token to receive.
     * @param to The address to receive the tokens.
     * @param amount The amount of ETH to swap.
     * @param slippage The acceptable slippage percentage.
     * @return The amount of `destToken` received from the swap.
     */
    function swapEthForTokens(address destToken, address to, uint256 amount, uint slippage) 
        internal override
        returns (uint256)
        {
            return kyberNetworkProxy.tradeWithHint{value: amount}(
                IERC20(MosaicaLib.KYBER_ETH_ADDRESS),
                amount,
                IERC20(destToken),
                payable(to),
                type(uint256).max,
                getMinAmountExpected(MosaicaLib.KYBER_ETH_ADDRESS, destToken, amount, slippage),
                address(0),
                "PERM"
            );
        }
    
    /**
     * @dev Swaps a specified token for ETH using Kyber Network and transfers the ETH to a recipient.
     *
     * @param srcToken The address of the token to swap.
     * @param to The address to receive the ETH.
     * @param amount The amount of `srcToken` to swap.
     * @param slippage The acceptable slippage percentage.
     * @return The amount of ETH received from the swap.
     *
     * Requirements:
     * - `srcToken` must have been transferred to the contract and approved for Kyber Network Proxy.
     */
    function swapTokensForEth(address srcToken, address to, uint256 amount, uint slippage) 
        internal override
        returns (uint256)
        {
            transferAndApprove(srcToken, address(kyberNetworkProxy), amount);
            return kyberNetworkProxy.tradeWithHint(
                IERC20(srcToken),
                amount,
                IERC20(MosaicaLib.KYBER_ETH_ADDRESS),
                payable(to),
                type(uint256).max,
                getMinAmountExpected(srcToken, MosaicaLib.KYBER_ETH_ADDRESS, amount, slippage),
                address(0),
                "PERM"
            );
        }

    /**
     * @dev Swaps a specified amount of one token for another token using Kyber Network and transfers to a recipient.
     *
     * @param srcToken The address of the token to swap.
     * @param destToken The address of the token to receive.
     * @param to The address to receive the destination token.
     * @param amount The amount of `srcToken` to swap.
     * @param slippage The acceptable slippage percentage.
     * @return The amount of `destToken` received from the swap.
     *
     * Requirements:
     * - `srcToken` must have been transferred to the contract and approved for Kyber Network Proxy.
     */
    function swapTokensForTokens(address srcToken, address destToken, address to, uint256 amount, uint256 slippage) 
        internal override
        returns (uint256)
        {
            transferAndApprove(srcToken, address(kyberNetworkProxy), amount);
            return kyberNetworkProxy.tradeWithHint(
                IERC20(srcToken),
                amount,
                IERC20(destToken),
                payable(to),
                type(uint256).max,
                getMinAmountExpected(srcToken, destToken, amount, slippage),
                address(0),
                "PERM"
            );
        }
}