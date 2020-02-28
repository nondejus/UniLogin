import {GAS_BASE, GAS_FIXED, Message} from '@unilogin/commons';
import {waitExpect} from '@unilogin/commons/testutils';
import {beta2} from '@unilogin/contracts';
import {encodeFunction, mockContracts} from '@unilogin/contracts/testutils';
import {expect} from 'chai';
import {deployContract} from 'ethereum-waffle';
import {utils, Wallet, Contract} from 'ethers';
import {getConfig} from '../../../../../src';
import {clearDatabase} from '../../../../../src/http/relayers/RelayerUnderTest';
import defaultDeviceInfo from '../../../../testconfig/defaults';
import {getTestSignedMessage} from '../../../../testconfig/message';
import {addKeyMessage, removeKeyMessage, transferMessage} from '../../../../fixtures/basicWalletContract';
import {getKnexConfig} from '../../../../testhelpers/knex';
import setupMessageService from '../../../../testhelpers/setupMessageService';
import MessageHandler from '../../../../../src/core/services/execution/messages/MessageHandler';
import {Provider} from 'ethers/providers';
import AuthorisationStore from '../../../../../src/integration/sql/services/AuthorisationStore';
import {DevicesStore} from '../../../../../src/integration/sql/services/DevicesStore';
import ExecutionWorker from '../../../../../src/core/services/execution/ExecutionWorker';

describe('INT: MessageHandler', async () => {
  let messageHandler: MessageHandler;
  let provider: Provider;
  let authorisationStore: AuthorisationStore;
  let devicesStore: DevicesStore;
  let wallet: Wallet;
  let walletContract: Contract;
  let msg: Message;
  let otherWallet: Wallet;
  let executionWorker: ExecutionWorker;
  const config = getConfig('test');
  const knex = getKnexConfig();

  beforeEach(async () => {
    ({wallet, provider, messageHandler, authorisationStore, walletContract, otherWallet, devicesStore, executionWorker} = await setupMessageService(knex, config));
    msg = {...transferMessage, from: walletContract.address, nonce: await walletContract.lastNonce(), refundReceiver: wallet.address};
    executionWorker.start();
  });

  afterEach(async () => {
    await executionWorker.stopLater();
    await clearDatabase(knex);
  });

  it('Error when not enough tokens', async () => {
    const mockToken = await deployContract(wallet, mockContracts.MockToken);
    await mockToken.transfer(walletContract.address, 1);
    const signedMessage = getTestSignedMessage({...msg, gasToken: mockToken.address}, wallet.privateKey);
    const {messageHash} = await messageHandler.handleMessage(signedMessage);
    await executionWorker.stopLater();
    const messageEntry = await messageHandler.getStatus(messageHash);
    expect(messageEntry?.error).to.eq('Error: Not enough tokens');
  });

  it('Error when not enough gas', async () => {
    const safeTxGas = 1;
    const baseGas = 7696;
    const gasLimit = utils.bigNumberify(baseGas + safeTxGas).add(GAS_FIXED);
    const signedMessage = getTestSignedMessage({...msg, gasLimit}, wallet.privateKey);
    await expect(messageHandler.handleMessage(signedMessage)).to.be.rejectedWith(`Insufficient Gas. Got safeTxGas 1 but should greater than ${GAS_BASE}`);
  });

  describe('Transfer', async () => {
    it('successful execution of transfer', async () => {
      const expectedBalance = (await provider.getBalance(msg.to)).add(msg.value);
      const signedMessage = getTestSignedMessage(msg, wallet.privateKey);
      const {messageHash} = await messageHandler.handleMessage(signedMessage);
      await executionWorker.stopLater();
      expect(await provider.getBalance(msg.to)).to.eq(expectedBalance);
      const msgStatus = await messageHandler.getStatus(messageHash);
      expect(msgStatus?.transactionHash).to.not.be.null;
      expect(msgStatus?.state).to.eq('Success');
    });
  });

  describe('Add Key', async () => {
    it('execute add key', async () => {
      msg = {...addKeyMessage, from: walletContract.address, to: walletContract.address, nonce: await walletContract.lastNonce(), refundReceiver: wallet.address};
      const signedMessage = getTestSignedMessage(msg, wallet.privateKey);

      await messageHandler.handleMessage(signedMessage);
      await executionWorker.stopLater();
      expect(await walletContract.keyExist(otherWallet.address)).to.be.true;
    });

    describe('Collaboration with Authorisation Service', async () => {
      it('should remove request from pending authorisations if addKey', async () => {
        const request = {walletContractAddress: walletContract.address, key: otherWallet.address, deviceInfo: defaultDeviceInfo};
        await authorisationStore.addRequest(request);
        msg = {...addKeyMessage, from: walletContract.address, to: walletContract.address, nonce: await walletContract.lastNonce(), refundReceiver: wallet.address};
        const signedMessage = getTestSignedMessage(msg, wallet.privateKey);
        await messageHandler.handleMessage(signedMessage);
        await executionWorker.stopLater();
        const authorisations = await authorisationStore.getPendingAuthorisations(walletContract.address);
        expect(authorisations).to.deep.eq([]);
        expect(await devicesStore.get(walletContract.address)).length(1);
      });
    });
  });

  describe('Add Keys', async () => {
    it('execute add keys', async () => {
      const keys = [otherWallet.address];
      const data = encodeFunction(beta2.WalletContract, 'addKeys', [keys]);
      msg = {...addKeyMessage, from: walletContract.address, to: walletContract.address, nonce: await walletContract.lastNonce(), data, refundReceiver: wallet.address};
      const signedMessage0 = getTestSignedMessage(msg, wallet.privateKey);
      await messageHandler.handleMessage(signedMessage0);
      await executionWorker.stopLater();
      expect(await walletContract.keyExist(otherWallet.address)).to.be.true;
      const devices = await devicesStore.get(walletContract.address);
      expect(devices.map(({publicKey}) => publicKey)).to.deep.eq(keys);
    });
  });

  describe('Remove key ', async () => {
    beforeEach(async () => {
      const message = {...addKeyMessage, from: walletContract.address, to: walletContract.address, nonce: await walletContract.lastNonce(), refundReceiver: wallet.address};
      const signedMessage = getTestSignedMessage(message, wallet.privateKey);

      await messageHandler.handleMessage(signedMessage);
    });

    it('should remove key', async () => {
      await waitExpect(async () => expect((await walletContract.keyExist(otherWallet.address))).to.be.true);
      const message = {...removeKeyMessage, from: walletContract.address, to: walletContract.address, nonce: await walletContract.lastNonce(), refundReceiver: wallet.address};
      const signedMessage = getTestSignedMessage(message, wallet.privateKey);

      await messageHandler.handleMessage(signedMessage);
      await executionWorker.stopLater();
      expect(await devicesStore.get(walletContract.address)).to.deep.eq([]);
      expect(await walletContract.keyExist(otherWallet.address)).to.eq(false);
    });
  });

  after(async () => {
    await knex.destroy();
  });
});
