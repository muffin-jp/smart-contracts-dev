const { ethers } = require("hardhat");
const fs = require('fs');
const path = require('path');

async function main() {
  const [deployer] = await ethers.getSigners();

  console.log(`Deploying contracts with the account: ${deployer.address}`);

  // Deploy MyToken for Reward and Staking
  const MyToken = await ethers.getContractFactory("MyToken");
  const initialSupply = ethers.utils.parseEther("1000000"); // 1 million tokens

  const rewardToken = await MyToken.deploy("Reward Token", "RT", initialSupply);
  await rewardToken.deployed();
  const stakingToken = await MyToken.deploy("Staking Token", "ST", initialSupply);
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
  const proxy = await Proxy.deploy(tokenStakeImplementation.address);
  await proxy.deployed();
  console.log("Proxy deployed to:", proxy.address);

  // Initialize the TokenStake contract through the proxy
  const proxiedTokenStake = TokenStake.attach(proxy.address);
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
  await rewardToken.approve(proxiedTokenStake.address, ethers.utils.parseEther("1000"));
  await proxiedTokenStake.depositRewardTokens(ethers.utils.parseEther("1000"));
  const rewardBalance = await proxiedTokenStake.getRewardTokenBalance();
  console.log("Reward token balance in contract:", ethers.utils.formatEther(rewardBalance));

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