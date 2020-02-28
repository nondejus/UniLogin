import {RpcBridge} from './RpcBridge';
import {DEFAULT_CONFIG, ProviderConfig} from './config';
import {createIFrame} from './createIframe';
import {State, waitFor} from 'reactive-properties';
import {getApplicationInfoFromDocument} from './applicationInfo';
import {buildIframeUrl} from './buildIframeUrl';

export interface Provider {
  send: (msg: any, cb: (err: any, response: any) => void) => void;
}

export type Network
  = '1' | 'mainnet'
  | '3' | 'ropsten'
  | '4' | 'rinkeby'
  | '42' | 'kovan'
  | '8545' | 'ganache';

export interface ExtendedConfig extends ProviderConfig {
  enablePicker: boolean;
  upstream?: Provider;
  network?: Network;
}

export class ULIFrameProvider {
  private iframe: HTMLIFrameElement;
  private bridge: RpcBridge;
  private isReady = new State(false);
  private hasNotifications = false;

  readonly isUniLogin = true;

  constructor(
    private readonly config: ExtendedConfig,
  ) {
    const applicationInfo = getApplicationInfoFromDocument();
    this.iframe = createIFrame(buildIframeUrl(config.backendUrl, applicationInfo, config.enablePicker, config.network));
    this.bridge = new RpcBridge(
      msg => this.iframe.contentWindow!.postMessage(msg, '*'),
      this.handleRpc.bind(this),
    );
    window.addEventListener('message', e => this.bridge.handleMessage(e.data));

    this.observeDomForUlButtons();
  }

  private observeDomForUlButtons() {
    const mutationObserver = new MutationObserver(mutations => {
      for (const mutation of mutations) {
        if (mutation.target instanceof Element) {
          mutation.target.querySelectorAll(`button#${this.config.ulButtonId}`)
            .forEach(element => {
              if (element instanceof HTMLButtonElement) {
                this.initUlButton(element);
              }
            });
        }
      }
    });
    mutationObserver.observe(document.body, {childList: true, subtree: true});
  }

  private handleRpc(msg: any, cb: (error: any, response: any) => void) {
    switch (msg.method) {
      case 'ul_set_iframe_visibility':
        this.setIframeVisibility(msg.params[0]);
        break;
      case 'ul_ready':
        this.isReady.set(true);
        break;
      case 'ul_set_notification_indicator':
        this.hasNotifications = msg.params[0];
        this.setNotificationsIndicatorVisibility(this.hasNotifications);
        break;
      default:
        this.sendUpstream(msg, cb);
    }
  }

  private setNotificationsIndicatorVisibility(hasNotifications: boolean) {
    const notificationsIndicator = this.getNotificationsIndicator();
    if (notificationsIndicator) {
      notificationsIndicator.style.display = hasNotifications ? 'block' : 'none';
    }
  }

  private sendUpstream(msg: any, cb: (error: any, response: any) => void) {
    const upstream = this.config.upstream;
    if (!upstream) {
      throw new TypeError();
    }
    if ((upstream as any).sendAsync) {
      (upstream as any).sendAsync(msg, cb);
    } else {
      upstream.send(msg, cb);
    }
  }

  private setIframeVisibility(visible: boolean) {
    this.iframe.style.display = visible ? 'unset' : 'none';
  }

  static create(network: Network, config = DEFAULT_CONFIG) {
    return new ULIFrameProvider({
      enablePicker: false,
      network: network.toString() as Network,
      ...config,
    });
  }

  static createPicker(upstream: Provider | Network, config = DEFAULT_CONFIG) {
    if (typeof upstream === 'string') {
      return new ULIFrameProvider({
        enablePicker: true,
        network: upstream.toString() as Network,
        ...config,
      });
    } else {
      return new ULIFrameProvider({
        enablePicker: true,
        upstream,
        ...config,
      });
    }
  }

  async send(msg: any, cb: (error: any, response: any) => void) {
    await this.waitUntilReady();
    this.bridge.send(msg, cb);
  }

  async sendAsync(msg: any, cb: (error: any, response: any) => void) {
    await this.send(msg, cb);
  }

  setDashboardVisibility(visible: boolean) {
    this.send({method: 'ul_set_dashboard_visibility', params: [visible]}, () => {});
  }

  openDashboard() {
    this.setDashboardVisibility(true);
  }

  closeDashboard() {
    this.setDashboardVisibility(false);
  }

  waitUntilReady() {
    return this.isReady.pipe(waitFor(Boolean));
  }

  private boundOpenDashboard = this.openDashboard.bind(this);

  private getNotificationsIndicator = () => document.getElementById(`${this.config.ulButtonId}-notifications`);

  initUlButton(element: HTMLButtonElement) {
    Object.assign(element.style, {
      display: 'inline-block',
      background: 'none',
      border: 'none',
      cursor: 'pointer',
      position: 'relative',
      width: '60px',
      height: '60px',
      padding: '0',
    });

    element.innerHTML = `
      <img style="width: 100%; height: 100%;" src="${this.config.logoUrl}" alt="U" >
      <div id="${this.config.ulButtonId}-notifications"></div>
    `;
    Object.assign(this.getNotificationsIndicator()!.style, {
      display: this.hasNotifications ? 'block' : 'none',
      position: 'absolute',
      top: '0px',
      right: '-11px',
      width: '15px',
      height: '15px',
      background: '#0FB989',
      'box-shadow': '0px 5px 4px rgba(0, 0, 0, 0.14516)',
      'border-radius': '50%',
    });

    element.addEventListener('click', this.boundOpenDashboard);
  }
}
