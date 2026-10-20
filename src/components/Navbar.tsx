import React from 'react';
import {
  BookOpen,
  Bookmark,
  FolderOpen,
  Shield,
  HelpCircle,
  Plus,
  User as UserIcon,
  LogOut,
  LogIn,
} from 'lucide-react';
import { ActiveView, SiteSettings, UserProfile } from '../types/models';

interface NavbarProps {
  siteSettings: SiteSettings;
  activeView: ActiveView;
  onSelectView: (view: ActiveView) => void;
  userProfile: UserProfile | null;
  authEmailVerified: boolean;
  isStaff: boolean;
  favoritesCount: number;
  pendingReportsCount: number;
  onOpenAuthModal: (mode: 'login' | 'register') => void;
  onOpenPostModal: () => void;
  onSignOut: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  siteSettings,
  activeView,
  onSelectView,
  userProfile,
  authEmailVerified,
  isStaff,
  favoritesCount,
  pendingReportsCount,
  onOpenAuthModal,
  onOpenPostModal,
  onSignOut,
}) => {
  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur border-b border-slate-200">
      <div className="max-w-[1440px] mx-auto flex items-center justify-between gap-8 px-4 sm:px-6 lg:px-8 h-16">
        {/* Zone 1: Single-line Brand Title */}
        <button
          type="button"
          onClick={() => onSelectView('explore')}
          className="text-lg font-bold tracking-tight text-blue-950 hover:text-blue-700 transition-colors whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 rounded"
        >
          {siteSettings.siteName}
        </button>

        {/* Zone 2: 4–5 Concise Single-Line Navigation Links */}
        <nav
          aria-label="เมนูหลัก"
          className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600"
        >
          <button
            type="button"
            onClick={() => onSelectView('explore')}
            className={`py-1 transition-colors whitespace-nowrap shrink-0 border-b-2 ${
              activeView === 'explore'
                ? 'border-blue-600 text-blue-700 font-semibold'
                : 'border-transparent hover:text-slate-900 hover:border-slate-300'
            }`}
          >
            คลังความรู้ทั้งหมด
          </button>

          {userProfile && (
            <>
              <button
                type="button"
                onClick={() => onSelectView('favorites')}
                className={`py-1 transition-colors whitespace-nowrap shrink-0 border-b-2 ${
                  activeView === 'favorites'
                    ? 'border-blue-600 text-blue-700 font-semibold'
                    : 'border-transparent hover:text-slate-900 hover:border-slate-300'
                }`}
              >
                รายการโปรด ({favoritesCount})
              </button>

              <button
                type="button"
                onClick={() => onSelectView('my-resources')}
                className={`py-1 transition-colors whitespace-nowrap shrink-0 border-b-2 ${
                  activeView === 'my-resources'
                    ? 'border-blue-600 text-blue-700 font-semibold'
                    : 'border-transparent hover:text-slate-900 hover:border-slate-300'
                }`}
              >
                สื่อของฉัน
              </button>
            </>
          )}

          {isStaff && (
            <button
              type="button"
              onClick={() => onSelectView('admin')}
              className={`py-1 transition-colors whitespace-nowrap shrink-0 border-b-2 ${
                activeView === 'admin'
                  ? 'border-blue-600 text-blue-700 font-semibold'
                  : 'border-transparent hover:text-slate-900 hover:border-slate-300'
              }`}
            >
              จัดการระบบ{pendingReportsCount > 0 ? ` (${pendingReportsCount})` : ''}
            </button>
          )}

          <button
            type="button"
            onClick={() => onSelectView('guide')}
            className={`py-1 transition-colors whitespace-nowrap shrink-0 border-b-2 ${
              activeView === 'guide'
                ? 'border-blue-600 text-blue-700 font-semibold'
                : 'border-transparent hover:text-slate-900 hover:border-slate-300'
            }`}
          >
            คู่มือระบบ & ทดสอบ
          </button>
        </nav>

        {/* Zone 3: Primary Action & Account Controls */}
        <div className="flex items-center gap-3 shrink-0">
          {userProfile ? (
            <>
              <button
                type="button"
                onClick={onOpenPostModal}
                disabled={userProfile.status === 'suspended'}
                className="inline-flex items-center gap-2 px-4 py-2 text-xs sm:text-sm font-semibold text-white bg-blue-700 rounded-lg hover:bg-blue-800 disabled:opacity-50 transition-colors whitespace-nowrap shrink-0 shadow-xs cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>แบ่งปันความรู้</span>
              </button>

              <button
                type="button"
                onClick={() => onSelectView('profile')}
                title={`โปรไฟล์ของ ${userProfile.displayName}`}
                className={`inline-flex items-center gap-2 px-3 py-2 text-xs sm:text-sm font-medium rounded-lg border transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  activeView === 'profile'
                    ? 'border-blue-600 bg-sky-50 text-blue-800'
                    : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                }`}
              >
                <UserIcon className="w-4 h-4 text-blue-700" />
                <span className="max-w-[120px] truncate">{userProfile.displayName}</span>
                {!authEmailVerified && (
                  <span className="text-[11px] text-amber-700 font-semibold">(รอยืนยันอีเมล)</span>
                )}
              </button>

              <button
                type="button"
                onClick={onSignOut}
                title="ออกจากระบบ"
                className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors shrink-0 cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={() => onOpenAuthModal('login')}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs sm:text-sm font-semibold text-white bg-blue-700 rounded-lg hover:bg-blue-800 transition-colors whitespace-nowrap shrink-0 shadow-xs cursor-pointer"
            >
              <LogIn className="w-4 h-4" />
              <span>เข้าสู่ระบบ / สมัครสมาชิก</span>
            </button>
          )}
        </div>
      </div>

      {/* Mobile Secondary Navigation Strip */}
      <div className="flex md:hidden items-center gap-2 overflow-x-auto px-4 py-2 bg-slate-50 border-t border-slate-200 text-xs font-medium text-slate-600">
        <button
          type="button"
          onClick={() => onSelectView('explore')}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md whitespace-nowrap shrink-0 ${
            activeView === 'explore' ? 'bg-blue-700 text-white' : 'bg-white border border-slate-200'
          }`}
        >
          <BookOpen className="w-3.5 h-3.5" />
          <span>คลังความรู้</span>
        </button>

        {userProfile && (
          <>
            <button
              type="button"
              onClick={() => onSelectView('favorites')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md whitespace-nowrap shrink-0 ${
                activeView === 'favorites' ? 'bg-blue-700 text-white' : 'bg-white border border-slate-200'
              }`}
            >
              <Bookmark className="w-3.5 h-3.5" />
              <span>รายการโปรด ({favoritesCount})</span>
            </button>
            <button
              type="button"
              onClick={() => onSelectView('my-resources')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md whitespace-nowrap shrink-0 ${
                activeView === 'my-resources' ? 'bg-blue-700 text-white' : 'bg-white border border-slate-200'
              }`}
            >
              <FolderOpen className="w-3.5 h-3.5" />
              <span>สื่อของฉัน</span>
            </button>
          </>
        )}

        {isStaff && (
          <button
            type="button"
            onClick={() => onSelectView('admin')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md whitespace-nowrap shrink-0 ${
              activeView === 'admin' ? 'bg-blue-700 text-white' : 'bg-white border border-slate-200'
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            <span>ผู้ดูแลระบบ ({pendingReportsCount})</span>
          </button>
        )}

        <button
          type="button"
          onClick={() => onSelectView('guide')}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md whitespace-nowrap shrink-0 ${
            activeView === 'guide' ? 'bg-blue-700 text-white' : 'bg-white border border-slate-200'
          }`}
        >
          <HelpCircle className="w-3.5 h-3.5" />
          <span>คู่มือระบบ</span>
        </button>
      </div>
    </header>
  );
};
