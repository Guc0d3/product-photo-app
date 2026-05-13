import { initializeTestEnvironment, assertSucceeds, assertFails } from '@firebase/rules-unit-testing'
import { readFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  collection,
  addDoc,
} from 'firebase/firestore'

const __dirname = dirname(fileURLToPath(import.meta.url))
const RULES_PATH = resolve(__dirname, '..', 'firestore.rules')

let testEnv

// ── helpers ─────────────────────────────────────────────────────────────────

function authCtx(uid, tokenOverrides = {}) {
  return testEnv.authenticatedContext(uid, tokenOverrides)
}

function unauthCtx() {
  return testEnv.unauthenticatedContext()
}

async function seedUser(uid, role) {
  await testEnv.withSecurityRulesDisabled(async (ctx) => {
    const db = ctx.firestore()
    await setDoc(doc(db, 'users', uid), { role, email: `${uid}@test.com` })
  })
}

async function seedQueue(queueId, data) {
  await testEnv.withSecurityRulesDisabled(async (ctx) => {
    const db = ctx.firestore()
    await setDoc(doc(db, 'queues', queueId), data)
  })
}

async function seedMedia(queueId, mediaId, data) {
  await testEnv.withSecurityRulesDisabled(async (ctx) => {
    const db = ctx.firestore()
    await setDoc(doc(db, 'queues', queueId, 'media', mediaId), data)
  })
}

async function seedProduct(productId, data) {
  await testEnv.withSecurityRulesDisabled(async (ctx) => {
    const db = ctx.firestore()
    await setDoc(doc(db, 'products', productId), data)
  })
}

// ── setup ────────────────────────────────────────────────────────────────────

beforeAll(async () => {
  testEnv = await initializeTestEnvironment({
    projectId: 'product-photo-app-test',
    firestore: {
      rules: readFileSync(RULES_PATH, 'utf8'),
      host: 'localhost',
      port: 8080,
    },
  })
})

afterAll(async () => {
  await testEnv.cleanup()
})

afterEach(async () => {
  await testEnv.clearFirestore()
})

// ── /users ────────────────────────────────────────────────────────────────────

describe('/users collection', () => {
  describe('read', () => {
    test('user can read own doc', async () => {
      await seedUser('alice', 'staff')
      const db = authCtx('alice').firestore()
      await assertSucceeds(getDoc(doc(db, 'users', 'alice')))
    })

    test('admin can read any user doc', async () => {
      await seedUser('admin1', 'admin')
      await seedUser('alice', 'staff')
      const db = authCtx('admin1').firestore()
      await assertSucceeds(getDoc(doc(db, 'users', 'alice')))
    })

    test('staff cannot read another user doc', async () => {
      await seedUser('alice', 'staff')
      await seedUser('bob', 'staff')
      const db = authCtx('alice').firestore()
      await assertFails(getDoc(doc(db, 'users', 'bob')))
    })

    test('unauthenticated cannot read any user doc', async () => {
      await seedUser('alice', 'staff')
      const db = unauthCtx().firestore()
      await assertFails(getDoc(doc(db, 'users', 'alice')))
    })
  })

  describe('create', () => {
    test('user can create own doc with role=staff', async () => {
      const db = authCtx('alice').firestore()
      await assertSucceeds(
        setDoc(doc(db, 'users', 'alice'), { role: 'staff', email: 'alice@test.com' })
      )
    })

    test('user cannot create own doc with role=admin', async () => {
      const db = authCtx('alice').firestore()
      await assertFails(
        setDoc(doc(db, 'users', 'alice'), { role: 'admin', email: 'alice@test.com' })
      )
    })

    test('user cannot create another user doc', async () => {
      const db = authCtx('alice').firestore()
      await assertFails(
        setDoc(doc(db, 'users', 'bob'), { role: 'staff', email: 'bob@test.com' })
      )
    })
  })

  describe('update', () => {
    test('admin can update any user doc', async () => {
      await seedUser('admin1', 'admin')
      await seedUser('alice', 'staff')
      const db = authCtx('admin1').firestore()
      await assertSucceeds(updateDoc(doc(db, 'users', 'alice'), { role: 'qc' }))
    })

    test('staff cannot update any user doc', async () => {
      await seedUser('alice', 'staff')
      await seedUser('bob', 'staff')
      const db = authCtx('alice').firestore()
      await assertFails(updateDoc(doc(db, 'users', 'bob'), { role: 'admin' }))
    })

    test('staff cannot update own user doc', async () => {
      await seedUser('alice', 'staff')
      const db = authCtx('alice').firestore()
      await assertFails(updateDoc(doc(db, 'users', 'alice'), { role: 'admin' }))
    })
  })

  describe('delete', () => {
    test('nobody can delete a user doc (even admin)', async () => {
      await seedUser('admin1', 'admin')
      await seedUser('alice', 'staff')
      const db = authCtx('admin1').firestore()
      await assertFails(deleteDoc(doc(db, 'users', 'alice')))
    })
  })
})

