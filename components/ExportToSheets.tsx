import React from 'react';
import type { TranslationSet } from '../types';
import ComingSoon from './ComingSoon';

interface ExportToSheetsProps {
  t: TranslationSet;
}

const ExportToSheets: React.FC<ExportToSheetsProps> = ({ t }) => {
  return <ComingSoon toolName="Export to Sheets" />;
};

export default ExportToSheets;