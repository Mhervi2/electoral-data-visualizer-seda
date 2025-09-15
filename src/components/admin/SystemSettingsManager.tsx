import React from 'react';
import { MailVotingToggle } from './MailVotingToggle';
import { SubmitActaToggle } from './SubmitActaToggle';

export const SystemSettingsManager = () => {
  return (
    <div className="space-y-6">
      <MailVotingToggle />
      <SubmitActaToggle />
    </div>
  );
};