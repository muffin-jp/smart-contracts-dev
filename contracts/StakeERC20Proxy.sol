// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";

/**
 * @title StakeERC20Proxy
 * @dev This contract implements an upgradeable proxy for the StakeERC20 contract.
 * It uses the Unstructured Storage Proxy pattern and includes access control.
 */
contract StakeERC20Proxy is Initializable, OwnableUpgradeable {
    // Storage slot for the address of the current implementation
    bytes32 private constant IMPLEMENTATION_SLOT = bytes32(uint256(keccak256('eip1967.proxy.implementation')) - 1);

    // Event emitted when the implementation is upgraded
    event Upgraded(address indexed implementation);

    /**
     * @dev Initializes the proxy with an initial implementation and sets the initial owner.
     * @param _implementation Address of the initial implementation.
     */
    function initialize(address _implementation) public initializer {
        require(_implementation != address(0), "Invalid implementation address");
        require(_isContract(_implementation), "Implementation must be a contract");
        _setImplementation(_implementation);
        __Ownable_init(msg.sender); // Initialize the OwnableUpgradeable contract with the deployer as the initial owner
    }

    /**
     * @dev Upgrades the implementation to a new address.
     * @param newImplementation Address of the new implementation.
     */
    function upgradeTo(address newImplementation) external onlyOwner {
        require(newImplementation != address(0), "Invalid implementation address");
        require(_isContract(newImplementation), "Implementation must be a contract");
        require(newImplementation != _implementation(), "Cannot upgrade to the same implementation");
        _setImplementation(newImplementation);
        emit Upgraded(newImplementation);
    }

    /**
     * @dev Returns the current implementation address.
     */
    function implementation() public view returns (address) {
        return _implementation();
    }

    /**
     * @dev Fallback function that delegates calls to the current implementation.
     * This function will run if the call data is empty.
     */
    receive() external payable {
        _delegate(_implementation());
    }

    /**
     * @dev Fallback function that delegates calls to the current implementation.
     * This function will run if no other function in the contract matches the call data.
     */
    fallback() external payable {
        _delegate(_implementation());
    }

    /**
     * @dev Delegates the current call to `implementation`.
     *
     * This function does not return to its internal call site, it will return directly to the external caller.
     */
    function _delegate(address implementation) internal {
        assembly {
            // Copy msg.data. We take full control of memory in this inline assembly
            // block because it will not return to Solidity code. We overwrite the
            // Solidity scratch pad at memory position 0.
            calldatacopy(0, 0, calldatasize())

            // Call the implementation.
            // out and outsize are 0 because we don't know the size yet.
            let result := delegatecall(gas(), implementation, 0, calldatasize(), 0, 0)

            // Copy the returned data.
            returndatacopy(0, 0, returndatasize())

            switch result
            // delegatecall returns 0 on error.
            case 0 { revert(0, returndatasize()) }
            default { return(0, returndatasize()) }
        }
    }

    /**
     * @dev Returns the current implementation address.
     */
    function _implementation() internal view returns (address impl) {
        bytes32 slot = IMPLEMENTATION_SLOT;
        assembly {
            impl := sload(slot)
        }
    }

    /**
     * @dev Stores a new address in the implementation slot.
     */
    function _setImplementation(address newImplementation) private {
        bytes32 slot = IMPLEMENTATION_SLOT;
        assembly {
            sstore(slot, newImplementation)
        }
    }

    /**
     * @dev Checks if an address is a contract
     * @param _addr Address to check
     * @return bool True if the address is a contract, false otherwise
     */
    function _isContract(address _addr) private view returns (bool) {
        uint32 size;
        assembly {
            size := extcodesize(_addr)
        }
        return (size > 0);
    }
}