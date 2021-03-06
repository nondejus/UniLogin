import {expect} from 'chai';
import {utils, Contract} from 'ethers';
import {createMockProvider, getWallets, deployContract} from 'ethereum-waffle';
import {BalanceChecker} from '../../../src/integration/ethereum/BalanceChecker';
import {RequiredBalanceChecker} from '../../../src/core/services/RequiredBalanceChecker';
import {ETHER_NATIVE_TOKEN} from '../../../src/core/constants/constants';
import {TEST_ACCOUNT_ADDRESS} from '../../../src/core/constants/test';
import MockToken from '../../fixtures/MockToken.json';
import {SupportedToken} from '../../../src';

describe('INT: RequiredBalanceChecker', () => {
  const provider = createMockProvider();
  const balanceChecker = new BalanceChecker(provider);
  const requiredBalanceChecker = new RequiredBalanceChecker(balanceChecker);
  const [wallet] = getWallets(provider);
  let mockToken: Contract;
  let supportedTokens: SupportedToken[];

  beforeEach(async () => {
    mockToken = await deployContract(wallet, MockToken);
    supportedTokens = [
      {
        address: ETHER_NATIVE_TOKEN.address,
        minimalAmount: '0.5',
      },
      {
        address: mockToken.address,
        minimalAmount: '0.3',
      },
    ];
  });

  it('no tokens with required balance', async () => {
    expect(await requiredBalanceChecker.findTokenWithRequiredBalance(supportedTokens, TEST_ACCOUNT_ADDRESS)).to.be.null;
  });

  it('one token with just enough balance', async () => {
    await mockToken.transfer(TEST_ACCOUNT_ADDRESS, utils.parseEther('0.3'));

    const actualTokenAddress = await requiredBalanceChecker
      .findTokenWithRequiredBalance(supportedTokens, TEST_ACCOUNT_ADDRESS);
    expect(actualTokenAddress).to.eq(mockToken.address);
  });

  it('two tokens with just enough balance', async () => {
    await wallet.sendTransaction({to: TEST_ACCOUNT_ADDRESS, value: utils.parseEther('0.5')});
    await mockToken.transfer(TEST_ACCOUNT_ADDRESS, utils.parseEther('0.3'));

    const actualTokenAddress = await requiredBalanceChecker
      .findTokenWithRequiredBalance(supportedTokens, TEST_ACCOUNT_ADDRESS);
    expect(actualTokenAddress).to.eq(ETHER_NATIVE_TOKEN.address);
  });
});
