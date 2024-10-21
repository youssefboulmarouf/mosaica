// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.24;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

interface IKyberNetworkProxy {
    function getExpectedRate(
        ERC20 src,
        ERC20 dest,
        uint256 srcQty
    ) external view returns (uint256 expectedRate, uint256 worstRate);

    function tradeWithHint(
        IERC20 srcToken,
        uint256 srcAmount,
        IERC20 destToken,
        address payable destAddress,
        uint256 maxDestAmount,
        uint256 minConversionRate,
        address walletId,
        bytes calldata hint
    ) external payable returns (uint256);
}

library MosaicaLib {

    struct DexPrice {
        address connectorAddress;
        uint price;
    }

    struct PortfolioParam {
        address dexConnectorAddress;
        address tokenAddress;
        uint256 amount;
    }
    
    // The ETH_ADDRESS is purely symbolic and has no actual balance or functionality on the Ethereum network.
    address public constant ETH_ADDRESS = address(0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE);
    address constant public WETH_ADDRESS = 0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2;


    event DexConnectorEnabledEvent(address connectorContractAddress);
    event DexConnectorDisabledEvent(address connectorContractAddress);
    event DexConnectorAddedEvent(address connectorContractAddress);
    event DexConnectorRemovedEvent(address connectorContractAddress);

    error DexConnectorFoundError(address connectorContractAddress);
    error DexConnectorNotFoundError(address connectorContractAddress);
    error DexConnectorDisabledError(address connectorContractAddress);
    error DexConnectorEnabledError(address connectorContractAddress);
    error IdenticalTokens();
    error ZeroOrNegativeAmount();
    error MissingEthValue();
    error ReceivedDifferentEthValueAndAmount();
    error InvalidAddressError();

    function isWeth(address tokenAddress) public pure returns(bool) {
        return tokenAddress == WETH_ADDRESS;
    }

    function isEth(address tokenAddress) public pure returns(bool) {
        return tokenAddress == ETH_ADDRESS;
    }
}