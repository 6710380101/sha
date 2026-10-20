import React from 'react';
import {
  CheckCircle2,
  Database,
  ShieldCheck,
  KeyRound,
  Settings,
  ClipboardCheck,
  ExternalLink,
} from 'lucide-react';
import firebaseConfig from '../../firebase-applet-config.json';

export const GuideAndTestingView: React.FC = () => {
  const consoleBaseUrl = `https://console.firebase.google.com/project/${firebaseConfig.projectId}`;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header Banner */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8">
        <div className="text-xs font-semibold text-blue-700 mb-1">
          เอกสารส่งมอบงานและคู่มือผู้ดูแลระบบ (System Delivery & Verification Guide)
        </div>
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
          ขั้นตอนการตั้งค่า Firebase Console และวิธีทดสอบระบบจริงครบวงจร
        </h1>
        <p className="text-sm text-slate-600 mt-2 leading-relaxed">
          เว็บไซต์นี้เชื่อมต่อกับโปรเจกต์ Firebase จริง (<span className="font-mono-tabular font-semibold text-slate-800">{firebaseConfig.projectId}</span>)
          และฐานข้อมูล Cloud Firestore (<span className="font-mono-tabular font-semibold text-slate-800">{firebaseConfig.firestoreDatabaseId}</span>)
          พร้อมติดตั้ง Firestore Security Rules แบบ Zero-Trust เรียบร้อยแล้ว
        </p>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <a
            href={`${consoleBaseUrl}/authentication/providers`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-blue-700 hover:bg-blue-800 rounded-lg transition-colors"
          >
            <KeyRound className="w-3.5 h-3.5" />
            <span>เปิดหน้าตั้งค่า Authentication Providers</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>

          <a
            href={`${consoleBaseUrl}/firestore/databases/${firebaseConfig.firestoreDatabaseId}/data`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-blue-800 bg-sky-50 hover:bg-sky-100 border border-sky-200 rounded-lg transition-colors"
          >
            <Database className="w-3.5 h-3.5" />
            <span>เปิดดูข้อมูล Cloud Firestore จริง</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>

      {/* Part 1: Firebase Console Setup Steps */}
      <section className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 space-y-5">
        <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
          <Settings className="w-5 h-5 text-blue-700" />
          <span>1. ขั้นตอนที่ต้องตั้งค่าเพิ่มเติมใน Firebase Console</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
            <h3 className="text-sm font-bold text-slate-900">
              1.1 เปิดใช้งาน Email/Password Sign-In
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              ระบบได้เปิดใช้งาน <strong>Google Sign-In</strong> ให้อัตโนมัติแล้ว สำหรับการสมัครสมาชิกด้วยอีเมลและรหัสผ่าน:
            </p>
            <ol className="text-xs text-slate-700 space-y-1 list-decimal list-inside">
              <li>ไปที่เมนู <strong>Authentication &rarr; Sign-in method</strong></li>
              <li>คลิก <strong>Add new provider</strong> แล้วเลือก <strong>Email/Password</strong></li>
              <li>เปิดสวิตช์ <strong>Enable</strong> (ไม่ต้องเปิด Email link passwordless) แล้วกด <strong>Save</strong></li>
            </ol>
          </div>

          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
            <h3 className="text-sm font-bold text-slate-900">
              1.2 ตรวจสอบ Authorized Domains
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              เพื่อให้ป๊อปอัป Google Sign-In และลิงก์ยืนยันอีเมลทำงานได้บนทุกโดเมน:
            </p>
            <ol className="text-xs text-slate-700 space-y-1 list-decimal list-inside">
              <li>ไปที่ <strong>Authentication &rarr; Settings &rarr; Authorized domains</strong></li>
              <li>ตรวจสอบว่ามีโดเมนของแอปพลิเคชันอยู่ในรายการแล้ว</li>
              <li>ปรับแต่งภาษาของอีเมลยืนยันตัวตนได้ที่แท็บ <strong>Templates &rarr; Template language (Thai)</strong></li>
            </ol>
          </div>

          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
            <h3 className="text-sm font-bold text-slate-900">
              1.3 โครงสร้าง Collections ทั้ง 6 ใน Cloud Firestore
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              ระบบสร้างและจัดการข้อมูลจริงใน 6 Collections ตามข้อกำหนดโดยไม่เก็บรหัสผ่านลงฐานข้อมูล:
            </p>
            <ul className="text-xs text-slate-700 space-y-1 font-mono-tabular">
              <li>• /users/&#123;userId&#125; — ข้อมูลสมาชิก บทบาท และสถานะ</li>
              <li>• /resources/&#123;resourceId&#125; — สื่อการเรียนรู้และเอกสารแนบ</li>
              <li>• /favorites/&#123;userId_resourceId&#125; — รายการโปรดไม่ซ้ำซ้อน</li>
              <li>• /reports/&#123;reportId&#125; — รายงานเนื้อหาไม่เหมาะสม/ลิงก์เสีย</li>
              <li>• /moderationLogs/&#123;logId&#125; — ประวัติการตรวจสอบแบบแก้ไขไม่ได้</li>
              <li>• /settings/site_config — ชื่อเว็บ คำประกาศ และหมวดหมู่</li>
            </ul>
          </div>

          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
            <h3 className="text-sm font-bold text-slate-900">
              1.4 ความปลอดภัยของ Firestore Security Rules
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              กฎความปลอดภัยในไฟล์ <code className="font-mono-tabular">firestore.rules</code> ถูก Deploy ขึ้นระบบจริงแล้ว:
            </p>
            <ul className="text-xs text-slate-700 space-y-1">
              <li>• ป้องกันผู้ใช้ทั่วไปแก้ไขฟิลด์ <code className="font-mono-tabular">role</code> เป็น <code className="font-mono-tabular">admin</code></li>
              <li>• บังคับตรวจสอบ <code className="font-mono-tabular">email_verified == true</code> ทุกครั้งที่เขียนข้อมูล</li>
              <li>• แยกสิทธิ์การเข้าถึงอีเมลส่วนบุคคล (PII Isolation) เฉพาะเจ้าของบัญชีและผู้ดูแล</li>
            </ul>
          </div>
        </div>
      </section>

      {/* Part 2: Step-by-Step Real Testing Guide */}
      <section className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 space-y-5">
        <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
          <ClipboardCheck className="w-5 h-5 text-blue-700" />
          <span>2. สรุปวิธีทดสอบระบบจริงตั้งแต่ต้นจนจบ (End-to-End Testing)</span>
        </h2>

        <div className="space-y-4">
          <div className="p-4 border border-slate-200 rounded-xl flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-blue-700 shrink-0 mt-0.5" />
            <div className="text-xs sm:text-sm space-y-1">
              <p className="font-bold text-slate-900">
                ขั้นตอนที่ 1: ทดสอบการสมัครสมาชิก ยืนยันอีเมล และลืมรหัสผ่าน
              </p>
              <p className="text-slate-600 leading-relaxed">
                คลิกปุ่ม <strong>&ldquo;เข้าสู่ระบบ / สมัครสมาชิก&rdquo;</strong> มุมขวาบน ทดสอบเข้าสู่ระบบด้วย Google (ซึ่งจะได้รับสิทธิ์ Admin ทันทีสำหรับอีเมลผู้ดูแลหลัก) หรือสมัครด้วยอีเมลและรหัสผ่าน ระบบจะส่งอีเมลยืนยันจริงพร้อมแถบปุ่ม <strong>&ldquo;ฉันยืนยันอีเมลแล้ว (รีเฟรชสถานะ)&rdquo;</strong> และสามารถทดสอบส่งลิงก์ตั้งรหัสผ่านใหม่ได้ในแท็บ <strong>&ldquo;ลืมรหัสผ่าน&rdquo;</strong>
              </p>
            </div>
          </div>

          <div className="p-4 border border-slate-200 rounded-xl flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-blue-700 shrink-0 mt-0.5" />
            <div className="text-xs sm:text-sm space-y-1">
              <p className="font-bold text-slate-900">
                ขั้นตอนที่ 2: ทดสอบการโพสต์สื่อการเรียนรู้ ค้นหา และกรองตามหมวดหมู่
              </p>
              <p className="text-slate-600 leading-relaxed">
                คลิกปุ่ม <strong>&ldquo;แบ่งปันความรู้&rdquo;</strong> กรอกชื่อ คำอธิบาย เลือกหมวดหมู่ ระดับชั้น ประเภทสื่อ และแนบลิงก์หรืออัปโหลดไฟล์ จากนั้นกดเผยแพร่ สื่อจะปรากฏในหน้าคลังความรู้แบบเรียลไทม์ ทดสอบพิมพ์ค้นหาในช่องค้นหาขนาดใหญ่ หรือคลิกกรองตามหมวดหมู่และระดับชั้นที่ Sidebar ด้านซ้าย
              </p>
            </div>
          </div>

          <div className="p-4 border border-slate-200 rounded-xl flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-blue-700 shrink-0 mt-0.5" />
            <div className="text-xs sm:text-sm space-y-1">
              <p className="font-bold text-slate-900">
                ขั้นตอนที่ 3: ทดสอบระบบรายการโปรด (Favorites) และการรายงานปัญหา (Reports)
              </p>
              <p className="text-slate-600 leading-relaxed">
                กดปุ่ม <strong>&ldquo;บันทึก&rdquo;</strong> บนการ์ดสื่อการเรียนรู้ ระบบจะบันทึกลงคอลเลกชัน <code className="font-mono-tabular">favorites</code> ด้วยรหัสเฉพาะ <code className="font-mono-tabular">&#123;uid&#125;_&#123;resourceId&#125;</code> ป้องกันการบันทึกซ้ำและซิงค์ตรงกันทุกอุปกรณ์ และสามารถกดไอคอนธงเพื่อส่งรายงานเนื้อหาไม่เหมาะสมเข้าสู่คอลเลกชัน <code className="font-mono-tabular">reports</code>
              </p>
            </div>
          </div>

          <div className="p-4 border border-slate-200 rounded-xl flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-blue-700 shrink-0 mt-0.5" />
            <div className="text-xs sm:text-sm space-y-1">
              <p className="font-bold text-slate-900">
                ขั้นตอนที่ 4: ทดสอบหน้าผู้ดูแลระบบ (Admin Dashboard) และการตั้งค่าเว็บไซต์
              </p>
              <p className="text-slate-600 leading-relaxed">
                เข้าสู่เมนู <strong>&ldquo;จัดการระบบ&rdquo;</strong> เพื่อตรวจสอบรายงานที่ส่งเข้ามา ทดสอบกดซ่อน/เปิดแสดงสื่อ หรือลบสื่อพร้อมหน้าต่างยืนยัน ทดสอบค้นหาสมาชิกเพื่อปรับเปลี่ยนบทบาท (<code className="font-mono-tabular">member / moderator / admin</code>) หรือระงับบัญชี และไปที่แท็บ <strong>&ldquo;ตั้งค่าเว็บไซต์และหมวดหมู่&rdquo;</strong> เพื่อแก้ไขชื่อเว็บ คำประกาศ หรือเพิ่มหมวดหมู่ความรู้ใหม่โดยไม่ต้องแก้โค้ด
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
