// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.24;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {Portfolio} from "./Portfolio.sol";
import {MosaicaLib} from "../MosaicaUtils.sol";

/**
 * @title PortfolioFactory
 * @dev A contract that allows users to create and manage individual portfolios of assets.
 * Each user can create multiple portfolios, and each portfolio can hold various tokens and ETH.
 * Only the owner can deploy the factory and define custom behavior for portfolio creation.
 */
contract PortfolioFactory is Ownable {
    using SafeERC20 for IERC20;

    // Mapping from user address to an array of portfolio addresses owned by that user
    mapping(address => address[]) public portfolios;

    /**
     * @dev Initializes the contract by setting the deployer as the owner.
     */
    constructor() Ownable(msg.sender) {}

    /**
     * @dev Creates a new portfolio for the caller based on the provided asset parameters.
     * Transfers the specified assets from the caller to the newly created portfolio.
     * Calls the portfolio's `buyAssets` function to handle asset purchases.
     *
     * @param params An array of `PortfolioParam` structs specifying the assets and amounts for the portfolio.
     *
     * Requirements:
     * - The caller must have a sufficient balance of each specified token.
     * - If ETH is included in the parameters, `msg.value` must be equal to or greater than the specified ETH amount.
     * - Each token specified in `params` must have been approved for transfer to the portfolio.
     *
     * Emits:
     * - `PortfolioCreated` event with the new portfolio's address.
     */
    function createPortfolio(MosaicaLib.PortfolioParam[] calldata params) 
        external payable 
        enoughEthValue(params) enoughTokenBalance(params)
        {
            address[] storage portfoliosList = portfolios[msg.sender];
            Portfolio newPortfolio = new Portfolio(address(this), msg.sender);
            portfoliosList.push(address(newPortfolio));
            portfolios[msg.sender] = portfoliosList;

            // Transfer specified assets to the new portfolio
            for (uint i; i < params.length; i++) {
                if (!MosaicaLib.isEth(params[i].srcToken)) {
                    IERC20(params[i].srcToken).safeTransferFrom(msg.sender, address(newPortfolio), params[i].amount);
                }
            }
        
            newPortfolio.buyAssets{value: msg.value}(params);
            emit MosaicaLib.PortfolioCreated(address(newPortfolio), msg.sender, block.timestamp);
        }

    function deletePortfolio(address portfolioAddress) 
        external 
        portfolioExist(portfolioAddress) emptyProtfolio(portfolioAddress)
        {
            address[] storage portfoliosAddresses = portfolios[msg.sender];
            uint256 length = portfoliosAddresses.length;

            for (uint256 i = 0; i < length; i++) {
                if (portfoliosAddresses[i] == portfolioAddress) {
                    portfoliosAddresses[i] = portfoliosAddresses[length - 1];
                    portfoliosAddresses.pop();
                    return;
                }
            }
        }

    /**
     * @dev Returns an array of portfolio addresses owned by a specific address.
     *
     * @param portfolioOwnerAddress The address of the portfolio owner to query.
     * @return An array of portfolio contract addresses owned by `portfolioOwnerAddress`.
     */
    function getPortfolios(address portfolioOwnerAddress) 
        external view 
        returns(address[] memory) 
        {
            return portfolios[portfolioOwnerAddress];
        }

    /**
     * @dev Modifier that checks if the provided ETH amount in `msg.value` is sufficient
     * for the ETH amounts specified in `params`.
     *
     * Reverts with `ReceivedDifferentEthValueAndAmount` if `msg.value` is less than the required ETH amount.
     *
     * @param params The array of `PortfolioParam` structs containing the asset details for the portfolio.
     */
    modifier enoughEthValue(MosaicaLib.PortfolioParam[] calldata params) {
        uint256 ethAmount;

        for (uint i; i < params.length; i++) {
            if (MosaicaLib.isEth(params[i].srcToken)) {
                ethAmount += params[i].amount;
            }
        }

        if (ethAmount > msg.value) {
            revert MosaicaLib.ReceivedDifferentEthValueAndAmount();
        }
        _;
    }

    /**
     * @dev Modifier that checks if the caller has a sufficient balance of each specified token
     * in the `params` array to fund the portfolio creation.
     *
     * Reverts with `NotEnoughBalance` if any token's balance is less than the required amount.
     *
     * @param params The array of `PortfolioParam` structs containing the asset details for the portfolio.
     */
    modifier enoughTokenBalance(MosaicaLib.PortfolioParam[] calldata params) {
        for (uint i; i < params.length; i++) {
            if (!MosaicaLib.isEth(params[i].srcToken)) {
                uint256 balance = IERC20(params[i].srcToken).balanceOf(msg.sender);
                if (params[i].amount > balance) {
                    revert MosaicaLib.NotEnoughBalance(params[i].srcToken);
                }
            }
        }
        _;
    }

    modifier portfolioExist(address portfolioAddress) {
        address[] memory portfoliosAddresses = portfolios[msg.sender];
        bool exists = false;

        // Iterate through the portfoliosAddresses array
        for (uint256 i = 0; i < portfoliosAddresses.length; i++) {
            if (portfoliosAddresses[i] == portfolioAddress) {
                exists = true;
                break;
            }
        }

        // Revert if the portfolioAddress does not exist
        if (!exists) {
            revert MosaicaLib.PortfolioDoesNotExists(portfolioAddress);
        }
        _;
    }

    modifier emptyProtfolio(address portfolioAddress) {
        if (Portfolio(portfolioAddress).getAssetAddresses().length > 0) {
            revert MosaicaLib.PortfolioNotEmpty(address(this));
        }
        _;
    }
}