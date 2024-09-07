const { ethers } = require("hardhat");
const fs = require('fs');
const path = require('path');

async function main() {
  const [deployer] = await ethers.getSigners();

  console.log(`Deploying contracts with the account: ${deployer.address}`);

  // Deploy MyToken for Reward and Staking
  const MyToken = await ethers.getContractFactory("MyToken");
  const decimals = 18;
  const initialSupply = ethers.utils.parseUnits("1000000", decimals); // 1 million tokens

  const rewardToken = await MyToken.deploy("Reward Token", "RT", decimals, initialSupply);
  await rewardToken.deployed();
  
  const stakingToken = await MyToken.deploy("Staking Token", "ST", decimals, initialSupply);
  await stakingToken.deployed();
  
  console.log(`rewardToken: ${rewardToken.address}, stakingToken: ${stakingToken.address}`);

  // Deploy TokenStake implementation
  const TokenStake = await ethers.getContractFactory("TokenStake");
  console.log("Deploying TokenStake implementation...");
  const tokenStakeImplementation = await TokenStake.deploy(deployer.address);
  await tokenStakeImplementation.deployed();
  console.log("TokenStake implementation deployed to:", tokenStakeImplementation.address);

  // Deploy Proxy
  const Proxy = await ethers.getContractFactory("StakeERC20Proxy");
  console.log("Deploying Proxy...");
  const proxy = await Proxy.deploy();
  await proxy.deployed();
  console.log("Proxy deployed to:", proxy.address);

  // Initialize the proxy
  console.log("Initializing proxy...");
  await proxy.initialize(tokenStakeImplementation.address);

  // Get TokenStake interface for the proxy
  const proxiedTokenStake = TokenStake.attach(proxy.address);

  // Initialize the TokenStake contract through the proxy
  await proxiedTokenStake.initialize(
    deployer.address,
    'contractURI',
    [],
    rewardToken.address,
    stakingToken.address,
    60,
    30,
    50
  );

  // Approve and deposit reward tokens
  await rewardToken.approve(proxiedTokenStake.address, ethers.utils.parseUnits("1000", decimals));
  await proxiedTokenStake.depositRewardTokens(ethers.utils.parseUnits("1000", decimals));
  const rewardBalance = await proxiedTokenStake.getRewardTokenBalance();
  console.log("Reward token balance in contract:", ethers.utils.formatUnits(rewardBalance, decimals));

  // Save deployed addresses
  const deploymentInfo = {
    rewardToken: rewardToken.address,
    stakingToken: stakingToken.address,
    tokenStakeProxy: proxy.address,
    tokenStakeImplementation: tokenStakeImplementation.address,
  };
  const deploymentFile = path.join(__dirname, 'deployment-info.json');
  fs.writeFileSync(deploymentFile, JSON.stringify(deploymentInfo, null, 2));
  console.log(`Deployment info saved to ${deploymentFile}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });