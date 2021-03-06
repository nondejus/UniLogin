import React, {ReactNode} from 'react';
import {Omit, isClassName} from '@unilogin/commons';
import EthereumIcon from './../assets/icons/ether.svg';
import daiIcon from './../assets/icons/dai.svg';
import cardIcon from './../assets/icons/card.svg';
import bankIcon from './../assets/icons/bank.svg';
import {classForComponent} from '../utils/classFor';

export interface TopUpRadioProps {
  onClick: () => void;
  checked: boolean;
  className?: string;
  children: ReactNode;
  name: string;
  id?: string;
}

export const TopUpRadio = ({id, onClick, checked, children, className, name}: TopUpRadioProps) => (
  <label
    id={id}
    onClick={onClick}
    className={`${classForComponent('top-up-radio-label')} ${isClassName(className)}`}
  >
    <input
      className={classForComponent('top-up-radio')}
      type="radio"
      name={name}
      checked={checked}
      readOnly
    />
    <div className={classForComponent('top-up-radio-inner')}>
      {children}
    </div>
  </label>
);

export const TopUpRadioCrypto = (props: Omit<TopUpRadioProps, 'children'>) => (
  <TopUpRadio {...props}>
    <div className={classForComponent('top-up-method-icons')}>
      <img className={classForComponent('top-up-method-icon')} src={EthereumIcon} alt="Ethereum" />
      <img className={classForComponent('top-up-method-icon')} src={daiIcon} alt="Dai" />
    </div>
    <p className={classForComponent('top-up-method-title')}>Crypto</p>
    <p className={classForComponent('top-up-method-text')}>Free-Deposit ETH or DAI</p>
  </TopUpRadio>
);

export const TopUpRadioFiat = (props: Omit<TopUpRadioProps, 'children'>) => (
  <TopUpRadio {...props}>
    <div className={classForComponent('top-up-method-icons')}>
      <img className={classForComponent('top-up-method-icon')} src={cardIcon} alt="card" />
      <img className={classForComponent('top-up-method-icon')} src={bankIcon} alt="Dai" />
    </div>
    <p className={classForComponent('top-up-method-title')}>Fiat</p>
    <p className={classForComponent('top-up-method-text')}>Buy using credit card or bank account</p>
  </TopUpRadio>
);
