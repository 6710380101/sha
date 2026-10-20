import React from 'react';
import {
  Layers,
  GraduationCap,
  FileText,
  Video,
  Globe,
  FileSpreadsheet,
  Presentation,
  RotateCcw,
  Bookmark,
  FolderOpen,
  ShieldCheck,
} from 'lucide-react';
import {
  ActiveView,
  EDUCATION_LEVELS,
  MEDIA_TYPE_LABELS,
  MediaType,
  UserProfile,
} from '../types/models';

interface SidebarProps {
  categories: string[];
  categoryCounts: Record<string, number>;
  totalPublicCount: number;
  selectedCategory: string;
  onSelectCategory: (category: string) => void;
  selectedLevel: string;
  onSelectLevel: (level: string) => void;
  selectedMediaType: string;
  onSelectMediaType: (mediaType: string) => void;
  onResetFilters: () => void;
  activeView: ActiveView;
  onSelectView: (view: ActiveView) => void;
  userProfile: UserProfile | null;
  isStaff: boolean;
  favoritesCount: number;
  myResourcesCount: number;
  pendingReportsCount: number;
}

const MEDIA_ICONS: Record<MediaType, React.ReactNode> = {
  pdf: <FileText className="w-4 h-4 text-blue-700" />,
  video: <Video className="w-4 h-4 text-sky-600" />,
  website: <Globe className="w-4 h-4 text-indigo-600" />,
  document: <FileSpreadsheet className="w-4 h-4 text-teal-600" />,
  presentation: <Presentation className="w-4 h-4 text-amber-600" />,
};

