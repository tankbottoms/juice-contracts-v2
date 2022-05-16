import { expect } from 'chai';
import { ethers } from 'hardhat';

import { deployMockContract } from '@ethereum-waffle/mock-contract';

import jbDirectory from '../../artifacts/contracts/JBDirectory.sol/JBDirectory.json';

describe('JBNFTRewardDataSourceDelegate::transfer(...)', function () {
  const PROJECT_ID = 2;
  const NFT_NAME = 'Reward NFT';
  const NFT_SYMBOL = 'RN';
  const NFT_URI = 'ipfs://content_base';
  const NFT_METADATA = 'ipfs://metadata';
  const MEMO = 'Test Memo';
  const AMOUNT_TO_RECEIVE = 10_000;
  const CURRENCY_ETH = 1;
  const ETH_TO_PAY = ethers.utils.parseEther('1');
  const MIN_TOKEN_REQUESTED = 90;
  const PREFER_CLAIMED_TOKENS = true;
  const METADATA = '0x69';
  const FUNDING_CYCLE_NUMBER = 0;
  const TOKEN_RECEIVED = 100;
  const ADJUSTED_MEMO = 'test test memo';
  const ethToken = ethers.constants.AddressZero;

  async function setup() {
    let [deployer, projectTerminal, owner, notOwner, ...accounts] = await ethers.getSigners();

    let [
      mockJbDirectory,
    ] = await Promise.all([
      deployMockContract(deployer, jbDirectory.abi),
    ]);

    await mockJbDirectory.mock.isTerminalOf.withArgs(PROJECT_ID, projectTerminal.address).returns(true);

    const jbNFTRewardDataSourceFactory = await ethers.getContractFactory('JBNFTRewardDataSourceDelegate', deployer);
    const jbNFTRewardDataSource = await jbNFTRewardDataSourceFactory
      .connect(deployer)
      .deploy(
        PROJECT_ID,
        mockJbDirectory.address,
        1,
        { token: ethToken, value: 1000000, decimals: 18, currency: CURRENCY_ETH },
        NFT_NAME,
        NFT_SYMBOL,
        NFT_URI,
        ethers.constants.AddressZero,
        NFT_METADATA
      );

    await jbNFTRewardDataSource.connect(projectTerminal).didPay({
      payer: owner.address,
      projectId: PROJECT_ID,
      currentFundingCycleConfiguration: 0,
      amount: { token: ethToken, value: ETH_TO_PAY, decimals: 18, currency: CURRENCY_ETH },
      projectTokenCount: 0,
      beneficiary: owner.address,
      preferClaimedTokens: true,
      memo: '',
      metadata: '0x42'
    })

    return {
      projectTerminal,
      owner,
      notOwner,
      accounts,
      jbNFTRewardDataSource,
    };
  }

  it('Should transfer token and emit event if caller is owner', async function () {
    const { jbNFTRewardDataSource, owner, notOwner } = await setup();

    const transferTx = await jbNFTRewardDataSource
      .connect(owner)
    ['transfer(uint256,address,uint256)'](PROJECT_ID, notOwner.address, 0);

    await expect(transferTx)
      .to.emit(jbNFTRewardDataSource, 'Transfer')
      .withArgs(owner.address, notOwner.address, 0);

    const balance = await jbNFTRewardDataSource['ownerBalance(address)'](owner.address);
    expect(balance).to.equal(0);

    expect(await jbNFTRewardDataSource['ownerBalance(address)'](notOwner.address)).to.equal(1);
  });
});