// ── /queues ────────────────────────────────────────────────────────────────────

describe('/queues collection', () => {
  describe('read', () => {
    test('authenticated user can read queues', async () => {
      await seedUser('alice', 'staff')
      await seedQueue('q1', { status: 'open', name: 'Queue 1' })
      const db = authCtx('alice').firestore()
      await assertSucceeds(getDoc(doc(db, 'queues', 'q1')))
    })

    test('unauthenticated cannot read queues', async () => {
      await seedQueue('q1', { status: 'open', name: 'Queue 1' })
      const db = unauthCtx().firestore()
      await assertFails(getDoc(doc(db, 'queues', 'q1')))
    })
  })

  describe('create', () => {
    test('authenticated user can create a queue', async () => {
      await seedUser('alice', 'staff')
      const db = authCtx('alice').firestore()
      await assertSucceeds(
        setDoc(doc(db, 'queues', 'q-new'), { status: 'open', name: 'New Queue' })
      )
    })

    test('unauthenticated cannot create a queue', async () => {
      const db = unauthCtx().firestore()
      await assertFails(
        setDoc(doc(db, 'queues', 'q-new'), { status: 'open', name: 'New Queue' })
      )
    })
  })

  describe('update — status machine', () => {
    test('admin can update queue without changing status', async () => {
      await seedUser('admin1', 'admin')
      await seedQueue('q1', { status: 'open', name: 'Old Name' })
      const db = authCtx('admin1').firestore()
      await assertSucceeds(updateDoc(doc(db, 'queues', 'q1'), { name: 'New Name' }))
    })

    test('staff can update queue without changing status', async () => {
      await seedUser('alice', 'staff')
      await seedQueue('q1', { status: 'open', name: 'Old Name' })
      const db = authCtx('alice').firestore()
      await assertSucceeds(updateDoc(doc(db, 'queues', 'q1'), { name: 'New Name' }))
    })

    test('audit can trigger open → pending_close', async () => {
      await seedUser('auditor1', 'audit')
      await seedQueue('q1', { status: 'open' })
      const db = authCtx('auditor1').firestore()
      await assertSucceeds(
        updateDoc(doc(db, 'queues', 'q1'), {
          status: 'pending_close',
          firstApproval: { uid: 'auditor1' },
        })
      )
    })

    test('admin can trigger open → pending_close', async () => {
      await seedUser('admin1', 'admin')
      await seedQueue('q1', { status: 'open' })
      const db = authCtx('admin1').firestore()
      await assertSucceeds(
        updateDoc(doc(db, 'queues', 'q1'), {
          status: 'pending_close',
          firstApproval: { uid: 'admin1' },
        })
      )
    })

    test('staff cannot trigger open → pending_close', async () => {
      await seedUser('alice', 'staff')
      await seedQueue('q1', { status: 'open' })
      const db = authCtx('alice').firestore()
      await assertFails(
        updateDoc(doc(db, 'queues', 'q1'), {
          status: 'pending_close',
          firstApproval: { uid: 'alice' },
        })
      )
    })

    test('different audit/admin can trigger pending_close → closed', async () => {
      await seedUser('auditor1', 'audit')
      await seedUser('auditor2', 'audit')
      await seedQueue('q1', { status: 'pending_close', firstApproval: { uid: 'auditor1' } })
      const db = authCtx('auditor2').firestore()
      await assertSucceeds(updateDoc(doc(db, 'queues', 'q1'), { status: 'closed' }))
    })

    test('same person cannot do both approvals (pending_close → closed blocked)', async () => {
      await seedUser('auditor1', 'audit')
      await seedQueue('q1', { status: 'pending_close', firstApproval: { uid: 'auditor1' } })
      const db = authCtx('auditor1').firestore()
      await assertFails(updateDoc(doc(db, 'queues', 'q1'), { status: 'closed' }))
    })

    test('admin can reopen (closed → open)', async () => {
      await seedUser('admin1', 'admin')
      await seedQueue('q1', { status: 'closed', firstApproval: { uid: 'auditor1' } })
      const db = authCtx('admin1').firestore()
      await assertSucceeds(updateDoc(doc(db, 'queues', 'q1'), { status: 'open' }))
    })

    test('audit can reopen (closed → open)', async () => {
      await seedUser('auditor1', 'audit')
      await seedQueue('q1', { status: 'closed', firstApproval: { uid: 'auditor1' } })
      const db = authCtx('auditor1').firestore()
      await assertSucceeds(updateDoc(doc(db, 'queues', 'q1'), { status: 'open' }))
    })

    test('staff cannot reopen closed queue', async () => {
      await seedUser('alice', 'staff')
      await seedQueue('q1', { status: 'closed', firstApproval: { uid: 'auditor1' } })
      const db = authCtx('alice').firestore()
      await assertFails(updateDoc(doc(db, 'queues', 'q1'), { status: 'open' }))
    })

    test('any auth user can cancel (open → cancelled)', async () => {
      await seedUser('alice', 'staff')
      await seedQueue('q1', { status: 'open' })
      const db = authCtx('alice').firestore()
      await assertSucceeds(updateDoc(doc(db, 'queues', 'q1'), { status: 'cancelled' }))
    })

    test('cannot cancel from pending_close → cancelled', async () => {
      await seedUser('alice', 'staff')
      await seedQueue('q1', { status: 'pending_close', firstApproval: { uid: 'auditor1' } })
      const db = authCtx('alice').firestore()
      await assertFails(updateDoc(doc(db, 'queues', 'q1'), { status: 'cancelled' }))
    })
  })

  describe('delete', () => {
    test('admin can delete a queue', async () => {
      await seedUser('admin1', 'admin')
      await seedQueue('q1', { status: 'open' })
      const db = authCtx('admin1').firestore()
      await assertSucceeds(deleteDoc(doc(db, 'queues', 'q1')))
    })

    test('staff cannot delete a queue', async () => {
      await seedUser('alice', 'staff')
      await seedQueue('q1', { status: 'open' })
      const db = authCtx('alice').firestore()
      await assertFails(deleteDoc(doc(db, 'queues', 'q1')))
    })

    test('audit cannot delete a queue', async () => {
      await seedUser('auditor1', 'audit')
      await seedQueue('q1', { status: 'open' })
      const db = authCtx('auditor1').firestore()
      await assertFails(deleteDoc(doc(db, 'queues', 'q1')))
    })
  })
})

