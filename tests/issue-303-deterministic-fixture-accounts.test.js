'use strict';

/**
 * Deterministic fixture accounts — issue #303 / #652
 *
 * Verifies that the factory produces stable, reproducible account objects
 * that can be used as named fixtures in test suites.
 *
 * The pattern here: define a small set of well-known named fixtures with fixed
 * seeds, then assert their field values are stable across runs.
 */

const {
  createSchool,
  createStudent,
  createPayment,
  createFeeStructure,
  createUser,
  resetCallIndex,
} = require('./factories');

// ── Named fixture accounts ────────────────────────────────────────────────────
// These are intentionally named constants that tests across the codebase can
// import directly for consistent, human-readable fixture data.

beforeEach(() => resetCallIndex());

// Fixed seeds chosen so that the generated values are stable forever.
const SEEDS = {
  primarySchool:    1001,
  primaryStudent:   1002,
  paidStudent:      1003,
  unpaidStudent:    1004,
  partialStudent:   1005,
  adminUser:        1006,
  staffUser:        1007,
  primaryFee:       1008,
  successPayment:   1009,
  pendingPayment:   1010,
};

describe('deterministic fixture accounts — school', () => {
  test('primarySchool fixture is reproducible', () => {
    resetCallIndex();
    const a = createSchool({}, SEEDS.primarySchool);
    resetCallIndex();
    const b = createSchool({}, SEEDS.primarySchool);
    expect(a.schoolId).toBe(b.schoolId);
    expect(a.name).toBe(b.name);
    expect(a.slug).toBe(b.slug);
  });

  test('primarySchool has valid structure', () => {
    resetCallIndex();
    const school = createSchool({}, SEEDS.primarySchool);
    expect(school.schoolId).toBeTruthy();
    expect(school.stellarAddress).toMatch(/^G[A-Z2-7]{55}$/);
    expect(school.network).toBe('testnet');
  });
});

describe('deterministic fixture accounts — student', () => {
  test('primaryStudent fixture is reproducible', () => {
    resetCallIndex();
    const a = createStudent({}, SEEDS.primaryStudent);
    resetCallIndex();
    const b = createStudent({}, SEEDS.primaryStudent);
    expect(a.studentId).toBe(b.studentId);
    expect(a.name).toBe(b.name);
  });

  test('paidStudent fixture has feePaid=true when overridden', () => {
    resetCallIndex();
    const s = createStudent({ feePaid: true, totalPaid: 300 }, SEEDS.paidStudent);
    expect(s.feePaid).toBe(true);
    expect(s.totalPaid).toBe(300);
  });

  test('unpaidStudent fixture has feePaid=false', () => {
    resetCallIndex();
    const s = createStudent({ feePaid: false, totalPaid: 0 }, SEEDS.unpaidStudent);
    expect(s.feePaid).toBe(false);
    expect(s.totalPaid).toBe(0);
  });

  test('partialStudent fixture has partial payment state', () => {
    resetCallIndex();
    const s = createStudent({ feePaid: false, totalPaid: 100 }, SEEDS.partialStudent);
    expect(s.feePaid).toBe(false);
    expect(s.totalPaid).toBeGreaterThan(0);
  });

  test('studentId does not exceed 28 characters', () => {
    resetCallIndex();
    const s = createStudent({}, SEEDS.primaryStudent);
    expect(s.studentId.length).toBeLessThanOrEqual(28);
  });

  test('parentEmail is not exposed in a plain object (PII awareness)', () => {
    resetCallIndex();
    const s = createStudent({}, SEEDS.primaryStudent);
    // The factory includes parentEmail by default (admin use only)
    // This test confirms the field is present so integration tests can assert it
    // is NOT returned by the public API endpoint (see studentPiiProtection.test.js)
    expect(s).toHaveProperty('parentEmail');
  });
});

describe('deterministic fixture accounts — user', () => {
  test('adminUser fixture is reproducible', () => {
    resetCallIndex();
    const a = createUser({ roles: ['owner'] }, SEEDS.adminUser);
    resetCallIndex();
    const b = createUser({ roles: ['owner'] }, SEEDS.adminUser);
    expect(a.email).toBe(b.email);
  });

  test('staffUser has staff role', () => {
    resetCallIndex();
    const u = createUser({ roles: ['staff'] }, SEEDS.staffUser);
    expect(u.roles).toContain('staff');
  });

  test('adminUser email is unique from staffUser email', () => {
    resetCallIndex();
    const admin = createUser({ roles: ['owner'] }, SEEDS.adminUser);
    resetCallIndex();
    const staff = createUser({ roles: ['staff'] }, SEEDS.staffUser);
    expect(admin.email).not.toBe(staff.email);
  });
});

describe('deterministic fixture accounts — payments', () => {
  test('successPayment fixture is reproducible', () => {
    resetCallIndex();
    const a = createPayment({ status: 'SUCCESS' }, SEEDS.successPayment);
    resetCallIndex();
    const b = createPayment({ status: 'SUCCESS' }, SEEDS.successPayment);
    expect(a.txHash).toBe(b.txHash);
    expect(a.amount).toBe(b.amount);
  });

  test('pendingPayment has PENDING status', () => {
    resetCallIndex();
    const p = createPayment({ status: 'PENDING' }, SEEDS.pendingPayment);
    expect(p.status).toBe('PENDING');
  });

  test('successPayment and pendingPayment have different txHashes', () => {
    resetCallIndex();
    const success = createPayment({ status: 'SUCCESS' }, SEEDS.successPayment);
    resetCallIndex();
    const pending = createPayment({ status: 'PENDING' }, SEEDS.pendingPayment);
    expect(success.txHash).not.toBe(pending.txHash);
  });
});

describe('deterministic fixture accounts — fee structure', () => {
  test('primaryFee fixture is reproducible', () => {
    resetCallIndex();
    const a = createFeeStructure({}, SEEDS.primaryFee);
    resetCallIndex();
    const b = createFeeStructure({}, SEEDS.primaryFee);
    expect(a.feeAmount).toBe(b.feeAmount);
    expect(a.className).toBe(b.className);
  });

  test('primaryFee is active by default', () => {
    resetCallIndex();
    const f = createFeeStructure({}, SEEDS.primaryFee);
    expect(f.isActive).toBe(true);
  });

  test('override can deactivate a fee structure', () => {
    resetCallIndex();
    const f = createFeeStructure({ isActive: false }, SEEDS.primaryFee);
    expect(f.isActive).toBe(false);
  });
});
