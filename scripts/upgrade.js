const { ethers } = require("hardhat");
const fs = require('fs');
const path = require('path');

async function main() {
  const [deployer] = await ethers.getSigners();

  console.log(`Upgrading contracts with the account: ${deployer.address}`);

  // Load deployment info
  const deploymentFile = path.join(__dirname, 'deployment-info.json');
  let deploymentInfo;
  try {
    deploymentInfo = JSON.parse(fs.readFileSync(deploymentFile, 'utf8'));
  } catch (error) {
    console.error("Failed to load deployment info. Make sure you've run deploy.js first.");
    process.exit(1);
  }

  const { rewardToken: rewardTokenAddress, stakingToken: stakingTokenAddress, tokenStakeProxy: proxyAddress } = deploymentInfo;

  console.log("Loaded addresses:");
  console.log("Proxy:", proxyAddress);
  console.log("Reward Token:", rewardTokenAddress);
  console.log("Staking Token:", stakingTokenAddress);

  // Deploy TokenStakeV2 implementation
  const TokenStakeV2 = await ethers.getContractFactory("TokenStakeV2");
  console.log("Deploying TokenStakeV2...");
  const tokenStakeV2Implementation = await TokenStakeV2.deploy(deployer.address);
  await tokenStakeV2Implementation.deployed();
  console.log("TokenStakeV2 implementation deployed to:", tokenStakeV2Implementation.address);

  // Upgrade Proxy
  const Proxy = await ethers.getContractFactory("StakeERC20Proxy");
  const proxy = Proxy.attach(proxyAddress);
  console.log("Upgrading Proxy to TokenStakeV2...");
  await proxy.upgradeTo(tokenStakeV2Implementation.address);
  console.log("Proxy upgraded to:", tokenStakeV2Implementation.address);

  // Interact with the upgraded contract
  const proxiedTokenStake = TokenStakeV2.attach(proxyAddress);

  // Set maximum staking volumes
  await proxiedTokenStake.setMaxStakingVolume(ethers.utils.parseEther("2000"));
  await proxiedTokenStake.setMaxIndividualStakingVolume(ethers.utils.parseEther("100"));

  // Test the new function
  const testResult = await proxiedTokenStake.testUpgradeFunction();
  console.log("Test upgrade function result:", testResult);

  // Verify the contract still has the old state
  const rewardBalance = await proxiedTokenStake.getRewardTokenBalance();
  console.log("Reward token balance in contract:", ethers.utils.formatEther(rewardBalance));

  console.log("Upgrade complete!");

  // Update deployment info with new implementation address
  deploymentInfo.tokenStakeImplementation = tokenStakeV2Implementation.address;
  fs.writeFileSync(deploymentFile, JSON.stringify(deploymentInfo, null, 2));
  console.log(`Updated deployment info saved to ${deploymentFile}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });