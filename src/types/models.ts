import { Timestamp } from 'firebase/firestore';

export type UserRole = 'member' | 'moderator' | 'admin';
export type AccountStatus = 'active' | 'suspended';

export type EducationLevel =
  | 'ประถมศึกษา'
  | 'มัธยมศึกษาตอนต้น'
  | 'มัธยมศึกษาตอนปลาย'
  | 'อาชีวศึกษา'
  | 'อุดมศึกษา'
  | 'บุคคลทั่วไป';

export type MediaType = 'pdf' | 'video' | 'website' | 'document' | 'presentation';

export type ResourceVisibility = 'public' | 'hidden';

export type ReportReason =
  | 'broken_link'
  | 'copyright'
  | 'inappropriate'
  | 'inaccurate'
  | 'spam';

export type ReportStatus = 'pending' | 'resolved' | 'dismissed';

export type ModerationActionType =
  | 'hide_resource'
  | 'restore_resource'
  | 'delete_resource'
  | 'resolve_report'
  | 'dismiss_report'
  | 'suspend_user'
  | 'activate_user'
  | 'change_role'
  | 'update_settings';

export interface UserProfile {
  uid: string;
  displayName: string;
  email: string;
  role: UserRole;
  status: AccountStatus;
  photoURL: string;
  bio: string;
  createdAt?: Timestamp | null;
  updatedAt?: Timestamp | null;
}

export interface ResourceItem {
  id: string;
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
  authorId: string;
  authorName: string;
  visibility: ResourceVisibility;
  createdAt?: Timestamp | null;
  updatedAt?: Timestamp | null;
}

export interface FavoriteItem {
  id: string;
  userId: string;
  resourceId: string;
  resourceTitle: string;
  resourceCategory: string;
  resourceMediaType: MediaType;
  createdAt?: Timestamp | null;
}

export interface ReportItem {
  id: string;
  resourceId: string;
  resourceTitle: string;
  reporterId: string;
  reporterName: string;
  reason: ReportReason;
  details: string;
  status: ReportStatus;
  resolutionNote: string;
  resolvedBy: string;
  createdAt?: Timestamp | null;
  updatedAt?: Timestamp | null;
}

export interface ModerationLogItem {
  id: string;
  actorId: string;
  actorName: string;
  actionType: ModerationActionType;
  targetId: string;
  targetLabel: string;
  note: string;
  createdAt?: Timestamp | null;
}

export interface SiteSettings {
  siteName: string;
  siteDescription: string;
  logoText: string;
  logoUrl: string;
  announcement: string;
  announcementActive: boolean;
  categories: string[];
  updatedBy: string;
  updatedAt?: Timestamp | null;
}

export interface ToastNotice {
  id: string;
  type: 'success' | 'error' | 'info';
  title: string;
  message: string;
}

export type ActiveView =
  | 'explore'
  | 'favorites'
  | 'my-resources'
  | 'profile'
  | 'admin'
  | 'guide';

export const BOOTSTRAPPED_ADMIN_EMAIL = 't.gan5140@gmail.com';

export const VALIDATION_LIMITS = {
  ID_REGEX: /^[a-zA-Z0-9_-]+$/,
  USER_NAME_MIN: 1,
  USER_NAME_MAX: 100,
  USER_BIO_MAX: 500,
  RESOURCE_TITLE_MIN: 3,
  RESOURCE_TITLE_MAX: 200,
  RESOURCE_DESC_MIN: 10,
  RESOURCE_DESC_MAX: 4000,
  CATEGORY_MAX: 80,
  URL_MAX: 2000,
  FILE_DATA_URL_MAX: 700000,
  TAGS_MAX_COUNT: 10,
  TAG_MAX_LEN: 40,
  REPORT_DETAILS_MIN: 5,
  REPORT_DETAILS_MAX: 1000,
  SITE_NAME_MIN: 2,
  SITE_NAME_MAX: 100,
  SITE_DESC_MIN: 5,
  SITE_DESC_MAX: 500,
} as const;

export const EDUCATION_LEVELS: EducationLevel[] = [
  'ประถมศึกษา',
  'มัธยมศึกษาตอนต้น',
  'มัธยมศึกษาตอนปลาย',
  'อาชีวศึกษา',
  'อุดมศึกษา',
  'บุคคลทั่วไป',
];

export const MEDIA_TYPE_LABELS: Record<MediaType, string> = {
  pdf: 'เอกสาร PDF',
  video: 'สื่อวิดีโอ',
  website: 'เว็บไซต์ / บทความ',
  document: 'ใบงาน / เอกสารประกอบ',
  presentation: 'สไลด์นำเสนอ',
};

export const REPORT_REASON_LABELS: Record<ReportReason, string> = {
  broken_link: 'ลิงก์เสีย / เปิดไฟล์ไม่ได้',
  copyright: 'ละเมิดลิขสิทธิ์',
  inappropriate: 'เนื้อหาไม่เหมาะสม',
  inaccurate: 'ข้อมูลทางวิชาการคลาดเคลื่อน',
  spam: 'สแปม / โฆษณาแฝง',
};

export const ACTION_TYPE_LABELS: Record<ModerationActionType, string> = {
  hide_resource: 'ซ่อนสื่อการเรียนรู้',
  restore_resource: 'เปิดแสดงสื่อสาธารณะอีกครั้ง',
  delete_resource: 'ลบสื่อการเรียนรู้ออกจากคลัง',
  resolve_report: 'ดำเนินการแก้ไขรายงานเสร็จสิ้น',
  dismiss_report: 'ยกเลิกรายงาน (ไม่พบความผิดปกติ)',
  suspend_user: 'ระงับบัญชีสมาชิกชั่วคราว',
  activate_user: 'ปลดระงับบัญชีสมาชิก',
  change_role: 'ปรับเปลี่ยนระดับสิทธิ์สมาชิก',
  update_settings: 'อัปเดตการตั้งค่าเว็บไซต์และหมวดหมู่',
};

export const DEFAULT_CATEGORIES: string[] = [
  'คอมพิวเตอร์และเทคโนโลยี',
  'คณิตศาสตร์',
  'วิทยาศาสตร์และดาราศาสตร์',
  'ภาษาไทยและวรรณคดี',
  'ภาษาต่างประเทศ',
  'สังคมศึกษาและประวัติศาสตร์',
  'ศิลปะและการออกแบบ',
  'แนะแนวและทักษะอาชีพ',
];

export const DEFAULT_SITE_SETTINGS: SiteSettings = {
  siteName: 'ThaiLearn Hub',
  siteDescription:
    'คลังปัญญาและสื่อการเรียนรู้เปิดกว้างสำหรับนักเรียน นักศึกษา และครูผู้สอนทั่วประเทศ แบ่งปันใบงาน เอกสารวิชาการ และสื่อการสอนคุณภาพสูง',
  logoText: 'TLH',
  logoUrl: '',
  announcement:
    'ยินดีต้อนรับสู่คลังความรู้ ThaiLearn Hub — สมาชิกที่ยืนยันอีเมลแล้วสามารถร่วมแบ่งปันสื่อการสอนและบันทึกคลังรายการโปรดได้ทันที',
  announcementActive: true,
  categories: DEFAULT_CATEGORIES,
  updatedBy: 'system',
};
