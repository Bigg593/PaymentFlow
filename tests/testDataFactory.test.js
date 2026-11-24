'use strict';

/**
 * Tests for the deterministic test data factory — issue #652
 *
 * Validates:
 *   - Every major domain model has a factory function
 *   - Default values are valid and consistent with model schema constraints
 *   - Factories support an overrides parameter for partial customisation
 *   - Deterministic: same seed → same output (seeded LCG)
 */

const {
  createSchool,
  createStudent,
  createPayment,
  createFeeStructure,
  createUser,
  resetCallIndex,
} = require('./factories');

// Reset the internal call counter before each test so each test gets a clean sequence
beforeEach(() => resetCallIndex());

// ── createSchool ──────────────────────────────────────────────────────────────

describe('createSchool', () => {
  test('returns an object with required school fields', () => {
    const school = createSchool();
    expect(typeof school.schoolId).toBe('string');
    expect(typeof school.name).toBe('string');
    expect(typeof school.slug).toBe('string');
    expect(typeof school.stellarAddress).toBe('string');
  });

  test('stellarAddress is a valid-format Stellar public key', () => {
    const school = createSchool();
    expect(school.stellarAddress).toMatch(/^G[A-Z2-7]{55}$/);
  });

  test('slug is lowercase and URL-safe', () => {
    const school = createSchool();
    expect(school.slug).toMatch(/^[a-z0-9-]+$/);
  });

  test('overrides are applied', () => {
    const school = createSchool({ name: 'Override School', network: 'mainnet' });
    expect(school.name).toBe('Override School');
    expect(school.network).toBe('mainnet');
  });

  test('non-overridden fields keep defaults', () => {
    const school = createSchool({ name: 'Override Only' });
    expect(school.network).toBe('testnet');
    expect(school.isActive).toBe(true);
  });

  test('deterministic: same seed produces same schoolId', () => {
    resetCallIndex();
    const a = createSchool({}, 42);
    resetCallIndex();
    const b = createSchool({}, 42);
    expect(a.schoolId).toBe(b.schoolId);
    expect(a.slug).toBe(b.slug);
  });
});

// ── createStudent ─────────────────────────────────────────────────────────────

describe('createStudent', () => {
  test('returns an object with required student fields', () => {
    const s = createStudent();
    expect(typeof s.schoolId).toBe('string');
    expect(typeof s.studentId).toBe('string');
    expect(typeof s.name).toBe('string');
    expect(typeof s.class).toBe('string');
    expect(typeof s.feeAmount).toBe('number');
  });

  test('studentId is 28 characters or fewer (Stellar memo limit)', () => {
    const s = createStudent();
    expect(s.studentId.length).toBeLessThanOrEqual(28);
  });

  test('studentId matches alphanumeric + hyphen/underscore pattern', () => {
    const s = createStudent();
    expect(s.studentId).toMatch(/^[a-zA-Z0-9_-]+$/);
  });

  test('feeAmount is a positive number', () => {
    const s = createStudent();
    expect(s.feeAmount).toBeGreaterThan(0);
  });

  test('feePaid defaults to false', () => {
    const s = createStudent();
    expect(s.feePaid).toBe(false);
  });

  test('totalPaid defaults to 0', () => {
    const s = createStudent();
    expect(s.totalPaid).toBe(0);
  });

  test('parentEmail is a valid email format', () => {
    const s = createStudent();
    expect(s.parentEmail).toMatch(/^[^@]+@[^@]+\.[^@]+$/);
  });

  test('overrides are applied', () => {
    const s = createStudent({ name: 'Alice Test', feePaid: true, totalPaid: 200 });
    expect(s.name).toBe('Alice Test');
    expect(s.feePaid).toBe(true);
    expect(s.totalPaid).toBe(200);
  });

  test('non-overridden fields keep defaults', () => {
    const s = createStudent({ name: 'Override Only' });
    expect(typeof s.studentId).toBe('string');
    expect(s.feePaid).toBe(false);
  });

  test('deterministic: same seed produces same student', () => {
    resetCallIndex();
    const a = createStudent({}, 42);
    resetCallIndex();
    const b = createStudent({}, 42);
    expect(a.studentId).toBe(b.studentId);
    expect(a.name).toBe(b.name);
    expect(a.feeAmount).toBe(b.feeAmount);
  });
});

// ── createPayment ─────────────────────────────────────────────────────────────

