import React, { useState, useEffect } from 'react';
import { X, Upload, Link as LinkIcon, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../firebase';
import {
  EDUCATION_LEVELS,
  EducationLevel,
  MEDIA_TYPE_LABELS,
  MediaType,
  ResourceItem,
  VALIDATION_LIMITS,
} from '../types/models';

export interface ResourceFormPayload {
  title: string;
  description: string;
  category: string;
  level: EducationLevel;
  mediaType: MediaType;
  resourceUrl: string;
  fileName: string;
  fileSize: number;
  fileDataUrl: string;
  tags: string[];
}

interface ResourceFormModalProps {
  isOpen: boolean;
  editingResource: ResourceItem | null;
  categories: string[];
  userUid: string;
  onClose: () => void;
  onSubmit: (payload: ResourceFormPayload, existingId?: string) => Promise<void>;
}

export const ResourceFormModal: React.FC<ResourceFormModalProps> = ({
  isOpen,
  editingResource,
  categories,
  userUid,
  onClose,
  onSubmit,
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState(categories[0] || 'คอมพิวเตอร์และเทคโนโลยี');
  const [level, setLevel] = useState<EducationLevel>('มัธยมศึกษาตอนปลาย');
  const [mediaType, setMediaType] = useState<MediaType>('pdf');
  const [resourceUrl, setResourceUrl] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  const [fileName, setFileName] = useState('');
  const [fileSize, setFileSize] = useState(0);
  const [fileDataUrl, setFileDataUrl] = useState('');
  const [uploadingFile, setUploadingFile] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (editingResource) {
      setTitle(editingResource.title);
      setDescription(editingResource.description);
      setCategory(editingResource.category);
      setLevel(editingResource.level);
      setMediaType(editingResource.mediaType);
      setResourceUrl(editingResource.resourceUrl);
      setFileName(editingResource.fileName);
      setFileSize(editingResource.fileSize);
      setFileDataUrl(editingResource.fileDataUrl);
      setTagsInput(editingResource.tags.join(', '));
      setErrorMsg(null);
    } else {
      setTitle('');
      setDescription('');
      setCategory(categories[0] || 'คอมพิวเตอร์และเทคโนโลยี');
      setLevel('มัธยมศึกษาตอนปลาย');
      setMediaType('pdf');
      setResourceUrl('');
      setFileName('');
      setFileSize(0);
      setFileDataUrl('');
      setTagsInput('');
      setErrorMsg(null);
    }
  }, [editingResource, categories, isOpen]);

  if (!isOpen) return null;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setErrorMsg(null);
    if (file.size > 10 * 1024 * 1024) {
      setErrorMsg('ขนาดไฟล์ต้องไม่เกิน 10 MB');
      return;
    }

    setUploadingFile(true);
    setFileName(file.name.slice(0, 255));
    setFileSize(file.size);

    try {
      // 1. Try uploading to Firebase Storage first
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
      const storageRef = ref(storage, `resources/${userUid}/${Date.now()}_${safeName}`);
      const snapshot = await uploadBytes(storageRef, file);
      const downloadUrl = await getDownloadURL(snapshot.ref);
      setResourceUrl(downloadUrl);
    } catch {
      // 2. Fallback: If Firebase Storage bucket isn't initialized in console yet, encode files up to 500KB as Data URL so upload still works 100% in Firestore
      if (file.size <= 500 * 1024) {
        const reader = new FileReader();
        reader.onload = () => {
          if (typeof reader.result === 'string') {
            setFileDataUrl(reader.result);
          }
        };
        reader.readAsDataURL(file);
      } else {
        setErrorMsg(
          'โปรเจกต์ยังไม่ได้เปิดใช้งาน Firebase Storage สำหรับไฟล์ขนาดใหญ่เกิน 500 KB กรุณาใช้ไฟล์ขนาดไม่เกิน 500 KB หรือแนบลิงก์ Google Drive / YouTube แทน'
        );
      }
    } finally {
      setUploadingFile(false);
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const cleanTitle = title.trim();
    const cleanDesc = description.trim();
    const cleanUrl = resourceUrl.trim();

    if (
      cleanTitle.length < VALIDATION_LIMITS.RESOURCE_TITLE_MIN ||
      cleanTitle.length > VALIDATION_LIMITS.RESOURCE_TITLE_MAX
    ) {
      setErrorMsg(
        `ชื่อสื่อการเรียนรู้ต้องมีความยาวระหว่าง ${VALIDATION_LIMITS.RESOURCE_TITLE_MIN} ถึง ${VALIDATION_LIMITS.RESOURCE_TITLE_MAX} ตัวอักษร`
      );
      return;
    }

    if (
      cleanDesc.length < VALIDATION_LIMITS.RESOURCE_DESC_MIN ||
      cleanDesc.length > VALIDATION_LIMITS.RESOURCE_DESC_MAX
    ) {
      setErrorMsg(
        `คำอธิบายสื่อต้องมีความยาวอย่างน้อย ${VALIDATION_LIMITS.RESOURCE_DESC_MIN} ตัวอักษร (สูงสุด ${VALIDATION_LIMITS.RESOURCE_DESC_MAX} ตัวอักษร)`
      );
      return;
    }

    if (cleanUrl.length === 0 && fileDataUrl.length === 0) {
      setErrorMsg('กรุณาระบุลิงก์สื่อการเรียนรู้ (URL) หรืออัปโหลดไฟล์อย่างน้อย 1 อย่าง');
      return;
    }

    if (cleanUrl.length > 0) {
      try {
        const parsed = new URL(cleanUrl);
        if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
          setErrorMsg('ลิงก์ต้องขึ้นต้นด้วย http:// หรือ https:// เท่านั้น');
          return;
        }
      } catch {
        setErrorMsg('รูปแบบลิงก์ (URL) ไม่ถูกต้อง กรุณาตรวจสอบอีกครั้ง (เช่น https://...)');
        return;
      }
    }

    const parsedTags = tagsInput
      .split(',')
      .map((t) => t.trim())
      .filter((t) => t.length >= 1 && t.length <= VALIDATION_LIMITS.TAG_MAX_LEN)
      .slice(0, VALIDATION_LIMITS.TAGS_MAX_COUNT);

    setSubmitting(true);
    try {
      await onSubmit(
        {
          title: cleanTitle,
          description: cleanDesc,
          category,
          level,
          mediaType,
          resourceUrl: cleanUrl.slice(0, VALIDATION_LIMITS.URL_MAX),
          fileName: fileName.slice(0, 255),
          fileSize,
          fileDataUrl: fileDataUrl.slice(0, VALIDATION_LIMITS.FILE_DATA_URL_MAX),
          tags: parsedTags,
        },
        editingResource?.id
      );
      onClose();
    } catch (err) {
      setErrorMsg(
        err instanceof Error
          ? `เกิดข้อผิดพลาดในการบันทึก: ${err.message}`
          : 'ไม่สามารถบันทึกข้อมูลได้ กรุณาตรวจสอบสิทธิ์หรือการยืนยันอีเมล'
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
    >
      <div className="bg-white border border-slate-200 rounded-2xl max-w-2xl w-full p-6 sm:p-8 shadow-xl my-8">
        <div className="flex items-center justify-between pb-4 border-b border-slate-200">
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-slate-900">
              {editingResource ? 'แก้ไขสื่อการเรียนรู้' : 'แบ่งปันสื่อการเรียนรู้ใหม่'}
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              กรอกข้อมูลสื่อการสอน ใบงาน หรือบทความวิชาการเพื่อแบ่งปันให้เพื่อนนักเรียนและครู
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {errorMsg && (
          <div className="mt-4 p-3.5 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2.5 text-xs sm:text-sm text-red-800">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleFormSubmit} className="mt-5 space-y-4">
          {/* Title */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              ชื่อสื่อการเรียนรู้ / หัวข้อวิชา <span className="text-red-600">*</span>
            </label>
            <input
              type="text"
              required
              minLength={3}
              maxLength={200}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="เช่น สรุปสูตรแคลคูลัสเบื้องต้น ม.6 พร้อมโจทย์ประยุกต์"
              className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:border-blue-600"
            />
          </div>

          {/* Category, Level, Media Type */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                หมวดหมู่ความรู้ <span className="text-red-600">*</span>
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white focus:outline-none focus:border-blue-600"
              >
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                ระดับชั้นเรียน <span className="text-red-600">*</span>
              </label>
              <select
                value={level}
                onChange={(e) => setLevel(e.target.value as EducationLevel)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white focus:outline-none focus:border-blue-600"
              >
                {EDUCATION_LEVELS.map((lvl) => (
                  <option key={lvl} value={lvl}>
                    {lvl}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                ประเภทสื่อ <span className="text-red-600">*</span>
              </label>
              <select
                value={mediaType}
                onChange={(e) => setMediaType(e.target.value as MediaType)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white focus:outline-none focus:border-blue-600"
              >
                {(Object.keys(MEDIA_TYPE_LABELS) as MediaType[]).map((type) => (
                  <option key={type} value={type}>
                    {MEDIA_TYPE_LABELS[type]}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              คำอธิบายเนื้อหาและจุดประสงค์การเรียนรู้ <span className="text-red-600">*</span>
            </label>
            <textarea
              required
              rows={4}
              minLength={10}
              maxLength={4000}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="อธิบายเนื้อหาสำคัญ สิ่งที่ผู้เรียนจะได้รับ หรือวิธีนำไปใช้ในการเรียนการสอน (อย่างน้อย 10 ตัวอักษร)"
              className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:border-blue-600"
            />
          </div>

          {/* External Link URL */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              ลิงก์สื่อการสอน / เว็บไซต์ / วิดีโอ / Google Drive (URL)
            </label>
            <div className="relative">
              <LinkIcon className="w-4 h-4 text-slate-400 absolute left-3.5 top-2.5" />
              <input
                type="url"
                value={resourceUrl}
                onChange={(e) => setResourceUrl(e.target.value)}
                placeholder="https://..."
                className="w-full pl-10 pr-3.5 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:border-blue-600"
              />
            </div>
          </div>

          {/* File Upload (Firebase Storage + Data URL Fallback) */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              หรืออัปโหลดไฟล์เอกสาร/ใบงานโดยตรง (PDF, รูปภาพ, เอกสาร)
            </label>
            <div className="flex flex-wrap items-center gap-3">
              <label className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-blue-800 bg-white border border-slate-300 rounded-lg hover:bg-sky-50 cursor-pointer transition-colors">
                {uploadingFile ? (
                  <Loader2 className="w-4 h-4 animate-spin text-blue-700" />
                ) : (
                  <Upload className="w-4 h-4 text-blue-700" />
                )}
                <span>{uploadingFile ? 'กำลังอัปโหลดไฟล์...' : 'เลือกไฟล์จากอุปกรณ์'}</span>
                <input
                  type="file"
                  accept=".pdf,.doc,.docx,.ppt,.pptx,.txt,.png,.jpg,.jpeg"
                  onChange={handleFileChange}
                  disabled={uploadingFile}
                  className="hidden"
                />
              </label>

              {fileName && (
                <div className="inline-flex items-center gap-1.5 text-xs text-emerald-800 font-medium">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span className="truncate max-w-[240px]">{fileName}</span>
                </div>
              )}
            </div>
          </div>

          {/* Tags */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              คำสำคัญ (คั่นด้วยเครื่องหมายจุลภาค , สูงสุด 10 คำ)
            </label>
            <input
              type="text"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              placeholder="เช่น แคลคูลัส, คณิตศาสตร์ ม.ปลาย, ข้อสอบเข้ามหาวิทยาลัย"
              className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:border-blue-600"
            />
          </div>

          {/* Submit & Cancel */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs sm:text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              disabled={submitting || uploadingFile}
              className="inline-flex items-center gap-2 px-5 py-2 text-xs sm:text-sm font-semibold text-white bg-blue-700 hover:bg-blue-800 disabled:opacity-50 rounded-lg transition-colors cursor-pointer"
            >
              {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
              <span>{editingResource ? 'บันทึกการแก้ไข' : 'เผยแพร่สื่อการเรียนรู้'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
