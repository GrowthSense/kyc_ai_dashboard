import React, { useState } from 'react';
import { X, AlertTriangle, CheckCircle, XCircle, Flag, Loader2 } from 'lucide-react';
import { KYCCase } from '@/types/kyc';
import Avatar from '../ui/Avatar';

const rejectionReasons = [
  'Insufficient documentation', 'Document quality too low', 'Document appears altered or fraudulent',
  'Face match failed', 'Information mismatch', 'Expired documents', 'Watchlist match confirmed',
  'Suspicious activity detected', 'Failed address verification', 'Unable to verify identity',
  'Duplicate account detected', 'Incomplete application', 'Other (specify in notes)'
];
const approvalReasons = [
  'All documents verified', 'Identity confirmed', 'Risk assessment passed',
  'Manual verification completed', 'Additional documents provided', 'False positive confirmed',
  'Enhanced due diligence completed', 'Supervisor override'
];
const flagReasons = [
  'Requires additional documentation', 'Pending supervisor review', 'Awaiting customer response',
  'Technical issue with documents', 'Requires enhanced due diligence', 'Escalated to compliance team',
  'Pending AML screening', 'Under investigation'
];

type ActionType = 'approve' | 'reject' | 'flag';

interface ActionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (action: ActionType, reason: string, notes: string) => void;
  actionType: ActionType;
  kycCase: KYCCase;
}

const ActionModal: React.FC<ActionModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  actionType,
  kycCase
}) => {
  const [selectedReason, setSelectedReason] = useState('');
  const [additionalNotes, setAdditionalNotes] = useState('');
  const [isConfirming, setIsConfirming] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);

  if (!isOpen) return null;

  const config = {
    approve: {
      title: 'Approve KYC Application',
      description: 'This will mark the user as verified and grant them full account access.',
      icon: CheckCircle,
      iconColor: 'text-emerald-500',
      iconBg: 'bg-emerald-100',
      buttonColor: 'bg-emerald-600 hover:bg-emerald-700',
      reasons: approvalReasons,
      confirmText: 'Confirm Approval',
      warningText: null
    },
    reject: {
      title: 'Reject KYC Application',
      description: 'This will deny the user\'s verification request. They may be able to resubmit.',
      icon: XCircle,
      iconColor: 'text-red-500',
      iconBg: 'bg-red-100',
      buttonColor: 'bg-red-600 hover:bg-red-700',
      reasons: rejectionReasons,
      confirmText: 'Confirm Rejection',
      warningText: 'This action cannot be undone. The user will be notified of the rejection.'
    },
    flag: {
      title: 'Flag for Review',
      description: 'This will escalate the case for additional review or investigation.',
      icon: Flag,
      iconColor: 'text-orange-500',
      iconBg: 'bg-orange-100',
      buttonColor: 'bg-orange-600 hover:bg-orange-700',
      reasons: flagReasons,
      confirmText: 'Flag Case',
      warningText: null
    }
  };

  const currentConfig = config[actionType];
  const Icon = currentConfig.icon;

  const handleSubmit = () => {
    if (!selectedReason) return;
    
    if (actionType === 'reject' && !showConfirmation) {
      setShowConfirmation(true);
      return;
    }

    setIsConfirming(true);
    // Simulate API call
    setTimeout(() => {
      onConfirm(actionType, selectedReason, additionalNotes);
      setIsConfirming(false);
      setShowConfirmation(false);
      setSelectedReason('');
      setAdditionalNotes('');
    }, 1000);
  };

  const handleClose = () => {
    setShowConfirmation(false);
    setSelectedReason('');
    setAdditionalNotes('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-lg mx-4 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${currentConfig.iconBg}`}>
              <Icon className={`w-5 h-5 ${currentConfig.iconColor}`} />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">{currentConfig.title}</h2>
              <p className="text-sm text-gray-500">{kycCase.id}</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-4 space-y-4">
          {/* User Info */}
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
            <Avatar name={kycCase.userName} src={kycCase.userAvatar || null} size={80} className="mb-3" />
            <div>
              <p className="font-medium text-gray-900">{kycCase.userName}</p>
              <p className="text-sm text-gray-500">{kycCase.userEmail}</p>
            </div>
          </div>

          <p className="text-sm text-gray-600">{currentConfig.description}</p>

          {/* Warning for rejection */}
          {currentConfig.warningText && showConfirmation && (
            <div className="flex items-start gap-3 p-3 bg-red-50 border border-red-200 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-700">{currentConfig.warningText}</p>
            </div>
          )}

          {/* Reason Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Reason <span className="text-red-500">*</span>
            </label>
            <select
              value={selectedReason}
              onChange={(e) => setSelectedReason(e.target.value)}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-700 focus:border-amber-700 outline-none transition-all"
            >
              <option value="">Select a reason...</option>
              {currentConfig.reasons.map((reason, index) => (
                <option key={index} value={reason}>{reason}</option>
              ))}
            </select>
          </div>

          {/* Additional Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Additional Notes
            </label>
            <textarea
              value={additionalNotes}
              onChange={(e) => setAdditionalNotes(e.target.value)}
              placeholder="Add any additional context or notes..."
              rows={3}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-700 focus:border-amber-700 outline-none transition-all resize-none"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-end gap-3">
          <button
            onClick={handleClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!selectedReason || isConfirming}
            className={`px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 ${currentConfig.buttonColor}`}
          >
            {isConfirming && <Loader2 className="w-4 h-4 animate-spin" />}
            {showConfirmation && actionType === 'reject' ? 'Yes, Reject' : currentConfig.confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ActionModal;
