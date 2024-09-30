// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.24;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {DexConnector} from "../DexConnector.sol";
import "hardhat/console.sol";

contract UniswapV2LikeDex is DexConnector {

    constructor(string memory _dexName) Ownable(msg.sender) {
        dexName = _dexName;
        enabled = false;
    }

    function getPrice(address token1, address token2, uint256 amount) external view override returns(uint) {
        return 0;
    }

    function swapTokens(address token1, address token2, uint256 amount, uint256 minReturn) external override {
    }
}