import React, { useState } from 'react';
import {
  X,
  Eye,
  EyeOff,
  Mail,
  Lock,
  User as UserIcon,
  AlertCircle,
  CheckCircle2,
  Loader2,
} from 'lucide-react';

export type AuthModalMode = 'login' | 'register' | 'reset';

interface AuthModalProps {
  isOpen: boolean;
  initialMode: AuthModalMode;
  onClose: () => void;
  onEmailLogin: (email: string, password: string) => Promise<void>;
  onEmailRegister: (displayName: string, email: string, password: string) => Promise<void>;
  onGoogleLogin: () => Promise<void>;
  onPasswordReset: (email: string) => Promise<void>;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  initialMode,
  onClose,
  onEmailLogin,
  onEmailRegister,
  onGoogleLogin,
  onPasswordReset,
}) => {
  const [mode, setMode] = useState<AuthModalMode>(initialMode);
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const switchMode = (nextMode: AuthModalMode) => {
    setMode(nextMode);
    setErrorMsg(null);
    setSuccessMsg(null);
  };

  const translateFirebaseAuthError = (err: unknown): string => {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes('auth/invalid-credential') || msg.includes('auth/wrong-password')) {
      return 'อีเมลหรือรหัสผ่านไม่ถูกต้อง กรุณาตรวจสอบอีกครั้ง';
    }
    if (msg.includes('auth/user-not-found')) {
      return 'ไม่พบบัญชีผู้ใช้นี้ในระบบ กรุณาสมัครสมาชิกก่อนเข้าใช้งาน';
    }
    if (msg.includes('auth/email-already-in-use')) {
      return 'อีเมลนี้ถูกใช้งานแล้ว กรุณาเข้าสู่ระบบหรือใช้ฟังก์ชันลืมรหัสผ่าน';
    }
    if (msg.includes('auth/weak-password')) {
      return 'รหัสผ่านต้องมีความยาวอย่างน้อย 6 ตัวอักษร';
    }
    if (msg.includes('auth/operation-not-allowed')) {
      return 'ระบบเข้าสู่ระบบด้วยอีเมล/รหัสผ่านยังไม่ได้เปิดใน Firebase Console (ดูวิธีเปิดใช้งานในเมนู "คู่มือระบบ & ทดสอบ" หรือเข้าสู่ระบบด้วย Google ได้ทันที)';
    }
    if (msg.includes('auth/popup-closed-by-user')) {
      return 'คุณปิดหน้าต่างเข้าสู่ระบบ Google ก่อนดำเนินการเสร็จสิ้น';
    }
    return `เกิดข้อผิดพลาด: ${msg}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);
    setBusy(true);

    try {
      if (mode === 'login') {
        await onEmailLogin(email.trim(), password);
        onClose();
      } else if (mode === 'register') {
        if (displayName.trim().length < 2) {
          setErrorMsg('กรุณากรอกชื่อ-นามสกุล หรือชื่อที่ใช้แสดงอย่างน้อย 2 ตัวอักษร');
          setBusy(false);
          return;
        }
        await onEmailRegister(displayName.trim(), email.trim(), password);
        onClose();
      } else if (mode === 'reset') {
        await onPasswordReset(email.trim());
        setSuccessMsg(
          'ระบบได้ส่งลิงก์สำหรับตั้งรหัสผ่านใหม่ไปยังอีเมลของคุณแล้ว กรุณาตรวจสอบกล่องจดหมายและโฟลเดอร์จดหมายขยะ (Spam)'
        );
      }
    } catch (err) {
      setErrorMsg(translateFirebaseAuthError(err));
    } finally {
      setBusy(false);
    }
  };

  const handleGoogleClick = async () => {
    setErrorMsg(null);
    setSuccessMsg(null);
    setBusy(true);
    try {
      await onGoogleLogin();
      onClose();
    } catch (err) {
      setErrorMsg(translateFirebaseAuthError(err));
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
      <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 sm:p-8 shadow-xl my-8">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 pb-4 border-b border-slate-200">
          <div>
            <h2 className="text-xl font-bold text-slate-900">
              {mode === 'login' && 'เข้าสู่ระบบคลังความรู้'}
              {mode === 'register' && 'สมัครสมาชิกใหม่'}
              {mode === 'reset' && 'กู้คืนรหัสผ่านผ่านอีเมล'}
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              {mode === 'login' && 'เข้าสู่ระบบเพื่อโพสต์สื่อการสอนและบันทึกรายการโปรด'}
              {mode === 'register' && 'สมัครด้วยอีเมลพร้อมรับลิงก์ยืนยันตัวตนจริงจาก Firebase'}
              {mode === 'reset' && 'กรอกอีเมลที่ใช้สมัครเพื่อรับลิงก์ตั้งรหัสผ่านใหม่'}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mode Switcher Tabs */}
        <div className="grid grid-cols-3 gap-1 p-1 bg-slate-100 rounded-lg mt-4 text-xs font-semibold">
          <button
            type="button"
            onClick={() => switchMode('login')}
            className={`py-2 rounded-md transition-colors cursor-pointer ${
              mode === 'login' ? 'bg-white text-blue-800 shadow-xs' : 'text-slate-600'
            }`}
          >
            เข้าสู่ระบบ
          </button>
          <button
            type="button"
            onClick={() => switchMode('register')}
            className={`py-2 rounded-md transition-colors cursor-pointer ${
              mode === 'register' ? 'bg-white text-blue-800 shadow-xs' : 'text-slate-600'
            }`}
          >
            สมัครสมาชิก
          </button>
          <button
            type="button"
            onClick={() => switchMode('reset')}
            className={`py-2 rounded-md transition-colors cursor-pointer ${
              mode === 'reset' ? 'bg-white text-blue-800 shadow-xs' : 'text-slate-600'
            }`}
          >
            ลืมรหัสผ่าน
          </button>
        </div>

        {errorMsg && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2 text-xs text-red-800">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="mt-4 p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-start gap-2 text-xs text-emerald-800">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <span>{successMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {mode === 'register' && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                ชื่อ-นามสกุล / ชื่อที่แสดงในระบบ <span className="text-red-600">*</span>
              </label>
              <div className="relative">
                <UserIcon className="w-4 h-4 text-slate-400 absolute left-3.5 top-2.5" />
                <input
                  type="text"
                  required
                  minLength={2}
                  maxLength={100}
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="เช่น อ.สมชาย ใจดี หรือ นศ.กมลชนก"
                  className="w-full pl-10 pr-3.5 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:border-blue-600"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              อีเมล (Email) <span className="text-red-600">*</span>
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-2.5" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@school.ac.th"
                className="w-full pl-10 pr-3.5 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:border-blue-600"
              />
            </div>
          </div>

          {mode !== 'reset' && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                รหัสผ่าน (Password) <span className="text-red-600">*</span>
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-2.5" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="อย่างน้อย 6 ตัวอักษร"
                  className="w-full pl-10 pr-10 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:border-blue-600"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  title={showPassword ? 'ซ่อนรหัสผ่าน' : 'แสดงรหัสผ่าน'}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-700 cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={busy}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 text-sm font-semibold text-white bg-blue-700 hover:bg-blue-800 disabled:opacity-50 rounded-lg transition-colors cursor-pointer"
          >
            {busy && <Loader2 className="w-4 h-4 animate-spin" />}
            <span>
              {mode === 'login' && 'เข้าสู่ระบบด้วยอีเมล'}
              {mode === 'register' && 'สมัครสมาชิกและส่งอีเมลยืนยันตัวตน'}
              {mode === 'reset' && 'ส่งลิงก์ตั้งรหัสผ่านใหม่ทางอีเมล'}
            </span>
          </button>
        </form>

        {mode !== 'reset' && (
          <>
            <div className="relative my-5">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200" />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="bg-white px-3 text-slate-500">หรือดำเนินการต่อด้วย</span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleGoogleClick}
              disabled={busy}
              className="w-full flex items-center justify-center gap-2.5 py-2.5 px-4 text-sm font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 disabled:opacity-50 rounded-lg transition-colors cursor-pointer"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" aria-hidden="true">
                <path
                  fill="#4285F4"
                  d="M23.745 12.27c0-.79-.07-1.54-.19-2.27h-11.3v4.51h6.47c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.54-5.17 3.54-8.97z"
                />
                <path
                  fill="#34A853"
                  d="M12.255 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.11-6.72-4.96h-4.01v3.14C3.515 21.3 7.565 24 12.255 24z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.535 14.24c-.24-.72-.38-1.49-.38-2.24s.14-1.52.38-2.24V6.62h-4.01C.705 8.24.255 10.06.255 12s.45 3.76 1.27 5.38l4.01-3.14z"
                />
                <path
                  fill="#EA4335"
                  d="M12.255 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C18.205 1.19 15.495 0 12.255 0 7.565 0 3.515 2.7 1.525 6.62l4.01 3.14c.95-2.85 3.6-4.96 6.72-4.96z"
                />
              </svg>
              <span>เข้าสู่ระบบด้วยบัญชี Google</span>
            </button>
          </>
        )}
      </div>
    </div>
  );
};
