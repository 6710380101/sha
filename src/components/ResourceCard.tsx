import React from 'react';
import {
  Bookmark,
  ExternalLink,
  Flag,
  Pencil,
  Trash2,
  EyeOff,
  Eye,
  FileText,
  Video,
  Globe,
  FileSpreadsheet,
  Presentation,
  Download,
} from 'lucide-react';
import { MEDIA_TYPE_LABELS, MediaType, ResourceItem, UserProfile } from '../types/models';

interface ResourceCardProps {
  resource: ResourceItem;
  isFavorited: boolean;
  favoriteBusy: boolean;
  userProfile: UserProfile | null;
  isStaff: boolean;
  onToggleFavorite: (resource: ResourceItem) => void;
  onSelectResource: (resource: ResourceItem) => void;
  onEditResource: (resource: ResourceItem) => void;
  onDeleteResource: (resource: ResourceItem) => void;
  onToggleVisibility?: (resource: ResourceItem) => void;
  onReportResource: (resource: ResourceItem) => void;
}

const MEDIA_ICON_MAP: Record<MediaType, React.ReactNode> = {
  pdf: <FileText className="w-4 h-4 text-blue-700" />,
  video: <Video className="w-4 h-4 text-sky-600" />,
  website: <Globe className="w-4 h-4 text-indigo-600" />,
  document: <FileSpreadsheet className="w-4 h-4 text-teal-600" />,
  presentation: <Presentation className="w-4 h-4 text-amber-600" />,
};

