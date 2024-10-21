// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.24;

import {IUniswapV2Router02} from "@uniswap/v2-periphery/contracts/interfaces/IUniswapV2Router02.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {DexConnector} from "./DexConnector.sol";
import {MosaicaLib} from "../../MosaicaUtils.sol";
import "hardhat/console.sol";

contract UniswapV2LikeConnector is DexConnector {

    address public routerAddress;
    IUniswapV2Router02 public router;

    constructor(string memory _dexName, address _routerAddress) Ownable(msg.sender) {
        dexName = _dexName;
        enabled = false;
        routerAddress = _routerAddress;
        router = IUniswapV2Router02(_routerAddress);
    }

    function getPrice(address srcToken, address destToken, uint256 amount) 
        public view override 
        differentTokens(srcToken, destToken)
        returns(uint) 
        {
            uint256[] memory amountsOut = router.getAmountsOut(amount, deducePath(srcToken, destToken));
            return amountsOut[1];
        }

    function swapEthForTokens(address destToken, uint256 amount, uint slippage) 
        internal override
        returns (uint256)
        {
            // swap ETH -> Tokens 
            uint256[] memory destAmount = router.swapExactETHForTokens{ value: msg.value }(
                getMinAmountExpected(MosaicaLib.ETH_ADDRESS, destToken, amount, slippage), 
                deducePath(MosaicaLib.ETH_ADDRESS, destToken), 
                msg.sender, 
                block.timestamp + 30
            );
            return destAmount[destAmount.length - 1];
        }
    
    function swapTokensForEth(address srcToken, uint256 amount, uint slippage) 
        internal override
        returns (uint256)
        {
            // swap Tokens -> ETH
            transferAndApprove(srcToken, address(router), amount);
            uint256[] memory destAmount = router.swapExactTokensForETH(
                amount, 
                getMinAmountExpected(srcToken, MosaicaLib.ETH_ADDRESS, amount, slippage),
                deducePath(srcToken, MosaicaLib.ETH_ADDRESS), 
                msg.sender, 
                block.timestamp + 30
            );
            return destAmount[destAmount.length - 1];
        }

    function swapTokensForTokens(address srcToken, address destToken, uint256 amount, uint256 slippage) 
        internal override
        returns (uint256)
        {
            // swap Tokens -> Tokens
            transferAndApprove(srcToken, address(router), amount);
            uint256[] memory destAmount = router.swapExactTokensForTokens(
                amount, 
                getMinAmountExpected(srcToken, destToken, amount, slippage),
                deducePath(srcToken, destToken),
                msg.sender, 
                block.timestamp + 30
            );
            return destAmount[destAmount.length - 1];
        }

    function deducePath(address srcToken, address destToken) 
        internal pure 
        returns(address[] memory path) 
        {
            // Changing ETH placeholder address to WETH since we can't use ETH_ADDRESS as an ERC20 address
            path = new address[](2);
            path[0] = MosaicaLib.isEth(srcToken) ? MosaicaLib.WETH_ADDRESS : srcToken;
            path[1] = MosaicaLib.isEth(destToken) ? MosaicaLib.WETH_ADDRESS : destToken;
        }
}