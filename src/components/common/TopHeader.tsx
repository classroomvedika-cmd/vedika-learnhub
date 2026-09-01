import React from 'react';
import { Bell, User, ShieldCheck } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { resolvePersistentStudentId } from '../../lib/studentIdHelper';

interface TopHeaderProps {
  onOpenNotifications: () => void;
  onOpenProfile: () => void;
  onOpenPlans: () => void;
}

export const TopHeader: React.FC<TopHeaderProps> = ({
  onOpenNotifications,
  onOpenProfile,
  onOpenPlans,
}) => {
  const { profile, hasActiveSubscription, subscription, unreadNotificationsCount } = useAuth();
  const resolvedStudentId = profile?.id ? resolvePersistentStudentId(profile.id, profile.student_id) : (profile?.student_id || 'Student Hub');

  return (
    <header className="sticky top-0 z-30 w-full bg-white/90 backdrop-blur-md border-b border-slate-200/80 px-4 py-3 shadow-[0_1px_3px_rgba(0,0,0,0.03)]">
      <div className="max-w-lg mx-auto flex items-center justify-between gap-3">
        {/* Brand & Student Snapshot */}
        <button
          type="button"
          id="btn-header-profile"
          className="flex items-center gap-3 cursor-pointer text-left focus:outline-none group"
          onClick={onOpenProfile}
        >
          <div className="relative shrink-0">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#312C51] to-[#48426D] p-[1.5px] shadow-sm shadow-[#312C51]/20">
              {profile?.image_url || profile?.avatar_url ? (
                <img
                  src={profile.image_url || profile.avatar_url}
                  alt={profile.full_name}
                  className="w-full h-full object-cover rounded-[10px]"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                />
              ) : (
                <div className="w-full h-full bg-slate-100 rounded-[10px] flex items-center justify-center text-[#312C51] font-bold text-sm">
                  {profile?.full_name?.charAt(0) || <User className="w-4 h-4" />}
                </div>
              )}
            </div>
            {hasActiveSubscription && (
              <span className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 border-2 border-white rounded-full flex items-center justify-center shadow-xs">
                <ShieldCheck className="w-2.5 h-2.5 text-white" />
              </span>
            )}
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-sm tracking-tight text-[#312C51] font-['Outfit']">
                VEDIKA
              </span>
              <span className="text-[10px] font-bold text-[#312C51] uppercase tracking-widest bg-purple-50 px-1.5 py-0.5 rounded border border-purple-200/60">
                STUDENT
              </span>
            </div>
            <div className="text-xs text-slate-500 font-medium truncate max-w-[120px] font-mono">
              {resolvedStudentId}
            </div>
          </div>
        </button>

        {/* Action Buttons */}
        <div className="flex items-center gap-1.5 shrink-0">
          {/* Subscription / Plan Badge Button */}
          <button
            type="button"
            id="btn-header-plans"
            onClick={onOpenPlans}
            className={`px-2 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1 border transition-all active:scale-95 shadow-xs ${
              hasActiveSubscription
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100/80'
                : 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100/80'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-current" />
            <span className="truncate max-w-[65px]">
              {hasActiveSubscription ? (subscription?.plan?.name || 'VIP') : 'Upgrade'}
            </span>
          </button>

          {/* Notifications button */}
          <button
            type="button"
            id="btn-header-notifications"
            onClick={onOpenNotifications}
            aria-label="Notifications"
            className="relative p-2 rounded-xl bg-slate-100/80 hover:bg-slate-200/80 border border-slate-200/80 text-slate-700 hover:text-slate-900 transition-all active:scale-95"
          >
            <Bell className="w-4 h-4" />
            {unreadNotificationsCount > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[16px] h-4 bg-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1 border-2 border-white shadow-xs">
                {unreadNotificationsCount > 9 ? '9+' : unreadNotificationsCount}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
