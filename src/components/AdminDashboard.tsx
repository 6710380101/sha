import React, { useState, useEffect } from 'react';
import {
  Flag,
  Users,
  Settings,
  History,
  Search,
  EyeOff,
  Eye,
  Trash2,
  CheckCircle2,
  XCircle,
  Plus,
  X,
  Save,
  Loader2,
  ShieldAlert,
  UserCheck,
  UserX,
  ExternalLink,
} from 'lucide-react';
import {
  ACTION_TYPE_LABELS,
  AccountStatus,
  ModerationLogItem,
  REPORT_REASON_LABELS,
  ReportItem,
  ReportStatus,
  ResourceItem,
  SiteSettings,
  UserProfile,
  UserRole,
  VALIDATION_LIMITS,
} from '../types/models';
import { formatThaiDate } from './ResourceCard';

interface AdminDashboardProps {
  currentUser: UserProfile;
  resources: ResourceItem[];
  reports: ReportItem[];
  users: UserProfile[];
  moderationLogs: ModerationLogItem[];
  siteSettings: SiteSettings;
  onToggleResourceVisibility: (resource: ResourceItem) => Promise<void>;
  onRequestDeleteResource: (resource: ResourceItem) => void;
  onSelectResource: (resource: ResourceItem) => void;
  onResolveReport: (
    report: ReportItem,
    nextStatus: 'resolved' | 'dismissed',
    resolutionNote: string
  ) => Promise<void>;
  onUpdateUserRoleAndStatus: (
    targetUser: UserProfile,
    nextRole: UserRole,
    nextStatus: AccountStatus
  ) => Promise<void>;
  onSaveSiteSettings: (nextSettings: Omit<SiteSettings, 'updatedAt' | 'updatedBy'>) => Promise<void>;
}

