import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  sendEmailVerification,
  sendPasswordResetEmail,
  updateProfile,
  signOut,
  User as FirebaseUser,
} from 'firebase/auth';
import {
  collection,
  doc,
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  where,
  serverTimestamp,
} from 'firebase/firestore';
import {
  Search,
  Plus,
  BookOpen,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Info,
  X,
  Loader2,
  FolderOpen,
  RotateCcw,
} from 'lucide-react';

import {
  auth,
  db,
  googleProvider,
  handleFirestoreError,
  OperationType,
} from './firebase';
import {
  AccountStatus,
  ActiveView,
  BOOTSTRAPPED_ADMIN_EMAIL,
  DEFAULT_SITE_SETTINGS,
  FavoriteItem,
  ModerationActionType,
  ModerationLogItem,
  ReportItem,
  ReportReason,
  ResourceItem,
  SiteSettings,
  ToastNotice,
  UserProfile,
  UserRole,
} from './types/models';
import { Navbar } from './components/Navbar';
import { BreadcrumbBar } from './components/BreadcrumbBar';
import { Sidebar } from './components/Sidebar';
import { ResourceCard } from './components/ResourceCard';
import { ResourceDetailModal } from './components/ResourceDetailModal';
import { ResourceFormModal, ResourceFormPayload } from './components/ResourceFormModal';
import { AuthModal, AuthModalMode } from './components/AuthModal';
import { ReportModal } from './components/ReportModal';
import { ConfirmDialogModal } from './components/ConfirmDialogModal';
import { ProfileView } from './components/ProfileView';
import { AdminDashboard } from './components/AdminDashboard';
import { GuideAndTestingView } from './components/GuideAndTestingView';

