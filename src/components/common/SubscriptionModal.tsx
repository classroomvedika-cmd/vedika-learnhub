import React from 'react';
import { Modal } from './Modal';
import { Lock } from 'lucide-react';

interface SubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
}

export const SubscriptionModal: React.FC<SubscriptionModalProps> = ({
  isOpen,
  onClose,
  title = "Unlock Premium Content",
  description = "Subscribe to Vedika LearnHub to access this content and unlock the full learning experience."
}) => {
  const handleViewPlans = () => {
    onClose();
    // Dispatch custom event to trigger PlansModal in App.tsx
    window.dispatchEvent(new CustomEvent('open-plans-modal'));
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      maxWidth="sm"
    >
      <div className="p-6 text-center flex flex-col items-center">
        {/* Lock Icon Circle */}
        <div className="w-16 h-16 rounded-full bg-[#312C51]/10 text-[#312C51] flex items-center justify-center mb-4">
          <Lock className="w-8 h-8 text-[#312C51]" />
        </div>

        {/* Title */}
        <h3 className="text-lg font-black text-slate-900 font-['Outfit'] mb-2">
          {title}
        </h3>

        {/* Description */}
        <p className="text-sm text-slate-600 font-medium leading-relaxed mb-6">
          {description}
        </p>

        {/* Action Buttons */}
        <div className="w-full space-y-2">
          <button
            onClick={handleViewPlans}
            className="w-full py-3 px-4 bg-[#312C51] hover:bg-[#48426D] text-[#F0C38E] hover:text-white font-extrabold text-sm rounded-2xl shadow-md hover:shadow-lg transition-all active:scale-98"
            id="view-plans-confirm-button"
          >
            View Subscription Plans
          </button>
          
          <button
            onClick={onClose}
            className="w-full py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm rounded-2xl transition-all"
            id="view-plans-cancel-button"
          >
            Not Now
          </button>
        </div>
      </div>
    </Modal>
  );
};
