
import React from 'react';
import {dashboardContentType} from '../../core/models/ReactUDashboardContentType';

export interface UHeaderProps {
  activeTab: dashboardContentType;
  setActiveTab: (tab: dashboardContentType) => void;
}

export const UHeader = ({activeTab, setActiveTab}: UHeaderProps) => {

  return (
    <div className="udashboard-header">
      <button
        className={`udashboard-tab udashboard-tab-funds ${activeTab === 'funds' ? 'active' : ''}`}
        onClick={() => setActiveTab('funds')}
      >
        Funds
      </button>
      <button
        className={`udashboard-tab udashboard-tab-approve ${activeTab === 'approveDevice' ? 'active' : ''}`}
        onClick={() => setActiveTab('approveDevice')}
      >
        Approve Device
      </button>
      <button
        className={`udashboard-tab udashboard-tab-devices ${activeTab === 'devices' ? 'active' : ''}`}
        onClick={() => setActiveTab('devices')}
      >
        Devices
      </button>
      <button
        className={`udashboard-tab udashboard-tab-backup ${activeTab === 'backup' ? 'active' : ''}`}
        onClick={() => setActiveTab('backup')}
      >
        Backup
      </button>
    </div>
  );
};
