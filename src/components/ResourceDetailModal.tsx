import React from 'react';
import {
  X,
  ExternalLink,
  Download,
  Bookmark,
  Flag,
  Pencil,
  Trash2,
  FileText,
  User,
  Calendar,
} from 'lucide-react';
import { MEDIA_TYPE_LABELS, ResourceItem, UserProfile } from '../types/models';
import { formatThaiDate } from './ResourceCard';

interface ResourceDetailModalProps {
  resource: ResourceItem | null;
  onClose: () => void;
  isFavorited: boolean;
  onToggleFavorite: (resource: ResourceItem) => void;
  userProfile: UserProfile | null;
  isStaff: boolean;
  onEditResource: (resource: ResourceItem) => void;
  onDeleteResource: (resource: ResourceItem) => void;
  onReportResource: (resource: ResourceItem) => void;
}

export const ResourceDetailModal: React.FC<ResourceDetailModalProps> = ({
  resource,
  onClose,
  isFavorited,
  onToggleFavorite,
  userProfile,
  isStaff,
  onEditResource,
  onDeleteResource,
  onReportResource,
}) => {
  if (!resource) return null;

  const isOwner = Boolean(userProfile && userProfile.uid === resource.authorId);
  const canDelete = isOwner || isStaff;

  const formatFileSize = (bytes: number) => {
    if (!bytes || bytes <= 0) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="resource-detail-title"
    >
      <div className="bg-white border border-slate-200 rounded-2xl max-w-2xl w-full p-6 sm:p-8 shadow-xl my-8">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 pb-4 border-b border-slate-200">
          <div>
            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 mb-1.5">
              <span className="font-semibold text-blue-700">
                {MEDIA_TYPE_LABELS[resource.mediaType]}
              </span>
              <span aria-hidden="true">·</span>
              <span className="font-medium text-slate-700">{resource.category}</span>
              <span aria-hidden="true">·</span>
              <span>ระดับชั้น: {resource.level}</span>
            </div>
            <h2
              id="resource-detail-title"
              className="text-xl sm:text-2xl font-bold text-slate-900 leading-snug"
            >
              {resource.title}
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Author & Timestamp Info */}
        <div className="flex flex-wrap items-center gap-4 py-3 text-xs text-slate-600 border-b border-slate-100">
          <div className="flex items-center gap-1.5">
            <User className="w-3.5 h-3.5 text-blue-700" />
            <span>ผู้แบ่งปัน:</span>
            <span className="font-semibold text-slate-900">{resource.authorName}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-blue-700" />
            <span>เผยแพร่เมื่อ:</span>
            <span className="font-mono-tabular">{formatThaiDate(resource.createdAt)}</span>
          </div>
        </div>

        {/* Full Description */}
        <div className="py-5 space-y-4">
          <div>
            <h3 className="text-xs font-semibold text-slate-500 mb-2">
              รายละเอียดและคำอธิบายสื่อการเรียนรู้
            </h3>
            <p className="text-sm sm:text-base text-slate-800 whitespace-pre-line leading-relaxed">
              {resource.description}
            </p>
          </div>

          {resource.tags && resource.tags.length > 0 && (
            <div className="pt-2">
              <h4 className="text-xs font-semibold text-slate-500 mb-1.5">คำสำคัญ (Tags)</h4>
              <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600">
                {resource.tags.map((tag, idx) => (
                  <React.Fragment key={tag}>
                    <span className="font-medium text-blue-800">#{tag}</span>
                    {idx < resource.tags.length - 1 && <span aria-hidden="true">·</span>}
                  </React.Fragment>
                ))}
              </div>
            </div>
          )}

          {/* Attached File or External Link Box */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
            <h4 className="text-xs font-semibold text-slate-700">
              ไฟล์แนบและลิงก์เข้าถึงสื่อการเรียนรู้
            </h4>

            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <FileText className="w-5 h-5 text-blue-700 shrink-0" />
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-slate-900 truncate">
                    {resource.fileName || resource.resourceUrl || 'สื่อการเรียนรู้'}
                  </p>
                  {resource.fileSize > 0 && (
                    <p className="text-xs text-slate-500 font-mono-tabular">
                      ขนาดไฟล์: {formatFileSize(resource.fileSize)}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {resource.fileDataUrl && (
                  <a
                    href={resource.fileDataUrl}
                    download={resource.fileName || `${resource.title}.pdf`}
                    className="inline-flex items-center gap-1.5 px-4 py-2 text-xs sm:text-sm font-semibold text-white bg-blue-700 hover:bg-blue-800 rounded-lg transition-colors whitespace-nowrap shrink-0"
                  >
                    <Download className="w-4 h-4" />
                    <span>ดาวน์โหลดไฟล์แนบ</span>
                  </a>
                )}

                {resource.resourceUrl && (
                  <a
                    href={resource.resourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-4 py-2 text-xs sm:text-sm font-semibold text-blue-800 bg-sky-100 hover:bg-sky-200 border border-sky-300 rounded-lg transition-colors whitespace-nowrap shrink-0"
                  >
                    <ExternalLink className="w-4 h-4" />
                    <span>เปิดลิงก์ต้นทาง</span>
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="pt-4 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onToggleFavorite(resource)}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2 text-xs sm:text-sm font-semibold rounded-lg border transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                isFavorited
                  ? 'bg-blue-700 text-white border-blue-700 hover:bg-blue-800'
                  : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
              }`}
            >
              <Bookmark className={`w-4 h-4 ${isFavorited ? 'fill-current' : ''}`} />
              <span>{isFavorited ? 'บันทึกในรายการโปรดแล้ว' : 'บันทึกรายการโปรด'}</span>
            </button>

            {!isOwner && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onReportResource(resource);
                }}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs sm:text-sm font-medium text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                <Flag className="w-4 h-4" />
                <span>รายงานปัญหา</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            {isOwner && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onEditResource(resource);
                }}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs sm:text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                <Pencil className="w-4 h-4" />
                <span>แก้ไข</span>
              </button>
            )}

            {canDelete && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onDeleteResource(resource);
                }}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs sm:text-sm font-medium text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                <span>ลบสื่อ</span>
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs sm:text-sm font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              ปิดหน้าต่าง
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
