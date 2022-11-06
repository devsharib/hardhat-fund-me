require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();
require("@nomiclabs/hardhat-etherscan");
require("hardhat-gas-reporter");
require("hardhat-deploy");
const GOERLI_RPC_URL = process.env.RPC_URL;
const PRIVATE_KEY = process.env.PRIVATE_KEY;
const GOERLI_ETHERSCAN_PRIVATE_KEY = process.env.GOERLI_ETHERSCAN_PRIVATE_KEY;
const COINMARKET_KEY = process.env.COINMARKET_KEY;

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  defaultNetwork: "hardhat",
  networks: {
    goerli: {
      url: GOERLI_RPC_URL,
      accounts: [PRIVATE_KEY],
      chainId: 5,
      blockConfirmations: 6,
    },
    localhost: {
      url: "http://127.0.0.1:8545/",
      //accounts: [PRIVATE_KEY],
      chainId: 31337,
    },
  },
  // solidity: "0.8.17",
  solidity: {
    compilers: [
      {
        version: "0.8.8",
      },
      { version: "0.6.6" },
    ],
  },
  etherscan: {
    apiKey: GOERLI_ETHERSCAN_PRIVATE_KEY,
  },
  gasReporter: {
    enabled: true,
    outputFile: "gas-report.txt",
    noColors: true,
    currency: "USD",
    // coinmarketcap: COINMARKET_KEY,
    token: "MATIC",
  },
  namedAccounts: {
    deployer: {
      default: 0, // here this will by default take the first account as deployer
      1: 0, // similarly on mainnet it will take the first account as deployer. Note though that depending on how hardhat network are configured, the account 0 on one network can be different than on another
    },
  },
};
