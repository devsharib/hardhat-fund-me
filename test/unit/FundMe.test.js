const { assert, expect } = require("chai");
const { deployments, ethers, getNamedAccounts } = require("hardhat");

describe("fundMe", async function() {
  let fundMe;
  let deployer;
  let mockV3Aggregator;
  const sendValue = ethers.utils.parseEther("1");

  beforeEach(async function() {
    deployer = (await getNamedAccounts()).deployer;
    await deployments.fixture("all");
    fundMe = await ethers.getContract("FundMe", deployer);
    mockV3Aggregator = await ethers.getContract("MockV3Aggregator", deployer);
  });

  describe("Constructor", async function() {
    it("Sets aggregator address correctly", async function() {
      const response = await fundMe.priceFeed();
      assert.equal(response, mockV3Aggregator.address);
    });
  });

  describe("Fund", async function() {
    it("Fails if you don't send enough ETH ", async () => {
      await expect(fundMe.fund()).to.be.rejectedWith(
        "You need to spend more ETH!"
      );
    });

    it("Updated the amount funded data structure", async () => {
      await fundMe.fund({
        value: sendValue,
      });
      const response = await fundMe.addressToAmountFunded(deployer);
      assert.equal(response.toString(), sendValue.toString());
    });

    it("Add funders array of funders", async () => {
      await fundMe.fund({
        value: sendValue,
      });
      const funder = await fundMe.funders(0);
      assert.equal(funder, deployer);
    });
  });

  describe("Withdrwa", async () => {
    beforeEach(async () => {
      await fundMe.fund({
        value: sendValue,
      });
    });

    it("Withdraw ETH from a single funder", async () => {
      //Arrange
      const startingFundMeBalance = await fundMe.provider.getBalance(
        fundMe.address
      );
      const startingDeployerBalance = await fundMe.provider.getBalance(
        deployer
      );
      // Act
      const transactionResponse = await fundMe.withdraw();
      const transactionReciept = await transactionResponse.wait(1);
      const { gasUsed, effectiveGasPrice } = transactionReciept;
      const gasCost = gasUsed.mul(effectiveGasPrice);
      const endingFundMeBalance = await fundMe.provider.getBalance(
        fundMe.address
      );
      const endingDeployerBalance = await fundMe.provider.getBalance(deployer);

      //Assert
      assert.equal(endingFundMeBalance, 0);
      assert.equal(
        startingFundMeBalance.add(startingDeployerBalance).toString(),
        endingDeployerBalance.add(gasCost)
      );
    });

    it("Allow us to withdraw with multiple funders", async () => {
      //Arrange

      const accounts = await ethers.getSigners();

      for (let i = 0; i < 6; i++) {
        const fundMeConnectContact = await fundMe.connect(accounts[1]);
        await fundMeConnectContact.fund({
          value: sendValue,
        });
        const startingFundMeBalance = await fundMe.provider.getBalance(
          fundMe.address
        );
        const startingDeployerBalance = await fundMe.provider.getBalance(
          deployer
        );

        //Act
        const transactionResponse = await fundMe.withdraw();
        const transactionReciept = await transactionResponse.wait(1);
        const { gasUsed, effectiveGasPrice } = transactionReciept;
        const gasCost = gasUsed.mul(effectiveGasPrice);

        //Assert
        const endingFundMeBalance = await fundMe.provider.getBalance(
          fundMe.address
        );
        const endingDeployerBalance = await fundMe.provider.getBalance(
          deployer
        );

        //Assert
        assert.equal(endingFundMeBalance, 0);
        assert.equal(
          startingFundMeBalance.add(startingDeployerBalance).toString(),
          endingDeployerBalance.add(gasCost)
        );

        //Make sure funders are reset properly

        await expect(fundMe.funders(0)).to.be.reverted;

        for (let i = 0; i < 6; i++) {
          assert.equal(
            await fundMe.addressToAmountFunded(accounts[i].address),
            0
          );
        }
      }
    });

    it("Only allows the owner  to withdraw", async () => {
      const accounts = await ethers.getSigners();
      const attacker = accounts[1];
      const attackerConnectedContract = await fundMe.connect(attacker);
      await expect(attackerConnectedContract.withdraw()).to.be.revertedWith(
        "Sender is not owner"
      );
    });
  });
});
