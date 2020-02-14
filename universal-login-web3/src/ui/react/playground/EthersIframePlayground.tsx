import React, {useState} from 'react';
import UniLoginProvider from '@universal-login/provider';
import {providers, utils} from 'ethers';

export const EthersIframePlayground = () => {
  const [provider] = useState(() => createProvider());
  const [address, setAddress] = useState('');
  const [balance, setBalance] = useState('');

  const onClick = async () => {
    const signer = provider.getSigner()
    setAddress(await signer.getAddress())
    const balance = await signer.getBalance()
    setBalance(utils.formatEther(balance))
  };
  return (
    <div className="web3-picker-playground">
      <button id="test-button" onClick={onClick}>Load stuff</button>
      <br />
      <p>Address: {address}</p>
      <p>Balance: {balance}</p>
      <br/>
      <button id="unilogin-button"/>
    </div>
  );
};

function createProvider() {
  const provider = UniLoginProvider.createPicker(window.ethereum as any)
  return new providers.Web3Provider(provider)
}
