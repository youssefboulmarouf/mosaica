// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.24;

import {IUniswapV2Router02} from "@uniswap/v2-periphery/contracts/interfaces/IUniswapV2Router02.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {DexConnector} from "./DexConnector.sol";
import "hardhat/console.sol";

contract UniswapV2LikeDex is DexConnector {

    address public routerAddress;

    constructor(string memory _dexName, address _routerAddress) Ownable(msg.sender) {
        dexName = _dexName;
        enabled = false;
        routerAddress = _routerAddress;
    }

    function getPrice(address token1, address token2, uint256 amount) external view override returns(uint) {
        address[] memory path = new address[](2);
        path[0] = token1;
        path[1] = token2;
        
        IUniswapV2Router02 uniswapV2Router = IUniswapV2Router02(routerAddress);
        uint256[] memory amountsOut = uniswapV2Router.getAmountsOut(amount, path);
        return amountsOut[1];
    }

    function swapTokens(address token1, address token2, uint256 amount, uint256 minReturn) external override {
        address[] memory path = new address[](2);
        path[0] = token1;
        path[1] = token2;

        IUniswapV2Router02 uniswapV2Router = IUniswapV2Router02(routerAddress);
        uniswapV2Router.swapExactTokensForTokens(amount, minReturn, path, msg.sender, block.timestamp);
    }
}