// ── /queues/{queueId}/media ──────────────────────────────────────────────────

describe('/queues/{queueId}/media subcollection', () => {
  // Helper: Firestore Timestamp-like object for today
  function todayTimestamp() {
    // Use Firestore server timestamp won't work in tests easily;
    // rules use ts.date() == request.time.date() — we seed with a JS Date
    // The emulator compares date() of the stored timestamp with request.time.date()
    return new Date()
  }

  function yesterdayTimestamp() {
    const d = new Date()
    d.setDate(d.getDate() - 1)
    return d
  }

  describe('read', () => {
    test('authenticated user can read media', async () => {
      await seedUser('alice', 'staff')
      await seedQueue('q1', { status: 'open' })
      await seedMedia('q1', 'm1', { takenBy: 'alice', takenAt: todayTimestamp() })
      const db = authCtx('alice').firestore()
      await assertSucceeds(getDoc(doc(db, 'queues', 'q1', 'media', 'm1')))
    })

    test('unauthenticated cannot read media', async () => {
      await seedQueue('q1', { status: 'open' })
      await seedMedia('q1', 'm1', { takenBy: 'alice', takenAt: todayTimestamp() })
      const db = unauthCtx().firestore()
      await assertFails(getDoc(doc(db, 'queues', 'q1', 'media', 'm1')))
    })
  })

  describe('create', () => {
    test('authenticated user can create media', async () => {
      await seedUser('alice', 'staff')
      await seedQueue('q1', { status: 'open' })
      const db = authCtx('alice').firestore()
      await assertSucceeds(
        setDoc(doc(db, 'queues', 'q1', 'media', 'm-new'), {
          takenBy: 'alice',
          takenAt: todayTimestamp(),
        })
      )
    })

    test('unauthenticated cannot create media', async () => {
      await seedQueue('q1', { status: 'open' })
      const db = unauthCtx().firestore()
      await assertFails(
        setDoc(doc(db, 'queues', 'q1', 'media', 'm-new'), {
          takenBy: 'alice',
          takenAt: todayTimestamp(),
        })
      )
    })
  })

  describe('update', () => {
    test('admin can update any media', async () => {
      await seedUser('admin1', 'admin')
      await seedQueue('q1', { status: 'open' })
      await seedMedia('q1', 'm1', { takenBy: 'alice', takenAt: yesterdayTimestamp() })
      const db = authCtx('admin1').firestore()
      await assertSucceeds(
        updateDoc(doc(db, 'queues', 'q1', 'media', 'm1'), { note: 'edited by admin' })
      )
    })

    test('audit can update any media (qcStatus)', async () => {
      await seedUser('auditor1', 'audit')
      await seedQueue('q1', { status: 'open' })
      await seedMedia('q1', 'm1', { takenBy: 'alice', takenAt: yesterdayTimestamp() })
      const db = authCtx('auditor1').firestore()
      await assertSucceeds(
        updateDoc(doc(db, 'queues', 'q1', 'media', 'm1'), { qcStatus: 'approved' })
      )
    })

    test('staff can update own media taken today', async () => {
      await seedUser('alice', 'staff')
      await seedQueue('q1', { status: 'open' })
      await seedMedia('q1', 'm1', { takenBy: 'alice', takenAt: todayTimestamp() })
      const db = authCtx('alice').firestore()
      await assertSucceeds(
        updateDoc(doc(db, 'queues', 'q1', 'media', 'm1'), { note: 'my update' })
      )
    })

    test('staff cannot update own media taken yesterday', async () => {
      await seedUser('alice', 'staff')
      await seedQueue('q1', { status: 'open' })
      await seedMedia('q1', 'm1', { takenBy: 'alice', takenAt: yesterdayTimestamp() })
      const db = authCtx('alice').firestore()
      await assertFails(
        updateDoc(doc(db, 'queues', 'q1', 'media', 'm1'), { note: 'stale update' })
      )
    })

    test('staff cannot update another user media', async () => {
      await seedUser('alice', 'staff')
      await seedQueue('q1', { status: 'open' })
      await seedMedia('q1', 'm1', { takenBy: 'bob', takenAt: todayTimestamp() })
      const db = authCtx('alice').firestore()
      await assertFails(
        updateDoc(doc(db, 'queues', 'q1', 'media', 'm1'), { note: 'sneaky' })
      )
    })
  })

  describe('delete', () => {
    test('admin can delete any media', async () => {
      await seedUser('admin1', 'admin')
      await seedQueue('q1', { status: 'open' })
      await seedMedia('q1', 'm1', { takenBy: 'alice', takenAt: yesterdayTimestamp() })
      const db = authCtx('admin1').firestore()
      await assertSucceeds(deleteDoc(doc(db, 'queues', 'q1', 'media', 'm1')))
    })

    test('staff can delete own media taken today', async () => {
      await seedUser('alice', 'staff')
      await seedQueue('q1', { status: 'open' })
      await seedMedia('q1', 'm1', { takenBy: 'alice', takenAt: todayTimestamp() })
      const db = authCtx('alice').firestore()
      await assertSucceeds(deleteDoc(doc(db, 'queues', 'q1', 'media', 'm1')))
    })

    test('staff cannot delete own media taken yesterday', async () => {
      await seedUser('alice', 'staff')
      await seedQueue('q1', { status: 'open' })
      await seedMedia('q1', 'm1', { takenBy: 'alice', takenAt: yesterdayTimestamp() })
      const db = authCtx('alice').firestore()
      await assertFails(deleteDoc(doc(db, 'queues', 'q1', 'media', 'm1')))
    })

    test('staff cannot delete another user media', async () => {
      await seedUser('alice', 'staff')
      await seedQueue('q1', { status: 'open' })
      await seedMedia('q1', 'm1', { takenBy: 'bob', takenAt: todayTimestamp() })
      const db = authCtx('alice').firestore()
      await assertFails(deleteDoc(doc(db, 'queues', 'q1', 'media', 'm1')))
    })
  })
})

