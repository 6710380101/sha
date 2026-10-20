import React, { useState } from 'react';
import { User, Mail, Shield, CheckCircle2, AlertCircle, Save, Loader2, KeyRound } from 'lucide-react';
import { UserProfile, VALIDATION_LIMITS } from '../types/models';

interface ProfileViewProps {
  userProfile: UserProfile;
  authEmailVerified: boolean;
  onUpdateProfile: (displayName: string, bio: string, photoURL: string) => Promise<void>;
  onSendPasswordReset: (email: string) => Promise<void>;
  onResendVerification: () => Promise<void>;
  onRefreshVerification: () => Promise<void>;
}

export const ProfileView: React.FC<ProfileViewProps> = ({
  userProfile,
  authEmailVerified,
  onUpdateProfile,
  onSendPasswordReset,
  onResendVerification,
  onRefreshVerification,
}) => {
  const [displayName, setDisplayName] = useState(userProfile.displayName);
  const [bio, setBio] = useState(userProfile.bio || '');
  const [photoURL, setPhotoURL] = useState(userProfile.photoURL || '');
  const [saving, setSaving] = useState(false);
  const [resetSending, setResetSending] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(
    null
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);

    const cleanName = displayName.trim();
    if (
      cleanName.length < VALIDATION_LIMITS.USER_NAME_MIN ||
      cleanName.length > VALIDATION_LIMITS.USER_NAME_MAX
    ) {
      setFeedback({
        type: 'error',
        text: `ชื่อที่แสดงต้องมีความยาว ${VALIDATION_LIMITS.USER_NAME_MIN}–${VALIDATION_LIMITS.USER_NAME_MAX} ตัวอักษร`,
      });
      return;
    }

    setSaving(true);
    try {
      await onUpdateProfile(
        cleanName,
        bio.trim().slice(0, VALIDATION_LIMITS.USER_BIO_MAX),
        photoURL.trim().slice(0, 1000)
      );
      setFeedback({ type: 'success', text: 'บันทึกข้อมูลโปรไฟล์ลงใน Cloud Firestore สำเร็จแล้ว' });
    } catch (err) {
      setFeedback({
        type: 'error',
        text: err instanceof Error ? err.message : 'ไม่สามารถอัปเดตโปรไฟล์ได้',
      });
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordResetClick = async () => {
    setFeedback(null);
    setResetSending(true);
    try {
      await onSendPasswordReset(userProfile.email);
      setFeedback({
        type: 'success',
        text: `ส่งลิงก์ตั้งรหัสผ่านใหม่ไปยัง ${userProfile.email} เรียบร้อยแล้ว`,
      });
    } catch (err) {
      setFeedback({
        type: 'error',
        text: err instanceof Error ? err.message : 'ไม่สามารถส่งลิงก์เปลี่ยนรหัสผ่านได้',
      });
    } finally {
      setResetSending(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-sky-100 border border-sky-200 flex items-center justify-center text-blue-800 font-bold text-xl shrink-0">
              {userProfile.displayName.charAt(0).toUpperCase()}
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900">{userProfile.displayName}</h1>
              <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 mt-1">
                <span className="inline-flex items-center gap-1">
                  <Mail className="w-3.5 h-3.5 text-blue-700" />
                  <span>{userProfile.email}</span>
                </span>
                <span aria-hidden="true">·</span>
                <span className="inline-flex items-center gap-1 font-semibold text-blue-800">
                  <Shield className="w-3.5 h-3.5" />
                  <span>
                    {userProfile.role === 'admin'
                      ? 'ผู้ดูแลระบบ (Admin)'
                      : userProfile.role === 'moderator'
                      ? 'ผู้ตรวจสอบเนื้อหา (Moderator)'
                      : 'สมาชิก (Member)'}
                  </span>
                </span>
                <span aria-hidden="true">·</span>
                <span
                  className={`font-semibold ${
                    authEmailVerified ? 'text-emerald-700' : 'text-amber-700'
                  }`}
                >
                  {authEmailVerified ? 'ยืนยันอีเมลแล้ว' : 'รอยืนยันอีเมล'}
                </span>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={handlePasswordResetClick}
            disabled={resetSending}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <KeyRound className="w-4 h-4 text-blue-700" />
            <span>{resetSending ? 'กำลังส่งอีเมล...' : 'ส่งลิงก์เปลี่ยนรหัสผ่านทางอีเมล'}</span>
          </button>
        </div>

        {!authEmailVerified && (
          <div className="mt-5 p-4 bg-amber-50 border border-amber-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-amber-950">
            <div>
              <p className="font-semibold">บัญชียังไม่ได้ยืนยันอีเมล</p>
              <p className="mt-0.5">
                กรุณากดลิงก์ยืนยันในอีเมลของคุณ แล้วคลิกปุ่มรีเฟรชเพื่อสร้างโปรไฟล์และเริ่มโพสต์สื่อการสอน
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={onResendVerification}
                className="px-3 py-1.5 bg-white border border-amber-300 rounded-md font-semibold hover:bg-amber-100 cursor-pointer"
              >
                ส่งอีเมลซ้ำ
              </button>
              <button
                type="button"
                onClick={onRefreshVerification}
                className="px-3 py-1.5 bg-amber-700 text-white rounded-md font-semibold hover:bg-amber-800 cursor-pointer"
              >
                ฉันยืนยันอีเมลแล้ว
              </button>
            </div>
          </div>
        )}

        {feedback && (
          <div
            className={`mt-5 p-3.5 rounded-xl border flex items-start gap-2.5 text-xs sm:text-sm ${
              feedback.type === 'success'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                : 'bg-red-50 border-red-200 text-red-900'
            }`}
          >
            {feedback.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
            )}
            <span>{feedback.text}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              ชื่อที่แสดงในคลังความรู้ (Display Name) <span className="text-red-600">*</span>
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-2.5" />
              <input
                type="text"
                required
                minLength={1}
                maxLength={100}
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full pl-10 pr-3.5 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:border-blue-600"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              แนะนำตัว / สังกัดสถานศึกษาหรือวิชาที่สนใจ (Bio)
            </label>
            <textarea
              rows={3}
              maxLength={500}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="เช่น ครูกลุ่มสาระการเรียนรู้วิทยาศาสตร์ โรงเรียนเตรียมอุดมศึกษา..."
              className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:border-blue-600"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              ลิงก์รูปโปรไฟล์ (Photo URL — ไม่บังคับ)
            </label>
            <input
              type="url"
              value={photoURL}
              onChange={(e) => setPhotoURL(e.target.value)}
              placeholder="https://..."
              className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:border-blue-600"
            />
          </div>

          <div className="pt-4 border-t border-slate-200 flex items-center justify-between gap-4">
            <span className="text-xs text-slate-500 font-mono-tabular">
              UID: {userProfile.uid}
            </span>
            <button
              type="submit"
              disabled={saving || !authEmailVerified}
              className="inline-flex items-center gap-2 px-5 py-2 text-xs sm:text-sm font-semibold text-white bg-blue-700 hover:bg-blue-800 disabled:opacity-50 rounded-lg transition-colors cursor-pointer"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              <span>บันทึกข้อมูลโปรไฟล์</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
