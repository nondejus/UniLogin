import chai, {expect} from 'chai';
import sinon from 'sinon';
import sinonChai from 'sinon-chai';
import {Contract, Wallet, providers, utils} from 'ethers';
import {solidity, createFixtureLoader} from 'ethereum-waffle';
import {RelayerUnderTest} from '@unilogin/relayer';
import {DEFAULT_GAS_PRICE, DEFAULT_GAS_LIMIT} from '@unilogin/commons';
import {waitExpect} from '@unilogin/commons/testutils';
import {mineBlock} from '@unilogin/contracts/testutils';
import basicSDK from '../fixtures/basicSDK';
import UniversalLoginSDK from '../../src/api/sdk';
import {Callback} from 'reactive-properties/dist/Property';
import {DeployedWallet} from '../../src';

chai.use(solidity);
chai.use(sinonChai);

const loadFixture = createFixtureLoader();

const gasPrice = DEFAULT_GAS_PRICE;
const gasLimit = DEFAULT_GAS_LIMIT;

describe('INT: Events', () => {
  let relayer: RelayerUnderTest;
  let provider: providers.Provider;
  let sdk: UniversalLoginSDK;
  let deployedWallet: DeployedWallet;
  let contractAddress: string;
  let wallet: Wallet;
  let privateKey: string;
  let mockToken: Contract;
  let unsubscribe: Callback;
  const connectionCallback = sinon.spy();

  before(async () => {
    ({sdk, relayer, mockToken, privateKey, contractAddress, wallet, provider} = await loadFixture(basicSDK));
    await sdk.start();
    unsubscribe = await sdk.subscribeAuthorisations(contractAddress, privateKey, connectionCallback);
    deployedWallet = new DeployedWallet(contractAddress, '', privateKey, sdk);
  });

  it('create, request connection, addKey roundtrip', async () => {
    const keyCallback = sinon.spy();
    const newKeySDK = new UniversalLoginSDK(relayer.url(), provider);
    await newKeySDK.start();
    const {privateKey: newPrivateKey} = await newKeySDK.connect(contractAddress);
    const publicKeyToAdd = utils.computeAddress(newPrivateKey);
    newKeySDK.subscribe('AddedOwner', {contractAddress, key: publicKeyToAdd}, keyCallback);
    await deployedWallet.addKey(publicKeyToAdd.toLowerCase(), {gasPrice, gasLimit, gasToken: mockToken.address});
    await mineBlock(wallet);
    await waitExpect(() => expect(keyCallback).to.have.been.calledOnce);
    await sdk.finalizeAndStop();
    await newKeySDK.finalizeAndStop();
    unsubscribe();
    expect(keyCallback).to.have.been.calledWith({key: publicKeyToAdd});
    expect(connectionCallback).to.have.been.called;
  });

  after(async () => {
    await relayer.stop();
  });
});