// ── /products ─────────────────────────────────────────────────────────────────

describe('/products collection', () => {
  describe('read', () => {
    test('authenticated user can read products', async () => {
      await seedUser('alice', 'staff')
      await seedProduct('p1', { name: 'Widget', sku: 'W-001' })
      const db = authCtx('alice').firestore()
      await assertSucceeds(getDoc(doc(db, 'products', 'p1')))
    })

    test('unauthenticated cannot read products', async () => {
      await seedProduct('p1', { name: 'Widget', sku: 'W-001' })
      const db = unauthCtx().firestore()
      await assertFails(getDoc(doc(db, 'products', 'p1')))
    })
  })

  describe('write', () => {
    test('admin can create a product', async () => {
      await seedUser('admin1', 'admin')
      const db = authCtx('admin1').firestore()
      await assertSucceeds(
        setDoc(doc(db, 'products', 'p-new'), { name: 'Gadget', sku: 'G-001' })
      )
    })

    test('admin can update a product', async () => {
      await seedUser('admin1', 'admin')
      await seedProduct('p1', { name: 'Widget', sku: 'W-001' })
      const db = authCtx('admin1').firestore()
      await assertSucceeds(updateDoc(doc(db, 'products', 'p1'), { name: 'Widget v2' }))
    })

    test('admin can delete a product', async () => {
      await seedUser('admin1', 'admin')
      await seedProduct('p1', { name: 'Widget', sku: 'W-001' })
      const db = authCtx('admin1').firestore()
      await assertSucceeds(deleteDoc(doc(db, 'products', 'p1')))
    })

    test('staff cannot create a product', async () => {
      await seedUser('alice', 'staff')
      const db = authCtx('alice').firestore()
      await assertFails(
        setDoc(doc(db, 'products', 'p-new'), { name: 'Gadget', sku: 'G-001' })
      )
    })

    test('staff cannot update a product', async () => {
      await seedUser('alice', 'staff')
      await seedProduct('p1', { name: 'Widget', sku: 'W-001' })
      const db = authCtx('alice').firestore()
      await assertFails(updateDoc(doc(db, 'products', 'p1'), { name: 'Hacked' }))
    })

    test('staff cannot delete a product', async () => {
      await seedUser('alice', 'staff')
      await seedProduct('p1', { name: 'Widget', sku: 'W-001' })
      const db = authCtx('alice').firestore()
      await assertFails(deleteDoc(doc(db, 'products', 'p1')))
    })

    test('unauthenticated cannot write products', async () => {
      const db = unauthCtx().firestore()
      await assertFails(
        setDoc(doc(db, 'products', 'p-new'), { name: 'Gadget', sku: 'G-001' })
      )
    })
  })
})

