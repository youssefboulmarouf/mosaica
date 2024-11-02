// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.24;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {MosaicaLib} from "../MosaicaUtils.sol";
import {DexConnector} from "../dex-connector/connectors/DexConnector.sol";

/**
 * @title Portfolio
 * @dev A contract that manages assets in a portfolio, enabling users to add, buy, and withdraw assets.
 * Provides functionality to interact with DEX connectors for asset swaps and maintains a balance for each asset.
 * Only the portfolio owner can manage and withdraw assets.
 */
contract Portfolio is Ownable { 
    using SafeERC20 for IERC20;

    // Address of the factory contract that created this portfolio
    address public factory;

    // Mapping from asset addresses to balances held in the portfolio
    mapping(address => uint256) public assetBalances;

    // Array of unique asset addresses currently held in the portfolio
    address[] public assetAddresses;

    /**
     * @dev Initializes the portfolio with the specified factory and owner addresses.
     *
     * @param _factory The address of the factory contract that created this portfolio.
     * @param _owner The address of the portfolio owner.
     */
    constructor(address _factory, address _owner) Ownable(_owner) {
        factory = _factory;
    }

    /**
     * @dev Returns the balance of a specific asset held in the portfolio.
     *
     * @param asset The address of the asset to check.
     * @return The balance of the asset in the portfolio.
     */
    function getAssetBalance(address asset) 
        external view 
        returns (uint256) 
        {
            return assetBalances[asset];
        }

    /**
     * @dev Returns the list of unique asset addresses currently held in the portfolio.
     *
     * @return An array of asset addresses.
     */
    function getAssetAddresses() 
        external view 
        returns(address[] memory) 
        {
            return assetAddresses;
        }

    /**
     * @dev Adds a new asset to the portfolio by transferring it from the caller to the portfolio.
     * Updates the asset balance and stores the asset address if it's new.
     *
     * @param assetAddress The address of the asset to add.
     * @param amount The amount of the asset to add.
     *
     * Requirements:
     * - The caller must have enough balance of the asset.
     * - If `assetAddress` represents ETH, `msg.value` must match `amount`.
     */
    function addAsset(address assetAddress, uint256 amount)  
        external payable 
        onlyOwner equalsEthValueAndAmount(assetAddress, amount) enoughTokenBalance(assetAddress, amount)
        {
            // receives a new asset form the owner
            if (!MosaicaLib.isEth(assetAddress)) {
                IERC20(assetAddress).safeTransferFrom(msg.sender, address(this), amount);
            }
            updateAssetStorage(assetAddress, amount);
        }

    /**
     * @dev Buys assets for the portfolio by swapping specified tokens using DEX connectors.
     * Transfers tokens from the caller to the portfolio and performs swaps using connectors.
     *
     * @param params Array of `PortfolioParam` structs defining each asset and swap details.
     *
     * Requirements:
     * - The caller must have enough balance and approved each token for transfer.
     * - `msg.value` must be sufficient for ETH transactions.
     */
    function buyAssets(MosaicaLib.PortfolioParam[] calldata params) 
        external payable 
        onlyAuthorized() enoughEthValue(params) enoughTokensBalance(params)
        {
            for (uint i; i < params.length; i++) {
                if (MosaicaLib.isEth(params[i].srcToken)) {
                    swapEth(params[i].dexConnectorAddress, address(this), params[i]);
                } else { 
                    if (msg.sender != factory) {
                        // Should transfer tokens when call is coming from the user
                        IERC20(params[i].srcToken).safeTransferFrom(msg.sender, address(this), params[i].amount);
                    }

                    IERC20(params[i].srcToken).approve(params[i].dexConnectorAddress, params[i].amount);
                    swap(params[i].dexConnectorAddress, address(this), params[i]);
                }

                uint256 balance = IERC20(params[i].destToken).balanceOf(address(this));
                updateAssetStorage(params[i].destToken, balance);
            }

            if (address(this).balance > 0) {
                updateAssetStorage(MosaicaLib.ETH_ADDRESS, address(this).balance);
            }
        }
    
    /**
     * @dev Withdraws specified assets from the portfolio to the owner’s wallet.
     * Swaps assets if needed before withdrawal.
     *
     * @param params Array of `PortfolioParam` structs defining each asset and amount to withdraw.
     *
     * Requirements:
     * - The portfolio must have enough balance of each asset specified.
     */
    function withdrawAssets(MosaicaLib.PortfolioParam[] calldata params) 
        external 
        onlyOwner enoughAssetsBalance(params) 
        {
            for (uint i; i < params.length; i++) {
                if (params[i].srcToken == params[i].destToken) {
                    withdrawAssetToWallet(params[i].srcToken, params[i].amount);
                } else {
                    IERC20(params[i].srcToken).approve(params[i].dexConnectorAddress, params[i].amount);
                    swap(params[i].dexConnectorAddress, owner(), params[i]);
                }
                updateAssetStorage(params[i].srcToken, assetBalances[params[i].srcToken] - params[i].amount);
            }
        }

    /**
     * @dev Internal function to withdraw a specific asset directly to the owner's wallet.
     *
     * @param token The address of the asset to withdraw.
     * @param amount The amount of the asset to withdraw.
     */
    function withdrawAssetToWallet(address token, uint256 amount) 
        internal 
        {
            if (MosaicaLib.isEth(token)) {
                payable(owner()).transfer(amount);
            } else {
                IERC20(token).safeTransfer(owner(), amount);
            }
        }
    
    /**
     * @dev Internal function to perform a token-to-token swap using a DEX connector.
     *
     * @param connectorAddress The address of the DEX connector contract.
     * @param to The address to receive the destination token.
     * @param params The parameters for the swap, including tokens, amounts, and slippage.
     */
    function swap(address connectorAddress, address to, MosaicaLib.PortfolioParam calldata params) 
        internal 
        {
            DexConnector dexConnector = DexConnector(connectorAddress);
            dexConnector.swapTokens(
                params.srcToken, 
                params.destToken, 
                to, 
                params.amount, 
                params.slippage
            );
        }

    /**
     * @dev Internal function to perform an ETH-token swap using a DEX connector.
     *
     * @param connectorAddress The address of the DEX connector contract.
     * @param to The address to receive the destination token.
     * @param params The parameters for the swap, including tokens, amounts, and slippage.
     */
    function swapEth(address connectorAddress, address to, MosaicaLib.PortfolioParam calldata params) 
        internal 
        {
            DexConnector dexConnector = DexConnector(connectorAddress);
            dexConnector.swapTokens{value: params.amount}(
                params.srcToken, 
                params.destToken, 
                to, 
                params.amount, 
                params.slippage
            );
        }

    /**
     * @dev Internal function to update the balance and address of an asset in the portfolio.
     * Adds the asset address if it does not already exist in the storage.
     *
     * @param asset The address of the asset to update.
     * @param amount The amount of the asset to add.
     */
    function updateAssetStorage(address asset, uint256 amount) 
        internal 
        {
            // Add the asset address only if it doesn't exist in the mapping
            if (assetBalances[asset] == 0) {
                assetAddresses.push(asset);
            }
            assetBalances[asset] += amount;
        }

    /**
     * @dev Modifier to restrict access to authorized accounts (factory or owner).
     * Reverts if the caller is neither the factory nor the owner.
     */
    modifier onlyAuthorized() {
        if (msg.sender != factory && msg.sender != owner()) {
            revert OwnableUnauthorizedAccount(msg.sender);
        }
        _;
    }

    /**
     * @dev Modifier to ensure that `msg.value` matches the specified `amount` when transferring ETH.
     * Reverts if `msg.value` does not equal `amount`, indicating a mismatch between the sent ETH and the required amount.
     *
     * @param srcToken The address of the source token, which may be ETH.
     * @param amount The expected amount of ETH to be received.
     *
     * Requirements:
     * - `srcToken` must represent ETH, as determined by `MosaicaLib.isEth`.
     * - `msg.value` must equal `amount`.
     *
     * Reverts with:
     * - `ReceivedDifferentEthValueAndAmount` if `msg.value` is not equal to `amount`.
     */
    modifier equalsEthValueAndAmount(address srcToken, uint256 amount) {
        if (MosaicaLib.isEth(srcToken) && msg.value != amount) {
            revert MosaicaLib.ReceivedDifferentEthValueAndAmount();
        }
        _;
    }

    /**
     * @dev Modifier to verify that the ETH amount in `msg.value` is sufficient for the total required ETH
     * specified in the `params` array.
     *
     * Iterates through the `params` array and sums up all ETH amounts specified. Compares the sum with `msg.value`.
     *
     * @param params An array of `PortfolioParam` structs, each containing asset information including token address and amount.
     *
     * Requirements:
     * - `msg.value` must be greater than or equal to the total ETH amount specified in `params`.
     *
     * Reverts with:
     * - `ReceivedDifferentEthValueAndAmount` if `msg.value` is less than the total ETH amount specified.
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
     * @dev Modifier to ensure the caller has enough balance of each specified token to fund the portfolio creation.
     * Checks the caller’s token balances and ensures they meet or exceed the amounts specified in `params`.
     *
     * @param params An array of `PortfolioParam` structs, each containing asset information including token address and amount.
     *
     * Requirements:
     * - For each token in `params`, the caller's balance must be greater than or equal to the specified amount.
     *
     * Reverts with:
     * - `NotEnoughBalance` if the caller’s balance for any token is insufficient.
     */
    modifier enoughTokensBalance(MosaicaLib.PortfolioParam[] calldata params) {
        if (msg.sender != factory) {
            for (uint i; i < params.length; i++) {
                if (!MosaicaLib.isEth(params[i].srcToken)) {
                    uint256 balance = IERC20(params[i].srcToken).balanceOf(msg.sender);
                    if (params[i].amount > balance) {
                        revert MosaicaLib.NotEnoughBalance(params[i].srcToken);
                    }
                }
            }
        }
        _;
    }

    /**
     * @dev Modifier to check if the caller has sufficient balance of the specified token to meet the required `amount`.
     * For non-ETH tokens, ensures the caller’s balance is at least `amount`.
     *
     * @param srcToken The address of the source token.
     * @param amount The required token balance.
     *
     * Requirements:
     * - If `srcToken` is not ETH, the caller’s balance must be greater than or equal to `amount`.
     *
     * Reverts with:
     * - `NotEnoughBalance` if the caller’s balance of `srcToken` is less than `amount`.
     */
    modifier enoughTokenBalance(address srcToken, uint256 amount) {
        if (!MosaicaLib.isEth(srcToken)) {
            uint256 balance = IERC20(srcToken).balanceOf(msg.sender);
            if (amount > balance) {
                revert MosaicaLib.NotEnoughBalance(srcToken);
            }
        }
        _;
    }

    /**
     * @dev Modifier to verify that the portfolio has sufficient balance of each specified asset for withdrawal.
     * Checks the portfolio's balance for each asset in `params` and ensures it meets or exceeds the required amount.
     *
     * @param params An array of `PortfolioParam` structs, each containing asset information including token address and amount.
     *
     * Requirements:
     * - For each asset in `params`, the portfolio’s balance must be greater than or equal to the specified amount.
     *
     * Reverts with:
     * - `NotEnoughBalance` if the portfolio's balance for any asset is insufficient.
     */
    modifier enoughAssetsBalance(MosaicaLib.PortfolioParam[] calldata params) {
        for (uint i; i < params.length; i++) {
            uint256 balance;
            if (MosaicaLib.isEth(params[i].srcToken)) {
                balance = address(this).balance;
            } else {
                balance = IERC20(params[i].srcToken).balanceOf(address(this));
            }

            if (params[i].amount > balance) {
                revert MosaicaLib.NotEnoughBalance(params[i].srcToken);
            }
        }
        _;
    }
}