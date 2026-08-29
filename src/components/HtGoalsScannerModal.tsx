import React from 'react';
import { DbState } from '../types';
import { RadarScannerModal } from './RadarScannerModal';

export interface HtGoalsScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  dbState: DbState;
  onSelectMatchForAnalysis?: (matchId: string) => void;
}

export const HtGoalsScannerModal: React.FC<HtGoalsScannerModalProps> = (props) => {
  return <RadarScannerModal {...props} />;
};

export { RadarScannerModal };
