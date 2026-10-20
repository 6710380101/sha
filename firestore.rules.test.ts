/**
 * Firestore Security Rules Test Suite — Dirty Dozen Verification
 * Verifies that all 12 adversarial payloads defined in security_spec.md return PERMISSION_DENIED.
 */

export interface SecurityTestCase {
  id: number;
  name: string;
  collection: string;
  operation: 'get' | 'list' | 'create' | 'update' | 'delete';
  expectedResult: 'PERMISSION_DENIED';
}

export const DIRTY_DOZEN_TESTS: SecurityTestCase[] = [
  {
    id: 1,
    name: 'Privilege Escalation on Registration (self-assign admin role)',
    collection: 'users/attacker_uid',
    operation: 'create',
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 2,
    name: 'Shadow Field Injection on User Update (isSuperAdmin: true)',
    collection: 'users/user_1',
    operation: 'update',
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 3,
    name: 'Unverified Email Spoofing of Bootstrapped Admin',
    collection: 'users/admin_uid',
    operation: 'create',
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 4,
    name: 'Cross-User PII Leak (reading another user profile)',
    collection: 'users/user_b',
    operation: 'get',
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 5,
    name: 'Identity Spoofing on Resource Creation (mismatched authorId)',
    collection: 'resources/res_1',
    operation: 'create',
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 6,
    name: 'Orphaned Favorite Creation (non-existent resourceId)',
    collection: 'favorites/user_1_ghost_res',
    operation: 'create',
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 7,
    name: 'Unauthorized Favorite Scraping (list without userId filter)',
    collection: 'favorites',
    operation: 'list',
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 8,
    name: 'Terminal State Re-Opening on Resolved Report by Non-Admin',
    collection: 'reports/rep_1',
    operation: 'update',
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 9,
    name: 'Audit Log Tampering (updating or deleting moderationLogs)',
    collection: 'moderationLogs/log_1',
    operation: 'delete',
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 10,
    name: 'Unbounded Tag Array Exhaustion (>10 tags on resource)',
    collection: 'resources/res_2',
    operation: 'create',
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 11,
    name: 'Client Timestamp Forgery (backdated createdAt)',
    collection: 'resources/res_3',
    operation: 'create',
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 12,
    name: 'Unauthorized Site Settings Mutation by Regular Member',
    collection: 'settings/site_config',
    operation: 'update',
    expectedResult: 'PERMISSION_DENIED',
  },
];