export default function App() {
  // Navigation & Filter States
  const [activeView, setActiveView] = useState<ActiveView>('explore');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedLevel, setSelectedLevel] = useState<string>('all');
  const [selectedMediaType, setSelectedMediaType] = useState<string>('all');

  // Auth & User Profile States
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [verificationLoading, setVerificationLoading] = useState(false);

  // Firestore Real-time Data States
  const [siteSettings, setSiteSettings] = useState<SiteSettings>(DEFAULT_SITE_SETTINGS);
  const [publicResources, setPublicResources] = useState<ResourceItem[]>([]);
  const [ownResources, setOwnResources] = useState<ResourceItem[]>([]);
  const [resourcesLoading, setResourcesLoading] = useState(true);
  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);
  const [favoriteBusyId, setFavoriteBusyId] = useState<string | null>(null);

  // Admin Data States
  const [allUsers, setAllUsers] = useState<UserProfile[]>([]);
  const [reports, setReports] = useState<ReportItem[]>([]);
  const [moderationLogs, setModerationLogs] = useState<ModerationLogItem[]>([]);

  // Modals States
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<AuthModalMode>('login');
  const [postModalOpen, setPostModalOpen] = useState(false);
  const [editingResource, setEditingResource] = useState<ResourceItem | null>(null);
  const [selectedResource, setSelectedResource] = useState<ResourceItem | null>(null);
  const [reportingResource, setReportingResource] = useState<ResourceItem | null>(null);
  const [deletingResource, setDeletingResource] = useState<ResourceItem | null>(null);
  const [seedingResources, setSeedingResources] = useState(false);

  // Toast Notifications
  const [toasts, setToasts] = useState<ToastNotice[]>([]);

  const pushToast = useCallback(
    (type: ToastNotice['type'], title: string, message: string) => {
      const id = `${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
      setToasts((prev) => [...prev, { id, type, title, message }]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 4500);
    },
    []
  );

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Helper to write immutable moderation log
  const writeModerationLog = async (
    actionType: ModerationActionType,
    targetId: string,
    targetLabel: string,
    note: string
  ) => {
    if (!userProfile) return;
    const path = 'moderationLogs';
    try {
      await addDoc(collection(db, path), {
        actorId: userProfile.uid,
        actorName: userProfile.displayName.slice(0, 100),
        actionType,
        targetId: targetId.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 128),
        targetLabel: targetLabel.slice(0, 200),
        note: note.slice(0, 1000),
        createdAt: serverTimestamp(),
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, path);
    }
  };

  // Ensure verified user document exists in Firestore /users/{uid}
  const ensureVerifiedUserDocument = useCallback(
    async (user: FirebaseUser, preferredName?: string) => {
      if (!user.emailVerified) return;
      const userDocPath = `users/${user.uid}`;
      const isBootstrapAdmin =
        user.email?.toLowerCase() === BOOTSTRAPPED_ADMIN_EMAIL.toLowerCase();
      const displayName = (
        preferredName ||
        user.displayName ||
        user.email?.split('@')[0] ||
        'สมาชิกคลังความรู้'
      ).slice(0, 100);

      try {
        await setDoc(
          doc(db, 'users', user.uid),
          {
            uid: user.uid,
            displayName,
            email: (user.email || 'user@example.com').slice(0, 254),
            role: isBootstrapAdmin ? 'admin' : 'member',
            status: 'active',
            photoURL: (user.photoURL || '').slice(0, 1000),
            bio: '',
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          },
          { merge: false }
        );
      } catch (error) {
        handleFirestoreError(error, OperationType.CREATE, userDocPath);
      }
    },
    []
  );

  // 1. Auth State Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setFirebaseUser(user);
      setAuthReady(true);
      if (!user) {
        setUserProfile(null);
        setFavorites([]);
        setOwnResources([]);
        setAllUsers([]);
        setReports([]);
        setModerationLogs([]);
      }
    });
    return () => unsubscribe();
  }, []);

  // 2. Site Settings Listener (/settings/site_config)
  useEffect(() => {
    const settingsDocRef = doc(db, 'settings', 'site_config');
    const unsubscribe = onSnapshot(
      settingsDocRef,
      async (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data() as SiteSettings;
          setSiteSettings(data);
        } else if (
          firebaseUser &&
          firebaseUser.emailVerified &&
          firebaseUser.email?.toLowerCase() === BOOTSTRAPPED_ADMIN_EMAIL.toLowerCase()
        ) {
          // Initialize default site_config document when Bootstrapped Admin logs in first time
          try {
            await setDoc(settingsDocRef, {
              ...DEFAULT_SITE_SETTINGS,
              updatedBy: firebaseUser.uid,
              updatedAt: serverTimestamp(),
            });
          } catch {
            // Ignore if not yet ready
          }
        }
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, 'settings/site_config');
      }
    );
    return () => unsubscribe();
  }, [firebaseUser]);

  // 3. Current User Profile Listener (/users/{uid})
  useEffect(() => {
    if (!authReady || !firebaseUser) return;

    if (!firebaseUser.emailVerified) {
      // Unverified Email/Password account: hold temporary local profile until email is verified
      setUserProfile({
        uid: firebaseUser.uid,
        displayName:
          firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'สมาชิกใหม่',
        email: firebaseUser.email || '',
        role: 'member',
        status: 'active',
        photoURL: firebaseUser.photoURL || '',
        bio: '',
      });
      return;
    }

    const userDocRef = doc(db, 'users', firebaseUser.uid);
    const unsubscribe = onSnapshot(
      userDocRef,
      async (snapshot) => {
        if (snapshot.exists()) {
          setUserProfile(snapshot.data() as UserProfile);
        } else {
          await ensureVerifiedUserDocument(firebaseUser);
        }
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, `users/${firebaseUser.uid}`);
      }
    );

    return () => unsubscribe();
  }, [authReady, firebaseUser, ensureVerifiedUserDocument]);

  // 4. Resources Listener (/resources)
  const isBootstrappedAdminUser = Boolean(
    firebaseUser &&
      firebaseUser.emailVerified &&
      firebaseUser.email?.toLowerCase() === BOOTSTRAPPED_ADMIN_EMAIL.toLowerCase()
  );

  useEffect(() => {
    setResourcesLoading(true);
    const resourcesQuery = isBootstrappedAdminUser
      ? collection(db, 'resources')
      : query(collection(db, 'resources'), where('visibility', '==', 'public'));

    const unsubscribe = onSnapshot(
      resourcesQuery,
      (snapshot) => {
        const list: ResourceItem[] = snapshot.docs.map((d) => ({
          id: d.id,
          ...(d.data() as Omit<ResourceItem, 'id'>),
        }));
        setPublicResources(list);
        setResourcesLoading(false);
      },
      (error) => {
        setResourcesLoading(false);
        handleFirestoreError(error, OperationType.LIST, 'resources');
      }
    );

    return () => unsubscribe();
  }, [isBootstrappedAdminUser]);

  // Also listen to current user's own resources (including any hidden ones)
  useEffect(() => {
    if (!authReady || !firebaseUser || isBootstrappedAdminUser) {
      setOwnResources([]);
      return;
    }

    const ownQuery = query(
      collection(db, 'resources'),
      where('authorId', '==', firebaseUser.uid)
    );

    const unsubscribe = onSnapshot(
      ownQuery,
      (snapshot) => {
        const list: ResourceItem[] = snapshot.docs.map((d) => ({
          id: d.id,
          ...(d.data() as Omit<ResourceItem, 'id'>),
        }));
        setOwnResources(list);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, 'resources');
      }
    );

    return () => unsubscribe();
  }, [authReady, firebaseUser, isBootstrappedAdminUser]);

  // Combined deduplicated resources sorted newest first
  const allResources = useMemo(() => {
    const map = new Map<string, ResourceItem>();
    for (const r of publicResources) map.set(r.id, r);
    for (const r of ownResources) map.set(r.id, r);

    return Array.from(map.values()).sort((a, b) => {
      const timeA = a.createdAt?.toMillis?.() ?? 0;
      const timeB = b.createdAt?.toMillis?.() ?? 0;
      return timeB - timeA;
    });
  }, [publicResources, ownResources]);

  // 5. Favorites Listener (/favorites where userId == currentUser.uid)
  useEffect(() => {
    if (!authReady || !firebaseUser) {
      setFavorites([]);
      return;
    }

    const favQuery = query(
      collection(db, 'favorites'),
      where('userId', '==', firebaseUser.uid)
    );

    const unsubscribe = onSnapshot(
      favQuery,
      (snapshot) => {
        const list: FavoriteItem[] = snapshot.docs.map((d) => ({
          id: d.id,
          ...(d.data() as Omit<FavoriteItem, 'id'>),
        }));
        setFavorites(list);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, 'favorites');
      }
    );

    return () => unsubscribe();
  }, [authReady, firebaseUser]);

  // 6. Admin Listeners (users, reports, moderationLogs)
  useEffect(() => {
    if (!authReady || !firebaseUser || !isBootstrappedAdminUser) {
      return;
    }

    const usersQuery = query(
      collection(db, 'users'),
      where('status', 'in', ['active', 'suspended'])
    );
    const reportsQuery = query(
      collection(db, 'reports'),
      where('status', 'in', ['pending', 'resolved', 'dismissed'])
    );
    const logsQuery = query(
      collection(db, 'moderationLogs'),
      where('actionType', 'in', [
        'hide_resource',
        'restore_resource',
        'delete_resource',
        'resolve_report',
        'dismiss_report',
        'suspend_user',
        'activate_user',
        'change_role',
        'update_settings',
      ])
    );

    const unsubUsers = onSnapshot(
      usersQuery,
      (snap) => {
        setAllUsers(snap.docs.map((d) => d.data() as UserProfile));
      },
      (err) => handleFirestoreError(err, OperationType.LIST, 'users')
    );

    const unsubReports = onSnapshot(
      reportsQuery,
      (snap) => {
        const list: ReportItem[] = snap.docs
          .map((d) => ({
            id: d.id,
            ...(d.data() as Omit<ReportItem, 'id'>),
          }))
          .sort((a, b) => (b.createdAt?.toMillis?.() ?? 0) - (a.createdAt?.toMillis?.() ?? 0));
        setReports(list);
      },
      (err) => handleFirestoreError(err, OperationType.LIST, 'reports')
    );

    const unsubLogs = onSnapshot(
      logsQuery,
      (snap) => {
        const list: ModerationLogItem[] = snap.docs
          .map((d) => ({
            id: d.id,
            ...(d.data() as Omit<ModerationLogItem, 'id'>),
          }))
          .sort((a, b) => (b.createdAt?.toMillis?.() ?? 0) - (a.createdAt?.toMillis?.() ?? 0));
        setModerationLogs(list);
      },
      (err) => handleFirestoreError(err, OperationType.LIST, 'moderationLogs')
    );

    return () => {
      unsubUsers();
      unsubReports();
      unsubLogs();
    };
  }, [authReady, firebaseUser, isBootstrappedAdminUser]);

  // Derived Role Checks
  const isStaff = Boolean(
    userProfile && (userProfile.role === 'admin' || userProfile.role === 'moderator')
  );

  const favoriteResourceIds = useMemo(
    () => new Set(favorites.map((f) => f.resourceId)),
    [favorites]
  );

  // Category Counts for Sidebar
  const visiblePublicResources = useMemo(
    () => allResources.filter((r) => r.visibility === 'public'),
    [allResources]
  );

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const r of visiblePublicResources) {
      counts[r.category] = (counts[r.category] || 0) + 1;
    }
    return counts;
  }, [visiblePublicResources]);

  const myResourcesList = useMemo(
    () =>
      userProfile ? allResources.filter((r) => r.authorId === userProfile.uid) : [],
    [allResources, userProfile]
  );

  const favoriteResourcesList = useMemo(
    () => allResources.filter((r) => favoriteResourceIds.has(r.id)),
    [allResources, favoriteResourceIds]
  );

  // Filtered Resources for Current View
  const displayedResources = useMemo(() => {
    const baseList =
      activeView === 'favorites'
        ? favoriteResourcesList
        : activeView === 'my-resources'
        ? myResourcesList
        : isStaff
        ? allResources
        : visiblePublicResources;

    return baseList.filter((res) => {
      if (activeView === 'explore') {
        if (selectedCategory !== 'all' && res.category !== selectedCategory) return false;
        if (selectedLevel !== 'all' && res.level !== selectedLevel) return false;
        if (selectedMediaType !== 'all' && res.mediaType !== selectedMediaType) return false;
      }

      if (searchQuery.trim() !== '') {
        const q = searchQuery.trim().toLowerCase();
        const matchTitle = res.title.toLowerCase().includes(q);
        const matchDesc = res.description.toLowerCase().includes(q);
        const matchCategory = res.category.toLowerCase().includes(q);
        const matchAuthor = res.authorName.toLowerCase().includes(q);
        const matchTags = res.tags?.some((t) => t.toLowerCase().includes(q));
        if (!matchTitle && !matchDesc && !matchCategory && !matchAuthor && !matchTags) {
          return false;
        }
      }

      return true;
    });
  }, [
    activeView,
    favoriteResourcesList,
    myResourcesList,
    isStaff,
    allResources,
    visiblePublicResources,
    selectedCategory,
    selectedLevel,
    selectedMediaType,
    searchQuery,
  ]);

  // =========================================================================
  // Authentication Handlers
  // =========================================================================
  const handleEmailLogin = async (email: string, password: string) => {
    const cred = await signInWithEmailAndPassword(auth, email, password);
    if (cred.user.emailVerified) {
      pushToast('success', 'เข้าสู่ระบบสำเร็จ', `ยินดีต้อนรับกลับมา ${cred.user.displayName || cred.user.email}`);
    } else {
      pushToast(
        'info',
        'เข้าสู่ระบบสำเร็จ (รอยืนยันอีเมล)',
        'กรุณากดลิงก์ยืนยันในอีเมลของคุณเพื่อเปิดสิทธิ์การโพสต์สื่อการสอน'
      );
    }
  };

  const handleEmailRegister = async (
    displayName: string,
    email: string,
    password: string
  ) => {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(cred.user, { displayName });
    await sendEmailVerification(cred.user);
    pushToast(
      'success',
      'สมัครสมาชิกและส่งอีเมลยืนยันตัวตนแล้ว',
      `ระบบได้ส่งลิงก์ยืนยันไปยัง ${email} กรุณากดลิงก์ในอีเมลแล้วกดปุ่ม "ฉันยืนยันอีเมลแล้ว"`
    );
  };

  const handleGoogleLogin = async () => {
    const cred = await signInWithPopup(auth, googleProvider);
    pushToast(
      'success',
      'เข้าสู่ระบบด้วย Google สำเร็จ',
      `ยินดีต้อนรับ ${cred.user.displayName || cred.user.email}`
    );
  };

  const handlePasswordReset = async (email: string) => {
    await sendPasswordResetEmail(auth, email);
    pushToast(
      'info',
      'ส่งลิงก์ตั้งรหัสผ่านใหม่แล้ว',
      `กรุณาตรวจสอบกล่องจดหมายที่ ${email}`
    );
  };

  const handleResendVerification = async () => {
    if (!auth.currentUser) return;
    setVerificationLoading(true);
    try {
      await sendEmailVerification(auth.currentUser);
      pushToast(
        'success',
        'ส่งอีเมลยืนยันซ้ำเรียบร้อยแล้ว',
        'กรุณาตรวจสอบกล่องจดหมายและโฟลเดอร์ Spam ของคุณ'
      );
    } catch (err) {
      pushToast(
        'error',
        'ไม่สามารถส่งอีเมลยืนยันได้',
        err instanceof Error ? err.message : 'กรุณารอสักครู่แล้วลองใหม่อีกครั้ง'
      );
    } finally {
      setVerificationLoading(false);
    }
  };

  const handleRefreshVerification = async () => {
    if (!auth.currentUser) return;
    setVerificationLoading(true);
    try {
      await auth.currentUser.reload();
      await auth.currentUser.getIdToken(true);
      const refreshedUser = auth.currentUser;
      setFirebaseUser({ ...refreshedUser } as FirebaseUser);

      if (refreshedUser.emailVerified) {
        await ensureVerifiedUserDocument(refreshedUser, userProfile?.displayName);
        pushToast(
          'success',
          'ยืนยันอีเมลสำเร็จ!',
          'บัญชีของคุณพร้อมโพสต์สื่อการเรียนรู้และบันทึกรายการโปรดแล้ว'
        );
      } else {
        pushToast(
          'info',
          'ยังตรวจไม่พบการยืนยันอีเมล',
          'กรุณาคลิกลิงก์ที่อยู่ในอีเมลของคุณก่อน แล้วจึงกดปุ่มนี้อีกครั้ง'
        );
      }
    } catch (err) {
      pushToast(
        'error',
        'เกิดข้อผิดพลาดในการตรวจสอบสถานะ',
        err instanceof Error ? err.message : 'กรุณาลองใหม่อีกครั้ง'
      );
    } finally {
      setVerificationLoading(false);
    }
  };

  const handleSignOut = async () => {
    await signOut(auth);
    setActiveView('explore');
    pushToast('info', 'ออกจากระบบเรียบร้อยแล้ว', 'ขอบคุณที่ร่วมแบ่งปันความรู้ใน ThaiLearn Hub');
  };

  // =========================================================================
  // Firestore CRUD Handlers
  // =========================================================================
  const handleCreateOrUpdateResource = async (
    payload: ResourceFormPayload,
    existingId?: string
  ) => {
    if (!firebaseUser || !userProfile) {
      throw new Error('กรุณาเข้าสู่ระบบก่อนโพสต์สื่อการเรียนรู้');
    }
    if (!firebaseUser.emailVerified) {
      throw new Error('กรุณายืนยันอีเมลของคุณก่อนโพสต์สื่อการเรียนรู้');
    }
    if (userProfile.status === 'suspended') {
      throw new Error('บัญชีของคุณถูกระงับการใช้งานชั่วคราว');
    }

    if (existingId) {
      const path = `resources/${existingId}`;
      try {
        await updateDoc(doc(db, 'resources', existingId), {
          title: payload.title,
          description: payload.description,
          category: payload.category,
          level: payload.level,
          mediaType: payload.mediaType,
          resourceUrl: payload.resourceUrl,
          fileName: payload.fileName,
          fileSize: payload.fileSize,
          fileDataUrl: payload.fileDataUrl,
          tags: payload.tags,
          authorName: userProfile.displayName,
          updatedAt: serverTimestamp(),
        });
        pushToast('success', 'อัปเดตสื่อการเรียนรู้สำเร็จ', `บันทึกการแก้ไข "${payload.title}" แล้ว`);
      } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, path);
      }
    } else {
      const path = 'resources';
      try {
        await addDoc(collection(db, path), {
          title: payload.title,
          description: payload.description,
          category: payload.category,
          level: payload.level,
          mediaType: payload.mediaType,
          resourceUrl: payload.resourceUrl,
          fileName: payload.fileName,
          fileSize: payload.fileSize,
          fileDataUrl: payload.fileDataUrl,
          tags: payload.tags,
          authorId: userProfile.uid,
          authorName: userProfile.displayName,
          visibility: 'public',
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
        pushToast('success', 'เผยแพร่สื่อการเรียนรู้สำเร็จ', `"${payload.title}" ถูกเพิ่มเข้าสู่คลังความรู้แล้ว`);
      } catch (error) {
        handleFirestoreError(error, OperationType.CREATE, path);
      }
    }
  };

  const handleToggleFavorite = async (resource: ResourceItem) => {
    if (!firebaseUser || !userProfile) {
      setAuthModalMode('login');
      setAuthModalOpen(true);
      return;
    }
    if (!firebaseUser.emailVerified) {
      pushToast(
        'info',
        'กรุณายืนยันอีเมลก่อนบันทึกรายการโปรด',
        'กดลิงก์ในอีเมลของคุณแล้วคลิกปุ่ม "ฉันยืนยันอีเมลแล้ว"'
      );
      return;
    }

    const favId = `${userProfile.uid}_${resource.id}`;
    const path = `favorites/${favId}`;
    const alreadyFav = favoriteResourceIds.has(resource.id);

    setFavoriteBusyId(resource.id);
    try {
      if (alreadyFav) {
        await deleteDoc(doc(db, 'favorites', favId));
        pushToast('info', 'ลบออกจากรายการโปรดแล้ว', resource.title);
      } else {
        await setDoc(doc(db, 'favorites', favId), {
          userId: userProfile.uid,
          resourceId: resource.id,
          resourceTitle: resource.title.slice(0, 200),
          resourceCategory: resource.category.slice(0, 80),
          resourceMediaType: resource.mediaType,
          createdAt: serverTimestamp(),
        });
        pushToast('success', 'บันทึกในรายการโปรดแล้ว', resource.title);
      }
    } catch (error) {
      handleFirestoreError(
        error,
        alreadyFav ? OperationType.DELETE : OperationType.CREATE,
        path
      );
    } finally {
      setFavoriteBusyId(null);
    }
  };

  const handleConfirmDeleteResource = async () => {
    if (!deletingResource) return;
    const target = deletingResource;
    const path = `resources/${target.id}`;
    try {
      await deleteDoc(doc(db, 'resources', target.id));
      if (isStaff && userProfile && target.authorId !== userProfile.uid) {
        await writeModerationLog(
          'delete_resource',
          target.id,
          target.title,
          'ลบสื่อการเรียนรู้ออกจากคลังโดยผู้ดูแลระบบ'
        );
      }
      pushToast('success', 'ลบสื่อการเรียนรู้เรียบร้อยแล้ว', target.title);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  };

  const handleToggleResourceVisibility = async (resource: ResourceItem) => {
    const nextVisibility = resource.visibility === 'public' ? 'hidden' : 'public';
    const path = `resources/${resource.id}`;
    try {
      await updateDoc(doc(db, 'resources', resource.id), {
        visibility: nextVisibility,
        updatedAt: serverTimestamp(),
      });
      await writeModerationLog(
        nextVisibility === 'hidden' ? 'hide_resource' : 'restore_resource',
        resource.id,
        resource.title,
        nextVisibility === 'hidden'
          ? 'ซ่อนสื่อการเรียนรู้ชั่วคราวเพื่อตรวจสอบ'
          : 'เปิดแสดงสื่อเป็นสาธารณะอีกครั้ง'
      );
      pushToast(
        'success',
        nextVisibility === 'hidden' ? 'ซ่อนสื่อการเรียนรู้แล้ว' : 'เปิดแสดงสื่อสาธารณะแล้ว',
        resource.title
      );
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
    }
  };

  const handleSubmitReport = async (
    resource: ResourceItem,
    reason: ReportReason,
    details: string
  ) => {
    if (!firebaseUser || !userProfile) {
      throw new Error('กรุณาเข้าสู่ระบบก่อนส่งรายงาน');
    }
    if (!firebaseUser.emailVerified) {
      throw new Error('กรุณายืนยันอีเมลก่อนส่งรายงาน');
    }

    const path = 'reports';
    try {
      await addDoc(collection(db, path), {
        resourceId: resource.id,
        resourceTitle: resource.title.slice(0, 200),
        reporterId: userProfile.uid,
        reporterName: userProfile.displayName.slice(0, 100),
        reason,
        details: details.slice(0, 1000),
        status: 'pending',
        resolutionNote: '',
        resolvedBy: '',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      pushToast(
        'success',
        'ส่งรายงานให้ผู้ดูแลระบบเรียบร้อยแล้ว',
        'ขอบคุณที่ช่วยดูแลคุณภาพเนื้อหาในคลังความรู้'
      );
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, path);
    }
  };

  const handleResolveReport = async (
    report: ReportItem,
    nextStatus: 'resolved' | 'dismissed',
    resolutionNote: string
  ) => {
    if (!userProfile) return;
    const path = `reports/${report.id}`;
    try {
      await updateDoc(doc(db, 'reports', report.id), {
        status: nextStatus,
        resolutionNote: resolutionNote.slice(0, 1000),
        resolvedBy: userProfile.uid,
        updatedAt: serverTimestamp(),
      });
      await writeModerationLog(
        nextStatus === 'resolved' ? 'resolve_report' : 'dismiss_report',
        report.id,
        report.resourceTitle,
        resolutionNote
      );
      pushToast(
        'success',
        nextStatus === 'resolved' ? 'บันทึกการแก้ไขรายงานแล้ว' : 'ยกเลิกรายงานเรียบร้อยแล้ว',
        report.resourceTitle
      );
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
    }
  };

  const handleUpdateUserRoleAndStatus = async (
    targetUser: UserProfile,
    nextRole: UserRole,
    nextStatus: AccountStatus
  ) => {
    const path = `users/${targetUser.uid}`;
    try {
      await updateDoc(doc(db, 'users', targetUser.uid), {
        role: nextRole,
        status: nextStatus,
        updatedAt: serverTimestamp(),
      });

      const actionType: ModerationActionType =
        targetUser.status !== nextStatus
          ? nextStatus === 'suspended'
            ? 'suspend_user'
            : 'activate_user'
          : 'change_role';

      await writeModerationLog(
        actionType,
        targetUser.uid,
        targetUser.displayName,
        `ปรับสิทธิ์เป็น ${nextRole} / สถานะ ${nextStatus}`
      );

      pushToast(
        'success',
        'อัปเดตข้อมูลสมาชิกสำเร็จ',
        `${targetUser.displayName}: ${nextRole} (${nextStatus})`
      );
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
    }
  };

  const handleSaveSiteSettings = async (
    nextSettings: Omit<SiteSettings, 'updatedAt' | 'updatedBy'>
  ) => {
    if (!userProfile) return;
    const path = 'settings/site_config';
    try {
      await setDoc(doc(db, 'settings', 'site_config'), {
        ...nextSettings,
        updatedBy: userProfile.uid,
        updatedAt: serverTimestamp(),
      });
      await writeModerationLog(
        'update_settings',
        'site_config',
        nextSettings.siteName,
        `อัปเดตการตั้งค่าเว็บไซต์และหมวดหมู่ (${nextSettings.categories.length} หมวดหมู่)`
      );
      pushToast(
        'success',
        'บันทึกการตั้งค่าเว็บไซต์สำเร็จ',
        'ข้อมูลชื่อเว็บ คำประกาศ และหมวดหมู่ถูกอัปเดตแบบเรียลไทม์แล้ว'
      );
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  };

  const handleUpdateProfile = async (
    displayName: string,
    bio: string,
    photoURL: string
  ) => {
    if (!userProfile) return;
    const path = `users/${userProfile.uid}`;
    try {
      await updateDoc(doc(db, 'users', userProfile.uid), {
        displayName,
        bio,
        photoURL,
        updatedAt: serverTimestamp(),
      });
      if (auth.currentUser) {
        await updateProfile(auth.currentUser, { displayName, photoURL: photoURL || null });
      }
      pushToast('success', 'บันทึกโปรไฟล์เรียบร้อยแล้ว', displayName);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
    }
  };

  // Seed Sample Real Resources into Firestore when Database is Empty
  const handleSeedInitialResources = async () => {
    if (!firebaseUser || !userProfile || !firebaseUser.emailVerified) {
      setAuthModalMode('login');
      setAuthModalOpen(true);
      return;
    }

    setSeedingResources(true);
    const sampleItems: ResourceFormPayload[] = [
      {
        title: 'สรุปโครงสร้างข้อมูลและอัลกอริทึมด้วยภาษา Python สำหรับชั้นมัธยมปลาย',
        description:
          'เอกสารประกอบการเรียนการสอนเรื่องโครงสร้างข้อมูลพื้นฐาน ได้แก่ List, Stack, Queue, Tree และ Graph พร้อมตัวอย่างโค้ดภาษา Python และโจทย์ฝึกคิดเชิงคำนวณ (Computational Thinking) เหมาะสำหรับนักเรียน ม.4–ม.6 และผู้เตรียมสอบโอลิมปิกวิชาการ',
        category: 'คอมพิวเตอร์และเทคโนโลยี',
        level: 'มัธยมศึกษาตอนปลาย',
        mediaType: 'pdf',
        resourceUrl: 'https://docs.python.org/3/tutorial/datastructures.html',
        fileName: 'python_data_structures_guide.pdf',
        fileSize: 0,
        fileDataUrl: '',
        tags: ['Python', 'โครงสร้างข้อมูล', 'วิทยาการคำนวณ', 'อัลกอริทึม'],
      },
      {
        title: 'บทเรียนออนไลน์และโจทย์ประยุกต์แคลคูลัสเบื้องต้น (ลิมิตและอนุพันธ์)',
        description:
          'รวบรวมเนื้อหาความหมายของลิมิต ความต่อเนื่องของฟังก์ชัน อัตราการเปลี่ยนแปลง และกฎการหาอนุพันธ์ พร้อมตัวอย่างการประยุกต์ใช้หาค่าสูงสุด-ต่ำสุดสัมพัทธ์ในชีวิตจริง สำหรับนักเรียนชั้น ม.6 และนักศึกษาปี 1',
        category: 'คณิตศาสตร์',
        level: 'มัธยมศึกษาตอนปลาย',
        mediaType: 'website',
        resourceUrl: 'https://www.khanacademy.org/math/calculus-1',
        fileName: '',
        fileSize: 0,
        fileDataUrl: '',
        tags: ['แคลคูลัส', 'อนุพันธ์', 'คณิตศาสตร์ ม.6', 'A-Level'],
      },
      {
        title: 'สื่อวิดีโอการทดลองเคมีไฟฟ้าและเซลล์กัลวานิกพร้อมใบงานบันทึกผล',
        description:
          'สื่อการสอนวิชาเคมี เรื่องปฏิกิริยารีดอกซ์ การถ่ายโอนอิเล็กตรอน และการวัดค่าศักย์ไฟฟ้าของเซลล์กัลวานิก ช่วยให้นักเรียนเห็นภาพการเคลื่อนที่ของไอออนผ่านสะพานเกลือได้อย่างชัดเจน',
        category: 'วิทยาศาสตร์และดาราศาสตร์',
        level: 'มัธยมศึกษาตอนปลาย',
        mediaType: 'video',
        resourceUrl: 'https://phet.colorado.edu/',
        fileName: '',
        fileSize: 0,
        fileDataUrl: '',
        tags: ['เคมีไฟฟ้า', 'เซลล์กัลวานิก', 'การทดลองวิทยาศาสตร์'],
      },
      {
        title: 'คู่มือการเขียนเรียงความเชิงวิเคราะห์และการอ่านจับใจความสำคัญภาษาไทย',
        description:
          'แนวทางการวางโครงเรื่อง (คำนำ เนื้อเรื่อง สรุป) การใช้เหตุผลสนับสนุนข้อโต้แย้ง และการสังเคราะห์สาระสำคัญจากบทความวิชาการ สำหรับนักเรียนระดับมัธยมศึกษาตอนต้นและตอนปลาย',
        category: 'ภาษาไทยและวรรณคดี',
        level: 'มัธยมศึกษาตอนต้น',
        mediaType: 'document',
        resourceUrl: 'https://www.ipst.ac.th/',
        fileName: '',
        fileSize: 0,
        fileDataUrl: '',
        tags: ['การเขียนเรียงความ', 'การอ่านวิเคราะห์', 'ภาษาไทย'],
      },
    ];

    try {
      for (const item of sampleItems) {
        await addDoc(collection(db, 'resources'), {
          ...item,
          authorId: userProfile.uid,
          authorName: userProfile.displayName,
          visibility: 'public',
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }
      pushToast(
        'success',
        'สร้างสื่อการเรียนรู้เริ่มต้นสำเร็จ',
        'บันทึกสื่อตัวอย่างทั้ง 4 หมวดหมู่ลงใน Cloud Firestore จริงเรียบร้อยแล้ว'
      );
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'resources');
    } finally {
      setSeedingResources(false);
    }
  };

  const pendingReportsCount = useMemo(
    () => reports.filter((r) => r.status === 'pending').length,
    [reports]
  );

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      {/* Top Bar Navigation */}
      <Navbar
        siteSettings={siteSettings}
        activeView={activeView}
        onSelectView={setActiveView}
        userProfile={userProfile}
        authEmailVerified={Boolean(firebaseUser?.emailVerified)}
        isStaff={isStaff}
        favoritesCount={favorites.length}
        pendingReportsCount={pendingReportsCount}
        onOpenAuthModal={(mode) => {
          setAuthModalMode(mode);
          setAuthModalOpen(true);
        }}
        onOpenPostModal={() => {
          if (!firebaseUser) {
            setAuthModalMode('login');
            setAuthModalOpen(true);
            return;
          }
          if (!firebaseUser.emailVerified) {
            pushToast(
              'info',
              'กรุณายืนยันอีเมลก่อนแบ่งปันสื่อ',
              'คลิกลิงก์ในอีเมลของคุณแล้วกดปุ่ม "ฉันยืนยันอีเมลแล้ว" ด้านบน'
            );
            return;
          }
          setEditingResource(null);
          setPostModalOpen(true);
        }}
        onSignOut={handleSignOut}
      />

      {/* Contextual Breadcrumb, Site Announcement & Email Verification Bar */}
      <BreadcrumbBar
        activeView={activeView}
        selectedCategory={selectedCategory}
        selectedLevel={selectedLevel}
        searchQuery={searchQuery}
        siteSettings={siteSettings}
        userProfile={userProfile}
        authEmailVerified={Boolean(firebaseUser?.emailVerified)}
        isSignedIn={Boolean(firebaseUser)}
        onResetToHome={() => {
          setActiveView('explore');
          setSelectedCategory('all');
          setSelectedLevel('all');
          setSelectedMediaType('all');
          setSearchQuery('');
        }}
        onClearCategory={() => {
          setSelectedCategory('all');
          setSelectedLevel('all');
          setSelectedMediaType('all');
        }}
        onResendVerification={handleResendVerification}
        onRefreshVerification={handleRefreshVerification}
        verificationLoading={verificationLoading}
      />

      {/* Hero Banner with Prominent Search Bar (shown on Explore, Favorites, My Resources) */}
      {(activeView === 'explore' ||
        activeView === 'favorites' ||
        activeView === 'my-resources') && (
        <section className="bg-gradient-to-b from-blue-900 via-blue-800 to-sky-800 text-white border-b border-blue-950/20">
          <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
            <div className="max-w-3xl">
              <p className="text-xs sm:text-sm font-semibold text-sky-200 mb-2">
                คลังสื่อการเรียนการสอนและเอกสารวิชาการออนไลน์
              </p>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight leading-tight">
                {siteSettings.siteName} — แบ่งปันความรู้สำหรับนักเรียน นักศึกษา และครูไทย
              </h1>
              <p className="text-sm sm:text-base text-sky-100/90 mt-2.5 leading-relaxed">
                {siteSettings.siteDescription}
              </p>
            </div>

            {/* Large Search Bar */}
            <div className="mt-6 max-w-3xl">
              <div className="flex flex-col sm:flex-row gap-2.5 bg-white p-2 rounded-xl shadow-lg">
                <div className="relative flex-1 flex items-center">
                  <Search className="w-5 h-5 text-slate-400 ml-3 shrink-0" />
                  <input
                    type="search"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="ค้นหาชื่อเรื่อง หมวดหมู่ คำสำคัญ เช่น แคลคูลัส, Python, เคมีไฟฟ้า..."
                    className="w-full px-3 py-2.5 text-sm sm:text-base text-slate-900 placeholder:text-slate-400 focus:outline-none"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      className="p-1.5 text-slate-400 hover:text-slate-700 mr-1 cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => {
                    if (activeView !== 'explore') setActiveView('explore');
                  }}
                  className="px-6 py-2.5 text-sm font-semibold text-white bg-blue-700 hover:bg-blue-800 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                >
                  ค้นหาความรู้
                </button>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Main Content Container */}
      <main className="flex-1 max-w-[1440px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {activeView === 'admin' && userProfile && isStaff ? (
          <AdminDashboard
            currentUser={userProfile}
            resources={allResources}
            reports={reports}
            users={allUsers}
            moderationLogs={moderationLogs}
            siteSettings={siteSettings}
            onToggleResourceVisibility={handleToggleResourceVisibility}
            onRequestDeleteResource={(res) => setDeletingResource(res)}
            onSelectResource={(res) => setSelectedResource(res)}
            onResolveReport={handleResolveReport}
            onUpdateUserRoleAndStatus={handleUpdateUserRoleAndStatus}
            onSaveSiteSettings={handleSaveSiteSettings}
          />
        ) : activeView === 'profile' && userProfile ? (
          <ProfileView
            userProfile={userProfile}
            authEmailVerified={Boolean(firebaseUser?.emailVerified)}
            onUpdateProfile={handleUpdateProfile}
            onSendPasswordReset={handlePasswordReset}
            onResendVerification={handleResendVerification}
            onRefreshVerification={handleRefreshVerification}
          />
        ) : activeView === 'guide' ? (
          <GuideAndTestingView />
        ) : (
          /* Explore / Favorites / My Resources Layout with Sidebar */
          <div className="flex flex-col lg:flex-row items-start gap-6 sm:gap-8">
            <Sidebar
              categories={siteSettings.categories}
              categoryCounts={categoryCounts}
              totalPublicCount={visiblePublicResources.length}
              selectedCategory={selectedCategory}
              onSelectCategory={setSelectedCategory}
              selectedLevel={selectedLevel}
              onSelectLevel={setSelectedLevel}
              selectedMediaType={selectedMediaType}
              onSelectMediaType={setSelectedMediaType}
              onResetFilters={() => {
                setSelectedCategory('all');
                setSelectedLevel('all');
                setSelectedMediaType('all');
                setSearchQuery('');
              }}
              activeView={activeView}
              onSelectView={setActiveView}
              userProfile={userProfile}
              isStaff={isStaff}
              favoritesCount={favorites.length}
              myResourcesCount={myResourcesList.length}
              pendingReportsCount={pendingReportsCount}
            />

            {/* Primary Content Area */}
            <div className="flex-1 w-full min-w-0 space-y-5">
              {/* View Section Header */}
              <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h2 className="text-base sm:text-lg font-bold text-slate-900">
                    {activeView === 'explore' &&
                      (selectedCategory === 'all'
                        ? 'สื่อการเรียนรู้ทั้งหมดในคลังความรู้'
                        : `หมวดหมู่: ${selectedCategory}`)}
                    {activeView === 'favorites' && 'รายการโปรดที่ฉันบันทึกไว้'}
                    {activeView === 'my-resources' && 'สื่อการเรียนรู้ที่ฉันแบ่งปัน'}
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    พบสื่อการเรียนรู้ทั้งหมด{' '}
                    <span className="font-mono-tabular font-semibold text-blue-800">
                      {displayedResources.length}
                    </span>{' '}
                    รายการ
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  {(selectedCategory !== 'all' ||
                    selectedLevel !== 'all' ||
                    selectedMediaType !== 'all' ||
                    searchQuery.trim() !== '') && (
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedCategory('all');
                        setSelectedLevel('all');
                        setSelectedMediaType('all');
                        setSearchQuery('');
                      }}
                      className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>แสดงทั้งหมด</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => {
                      if (!firebaseUser) {
                        setAuthModalMode('login');
                        setAuthModalOpen(true);
                        return;
                      }
                      if (!firebaseUser.emailVerified) {
                        pushToast(
                          'info',
                          'กรุณายืนยันอีเมลก่อนโพสต์สื่อ',
                          'คลิกลิงก์ในอีเมลของคุณแล้วกดปุ่ม "ฉันยืนยันอีเมลแล้ว"'
                        );
                        return;
                      }
                      setEditingResource(null);
                      setPostModalOpen(true);
                    }}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs sm:text-sm font-semibold text-white bg-blue-700 hover:bg-blue-800 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>โพสต์สื่อการสอน</span>
                  </button>
                </div>
              </div>

              {/* Loading Skeleton State */}
              {resourcesLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[1, 2, 3, 4].map((n) => (
                    <div
                      key={n}
                      className="bg-white border border-slate-200 rounded-xl p-5 space-y-3 animate-pulse"
                    >
                      <div className="h-3.5 bg-slate-200 rounded w-1/3" />
                      <div className="h-5 bg-slate-200 rounded w-3/4" />
                      <div className="h-4 bg-slate-100 rounded w-full" />
                      <div className="h-4 bg-slate-100 rounded w-5/6" />
                      <div className="pt-3 border-t border-slate-100 flex justify-between">
                        <div className="h-3.5 bg-slate-200 rounded w-24" />
                        <div className="h-7 bg-slate-200 rounded w-20" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : displayedResources.length === 0 ? (
                /* Empty State */
                <div className="bg-white border border-slate-200 rounded-2xl p-8 sm:p-12 text-center max-w-xl mx-auto my-4">
                  <div className="w-12 h-12 rounded-2xl bg-sky-50 border border-sky-200 text-blue-700 flex items-center justify-center mx-auto mb-4">
                    {activeView === 'favorites' ? (
                      <FolderOpen className="w-6 h-6" />
                    ) : (
                      <BookOpen className="w-6 h-6" />
                    )}
                  </div>
                  <h3 className="text-base sm:text-lg font-bold text-slate-900">
                    {activeView === 'favorites'
                      ? 'ยังไม่มีสื่อการเรียนรู้ในรายการโปรดของคุณ'
                      : activeView === 'my-resources'
                      ? 'คุณยังไม่ได้แบ่งปันสื่อการเรียนรู้'
                      : 'ยังไม่มีสื่อการเรียนรู้ในหมวดหมู่หรือคำค้นหานี้'}
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-500 mt-1.5 leading-relaxed">
                    {activeView === 'favorites'
                      ? 'คุณสามารถกดปุ่ม "บันทึก" บนการ์ดสื่อการสอนที่สนใจเพื่อเก็บไว้อ่านภายหลังและซิงค์ข้ามอุปกรณ์'
                      : 'ร่วมเป็นส่วนหนึ่งในการสร้างสังคมแห่งการเรียนรู้ด้วยการแบ่งปันเอกสาร ใบงาน หรือวิดีโอการสอนชิ้นแรกของคุณ'}
                  </p>

                  <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                    {activeView === 'favorites' ? (
                      <button
                        type="button"
                        onClick={() => setActiveView('explore')}
                        className="inline-flex items-center gap-2 px-4 py-2 text-xs sm:text-sm font-semibold text-white bg-blue-700 hover:bg-blue-800 rounded-lg transition-colors cursor-pointer"
                      >
                        <BookOpen className="w-4 h-4" />
                        <span>ไปที่คลังความรู้ทั้งหมด</span>
                      </button>
                    ) : (
                      <>
                        <button
                          type="button"
                          onClick={() => {
                            if (!firebaseUser) {
                              setAuthModalMode('login');
                              setAuthModalOpen(true);
                              return;
                            }
                            setEditingResource(null);
                            setPostModalOpen(true);
                          }}
                          className="inline-flex items-center gap-2 px-4 py-2 text-xs sm:text-sm font-semibold text-white bg-blue-700 hover:bg-blue-800 rounded-lg transition-colors cursor-pointer"
                        >
                          <Plus className="w-4 h-4" />
                          <span>แบ่งปันสื่อการเรียนรู้ใหม่</span>
                        </button>

                        {allResources.length === 0 && (
                          <button
                            type="button"
                            disabled={seedingResources}
                            onClick={handleSeedInitialResources}
                            className="inline-flex items-center gap-2 px-4 py-2 text-xs sm:text-sm font-semibold text-blue-800 bg-sky-50 hover:bg-sky-100 border border-sky-200 rounded-lg transition-colors cursor-pointer"
                          >
                            {seedingResources ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Sparkles className="w-4 h-4" />
                            )}
                            <span>สร้างสื่อตัวอย่างเริ่มต้นลงฐานข้อมูลจริง (4 วิชา)</span>
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </div>
              ) : (
                /* Populated Resource Cards Grid */
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {displayedResources.map((res) => (
                    <ResourceCard
                      key={res.id}
                      resource={res}
                      isFavorited={favoriteResourceIds.has(res.id)}
                      favoriteBusy={favoriteBusyId === res.id}
                      userProfile={userProfile}
                      isStaff={isStaff}
                      onToggleFavorite={handleToggleFavorite}
                      onSelectResource={(r) => setSelectedResource(r)}
                      onEditResource={(r) => {
                        setEditingResource(r);
                        setPostModalOpen(true);
                      }}
                      onDeleteResource={(r) => setDeletingResource(r)}
                      onToggleVisibility={
                        isStaff ? handleToggleResourceVisibility : undefined
                      }
                      onReportResource={(r) => {
                        if (!firebaseUser) {
                          setAuthModalMode('login');
                          setAuthModalOpen(true);
                          return;
                        }
                        setReportingResource(r);
                      }}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Clean Minimal Footer */}
      <footer className="bg-white border-t border-slate-200 mt-12">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div>
            <span className="font-bold text-slate-800">{siteSettings.siteName}</span> —
            แพลตฟอร์มรวบรวมและแบ่งปันความรู้สำหรับนักเรียน นักศึกษา และครูผู้สอน
          </div>
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => setActiveView('explore')}
              className="hover:text-blue-700 transition-colors cursor-pointer"
            >
              คลังความรู้
            </button>
            <button
              type="button"
              onClick={() => setActiveView('guide')}
              className="hover:text-blue-700 transition-colors cursor-pointer"
            >
              คู่มือการตั้งค่า Firebase & การทดสอบระบบ
            </button>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <AuthModal
        isOpen={authModalOpen}
        initialMode={authModalMode}
        onClose={() => setAuthModalOpen(false)}
        onEmailLogin={handleEmailLogin}
        onEmailRegister={handleEmailRegister}
        onGoogleLogin={handleGoogleLogin}
        onPasswordReset={handlePasswordReset}
      />

      <ResourceFormModal
        isOpen={postModalOpen}
        editingResource={editingResource}
        categories={siteSettings.categories}
        userUid={userProfile?.uid || 'anonymous'}
        onClose={() => {
          setPostModalOpen(false);
          setEditingResource(null);
        }}
        onSubmit={handleCreateOrUpdateResource}
      />

      <ResourceDetailModal
        resource={selectedResource}
        onClose={() => setSelectedResource(null)}
        isFavorited={
          selectedResource ? favoriteResourceIds.has(selectedResource.id) : false
        }
        onToggleFavorite={handleToggleFavorite}
        userProfile={userProfile}
        isStaff={isStaff}
        onEditResource={(res) => {
          setEditingResource(res);
          setPostModalOpen(true);
        }}
        onDeleteResource={(res) => setDeletingResource(res)}
        onReportResource={(res) => {
          if (!firebaseUser) {
            setAuthModalMode('login');
            setAuthModalOpen(true);
            return;
          }
          setReportingResource(res);
        }}
      />

      <ReportModal
        resource={reportingResource}
        onClose={() => setReportingResource(null)}
        onSubmitReport={handleSubmitReport}
      />

      <ConfirmDialogModal
        isOpen={Boolean(deletingResource)}
        title="ยืนยันการลบสื่อการเรียนรู้"
        description={
          deletingResource
            ? `คุณต้องการลบสื่อ "${deletingResource.title}" ออกจากฐานข้อมูล Cloud Firestore อย่างถาวรใช่หรือไม่? การกระทำนี้ไม่สามารถเรียกคืนได้`
            : ''
        }
        confirmLabel="ยืนยันการลบสื่อถาวร"
        variant="danger"
        onClose={() => setDeletingResource(null)}
        onConfirm={handleConfirmDeleteResource}
      />

      {/* Toast Notifications Stack */}
      <div
        aria-live="polite"
        className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none px-4 sm:px-0"
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`pointer-events-auto p-4 rounded-xl border shadow-lg flex items-start justify-between gap-3 transition-all ${
              t.type === 'success'
                ? 'bg-white border-emerald-200 text-slate-900'
                : t.type === 'error'
                ? 'bg-white border-red-200 text-slate-900'
                : 'bg-white border-sky-200 text-slate-900'
            }`}
          >
            <div className="flex items-start gap-2.5">
              {t.type === 'success' && (
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              )}
              {t.type === 'error' && (
                <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
              )}
              {t.type === 'info' && (
                <Info className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
              )}
              <div>
                <p className="text-xs sm:text-sm font-bold">{t.title}</p>
                <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">{t.message}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => removeToast(t.id)}
              className="text-slate-400 hover:text-slate-700 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
