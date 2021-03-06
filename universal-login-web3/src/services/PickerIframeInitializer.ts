import {Web3PickerProvider} from '../Web3PickerProvider';
import {setupStrategies} from './setupStrategies';
import {combine, flatMap, Property, State} from 'reactive-properties';
import {ULWeb3Provider} from '../ULWeb3Provider';
import {IframeInitializerBase} from './IframeInitializerBase';
import {ApplicationInfo, Network} from '@unilogin/commons';
import {getConfigForNetwork} from '../config';
import {IframeBridgeEndpoint} from './IframeBridgeEndpoint';

export class PickerIframeInitializer extends IframeInitializerBase {
  private readonly provider: Web3PickerProvider;

  constructor(endpoint: IframeBridgeEndpoint, applicationInfo: ApplicationInfo, network?: Network) {
    super(endpoint);
    const upstream = this.getUpstream(network);
    const web3ProviderFactories = setupStrategies(upstream, ['UniLogin', 'Metamask'], {applicationInfo});
    this.provider = new Web3PickerProvider(web3ProviderFactories, upstream);
    endpoint.setHandler(this.provider);
  }

  private getUpstream(network: Network | undefined) {
    return network ? getConfigForNetwork(network).provider : this.endpoint.bridge;
  }

  protected getIsUiVisible(): Property<boolean> {
    return combine([
      this.provider.isVisible,
      this.provider.currentProvider.pipe(
        flatMap(provider => provider instanceof ULWeb3Provider ? provider.isUiVisible : new State(false)),
      ),
    ], (a, b) => a || b);
  }

  protected getHasNotifications(): Property<boolean> {
    return this.provider.currentProvider.pipe(
      flatMap(provider => provider instanceof ULWeb3Provider ? provider.hasNotifications : new State(false)),
    );
  }
}
