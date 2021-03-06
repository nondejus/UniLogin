import {MessageState} from '@unilogin/commons';

export interface Mineable {
  transactionHash: string | null;
  error: string | null;
  state: MessageState;
}
