// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "../StakeERC20/TokenStake.sol";

/**
 * @title TokenStakeV2
 * @dev This contract extends TokenStake with additional features and improved security.
 */
contract TokenStakeV2 is TokenStake {
    uint256 private _maxStakingVolume;
    uint256 private _maxIndividualStakingVolume;
    uint256 public constant MIN_STAKE_AMOUNT = 1e18; // 1 token minimum stake
    uint256 public cooldownPeriod = 1 days; // 24 hours cooldown period
    mapping(address => uint256) private lastStakeTimestamp;

    event MaxStakingVolumeUpdated(uint256 newMaxStakingVolume);
    event MaxIndividualStakingVolumeUpdated(uint256 newMaxIndividualStakingVolume);
    event CooldownPeriodUpdated(uint256 newCooldownPeriod);

    constructor(address _nativeTokenWrapper) TokenStake(_nativeTokenWrapper) {}

    /**
     * @dev Sets the maximum total staking volume.
     * @param _amount The new maximum staking volume.
     */
    function setMaxStakingVolume(uint256 _amount) external virtual {
        if (!_canSetStakeConditions()) {
            revert("Not authorized");
        }
        require(_amount > _maxIndividualStakingVolume, "Max staking volume must be greater than max individual staking volume");
        _maxStakingVolume = _amount;
        emit MaxStakingVolumeUpdated(_amount);
    }

    /**
     * @dev Sets the maximum individual staking volume.
     * @param _amount The new maximum individual staking volume.
     */
    function setMaxIndividualStakingVolume(uint256 _amount) external virtual {
        if (!_canSetStakeConditions()) {
            revert("Not authorized");
        }
        require(_amount <= _maxStakingVolume, "Max individual staking volume must be less than or equal to max staking volume");
        _maxIndividualStakingVolume = _amount;
        emit MaxIndividualStakingVolumeUpdated(_amount);
    }

    /**
     * @dev Sets the cooldown period for staking.
     * @param _period The new cooldown period in seconds.
     */
    function setCooldownPeriod(uint256 _period) external virtual {
        if (!_canSetStakeConditions()) {
            revert("Not authorized");
        }
        cooldownPeriod = _period;
        emit CooldownPeriodUpdated(_period);
    }

    /**
     * @dev Returns the maximum total staking volume.
     */
    function getMaxStakingVolume() external view returns (uint256) {
        return _maxStakingVolume;
    }

    /**
     * @dev Returns the maximum individual staking volume.
     */
    function getMaxIndividualStakingVolume() external view returns (uint256) {
        return _maxIndividualStakingVolume;
    }

    /**
     * @dev Overrides the _stake function to add additional checks and features.
     * @param _amount The amount to stake.
     */
    function _stake(uint256 _amount) internal virtual override {
        require(_amount >= MIN_STAKE_AMOUNT, "Stake amount below minimum");
        require(stakingTokenBalance + _amount <= _maxStakingVolume, "Exceeds maximum staking volume");
        require(stakers[_stakeMsgSender()].amountStaked + _amount <= _maxIndividualStakingVolume, "Exceeds maximum individual staking volume");
        require(block.timestamp >= lastStakeTimestamp[_stakeMsgSender()] + cooldownPeriod, "Cooldown period not elapsed");
        
        super._stake(_amount);
        lastStakeTimestamp[_stakeMsgSender()] = block.timestamp;
    }

    /**
     * @dev Overrides the _withdraw function to add additional checks and features.
     * @param _amount The amount to withdraw.
     */
    function _withdraw(uint256 _amount) internal virtual override {
        super._withdraw(_amount);
        // Additional logic can be added here if needed
    }

    /**
     * @dev Test function to verify upgrade.
     */
    function testUpgradeFunction() external pure virtual returns (bool) {
        return true;
    }
}