export function formatThaiDate(timestamp?: { toDate?: () => Date } | null): string {
  if (!timestamp || typeof timestamp.toDate !== 'function') {
    return 'เพิ่งเผยแพร่';
  }
  try {
    return timestamp.toDate().toLocaleDateString('th-TH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return 'เพิ่งเผยแพร่';
  }
}

export const ResourceCard: React.FC<ResourceCardProps> = ({
  resource,
  isFavorited,
  favoriteBusy,
  userProfile,
  isStaff,
  onToggleFavorite,
  onSelectResource,
  onEditResource,
  onDeleteResource,
  onToggleVisibility,
  onReportResource,
}) => {
  const isOwner = Boolean(userProfile && userProfile.uid === resource.authorId);
  const canDelete = isOwner || isStaff;

  return (
    <article
      className={`bg-white border rounded-xl p-5 flex flex-col justify-between transition-colors ${
        resource.visibility === 'hidden'
          ? 'border-amber-300 bg-amber-50/30'
          : 'border-slate-200 hover:border-blue-300'
      }`}
    >
      <div>
        {/* Zero-Pill Unboxed Metadata Kicker */}
        <div className="flex flex-wrap items-center gap-1.5 text-xs text-slate-500 mb-2">
          <span className="inline-flex items-center gap-1 font-semibold text-blue-800">
            {MEDIA_ICON_MAP[resource.mediaType]}
            <span>{MEDIA_TYPE_LABELS[resource.mediaType]}</span>
          </span>
          <span aria-hidden="true">·</span>
          <span className="font-medium text-slate-700">{resource.category}</span>
          <span aria-hidden="true">·</span>
          <span>{resource.level}</span>
          {resource.visibility === 'hidden' && (
            <>
              <span aria-hidden="true">·</span>
              <span className="font-semibold text-amber-700 inline-flex items-center gap-1">
                <EyeOff className="w-3.5 h-3.5" />
                <span>ถูกซ่อนโดยผู้ดูแล</span>
              </span>
            </>
          )}
        </div>

        {/* Title */}
        <h3 className="text-base sm:text-lg font-bold text-slate-900 leading-snug mb-2">
          <button
            type="button"
            onClick={() => onSelectResource(resource)}
            className="text-left hover:text-blue-700 transition-colors cursor-pointer"
          >
            {resource.title}
          </button>
        </h3>

        {/* Description */}
        <p className="text-sm text-slate-600 line-clamp-3 leading-relaxed mb-4">
          {resource.description}
        </p>

        {/* Unboxed Tags */}
        {resource.tags && resource.tags.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 mb-4">
            <span className="text-slate-400">คำสำคัญ:</span>
            {resource.tags.map((tag, idx) => (
              <React.Fragment key={`${tag}-${idx}`}>
                <span className="text-slate-600">#{tag}</span>
                {idx < resource.tags.length - 1 && <span aria-hidden="true">·</span>}
              </React.Fragment>
            ))}
          </div>
        )}
      </div>

      {/* Footer: Author Info & Action Affordances */}
      <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 text-xs text-slate-500">
          <span>โดย</span>
          <span className="font-medium text-slate-700">{resource.authorName}</span>
          <span aria-hidden="true">·</span>
          <span className="font-mono-tabular">{formatThaiDate(resource.createdAt)}</span>
        </div>

        <div className="flex items-center gap-1.5">
          {/* Open / View Details */}
          <button
            type="button"
            onClick={() => onSelectResource(resource)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-blue-800 bg-sky-50 hover:bg-sky-100 border border-sky-200 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            {resource.fileDataUrl ? (
              <Download className="w-3.5 h-3.5" />
            ) : (
              <ExternalLink className="w-3.5 h-3.5" />
            )}
            <span>เปิดดูสื่อ</span>
          </button>

          {/* Favorite Bookmark Button */}
          <button
            type="button"
            onClick={() => onToggleFavorite(resource)}
            disabled={favoriteBusy}
            title={isFavorited ? 'ลบออกจากรายการโปรด' : 'บันทึกในรายการโปรด'}
            className={`inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-lg border transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              isFavorited
                ? 'bg-blue-700 text-white border-blue-700 hover:bg-blue-800'
                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
            }`}
          >
            <Bookmark className={`w-3.5 h-3.5 ${isFavorited ? 'fill-current' : ''}`} />
            <span className="hidden sm:inline">{isFavorited ? 'บันทึกแล้ว' : 'บันทึก'}</span>
          </button>

          {/* Owner Edit Button */}
          {isOwner && (
            <button
              type="button"
              onClick={() => onEditResource(resource)}
              title="แก้ไขสื่อของฉัน"
              className="p-1.5 text-slate-600 hover:text-blue-700 hover:bg-sky-50 rounded-lg border border-transparent hover:border-sky-200 transition-colors cursor-pointer"
            >
              <Pencil className="w-4 h-4" />
            </button>
          )}

          {/* Staff Hide/Restore Button */}
          {isStaff && onToggleVisibility && (
            <button
              type="button"
              onClick={() => onToggleVisibility(resource)}
              title={resource.visibility === 'public' ? 'ซ่อนสื่อนี้ชั่วคราว' : 'เปิดแสดงสื่อสาธารณะ'}
              className="p-1.5 text-slate-600 hover:text-amber-700 hover:bg-amber-50 rounded-lg border border-transparent hover:border-amber-200 transition-colors cursor-pointer"
            >
              {resource.visibility === 'public' ? (
                <EyeOff className="w-4 h-4" />
              ) : (
                <Eye className="w-4 h-4" />
              )}
            </button>
          )}

          {/* Owner or Staff Delete Button */}
          {canDelete && (
            <button
              type="button"
              onClick={() => onDeleteResource(resource)}
              title="ลบสื่อการเรียนรู้"
              className="p-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg border border-transparent hover:border-red-200 transition-colors cursor-pointer"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}

          {/* Report Inappropriate Content Button */}
          {!isOwner && (
            <button
              type="button"
              onClick={() => onReportResource(resource)}
              title="แจ้งรายงานเนื้อหาไม่เหมาะสมหรือลิงก์เสีย"
              className="p-1.5 text-slate-400 hover:text-amber-700 hover:bg-amber-50 rounded-lg transition-colors cursor-pointer"
            >
              <Flag className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </article>
  );
};
