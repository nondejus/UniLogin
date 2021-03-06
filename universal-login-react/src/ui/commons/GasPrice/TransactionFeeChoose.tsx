import React from 'react';
import {RadioButton} from './RadioButton';
import {GasMode, GasOption, getBalanceOf, TokenDetailsWithBalance, safeMultiply} from '@unilogin/commons';
import {utils} from 'ethers';
import {isGasTokenDisabled} from '../../../core/utils/isGasTokenDisabled';
import {calculateTransactionFee} from '../../../core/utils/calculateTransactionFee';
import {getIconForToken} from '../../../core/utils/getIconForToken';
import {formatCryptoBalance} from '../../../core/utils/formatCryptoBalance';

interface TransactionFeeProps {
  gasModes: GasMode[];
  modeName: string;
  tokenAddress: string;
  gasLimit: utils.BigNumberish;
  usdAmount: utils.BigNumberish;
  tokensDetailsWithBalance?: TokenDetailsWithBalance[];
  onGasOptionChanged: (gasOption: GasOption) => void;
}

export const TransactionFeeChoose = ({gasModes, gasLimit, onGasOptionChanged, modeName, tokenAddress, tokensDetailsWithBalance, usdAmount}: TransactionFeeProps) => {
  const renderBalance = (option: GasOption) => tokensDetailsWithBalance ? (
    <div className="transaction-fee-balance">
      <p className="transaction-fee-balance-text">Your balance</p>
      <p className="transaction-fee-balance-amount">{getBalanceOf(option.token.symbol, tokensDetailsWithBalance)} {option.token.symbol}</p>
    </div>
  ) : null;

  return (
    <div className="transaction-fee">
      <p className="transaction-fee-title">Transaction fee</p>
      <ul className="transaction-fee-list">
        {gasModes.filter(gasMode => gasMode.name === modeName)[0].gasOptions.map((option: GasOption) => (
          <li key={option.token.address} className="transaction-fee-item">
            <RadioButton
              disabled={isGasTokenDisabled(option.token.symbol)}
              id={`token-${option.token.address}`}
              name="fee"
              checked={option.token.address === tokenAddress}
              onClick={() => onGasOptionChanged(option)}
            >
              <div className="transaction-fee-row">
                <img src={getIconForToken(option.token.symbol)} alt={option.token.symbol} className="transaction-fee-item-icon" />
                <div className="transaction-fee-details">
                  <div>
                    <p className="transaction-fee-amount-usd">{calculateTransactionFee(usdAmount, gasLimit)} USD</p>
                    <p className="transaction-fee-amount">{formatCryptoBalance(safeMultiply(option.gasPrice, gasLimit), 9)} {option.token.symbol}</p>
                  </div>
                </div>
                {renderBalance(option)}
              </div>
            </RadioButton>
          </li>
        ))}
      </ul>
    </div>
  );
};
