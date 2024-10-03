// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.24;

import {IUniswapV2Router02} from "@uniswap/v2-periphery/contracts/interfaces/IUniswapV2Router02.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {DexConnector} from "./DexConnector.sol";
import "hardhat/console.sol";

contract UniswapV2LikeConnector is DexConnector {

    IUniswapV2Router02 public router;

    constructor(string memory _dexName, address _routerAddress) Ownable(msg.sender) {
        dexName = _dexName;
        enabled = false;
        router = IUniswapV2Router02(_routerAddress);
    }

    function getPrice(address token1, address token2, uint256 amount) external view override returns(uint) {
        address[] memory path = pathFinder(token1, token2, router.WETH());
        uint256[] memory amountsOut = router.getAmountsOut(amount, path);
        return amountsOut[amountsOut.length - 1];
    }

    function swapTokens(address token1, address token2, uint256 amount, uint256 minReturn) external override {
        address[] memory path = pathFinder(token1, token2, router.WETH());
        router.swapExactTokensForTokens(amount, minReturn, path, msg.sender, block.timestamp);
    }

    function pathFinder(address token1, address token2, address weth) internal pure returns(address[] memory path) {
        bool oneOfTokensIsWeth = token1 == weth || token2 == weth;
        if (oneOfTokensIsWeth) {
            path = new address[](2);
            path[0] = token1;
            path[1] = token2;
        } else {
            path = new address[](3);
            path[0] = token1;
            path[1] = weth;
            path[2] = token2;
        }
    }
}