// ── /counters ─────────────────────────────────────────────────────────────────

describe('/counters collection', () => {
  test('authenticated user can read counters', async () => {
    await seedUser('alice', 'staff')
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), 'counters', '2026-05-13'), { count: 5 })
    })
    const db = authCtx('alice').firestore()
    await assertSucceeds(getDoc(doc(db, 'counters', '2026-05-13')))
  })

  test('authenticated user can write counters', async () => {
    await seedUser('alice', 'staff')
    const db = authCtx('alice').firestore()
    await assertSucceeds(
      setDoc(doc(db, 'counters', '2026-05-13'), { count: 1 })
    )
  })

  test('authenticated user can update counters', async () => {
    await seedUser('alice', 'staff')
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), 'counters', '2026-05-13'), { count: 5 })
    })
    const db = authCtx('alice').firestore()
    await assertSucceeds(updateDoc(doc(db, 'counters', '2026-05-13'), { count: 6 }))
  })

  test('unauthenticated cannot read counters', async () => {
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), 'counters', '2026-05-13'), { count: 5 })
    })
    const db = unauthCtx().firestore()
    await assertFails(getDoc(doc(db, 'counters', '2026-05-13')))
  })

  test('unauthenticated cannot write counters', async () => {
    const db = unauthCtx().firestore()
    await assertFails(setDoc(doc(db, 'counters', '2026-05-13'), { count: 1 }))
  })
})
