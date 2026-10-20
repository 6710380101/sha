import React, { useState } from 'react';
import { X, Flag, AlertCircle, Loader2 } from 'lucide-react';
import {
  REPORT_REASON_LABELS,
  ReportReason,
  ResourceItem,
  VALIDATION_LIMITS,
} from '../types/models';

interface ReportModalProps {
  resource: ResourceItem | null;
  onClose: () => void;
  onSubmitReport: (resource: ResourceItem, reason: ReportReason, details: string) => Promise<void>;
}

export const ReportModal: React.FC<ReportModalProps> = ({
  resource,
  onClose,
  onSubmitReport,
}) => {
  const [reason, setReason] = useState<ReportReason>('broken_link');
  const [details, setDetails] = useState('');
  const [busy, setBusy] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!resource) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const cleanDetails = details.trim();
    if (
      cleanDetails.length < VALIDATION_LIMITS.REPORT_DETAILS_MIN ||
      cleanDetails.length > VALIDATION_LIMITS.REPORT_DETAILS_MAX
    ) {
      setErrorMsg(
        `กรุณาระบุรายละเอียดเพิ่มเติมอย่างน้อย ${VALIDATION_LIMITS.REPORT_DETAILS_MIN} ตัวอักษร`
      );
      return;
    }

    setBusy(true);
    try {
      await onSubmitReport(resource, reason, cleanDetails);
      setDetails('');
      onClose();
    } catch (err) {
      setErrorMsg(
        err instanceof Error
          ? `ไม่สามารถส่งรายงานได้: ${err.message}`
          : 'เกิดข้อผิดพลาดในการส่งรายงาน กรุณาตรวจสอบว่าคุณยืนยันอีเมลแล้ว'
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
    >
      <div className="bg-white border border-slate-200 rounded-2xl max-w-lg w-full p-6 shadow-xl my-8">
        <div className="flex items-start justify-between gap-4 pb-4 border-b border-slate-200">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-amber-50 border border-amber-200 rounded-lg text-amber-700">
              <Flag className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">รายงานเนื้อหาไม่เหมาะสม / ลิงก์เสีย</h2>
              <p className="text-xs text-slate-500 truncate max-w-[300px]">
                สื่อที่รายงาน: {resource.title}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {errorMsg && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2 text-xs text-red-800">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              สาเหตุที่ต้องการรายงาน <span className="text-red-600">*</span>
            </label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value as ReportReason)}
              className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg bg-white focus:outline-none focus:border-blue-600"
            >
              {(Object.keys(REPORT_REASON_LABELS) as ReportReason[]).map((r) => (
                <option key={r} value={r}>
                  {REPORT_REASON_LABELS[r]}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              รายละเอียดเพิ่มเติมเพื่อช่วยให้ผู้ดูแลตรวจสอบได้รวดเร็ว <span className="text-red-600">*</span>
            </label>
            <textarea
              required
              rows={4}
              minLength={5}
              maxLength={1000}
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              placeholder="อธิบายปัญหาที่พบ เช่น ลิงก์ Google Drive เข้าไม่ได้ หรือเนื้อหาหน้า 3 มีข้อมูลผิดพลาด..."
              className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:border-blue-600"
            />
          </div>

          <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs sm:text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              disabled={busy}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs sm:text-sm font-semibold text-white bg-amber-700 hover:bg-amber-800 disabled:opacity-50 rounded-lg transition-colors cursor-pointer"
            >
              {busy && <Loader2 className="w-4 h-4 animate-spin" />}
              <span>ส่งรายงานให้ผู้ดูแลระบบ</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
