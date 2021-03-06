import React, {useMemo, useState} from 'react';
import {MemoryRouter} from 'react-router';
import {DeployedWallet, setBetaNotice, WalletService} from '@unilogin/sdk';
import logoIcon from '../assets/icons/U.svg';
import {useProperty} from '../..';
import {DashboardModal} from './DashboardModal';
import './../styles/udashboard.sass';
import {getWindowConfirmation} from '../../core/utils/getWindowConfirmation';
import {useAsyncEffect} from '../hooks/useAsyncEffect';

export interface DashboardProps {
  deployedWallet?: DeployedWallet;
  walletService?: WalletService;
}

export const Dashboard = (props: DashboardProps) => {
  const walletService = useMemo(
    () => initializeWalletService(props.walletService, props.deployedWallet),
    [props.deployedWallet, props.walletService],
  );
  const [dashboardVisibility, setDashboardVisibility] = useState(false);

  const state = useProperty(walletService.stateProperty);
  const deployedWallet = state.kind === 'Deployed' ? state.wallet : undefined;

  const [newNotifications, setNewNotifications] = useState<Notification[]>([]);
  useAsyncEffect(async () => deployedWallet?.subscribeAuthorisations(setNewNotifications) as Promise<() => void>, [deployedWallet]);

  useAsyncEffect(async () => deployedWallet?.subscribeDisconnected(() => walletService.disconnect()), [deployedWallet]);

  if (!deployedWallet) {
    return null;
  }

  return (
    <>
      <button
        className={`udashboard-logo-btn ${newNotifications.length > 0 ? 'new-notifications' : ''}`}
        onClick={() => setDashboardVisibility(true)}
      >
        <img src={logoIcon} alt="U" />
      </button>

      <MemoryRouter initialEntries={['/dashboard/funds']} getUserConfirmation={getWindowConfirmation}>
        {dashboardVisibility && (
          <DashboardModal
            walletService={walletService}
            onClose={() => setDashboardVisibility(false)}
          />
        )}
      </MemoryRouter>
    </>
  );
};

function initializeWalletService(walletService?: WalletService, deployedWallet?: DeployedWallet) {
  if (walletService) {
    setBetaNotice(walletService.sdk);
    return walletService;
  }

  if (!deployedWallet) {
    throw new TypeError('Either WalletService or DeployedWallet must be provided');
  }

  setBetaNotice(deployedWallet.sdk);

  const newWalletService = new WalletService(deployedWallet.sdk);
  newWalletService.setWallet(deployedWallet.asApplicationWallet);
  return newWalletService;
}
