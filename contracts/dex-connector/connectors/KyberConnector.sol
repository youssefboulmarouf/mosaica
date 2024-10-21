// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.24;

import {IUniswapV2Router02} from "@uniswap/v2-periphery/contracts/interfaces/IUniswapV2Router02.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {DexConnector} from "./DexConnector.sol";
import {MosaicaLib} from "../../MosaicaUtils.sol";
import {IKyberNetworkProxy} from "../../MosaicaUtils.sol";
import "hardhat/console.sol";

contract KyberConnector is DexConnector {

    address public constant KYBER_ETH_ADDRESS = address(0x00eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee);

    address public proxyAddress;
    IKyberNetworkProxy public kyberNetworkProxy;

    constructor(address _kyberNetwork) Ownable(msg.sender) {
        dexName = "Kyber";
        enabled = false;
        proxyAddress = _kyberNetwork;
        kyberNetworkProxy = IKyberNetworkProxy(_kyberNetwork);
    }

    function getPrice(address srcToken, address destToken, uint256 amount) 
        public view override 
        differentTokens(srcToken, destToken)
        returns(uint) 
        {
            ERC20 ercSrcToken = MosaicaLib.isEth(srcToken) ? ERC20(address(KYBER_ETH_ADDRESS)) : ERC20(srcToken); 
            ERC20 ercDestToken = MosaicaLib.isEth(destToken) ? ERC20(address(KYBER_ETH_ADDRESS)) : ERC20(destToken); 
            (uint256 expectedRate, ) = kyberNetworkProxy.getExpectedRate(ercSrcToken, ercDestToken, amount);
            return expectedRate;
        }

    function swapEthForTokens(address destToken, uint256 amount, uint slippage) 
        internal override
        returns (uint256)
        {
            // swap ETH -> Tokens
            return kyberNetworkProxy.tradeWithHint{value: msg.value}(
                IERC20(address(KYBER_ETH_ADDRESS)),
                msg.value,
                IERC20(destToken),
                payable(msg.sender),
                type(uint256).max,
                getMinAmountExpected(address(KYBER_ETH_ADDRESS), destToken, amount, slippage),
                address(0),
                "PERM"
            );
        }
    
    function swapTokensForEth(address srcToken, uint256 amount, uint slippage) 
        internal override
        returns (uint256)
        {
            // swap Tokens -> ETH
            transferAndApprove(srcToken, address(kyberNetworkProxy), amount);
            return kyberNetworkProxy.tradeWithHint(
                IERC20(srcToken),
                amount,
                IERC20(address(KYBER_ETH_ADDRESS)),
                payable(msg.sender),
                type(uint256).max,
                getMinAmountExpected(srcToken, address(KYBER_ETH_ADDRESS), amount, slippage),
                address(0),
                "PERM"
            );
        }

    function swapTokensForTokens(address srcToken, address destToken, uint256 amount, uint256 slippage) 
        internal override
        returns (uint256)
        {
            // swap Tokens -> Tokens
            transferAndApprove(srcToken, address(kyberNetworkProxy), amount);
            return kyberNetworkProxy.tradeWithHint(
                IERC20(srcToken),
                amount,
                IERC20(destToken),
                payable(msg.sender),
                type(uint256).max,
                getMinAmountExpected(srcToken, destToken, amount, slippage),
                address(0),
                "PERM"
            );
        }
}