describe('createPayment', () => {
  test('returns an object with required payment fields', () => {
    const p = createPayment();
    expect(typeof p.schoolId).toBe('string');
    expect(typeof p.studentId).toBe('string');
    expect(typeof p.txHash).toBe('string');
    expect(typeof p.amount).toBe('number');
    expect(typeof p.status).toBe('string');
  });

  test('amount is positive', () => {
    const p = createPayment();
    expect(p.amount).toBeGreaterThan(0);
  });

  test('status is one of the valid values', () => {
    const p = createPayment();
    expect(['SUCCESS', 'PENDING', 'FAILED']).toContain(p.status);
  });

  test('txHash is a 64-char hex string', () => {
    const p = createPayment();
    expect(p.txHash).toMatch(/^[0-9a-f]{64}$/);
  });

  test('overrides are applied', () => {
    const p = createPayment({ status: 'SUCCESS', amount: 999 });
    expect(p.status).toBe('SUCCESS');
    expect(p.amount).toBe(999);
  });

  test('deterministic: same seed produces same txHash', () => {
    resetCallIndex();
    const a = createPayment({}, 7);
    resetCallIndex();
    const b = createPayment({}, 7);
    expect(a.txHash).toBe(b.txHash);
  });
});

// ── createFeeStructure ────────────────────────────────────────────────────────

describe('createFeeStructure', () => {
  test('returns an object with required fee structure fields', () => {
    const f = createFeeStructure();
    expect(typeof f.schoolId).toBe('string');
    expect(typeof f.className).toBe('string');
    expect(typeof f.feeAmount).toBe('number');
    expect(typeof f.academicYear).toBe('string');
  });

  test('feeAmount is non-negative', () => {
    const f = createFeeStructure();
    expect(f.feeAmount).toBeGreaterThanOrEqual(0);
  });

  test('isActive defaults to true', () => {
    const f = createFeeStructure();
    expect(f.isActive).toBe(true);
  });

  test('academicYear is a 4-digit year string', () => {
    const f = createFeeStructure();
    expect(f.academicYear).toMatch(/^\d{4}$/);
  });

  test('overrides are applied', () => {
    const f = createFeeStructure({ className: 'Form 3', feeAmount: 350 });
    expect(f.className).toBe('Form 3');
    expect(f.feeAmount).toBe(350);
  });

  test('deterministic: same seed produces same feeAmount', () => {
    resetCallIndex();
    const a = createFeeStructure({}, 100);
    resetCallIndex();
    const b = createFeeStructure({}, 100);
    expect(a.feeAmount).toBe(b.feeAmount);
    expect(a.className).toBe(b.className);
  });
});

// ── createUser ────────────────────────────────────────────────────────────────

describe('createUser', () => {
  test('returns an object with required user fields', () => {
    const u = createUser();
    expect(typeof u.email).toBe('string');
    expect(typeof u.passwordHash).toBe('string');
    expect(Array.isArray(u.roles)).toBe(true);
  });

  test('email is a valid format', () => {
    const u = createUser();
    expect(u.email).toMatch(/^[^@]+@[^@]+\.[^@]+$/);
  });

  test('roles contains at least one valid role', () => {
    const u = createUser();
    const validRoles = ['super_admin', 'owner', 'staff', 'read_only'];
    expect(u.roles.length).toBeGreaterThan(0);
    u.roles.forEach((r) => expect(validRoles).toContain(r));
  });

  test('isActive defaults to true', () => {
    const u = createUser();
    expect(u.isActive).toBe(true);
  });

  test('mfaEnabled defaults to false', () => {
    const u = createUser();
    expect(u.mfaEnabled).toBe(false);
  });

  test('overrides are applied', () => {
    const u = createUser({ email: 'custom@test.com', roles: ['super_admin'] });
    expect(u.email).toBe('custom@test.com');
    expect(u.roles).toEqual(['super_admin']);
  });

  test('deterministic: same seed produces same email', () => {
    resetCallIndex();
    const a = createUser({}, 55);
    resetCallIndex();
    const b = createUser({}, 55);
    expect(a.email).toBe(b.email);
  });
});

// ── Cross-factory determinism ─────────────────────────────────────────────────

describe('cross-factory determinism', () => {
  test('same global seed produces the same full set of factories', () => {
    resetCallIndex();
    const school  = createSchool({}, 1);
    const student = createStudent({}, 1);
    const payment = createPayment({}, 1);
    const fee     = createFeeStructure({}, 1);
    const user    = createUser({}, 1);

    resetCallIndex();
    const school2  = createSchool({}, 1);
    const student2 = createStudent({}, 1);
    const payment2 = createPayment({}, 1);
    const fee2     = createFeeStructure({}, 1);
    const user2    = createUser({}, 1);

    expect(school.schoolId).toBe(school2.schoolId);
    expect(student.studentId).toBe(student2.studentId);
    expect(payment.txHash).toBe(payment2.txHash);
    expect(fee.feeAmount).toBe(fee2.feeAmount);
    expect(user.email).toBe(user2.email);
  });

  test('different seeds produce different values', () => {
    resetCallIndex();
    const a = createStudent({}, 1);
    resetCallIndex();
    const b = createStudent({}, 2);
    // With different seeds, at least one generated field should differ
    const different = a.studentId !== b.studentId || a.name !== b.name || a.feeAmount !== b.feeAmount;
    expect(different).toBe(true);
  });
});
