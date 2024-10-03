// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.24;

import {IUniswapV2Router02} from "@uniswap/v2-periphery/contracts/interfaces/IUniswapV2Router02.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {DexConnector} from "./DexConnector.sol";
import "hardhat/console.sol";


interface IKyberNetworkProxy {
    function getExpectedRateAfterFee(
        IERC20 src,
        IERC20 dest,
        uint256 srcQty,
        uint256 platformFeeBps,
        bytes calldata hint
    ) external view returns (uint256 expectedRate);

    function trade(
        address src,
        uint256 srcAmount,
        address dest,
        address payable destAddress,
        uint256 maxDestAmount,
        uint256 minConversionRate,
        address walletId
    ) external payable returns (uint256);
}

contract KyberConnector is DexConnector {

    IKyberNetworkProxy public kyberNetworkProxy;

    constructor(address _kyberNetwork) Ownable(msg.sender) {
        dexName = "Kyber";
        enabled = false;
        kyberNetworkProxy = IKyberNetworkProxy(_kyberNetwork);
    }

    function getPrice(address token1, address token2, uint256 amount) external view override returns(uint) {
        return kyberNetworkProxy.getExpectedRateAfterFee(IERC20(token1), IERC20(token2), amount, 25, '');
    }

    function swapTokens(address token1, address token2, uint256 amount, uint256 minReturn) external override {
    }
}