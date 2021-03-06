import React, {useState} from 'react';
import {useClassFor, classForComponent} from '../../utils/classFor';
import './../../styles/base/components/amountSelect.sass';
import './../../styles/themes/UniLogin/components/amountSelectThemeUniLogin.sass';

export interface AmountInputProps {
  amount: string;
  selectedCurrency: string;
  setCurrency: (currency: string) => void;
  onChange: (amount: string) => void;
}

export const AmountInput = ({amount, selectedCurrency, setCurrency, onChange}: AmountInputProps) => {
  const [expanded, setExpanded] = useState(false);
  const currenciesList = ['ETH'];
  const disabled = currenciesList.length < 2;

  const onCurrencyItemClick = (currency: string) => {
    setExpanded(false);
    setCurrency(currency);
  };

  return (
    <div className={useClassFor('amount-input-wrapper')}>
      <input
        value={amount}
        type="number"
        className={classForComponent('amount-input')}
        onChange={event => onChange(event.target.value)}
      />
      <div className={classForComponent('amount-dropdown')}>
        <button
          className={`${classForComponent('amount-dropdown-btn')} ${disabled ? '' : classForComponent('amount-dropdown-toggle')} ${expanded ? 'expanded' : ''}`}
          onClick={() => setExpanded(!expanded)}
        >
          {selectedCurrency}
        </button>
        {expanded &&
          <ul className={classForComponent('amount-dropdown-list')}>
            {currenciesList
              .filter(currency => currency !== selectedCurrency)
              .map(currency => (
                <li key={currency}>
                  <button onClick={() => onCurrencyItemClick(currency)} className={classForComponent('amount-dropdown-btn')}>{currency}</button>
                </li>
              ))
            }
          </ul>
        }
      </div>
    </div>
  );
};