export const Sidebar: React.FC<SidebarProps> = ({
  categories,
  categoryCounts,
  totalPublicCount,
  selectedCategory,
  onSelectCategory,
  selectedLevel,
  onSelectLevel,
  selectedMediaType,
  onSelectMediaType,
  onResetFilters,
  activeView,
  onSelectView,
  userProfile,
  isStaff,
  favoritesCount,
  myResourcesCount,
  pendingReportsCount,
}) => {
  const hasActiveFilters =
    selectedCategory !== 'all' || selectedLevel !== 'all' || selectedMediaType !== 'all';

  return (
    <aside className="w-full lg:w-72 shrink-0 space-y-6">
      {/* Personal Workspace Navigation */}
      {userProfile && (
        <section className="bg-white border border-slate-200 rounded-xl p-4">
          <h2 className="text-xs font-semibold text-slate-500 mb-3">พื้นที่ใช้งานของฉัน</h2>
          <div className="space-y-1">
            <button
              type="button"
              onClick={() => onSelectView('explore')}
              className={`w-full flex items-center justify-between px-3 py-2 text-sm rounded-lg transition-colors cursor-pointer ${
                activeView === 'explore'
                  ? 'bg-blue-700 text-white font-semibold'
                  : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              <span className="flex items-center gap-2.5 truncate">
                <Layers className="w-4 h-4 shrink-0" />
                <span className="truncate">สำรวจคลังความรู้</span>
              </span>
              <span className="font-mono-tabular text-xs opacity-80">{totalPublicCount}</span>
            </button>

            <button
              type="button"
              onClick={() => onSelectView('favorites')}
              className={`w-full flex items-center justify-between px-3 py-2 text-sm rounded-lg transition-colors cursor-pointer ${
                activeView === 'favorites'
                  ? 'bg-blue-700 text-white font-semibold'
                  : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              <span className="flex items-center gap-2.5 truncate">
                <Bookmark className="w-4 h-4 shrink-0" />
                <span className="truncate">รายการโปรดที่บันทึก</span>
              </span>
              <span className="font-mono-tabular text-xs opacity-80">{favoritesCount}</span>
            </button>

            <button
              type="button"
              onClick={() => onSelectView('my-resources')}
              className={`w-full flex items-center justify-between px-3 py-2 text-sm rounded-lg transition-colors cursor-pointer ${
                activeView === 'my-resources'
                  ? 'bg-blue-700 text-white font-semibold'
                  : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              <span className="flex items-center gap-2.5 truncate">
                <FolderOpen className="w-4 h-4 shrink-0" />
                <span className="truncate">สื่อที่ฉันแบ่งปัน</span>
              </span>
              <span className="font-mono-tabular text-xs opacity-80">{myResourcesCount}</span>
            </button>

            {isStaff && (
              <button
                type="button"
                onClick={() => onSelectView('admin')}
                className={`w-full flex items-center justify-between px-3 py-2 text-sm rounded-lg transition-colors cursor-pointer ${
                  activeView === 'admin'
                    ? 'bg-blue-700 text-white font-semibold'
                    : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                <span className="flex items-center gap-2.5 truncate">
                  <ShieldCheck className="w-4 h-4 shrink-0" />
                  <span className="truncate">จัดการระบบ (Admin)</span>
                </span>
                <span className="font-mono-tabular text-xs opacity-80">{pendingReportsCount}</span>
              </button>
            )}
          </div>
        </section>
      )}

      {/* Knowledge Categories Filter */}
      <section className="bg-white border border-slate-200 rounded-xl p-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
            <Layers className="w-4 h-4 text-blue-700" />
            <span>หมวดหมู่ความรู้</span>
          </h2>
          {hasActiveFilters && (
            <button
              type="button"
              onClick={onResetFilters}
              className="inline-flex items-center gap-1 text-xs font-medium text-blue-700 hover:text-blue-900 cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
              <span>ล้างตัวกรอง</span>
            </button>
          )}
        </div>

        <div className="space-y-1">
          <button
            type="button"
            onClick={() => {
              onSelectCategory('all');
              if (activeView !== 'explore') onSelectView('explore');
            }}
            className={`w-full flex items-center justify-between px-3 py-2 text-sm rounded-lg transition-colors cursor-pointer ${
              selectedCategory === 'all' && activeView === 'explore'
                ? 'bg-sky-50 text-blue-800 font-semibold border border-sky-200'
                : 'text-slate-700 hover:bg-slate-50'
            }`}
          >
            <span className="truncate">ทุกหมวดหมู่</span>
            <span className="font-mono-tabular text-xs text-slate-500">{totalPublicCount}</span>
          </button>

          {categories.map((cat) => {
            const count = categoryCounts[cat] || 0;
            const isSelected = selectedCategory === cat && activeView === 'explore';
            return (
              <button
                key={cat}
                type="button"
                onClick={() => {
                  onSelectCategory(cat);
                  if (activeView !== 'explore') onSelectView('explore');
                }}
                className={`w-full flex items-center justify-between px-3 py-2 text-sm rounded-lg transition-colors cursor-pointer ${
                  isSelected
                    ? 'bg-sky-50 text-blue-800 font-semibold border border-sky-200'
                    : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                <span className="truncate text-left">{cat}</span>
                <span className="font-mono-tabular text-xs text-slate-500 shrink-0 ml-2">
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      {/* Education Level Filter */}
      <section className="bg-white border border-slate-200 rounded-xl p-4">
        <h2 className="text-sm font-semibold text-slate-900 flex items-center gap-2 mb-3">
          <GraduationCap className="w-4 h-4 text-blue-700" />
          <span>ระดับชั้นเรียน</span>
        </h2>
        <div className="space-y-1">
          <button
            type="button"
            onClick={() => {
              onSelectLevel('all');
              if (activeView !== 'explore') onSelectView('explore');
            }}
            className={`w-full text-left px-3 py-1.5 text-sm rounded-lg transition-colors cursor-pointer ${
              selectedLevel === 'all'
                ? 'bg-sky-50 text-blue-800 font-semibold border border-sky-200'
                : 'text-slate-700 hover:bg-slate-50'
            }`}
          >
            ทุกระดับชั้น
          </button>
          {EDUCATION_LEVELS.map((lvl) => (
            <button
              key={lvl}
              type="button"
              onClick={() => {
                onSelectLevel(lvl);
                if (activeView !== 'explore') onSelectView('explore');
              }}
              className={`w-full text-left px-3 py-1.5 text-sm rounded-lg transition-colors cursor-pointer ${
                selectedLevel === lvl
                  ? 'bg-sky-50 text-blue-800 font-semibold border border-sky-200'
                  : 'text-slate-700 hover:bg-slate-50'
              }`}
            >
              {lvl}
            </button>
          ))}
        </div>
      </section>

      {/* Media Format Filter */}
      <section className="bg-white border border-slate-200 rounded-xl p-4">
        <h2 className="text-sm font-semibold text-slate-900 flex items-center gap-2 mb-3">
          <FileText className="w-4 h-4 text-blue-700" />
          <span>ประเภทสื่อการสอน</span>
        </h2>
        <div className="space-y-1">
          <button
            type="button"
            onClick={() => {
              onSelectMediaType('all');
              if (activeView !== 'explore') onSelectView('explore');
            }}
            className={`w-full text-left px-3 py-1.5 text-sm rounded-lg transition-colors cursor-pointer ${
              selectedMediaType === 'all'
                ? 'bg-sky-50 text-blue-800 font-semibold border border-sky-200'
                : 'text-slate-700 hover:bg-slate-50'
            }`}
          >
            สื่อทุกประเภท
          </button>
          {(Object.keys(MEDIA_TYPE_LABELS) as MediaType[]).map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => {
                onSelectMediaType(type);
                if (activeView !== 'explore') onSelectView('explore');
              }}
              className={`w-full flex items-center gap-2.5 px-3 py-1.5 text-sm rounded-lg transition-colors cursor-pointer ${
                selectedMediaType === type
                  ? 'bg-sky-50 text-blue-800 font-semibold border border-sky-200'
                  : 'text-slate-700 hover:bg-slate-50'
              }`}
            >
              {MEDIA_ICONS[type]}
              <span>{MEDIA_TYPE_LABELS[type]}</span>
            </button>
          ))}
        </div>
      </section>
    </aside>
  );
};
