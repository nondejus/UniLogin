import {utils, Wallet} from 'ethers';
import {deployContract} from 'ethereum-waffle';
import {executeAddKey, mockContracts} from '@unilogin/contracts/testutils';
import createWalletContract from '../testhelpers/createWalletContract';
import {buildEnsService} from '../testhelpers/buildEnsService';

export async function basicWalletContractWithMockToken(_: any, wallets: Wallet[]) {
  const [, otherWallet, wallet] = wallets;
  const [, provider] = await buildEnsService(wallet, 'mylogin.eth');
  const {master, proxy: walletContract} = await createWalletContract(wallet);
  const actionWallet = Wallet.createRandom();
  const actionKey = actionWallet.privateKey;
  const mockToken = await deployContract(wallet, mockContracts.MockToken);
  await wallet.sendTransaction({to: walletContract.address, value: utils.parseEther('1.0')});
  await mockToken.transfer(walletContract.address, utils.parseEther('1.0'));
  await executeAddKey(walletContract, actionWallet.address, wallet.privateKey);
  return {wallet, actionKey, provider, mockToken, master, walletContract, otherWallet, actionWallet};
}
