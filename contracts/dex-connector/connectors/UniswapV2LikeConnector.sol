// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.24;

import {IUniswapV2Router02} from "@uniswap/v2-periphery/contracts/interfaces/IUniswapV2Router02.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {DexConnector} from "./DexConnector.sol";
import {MosaicaLib} from "../../MosaicaUtils.sol";
import "hardhat/console.sol";

/**
 * @title UniswapV2LikeConnector
 * @dev DEX connector for interacting with Uniswap V2-like decentralized exchanges.
 * Supports token-to-token, ETH-to-token, and token-to-ETH swaps, as well as retrieving prices for swaps.
 * Inherits from DexConnector and integrates with Uniswap V2 routers to provide these functionalities.
 */
contract UniswapV2LikeConnector is DexConnector {

    // Interface to interact with the Uniswap V2 router contract
    IUniswapV2Router02 public router;

    /**
     * @dev Initializes the connector with a specific Uniswap V2-like router address.
     * Sets the DEX name and initializes the router interface. The connector is disabled by default.
     *
     * @param _dexName The name of the DEX (e.g., "Uniswap", "SushiSwap", ...) for identification.
     * @param _routerAddress The address of the Uniswap V2-compatible router contract.
     */
    constructor(string memory _dexName, address _routerAddress) Ownable(msg.sender) {
        dexName = _dexName;
        enabled = false;
        router = IUniswapV2Router02(_routerAddress);
    }

    /**
     * @dev Retrieves the expected price for swapping a specified amount of `srcToken` to `destToken`.
     * Uses the Uniswap V2 router to fetch the expected output amount for a given input.
     *
     * @param srcToken The address of the source token.
     * @param destToken The address of the destination token.
     * @param amount The amount of the source token to get the price for.
     * @return The expected output amount of `destToken` for the specified input amount of `srcToken`.
     *
     * Requirements:
     * - `srcToken` and `destToken` must be different.
     */
    function getPrice(address srcToken, address destToken, uint256 amount) 
        public view override 
        differentTokens(srcToken, destToken)
        returns(uint) 
        {
            uint256[] memory amountsOut = router.getAmountsOut(amount, deducePath(srcToken, destToken));
            return amountsOut[1];
        }

    /**
     * @dev Swaps ETH for a specified token and sends it to the recipient address.
     * Uses the Uniswap V2 router to perform the swap and enforces slippage tolerance.
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
            uint256[] memory destAmount = router.swapExactETHForTokens{ value: amount }(
                getMinAmountExpected(MosaicaLib.ETH_ADDRESS, destToken, amount, slippage), 
                deducePath(MosaicaLib.ETH_ADDRESS, destToken), 
                to, 
                block.timestamp + 30
            );
            return destAmount[destAmount.length - 1];
        }
    
    /**
     * @dev Swaps a specified token for ETH and sends it to the recipient address.
     * Uses the Uniswap V2 router to perform the swap and enforces slippage tolerance.
     *
     * @param srcToken The address of the token to swap.
     * @param to The address to receive the ETH.
     * @param amount The amount of `srcToken` to swap.
     * @param slippage The acceptable slippage percentage.
     * @return The amount of ETH received from the swap.
     *
     * Requirements:
     * - The `srcToken` must be approved for the router to spend on behalf of this contract.
     */
    function swapTokensForEth(address srcToken, address to, uint256 amount, uint slippage) 
        internal override
        returns (uint256)
        {
            transferAndApprove(srcToken, address(router), amount);
            uint256[] memory destAmount = router.swapExactTokensForETH(
                amount, 
                getMinAmountExpected(srcToken, MosaicaLib.ETH_ADDRESS, amount, slippage),
                deducePath(srcToken, MosaicaLib.ETH_ADDRESS), 
                to, 
                block.timestamp + 30
            );
            return destAmount[destAmount.length - 1];
        }

    /**
     * @dev Swaps a specified amount of one token for another and sends it to the recipient address.
     * Uses the Uniswap V2 router to perform the swap and enforces slippage tolerance.
     *
     * @param srcToken The address of the token to swap.
     * @param destToken The address of the token to receive.
     * @param to The address to receive the destination token.
     * @param amount The amount of `srcToken` to swap.
     * @param slippage The acceptable slippage percentage.
     * @return The amount of `destToken` received from the swap.
     *
     * Requirements:
     * - The `srcToken` must be approved for the router to spend on behalf of this contract.
     */
    function swapTokensForTokens(address srcToken, address destToken, address to, uint256 amount, uint256 slippage) 
        internal override
        returns (uint256)
        {
            transferAndApprove(srcToken, address(router), amount);
            uint256[] memory destAmount = router.swapExactTokensForTokens(
                amount, 
                getMinAmountExpected(srcToken, destToken, amount, slippage),
                deducePath(srcToken, destToken),
                to, 
                block.timestamp + 30
            );
            return destAmount[destAmount.length - 1];
        }

    /**
     * @dev Determines the path for token swaps by converting ETH placeholder addresses to WETH.
     * Uniswap V2 routers require a path, which is an array of token addresses, including wrapped ETH (WETH) instead of ETH.
     *
     * @param srcToken The address of the source token.
     * @param destToken The address of the destination token.
     * @return path The array of addresses representing the path for the swap.
     */
    function deducePath(address srcToken, address destToken) 
        internal pure 
        returns(address[] memory path) 
        {
            path = new address[](2);
            path[0] = MosaicaLib.isEth(srcToken) ? MosaicaLib.WETH_ADDRESS : srcToken;
            path[1] = MosaicaLib.isEth(destToken) ? MosaicaLib.WETH_ADDRESS : destToken;
        }
}