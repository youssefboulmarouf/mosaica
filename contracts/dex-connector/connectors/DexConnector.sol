// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.24;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {MosaicaLib} from "../../MosaicaUtils.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

abstract contract DexConnector is Ownable {
    string public dexName;
    bool public enabled;

    function getPrice(address srcToken, address destToken, uint256 amount) 
        public view virtual
        returns(uint);

    function swapEthForTokens(address destToken, uint256 amount, uint slippage) 
        internal virtual
        returns (uint256);
    
    function swapTokensForEth(address srcToken, uint256 amount, uint slippage) 
        internal virtual
        returns (uint256);

    function swapTokensForTokens(address srcToken, address destToken, uint256 amount, uint256 slippage) 
        internal virtual
        returns (uint256);

    function getMinAmountExpected(address srcToken, address destToken, uint256 amount, uint256 slippage) 
        internal view
        returns (uint256) 
        {
            uint256 expectedRate = getPrice(srcToken, destToken, amount);
            return expectedRate - ((expectedRate * slippage) / 100);
        }
    
    function transferAndApprove(address token, address to, uint256 amount)
        internal 
        {
            IERC20(token).transferFrom(msg.sender, address(this), amount);
            IERC20(token).approve(to, amount);
        }

    function swapTokens(address srcToken, address destToken, uint256 amount, uint256 slippage) 
        external payable 
        differentTokens(srcToken, destToken) equalsEthValueAndAmount(srcToken, amount) positiveEthValue(srcToken)
        {
            uint256 destAmount;
            if (MosaicaLib.isEth(srcToken)) {
                destAmount = swapEthForTokens(destToken, amount, slippage);
            } else if (MosaicaLib.isEth(destToken)) {
                destAmount = swapTokensForEth(srcToken, amount, slippage);
            } else {
                destAmount = swapTokensForTokens(srcToken, destToken, amount, slippage);
            }
            require(destAmount > 0, "Trade failed");
        }

    function enableConnector() external onlyOwner connectorDisabled {
        enabled = true;
        emit MosaicaLib.DexConnectorEnabledEvent(address(this));
    }

    function disableConnector() external onlyOwner connectorEnabled {
        enabled = false;
        emit MosaicaLib.DexConnectorDisabledEvent(address(this));
    }

    modifier connectorDisabled() {
        if(enabled) {
            revert MosaicaLib.DexConnectorEnabledError(address(this));
        } 
        _;
    }

    modifier connectorEnabled() {
        if(!enabled) {
            revert MosaicaLib.DexConnectorDisabledError(address(this));
        }
        _;
    }

    modifier differentTokens(address srcToken, address destToken) {
        if (srcToken == destToken) {
            revert MosaicaLib.IdenticalTokens();
        }
        _;
    }

    modifier positiveEthValue(address srcToken) {
        if (MosaicaLib.isEth(srcToken) && msg.value <= 0) {
            revert MosaicaLib.MissingEthValue();
        }
        _;
    }

    modifier equalsEthValueAndAmount(address srcToken, uint256 amount) {
        if (MosaicaLib.isEth(srcToken) && msg.value != amount) {
            revert MosaicaLib.ReceivedDifferentEthValueAndAmount();
        }
        _;
    }
}