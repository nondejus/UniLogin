import {DeployArgs, DeviceInfo, DeploymentState} from '@unilogin/commons';

export default interface Deployment extends DeployArgs {
  hash: string;
  deviceInfo: DeviceInfo;
  transactionHash: string | null;
  error: string | null;
  state: DeploymentState;
}
