require("@nomiclabs/hardhat-ethers");
require('dotenv').config();

require('@openzeppelin/hardhat-upgrades');
require('@nomiclabs/hardhat-web3');
require('@rumblefishdev/hardhat-kms-signer');

const PRIVATE_KEY = process.env.PRIVATE_KEY;

if (!PRIVATE_KEY) {
  console.error("Please set your PRIVATE_KEY in a .env file");
  process.exit(1);
}

module.exports = {
  defaultNetwork: "localhost",
  networks: {
    localhost: {
      url: 'http://127.0.0.1:8545/',
      chainId: 31337,
    },
    dm2verse: {
      url: "https://rpc.testnet.dm2verse.dmm.com/",
      chainId: 68775,
      accounts: [PRIVATE_KEY]
    }, 
  },
  paths: {
    sources: "./contracts",
    scripts: "./scripts",
    tests: './test',
    cache: "./cache",
    artifacts: "./artifacts"
  },
  solidity: {
    compilers: [
      {
        version: '0.8.20',
        settings: {
          optimizer: {
            enabled: true,
            runs: 200,
          },
        },
      },
    ],
  },
};