type AdminTab = 'reports' | 'users' | 'settings' | 'logs';

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  currentUser,
  resources,
  reports,
  users,
  moderationLogs,
  siteSettings,
  onToggleResourceVisibility,
  onRequestDeleteResource,
  onSelectResource,
  onResolveReport,
  onUpdateUserRoleAndStatus,
  onSaveSiteSettings,
}) => {
  const [activeTab, setActiveTab] = useState<AdminTab>('reports');

  // Reports & Content filter states
  const [reportFilter, setReportFilter] = useState<'all' | ReportStatus>('pending');
  const [resolutionNotes, setResolutionNotes] = useState<Record<string, string>>({});
  const [busyId, setBusyId] = useState<string | null>(null);

  // Member management states
  const [userSearch, setUserSearch] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState<'all' | UserRole>('all');

  // Site settings form states
  const [siteName, setSiteName] = useState(siteSettings.siteName);
  const [siteDescription, setSiteDescription] = useState(siteSettings.siteDescription);
  const [logoText, setLogoText] = useState(siteSettings.logoText);
  const [logoUrl, setLogoUrl] = useState(siteSettings.logoUrl);
  const [announcement, setAnnouncement] = useState(siteSettings.announcement);
  const [announcementActive, setAnnouncementActive] = useState(siteSettings.announcementActive);
  const [categories, setCategories] = useState<string[]>(siteSettings.categories);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [savingSettings, setSavingSettings] = useState(false);
  const [settingsError, setSettingsError] = useState<string | null>(null);

  useEffect(() => {
    setSiteName(siteSettings.siteName);
    setSiteDescription(siteSettings.siteDescription);
    setLogoText(siteSettings.logoText);
    setLogoUrl(siteSettings.logoUrl);
    setAnnouncement(siteSettings.announcement);
    setAnnouncementActive(siteSettings.announcementActive);
    setCategories(siteSettings.categories);
  }, [siteSettings]);

  const isAdmin = currentUser.role === 'admin';

  const pendingReportsCount = reports.filter((r) => r.status === 'pending').length;
  const hiddenResourcesCount = resources.filter((r) => r.visibility === 'hidden').length;
  const suspendedUsersCount = users.filter((u) => u.status === 'suspended').length;

  const filteredReports = reports.filter((r) =>
    reportFilter === 'all' ? true : r.status === reportFilter
  );

  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      userSearch.trim() === '' ||
      u.displayName.toLowerCase().includes(userSearch.trim().toLowerCase()) ||
      u.email.toLowerCase().includes(userSearch.trim().toLowerCase()) ||
      u.uid.toLowerCase().includes(userSearch.trim().toLowerCase());
    const matchesRole = userRoleFilter === 'all' || u.role === userRoleFilter;
    return matchesSearch && matchesRole;
  });

  const handleAddCategory = () => {
    const clean = newCategoryName.trim();
    if (!clean) return;
    if (clean.length > VALIDATION_LIMITS.CATEGORY_MAX) {
      setSettingsError('ชื่อหมวดหมู่ต้องไม่เกิน 80 ตัวอักษร');
      return;
    }
    if (categories.includes(clean)) {
      setSettingsError('มีหมวดหมู่นี้อยู่ในระบบแล้ว');
      return;
    }
    if (categories.length >= 25) {
      setSettingsError('เพิ่มหมวดหมู่ได้สูงสุด 25 หมวดหมู่');
      return;
    }
    setSettingsError(null);
    setCategories((prev) => [...prev, clean]);
    setNewCategoryName('');
  };

  const handleRemoveCategory = (catToRemove: string) => {
    if (categories.length <= 1) {
      setSettingsError('ระบบต้องมีหมวดหมู่อย่างน้อย 1 หมวดหมู่');
      return;
    }
    setSettingsError(null);
    setCategories((prev) => prev.filter((c) => c !== catToRemove));
  };

  const handleSettingsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSettingsError(null);

    const cleanName = siteName.trim();
    const cleanDesc = siteDescription.trim();
    const cleanLogo = logoText.trim() || 'TLH';

    if (
      cleanName.length < VALIDATION_LIMITS.SITE_NAME_MIN ||
      cleanName.length > VALIDATION_LIMITS.SITE_NAME_MAX
    ) {
      setSettingsError('ชื่อเว็บไซต์ต้องมีความยาว 2–100 ตัวอักษร');
      return;
    }

    if (
      cleanDesc.length < VALIDATION_LIMITS.SITE_DESC_MIN ||
      cleanDesc.length > VALIDATION_LIMITS.SITE_DESC_MAX
    ) {
      setSettingsError('คำอธิบายเว็บไซต์ต้องมีความยาว 5–500 ตัวอักษร');
      return;
    }

    if (categories.length < 1) {
      setSettingsError('ต้องมีหมวดหมู่ความรู้อย่างน้อย 1 หมวดหมู่');
      return;
    }

    setSavingSettings(true);
    try {
      await onSaveSiteSettings({
        siteName: cleanName,
        siteDescription: cleanDesc,
        logoText: cleanLogo.slice(0, 40),
        logoUrl: logoUrl.trim().slice(0, 1000),
        announcement: announcement.trim().slice(0, 500),
        announcementActive,
        categories,
      });
    } catch (err) {
      setSettingsError(
        err instanceof Error ? err.message : 'ไม่สามารถบันทึกการตั้งค่าเว็บไซต์ได้'
      );
    } finally {
      setSavingSettings(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top KPI Summary Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <div className="text-xs font-medium text-slate-500">สื่อการเรียนรู้ทั้งหมด</div>
          <div className="text-2xl font-bold text-slate-900 font-mono-tabular mt-1">
            {resources.length}
          </div>
          <div className="text-xs text-slate-500 mt-1">
            ซ่อนอยู่ <span className="font-mono-tabular font-semibold">{hiddenResourcesCount}</span> รายการ
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <div className="text-xs font-medium text-slate-500">รายงานที่รอตรวจสอบ</div>
          <div className="text-2xl font-bold text-amber-700 font-mono-tabular mt-1">
            {pendingReportsCount}
          </div>
          <div className="text-xs text-slate-500 mt-1">
            จากทั้งหมด <span className="font-mono-tabular">{reports.length}</span> รายงาน
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <div className="text-xs font-medium text-slate-500">สมาชิกในระบบ</div>
          <div className="text-2xl font-bold text-blue-800 font-mono-tabular mt-1">
            {users.length}
          </div>
          <div className="text-xs text-slate-500 mt-1">
            ระงับชั่วคราว <span className="font-mono-tabular font-semibold">{suspendedUsersCount}</span> บัญชี
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <div className="text-xs font-medium text-slate-500">หมวดหมู่ความรู้ที่เปิดใช้</div>
          <div className="text-2xl font-bold text-slate-900 font-mono-tabular mt-1">
            {siteSettings.categories.length}
          </div>
          <div className="text-xs text-slate-500 mt-1">
            บันทึกการดูแล <span className="font-mono-tabular">{moderationLogs.length}</span> รายการ
          </div>
        </div>
      </div>

      {/* Segmented Control Tabs */}
      <div className="bg-white border border-slate-200 rounded-xl p-1.5 flex flex-wrap items-center gap-1">
        <button
          type="button"
          onClick={() => setActiveTab('reports')}
          className={`inline-flex items-center gap-2 px-4 py-2 text-xs sm:text-sm font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
            activeTab === 'reports'
              ? 'bg-blue-700 text-white'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Flag className="w-4 h-4" />
          <span>จัดการรายงานและเนื้อหา ({pendingReportsCount})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('users')}
          className={`inline-flex items-center gap-2 px-4 py-2 text-xs sm:text-sm font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
            activeTab === 'users'
              ? 'bg-blue-700 text-white'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>จัดการสมาชิก ({users.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('settings')}
          className={`inline-flex items-center gap-2 px-4 py-2 text-xs sm:text-sm font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
            activeTab === 'settings'
              ? 'bg-blue-700 text-white'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Settings className="w-4 h-4" />
          <span>ตั้งค่าเว็บไซต์และหมวดหมู่</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('logs')}
          className={`inline-flex items-center gap-2 px-4 py-2 text-xs sm:text-sm font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
            activeTab === 'logs'
              ? 'bg-blue-700 text-white'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <History className="w-4 h-4" />
          <span>ประวัติการตรวจสอบ ({moderationLogs.length})</span>
        </button>
      </div>

      {/* TAB 1: REPORTS & CONTENT MODERATION */}
      {activeTab === 'reports' && (
        <div className="space-y-6">
          {/* Reported Content Section */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-bold text-slate-900">
                  รายการแจ้งรายงานเนื้อหาไม่เหมาะสม / ลิงก์เสีย
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  ตรวจสอบสื่อที่ได้รับแจ้ง ซ่อนหรือลบสื่อที่ผิดกฎ และบันทึกผลการดำเนินการ
                </p>
              </div>

              <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg text-xs font-medium">
                {(['pending', 'resolved', 'dismissed', 'all'] as const).map((status) => (
                  <button
                    key={status}
                    type="button"
                    onClick={() => setReportFilter(status)}
                    className={`px-3 py-1.5 rounded-md transition-colors cursor-pointer ${
                      reportFilter === status
                        ? 'bg-white text-slate-900 shadow-xs font-semibold'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {status === 'pending' && 'รอตรวจสอบ'}
                    {status === 'resolved' && 'แก้ไขแล้ว'}
                    {status === 'dismissed' && 'ยกเลิกรายงาน'}
                    {status === 'all' && 'ทั้งหมด'}
                  </button>
                ))}
              </div>
            </div>

            {filteredReports.length === 0 ? (
              <div className="py-10 text-center text-sm text-slate-500 bg-slate-50 rounded-xl border border-slate-200/70">
                ไม่มีรายการรายงานในสถานะที่เลือก
              </div>
            ) : (
              <div className="space-y-4">
                {filteredReports.map((rep) => {
                  const targetResource = resources.find((r) => r.id === rep.resourceId);
                  return (
                    <div
                      key={rep.id}
                      className="p-4 border border-slate-200 rounded-xl bg-slate-50/50 space-y-3"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 mb-1">
                            <span className="font-semibold text-amber-800">
                              สาเหตุ: {REPORT_REASON_LABELS[rep.reason]}
                            </span>
                            <span aria-hidden="true">·</span>
                            <span>ผู้แจ้ง: {rep.reporterName}</span>
                            <span aria-hidden="true">·</span>
                            <span className="font-mono-tabular">
                              {formatThaiDate(rep.createdAt)}
                            </span>
                            <span aria-hidden="true">·</span>
                            <span
                              className={`font-semibold ${
                                rep.status === 'pending'
                                  ? 'text-amber-700'
                                  : rep.status === 'resolved'
                                  ? 'text-emerald-700'
                                  : 'text-slate-600'
                              }`}
                            >
                              สถานะ:{' '}
                              {rep.status === 'pending'
                                ? 'รอตรวจสอบ'
                                : rep.status === 'resolved'
                                ? 'ดำเนินการแก้ไขแล้ว'
                                : 'ยกเลิกรายงาน'}
                            </span>
                          </div>

                          <h3 className="text-sm sm:text-base font-bold text-slate-900">
                            สื่อที่ถูกรายงาน: {rep.resourceTitle}
                          </h3>
                          <p className="text-xs sm:text-sm text-slate-700 mt-1">
                            รายละเอียดที่แจ้ง: &ldquo;{rep.details}&rdquo;
                          </p>
                        </div>

                        {targetResource ? (
                          <div className="flex flex-wrap items-center gap-2">
                            <button
                              type="button"
                              onClick={() => onSelectResource(targetResource)}
                              className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-blue-800 bg-white border border-slate-300 hover:bg-sky-50 rounded-lg cursor-pointer"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                              <span>ตรวจสอบสื่อ</span>
                            </button>

                            <button
                              type="button"
                              onClick={async () => {
                                setBusyId(targetResource.id);
                                try {
                                  await onToggleResourceVisibility(targetResource);
                                } finally {
                                  setBusyId(null);
                                }
                              }}
                              disabled={busyId === targetResource.id}
                              className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-amber-800 bg-amber-50 border border-amber-200 hover:bg-amber-100 rounded-lg cursor-pointer"
                            >
                              {targetResource.visibility === 'public' ? (
                                <>
                                  <EyeOff className="w-3.5 h-3.5" />
                                  <span>ซ่อนสื่อนี้</span>
                                </>
                              ) : (
                                <>
                                  <Eye className="w-3.5 h-3.5" />
                                  <span>เปิดแสดงสื่อ</span>
                                </>
                              )}
                            </button>

                            <button
                              type="button"
                              onClick={() => onRequestDeleteResource(targetResource)}
                              className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-red-700 bg-red-50 border border-red-200 hover:bg-red-100 rounded-lg cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>ลบสื่อถาวร</span>
                            </button>
                          </div>
                        ) : (
                          <span className="text-xs font-medium text-slate-400">
                            (สื่อนี้ถูกลบออกจากระบบแล้ว)
                          </span>
                        )}
                      </div>

                      {rep.status === 'pending' ? (
                        <div className="pt-3 border-t border-slate-200/80 flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
                          <input
                            type="text"
                            maxLength={500}
                            value={resolutionNotes[rep.id] || ''}
                            onChange={(e) =>
                              setResolutionNotes((prev) => ({
                                ...prev,
                                [rep.id]: e.target.value,
                              }))
                            }
                            placeholder="บันทึกผลการตรวจสอบ เช่น ซ่อนสื่อเนื่องจากลิงก์เสียเรียบร้อยแล้ว..."
                            className="flex-1 px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-blue-600"
                          />
                          <div className="flex items-center gap-2 shrink-0">
                            <button
                              type="button"
                              disabled={busyId === rep.id}
                              onClick={async () => {
                                setBusyId(rep.id);
                                try {
                                  await onResolveReport(
                                    rep,
                                    'resolved',
                                    resolutionNotes[rep.id] || 'ตรวจสอบและดำเนินการแก้ไขเรียบร้อยแล้ว'
                                  );
                                } finally {
                                  setBusyId(null);
                                }
                              }}
                              className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg cursor-pointer"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>ดำเนินการเสร็จสิ้น</span>
                            </button>

                            <button
                              type="button"
                              disabled={busyId === rep.id}
                              onClick={async () => {
                                setBusyId(rep.id);
                                try {
                                  await onResolveReport(
                                    rep,
                                    'dismissed',
                                    resolutionNotes[rep.id] || 'ตรวจสอบแล้วไม่พบความผิดปกติ'
                                  );
                                } finally {
                                  setBusyId(null);
                                }
                              }}
                              className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-100 rounded-lg cursor-pointer"
                            >
                              <XCircle className="w-3.5 h-3.5" />
                              <span>ยกเลิกรายงาน</span>
                            </button>
                          </div>
                        </div>
                      ) : (
                        rep.resolutionNote && (
                          <div className="pt-2 border-t border-slate-200/70 text-xs text-slate-600">
                            <strong>บันทึกจากผู้ดูแล:</strong> {rep.resolutionNote}
                          </div>
                        )
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* All Resources Management Table */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
            <h2 className="text-base font-bold text-slate-900">
              ตารางจัดการสื่อการเรียนรู้ทั้งหมดในระบบ ({resources.length} รายการ)
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs sm:text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500">
                    <th className="py-2.5 pr-4 font-semibold">ชื่อสื่อการเรียนรู้</th>
                    <th className="py-2.5 px-3 font-semibold">หมวดหมู่</th>
                    <th className="py-2.5 px-3 font-semibold">ผู้โพสต์</th>
                    <th className="py-2.5 px-3 font-semibold">การแสดงผล</th>
                    <th className="py-2.5 pl-3 text-right font-semibold">การจัดการ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {resources.map((res) => (
                    <tr key={res.id} className="hover:bg-slate-50">
                      <td className="py-3 pr-4 font-semibold text-slate-900 max-w-[260px] truncate">
                        {res.title}
                      </td>
                      <td className="py-3 px-3 text-slate-600">{res.category}</td>
                      <td className="py-3 px-3 text-slate-600">{res.authorName}</td>
                      <td className="py-3 px-3">
                        <span
                          className={`font-semibold ${
                            res.visibility === 'public' ? 'text-emerald-700' : 'text-amber-700'
                          }`}
                        >
                          {res.visibility === 'public' ? 'สาธารณะ (Public)' : 'ซ่อนชั่วคราว (Hidden)'}
                        </span>
                      </td>
                      <td className="py-3 pl-3 text-right whitespace-nowrap space-x-1.5">
                        <button
                          type="button"
                          onClick={() => onToggleResourceVisibility(res)}
                          className="px-2.5 py-1 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md cursor-pointer"
                        >
                          {res.visibility === 'public' ? 'ซ่อนสื่อ' : 'เปิดแสดง'}
                        </button>
                        <button
                          type="button"
                          onClick={() => onRequestDeleteResource(res)}
                          className="px-2.5 py-1 text-xs font-medium text-red-700 bg-red-50 hover:bg-red-100 rounded-md cursor-pointer"
                        >
                          ลบสื่อ
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: MEMBER MANAGEMENT */}
      {activeTab === 'users' && (
        <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                จัดการบัญชีสมาชิกและกำหนดระดับสิทธิ์
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                ค้นหาสมาชิก ตรวจสอบสถานะ ระงับบัญชีที่ทำผิดกฎ หรือปรับบทบาทสมาชิก (เฉพาะ Admin)
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2" />
                <input
                  type="text"
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  placeholder="ค้นหาชื่อ หรือ อีเมล..."
                  className="pl-9 pr-3 py-1.5 text-xs sm:text-sm border border-slate-300 rounded-lg focus:outline-none focus:border-blue-600"
                />
              </div>

              <select
                value={userRoleFilter}
                onChange={(e) => setUserRoleFilter(e.target.value as 'all' | UserRole)}
                className="px-3 py-1.5 text-xs sm:text-sm border border-slate-300 rounded-lg bg-white"
              >
                <option value="all">ทุกบทบาท</option>
                <option value="member">สมาชิก (Member)</option>
                <option value="moderator">ผู้ตรวจสอบ (Moderator)</option>
                <option value="admin">ผู้ดูแลระบบ (Admin)</option>
              </select>
            </div>
          </div>

          {filteredUsers.length === 0 ? (
            <div className="py-10 text-center text-sm text-slate-500 bg-slate-50 rounded-xl">
              ไม่พบข้อมูลสมาชิกที่ตรงกับการค้นหา
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs sm:text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500">
                    <th className="py-2.5 pr-4 font-semibold">ชื่อสมาชิก</th>
                    <th className="py-2.5 px-3 font-semibold">อีเมล</th>
                    <th className="py-2.5 px-3 font-semibold">ระดับสิทธิ์ (Role)</th>
                    <th className="py-2.5 px-3 font-semibold">สถานะบัญชี</th>
                    <th className="py-2.5 pl-3 text-right font-semibold">การจัดการสิทธิ์</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredUsers.map((u) => {
                    const isSelf = u.uid === currentUser.uid;
                    return (
                      <tr key={u.uid} className="hover:bg-slate-50">
                        <td className="py-3 pr-4 font-semibold text-slate-900">
                          {u.displayName}
                          {isSelf && (
                            <span className="ml-1.5 text-xs font-normal text-blue-700">(คุณ)</span>
                          )}
                        </td>
                        <td className="py-3 px-3 text-slate-600 font-mono-tabular">{u.email}</td>
                        <td className="py-3 px-3">
                          {isAdmin && !isSelf ? (
                            <select
                              value={u.role}
                              disabled={busyId === u.uid}
                              onChange={async (e) => {
                                const nextRole = e.target.value as UserRole;
                                setBusyId(u.uid);
                                try {
                                  await onUpdateUserRoleAndStatus(u, nextRole, u.status);
                                } finally {
                                  setBusyId(null);
                                }
                              }}
                              className="px-2.5 py-1 text-xs border border-slate-300 rounded-md bg-white font-medium text-slate-800"
                            >
                              <option value="member">Member (สมาชิก)</option>
                              <option value="moderator">Moderator (ผู้ดูแลเนื้อหา)</option>
                              <option value="admin">Admin (ผู้ดูแลระบบ)</option>
                            </select>
                          ) : (
                            <span className="font-semibold text-blue-900">{u.role}</span>
                          )}
                        </td>
                        <td className="py-3 px-3">
                          <span
                            className={`inline-flex items-center gap-1 font-semibold ${
                              u.status === 'active' ? 'text-emerald-700' : 'text-red-700'
                            }`}
                          >
                            {u.status === 'active' ? (
                              <>
                                <UserCheck className="w-3.5 h-3.5" />
                                <span>ปกติ (Active)</span>
                              </>
                            ) : (
                              <>
                                <UserX className="w-3.5 h-3.5" />
                                <span>ถูกระงับ (Suspended)</span>
                              </>
                            )}
                          </span>
                        </td>
                        <td className="py-3 pl-3 text-right">
                          {isAdmin && !isSelf ? (
                            <button
                              type="button"
                              disabled={busyId === u.uid}
                              onClick={async () => {
                                const nextStatus: AccountStatus =
                                  u.status === 'active' ? 'suspended' : 'active';
                                setBusyId(u.uid);
                                try {
                                  await onUpdateUserRoleAndStatus(u, u.role, nextStatus);
                                } finally {
                                  setBusyId(null);
                                }
                              }}
                              className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                                u.status === 'active'
                                  ? 'text-red-700 bg-red-50 hover:bg-red-100 border border-red-200'
                                  : 'text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200'
                              }`}
                            >
                              {u.status === 'active' ? 'ระงับบัญชี' : 'ปลดระงับบัญชี'}
                            </button>
                          ) : (
                            <span className="text-xs text-slate-400">—</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: SITE SETTINGS & DYNAMIC CATEGORIES */}
      {activeTab === 'settings' && (
        <div className="bg-white border border-slate-200 rounded-xl p-6 sm:p-8 space-y-6">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900">
              ตั้งค่าเว็บไซต์และหมวดหมู่ความรู้ (บันทึกลง Cloud Firestore จริง)
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              แก้ไขชื่อเว็บไซต์ คำอธิบาย คำประกาศ และเพิ่ม/ลบหมวดหมู่ความรู้ผ่านหน้าเว็บโดยไม่ต้องแก้ไขโค้ด
            </p>
          </div>

          {!isAdmin && (
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-center gap-2.5 text-xs text-amber-900">
              <ShieldAlert className="w-4 h-4 text-amber-700 shrink-0" />
              <span>เฉพาะผู้ดูแลระบบระดับ Admin เท่านั้นที่สามารถบันทึกการเปลี่ยนแปลงการตั้งค่าเว็บไซต์ได้</span>
            </div>
          )}

          {settingsError && (
            <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl text-xs text-red-800">
              {settingsError}
            </div>
          )}

          <form onSubmit={handleSettingsSubmit} className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  ชื่อเว็บไซต์ (Site Name) <span className="text-red-600">*</span>
                </label>
                <input
                  type="text"
                  required
                  disabled={!isAdmin}
                  minLength={2}
                  maxLength={100}
                  value={siteName}
                  onChange={(e) => setSiteName(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:border-blue-600 disabled:bg-slate-100"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  อักษรย่อโลโก้ (Logo Text) <span className="text-red-600">*</span>
                </label>
                <input
                  type="text"
                  required
                  disabled={!isAdmin}
                  minLength={1}
                  maxLength={40}
                  value={logoText}
                  onChange={(e) => setLogoText(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:border-blue-600 disabled:bg-slate-100"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                คำอธิบายเว็บไซต์ (Site Description) <span className="text-red-600">*</span>
              </label>
              <textarea
                rows={2}
                required
                disabled={!isAdmin}
                minLength={5}
                maxLength={500}
                value={siteDescription}
                onChange={(e) => setSiteDescription(e.target.value)}
                className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:border-blue-600 disabled:bg-slate-100"
              />
            </div>

            <div className="p-4 bg-sky-50/60 border border-sky-200 rounded-xl space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-800">
                  แถบประกาศแจ้งเตือนด้านบนเว็บไซต์ (Announcement Banner)
                </label>
                <label className="inline-flex items-center gap-2 text-xs font-semibold text-blue-900 cursor-pointer">
                  <input
                    type="checkbox"
                    disabled={!isAdmin}
                    checked={announcementActive}
                    onChange={(e) => setAnnouncementActive(e.target.checked)}
                    className="rounded border-slate-300 text-blue-700 focus:ring-blue-600"
                  />
                  <span>เปิดแสดงแถบประกาศ</span>
                </label>
              </div>
              <input
                type="text"
                disabled={!isAdmin}
                maxLength={500}
                value={announcement}
                onChange={(e) => setAnnouncement(e.target.value)}
                placeholder="กรอกข้อความประกาศสำหรับนักเรียนและครูผู้สอน..."
                className="w-full px-3.5 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-blue-600"
              />
            </div>

            {/* Dynamic Knowledge Categories Manager */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h3 className="text-xs font-bold text-slate-900">
                    จัดการหมวดหมู่ความรู้ ({categories.length}/25 หมวดหมู่)
                  </h3>
                  <p className="text-xs text-slate-500">
                    เพิ่มหรือลบหมวดหมู่เพื่อให้แสดงผลใน Sidebar และฟอร์มโพสต์สื่อทันที
                  </p>
                </div>

                {isAdmin && (
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      maxLength={80}
                      value={newCategoryName}
                      onChange={(e) => setNewCategoryName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddCategory();
                        }
                      }}
                      placeholder="ชื่อหมวดหมู่ใหม่..."
                      className="px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-blue-600"
                    />
                    <button
                      type="button"
                      onClick={handleAddCategory}
                      className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-white bg-blue-700 hover:bg-blue-800 rounded-lg whitespace-nowrap shrink-0 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>เพิ่มหมวดหมู่</span>
                    </button>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 pt-2">
                {categories.map((cat) => (
                  <div
                    key={cat}
                    className="flex items-center justify-between gap-2 px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-800"
                  >
                    <span className="truncate">{cat}</span>
                    {isAdmin && (
                      <button
                        type="button"
                        onClick={() => handleRemoveCategory(cat)}
                        title={`ลบหมวดหมู่ ${cat}`}
                        className="text-slate-400 hover:text-red-600 transition-colors cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {isAdmin && (
              <div className="pt-3 border-t border-slate-200 flex justify-end">
                <button
                  type="submit"
                  disabled={savingSettings}
                  className="inline-flex items-center gap-2 px-5 py-2.5 text-xs sm:text-sm font-semibold text-white bg-blue-700 hover:bg-blue-800 disabled:opacity-50 rounded-lg transition-colors cursor-pointer"
                >
                  {savingSettings ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  <span>บันทึกการตั้งค่าเว็บไซต์ลงฐานข้อมูล</span>
                </button>
              </div>
            )}
          </form>
        </div>
      )}

      {/* TAB 4: MODERATION LOGS */}
      {activeTab === 'logs' && (
        <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              บันทึกประวัติการดูแลระบบ (Moderation Audit Logs)
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              ข้อมูลในคอลเลกชัน moderationLogs ถูกป้องกันด้วยกฎ Immutable (ไม่สามารถแก้ไขหรือลบย้อนหลังได้)
            </p>
          </div>

          {moderationLogs.length === 0 ? (
            <div className="py-10 text-center text-sm text-slate-500 bg-slate-50 rounded-xl">
              ยังไม่มีประวัติการดำเนินการของผู้ดูแลระบบ
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs sm:text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500">
                    <th className="py-2.5 pr-4 font-semibold">วัน-เวลา</th>
                    <th className="py-2.5 px-3 font-semibold">ผู้ดำเนินการ</th>
                    <th className="py-2.5 px-3 font-semibold">ประเภทการกระทำ</th>
                    <th className="py-2.5 px-3 font-semibold">รายการเป้าหมาย</th>
                    <th className="py-2.5 pl-3 font-semibold">หมายเหตุ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {moderationLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50">
                      <td className="py-3 pr-4 text-slate-500 font-mono-tabular whitespace-nowrap">
                        {formatThaiDate(log.createdAt)}
                      </td>
                      <td className="py-3 px-3 font-medium text-slate-900">{log.actorName}</td>
                      <td className="py-3 px-3 text-blue-800 font-semibold">
                        {ACTION_TYPE_LABELS[log.actionType] || log.actionType}
                      </td>
                      <td className="py-3 px-3 text-slate-700 max-w-[200px] truncate">
                        {log.targetLabel}
                      </td>
                      <td className="py-3 pl-3 text-slate-600">{log.note || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
