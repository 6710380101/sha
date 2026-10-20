import React from 'react';
import { ChevronRight, Home, Megaphone, MailCheck, RefreshCw, AlertTriangle } from 'lucide-react';
import { ActiveView, SiteSettings, UserProfile } from '../types/models';

interface BreadcrumbBarProps {
  activeView: ActiveView;
  selectedCategory: string;
  selectedLevel: string;
  searchQuery: string;
  siteSettings: SiteSettings;
  userProfile: UserProfile | null;
  authEmailVerified: boolean;
  isSignedIn: boolean;
  onResetToHome: () => void;
  onClearCategory: () => void;
  onResendVerification: () => void;
  onRefreshVerification: () => void;
  verificationLoading: boolean;
}

const VIEW_NAMES: Record<ActiveView, string> = {
  explore: 'คลังความรู้ทั้งหมด',
  favorites: 'รายการโปรดของฉัน',
  'my-resources': 'สื่อการเรียนรู้ที่ฉันแบ่งปัน',
  profile: 'โปรไฟล์และการตั้งค่าบัญชี',
  admin: 'ศูนย์ผู้ดูแลระบบ (Admin & Moderator Dashboard)',
  guide: 'คู่มือการตั้งค่า Firebase และการทดสอบระบบ',
};

export const BreadcrumbBar: React.FC<BreadcrumbBarProps> = ({
  activeView,
  selectedCategory,
  selectedLevel,
  searchQuery,
  siteSettings,
  userProfile,
  authEmailVerified,
  isSignedIn,
  onResetToHome,
  onClearCategory,
  onResendVerification,
  onRefreshVerification,
  verificationLoading,
}) => {
  return (
    <div className="bg-white border-b border-slate-200">
      {/* Announcement Banner from Firestore SiteSettings */}
      {siteSettings.announcementActive && siteSettings.announcement.trim().length > 0 && (
        <div className="bg-sky-50 border-b border-sky-200/80 px-4 sm:px-6 lg:px-8 py-2.5">
          <div className="max-w-[1440px] mx-auto flex items-center justify-between gap-4 text-xs sm:text-sm text-blue-900">
            <div className="flex items-center gap-2.5">
              <Megaphone className="w-4 h-4 text-blue-700 shrink-0" />
              <p className="font-medium">{siteSettings.announcement}</p>
            </div>
          </div>
        </div>
      )}

      {/* Email Verification Required Banner for Unverified Email/Password Accounts */}
      {isSignedIn && !authEmailVerified && (
        <div className="bg-amber-50 border-b border-amber-200 px-4 sm:px-6 lg:px-8 py-3">
          <div className="max-w-[1440px] mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs sm:text-sm text-amber-950">
            <div className="flex items-start sm:items-center gap-2.5">
              <MailCheck className="w-4 h-4 text-amber-700 shrink-0 mt-0.5 sm:mt-0" />
              <div>
                <span className="font-semibold">กรุณายืนยันอีเมลของคุณ: </span>
                <span>
                  ระบบได้ส่งลิงก์ยืนยันตัวตนไปยังอีเมลของคุณแล้ว กรุณากดลิงก์ในอีเมลแล้วกดปุ่ม
                  &ldquo;ฉันยืนยันอีเมลแล้ว&rdquo; เพื่อเปิดสิทธิ์โพสต์สื่อและบันทึกรายการโปรด
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={onResendVerification}
                disabled={verificationLoading}
                className="px-3 py-1.5 text-xs font-semibold text-amber-900 bg-white border border-amber-300 rounded-md hover:bg-amber-100 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                ส่งอีเมลยืนยันอีกครั้ง
              </button>
              <button
                type="button"
                onClick={onRefreshVerification}
                disabled={verificationLoading}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-amber-700 rounded-md hover:bg-amber-800 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${verificationLoading ? 'animate-spin' : ''}`} />
                <span>ฉันยืนยันอีเมลแล้ว (รีเฟรชสถานะ)</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Suspended Account Warning */}
      {userProfile && userProfile.status === 'suspended' && (
        <div className="bg-red-50 border-b border-red-200 px-4 sm:px-6 lg:px-8 py-2.5">
          <div className="max-w-[1440px] mx-auto flex items-center gap-2.5 text-xs sm:text-sm text-red-900">
            <AlertTriangle className="w-4 h-4 text-red-700 shrink-0" />
            <span>
              <strong>บัญชีของคุณถูกระงับการใช้งานชั่วคราว:</strong> คุณยังสามารถเปิดดูสื่อสาธารณะได้ แต่ไม่สามารถโพสต์ แก้ไข หรือบันทึกรายการโปรดเพิ่มเติมได้
            </span>
          </div>
        </div>
      )}

      {/* Breadcrumb Navigation Row */}
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-2.5 flex flex-wrap items-center justify-between gap-4 text-xs text-slate-600">
        <nav aria-label="Breadcrumb" className="flex items-center flex-wrap gap-1.5">
          <button
            type="button"
            onClick={onResetToHome}
            className="inline-flex items-center gap-1 text-slate-500 hover:text-blue-700 transition-colors cursor-pointer"
          >
            <Home className="w-3.5 h-3.5" />
            <span>หน้าแรก</span>
          </button>

          <ChevronRight className="w-3.5 h-3.5 text-slate-400" />

          <button
            type="button"
            onClick={onClearCategory}
            className={`hover:text-blue-700 transition-colors cursor-pointer ${
              selectedCategory === 'all' && !searchQuery
                ? 'font-semibold text-slate-900'
                : 'text-slate-600'
            }`}
          >
            {VIEW_NAMES[activeView]}
          </button>

          {activeView === 'explore' && selectedCategory !== 'all' && (
            <>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              <span className="font-semibold text-blue-800">{selectedCategory}</span>
            </>
          )}

          {activeView === 'explore' && selectedLevel !== 'all' && (
            <>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-slate-700">ระดับชั้น: {selectedLevel}</span>
            </>
          )}

          {activeView === 'explore' && searchQuery.trim() !== '' && (
            <>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-slate-700">ค้นหา: &ldquo;{searchQuery.trim()}&rdquo;</span>
            </>
          )}
        </nav>

        {userProfile && (
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span>สถานะสิทธิ์:</span>
            <span className="font-semibold text-blue-900">
              {userProfile.role === 'admin'
                ? 'ผู้ดูแลระบบสูงสุด (Admin)'
                : userProfile.role === 'moderator'
                ? 'ผู้ตรวจสอบเนื้อหา (Moderator)'
                : 'สมาชิก (Member)'}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
