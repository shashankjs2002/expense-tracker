const request = require('supertest');
const app = require('../app');
const User = require('../models/User');
const { generateAccessToken } = require('../utils/token');

describe('Expenses', () => {
    let accessToken;
    let userId;

    // Create a user and get an access token before each test
    beforeAll(async () => {
        const user = await User.create({
            email: 'expense@test.com',
            passwordHash: 'hashed', // will be updated via virtual
            name: 'Expense User',
        });
        // Set password properly to trigger hashing
        user.password = 'StrongPass1';
        await user.save();
        userId = user._id;
        accessToken = generateAccessToken(userId);
    });

    const authHeader = () => ({ Authorization: `Bearer ${accessToken}` });

    // ---------- IDEMPOTENCY ----------
    describe('Idempotency', () => {
        const expensePayload = {
            amount: '50.00',
            category: 'Food',
            description: 'Lunch',
            date: new Date().toISOString(),
        };
        const idempotencyKey = 'test-key-123';

        it('should create expense and return 201', async () => {
            const res = await request(app)
                .post('/api/expenses')
                .set('Idempotency-Key', idempotencyKey)
                .set(authHeader())
                .send(expensePayload);
            expect(res.status).toBe(201);
            expect(res.body.data.amountCents).toBe(5000);
        });

        it('should return the same expense on duplicate request (no duplicates)', async () => {
            const res = await request(app)
                .post('/api/expenses')
                .set('Idempotency-Key', idempotencyKey)
                .set(authHeader())
                .send({
                    ...expensePayload,
                    description: 'Changed description', // different body
                });
            expect(res.status).toBe(201);
            // Should return original expense, ignoring new body
            expect(res.body.data.description).toBe('Lunch');
            // Check only one expense exists
            const listRes = await request(app).get('/api/expenses').set(authHeader());
            expect(listRes.body.data.expenses.length).toBe(1);
        });

        it('should reject missing Idempotency-Key header', async () => {
            const res = await request(app)
                .post('/api/expenses')
                .set(authHeader())
                .send(expensePayload);
            expect(res.status).toBe(400);
        });

        it('different keys should create separate expenses', async () => {
            const res1 = await request(app)
                .post('/api/expenses')
                .set('Idempotency-Key', 'key-2')
                .set(authHeader())
                .send({ ...expensePayload, amount: '10.00' });
            expect(res1.status).toBe(201);
            const res2 = await request(app)
                .post('/api/expenses')
                .set('Idempotency-Key', 'key-3')
                .set(authHeader())
                .send({ ...expensePayload, amount: '20.00' });
            expect(res2.status).toBe(201);
            const list = await request(app).get('/api/expenses').set(authHeader());
            expect(list.body.data.expenses.length).toBe(3); // including the first one
        });
    });

    // ---------- MONEY HANDLING ----------
    describe('Money handling', () => {
        it('should accept valid decimal string and store as cents', async () => {
            const res = await request(app)
                .post('/api/expenses')
                .set('Idempotency-Key', 'money-1')
                .set(authHeader())
                .send({
                    amount: '12.50',
                    category: 'Transport',
                    date: new Date().toISOString(),
                });
            expect(res.body.data.amountCents).toBe(1250);
        });

        it('should reject negative amount', async () => {
            const res = await request(app)
                .post('/api/expenses')
                .set('Idempotency-Key', 'money-2')
                .set(authHeader())
                .send({ amount: '-5.00', category: 'Test', date: new Date().toISOString() });
            expect(res.status).toBe(422);
        });

        it('should reject zero amount', async () => {
            const res = await request(app)
                .post('/api/expenses')
                .set('Idempotency-Key', 'money-3')
                .set(authHeader())
                .send({ amount: '0.00', category: 'Test', date: new Date().toISOString() });
            expect(res.status).toBe(422);
        });

        it('should reject amount with more than 2 decimal places', async () => {
            const res = await request(app)
                .post('/api/expenses')
                .set('Idempotency-Key', 'money-4')
                .set(authHeader())
                .send({ amount: '12.345', category: 'Test', date: new Date().toISOString() });
            expect(res.status).toBe(422);
        });

        it('should reject amount with letters', async () => {
            const res = await request(app)
                .post('/api/expenses')
                .set('Idempotency-Key', 'money-5')
                .set(authHeader())
                .send({ amount: 'abc', category: 'Test', date: new Date().toISOString() });
            expect(res.status).toBe(422);
        });
    });

    // ---------- GET EXPENSES (filter & sort & total) ----------
    describe('GET /expenses', () => {
        beforeEach(async () => {
            // Seed expenses
            const userId = (await User.findOne({ email: 'expense@test.com' }))._id;
            await request(app)
                .post('/api/expenses')
                .set('Idempotency-Key', 'seed-1')
                .set(authHeader())
                .send({ amount: '10.00', category: 'Food', date: '2025-01-01T00:00:00Z' });
            await request(app)
                .post('/api/expenses')
                .set('Idempotency-Key', 'seed-2')
                .set(authHeader())
                .send({ amount: '20.00', category: 'Transport', date: '2025-01-02T00:00:00Z' });
            await request(app)
                .post('/api/expenses')
                .set('Idempotency-Key', 'seed-3')
                .set(authHeader())
                .send({ amount: '5.50', category: 'Food', date: '2025-01-03T00:00:00Z' });
        });

        it('should return all expenses for user sorted by date_desc (default)', async () => {
            const res = await request(app).get('/api/expenses').set(authHeader());
            expect(res.status).toBe(200);
            const dates = res.body.data.expenses.map(e => e.date);
            expect(dates[0]).toBe('2025-01-03T00:00:00.000Z');
            expect(dates[1]).toBe('2025-01-02T00:00:00.000Z');
            expect(dates[2]).toBe('2025-01-01T00:00:00.000Z');
        });

        it('should filter by category', async () => {
            const res = await request(app)
                .get('/api/expenses?category=Food')
                .set(authHeader());
            expect(res.body.data.expenses.length).toBe(2);
            res.body.data.expenses.forEach(e => expect(e.category).toBe('Food'));
        });

        it('should sort by date_asc', async () => {
            const res = await request(app)
                .get('/api/expenses?sort=date_asc')
                .set(authHeader());
            const dates = res.body.data.expenses.map(e => e.date);
            expect(dates[0]).toBe('2025-01-01T00:00:00.000Z');
        });

        it('should compute correct totalCents and formattedTotal', async () => {
            const res = await request(app).get('/api/expenses').set(authHeader());
            expect(res.body.data.totalCents).toBe(3550); // 1000+2000+550
            expect(res.body.data.formattedTotal).toBe('₹35.50');
        });

        it('should return empty list if no match', async () => {
            const res = await request(app)
                .get('/api/expenses?category=Unknown')
                .set(authHeader());
            expect(res.body.data.expenses.length).toBe(0);
            expect(res.body.data.totalCents).toBe(0);
        });
    });

    // ---------- AUTH REQUIREMENT ----------
    it('should reject unauthenticated requests', async () => {
        const res = await request(app).get('/api/expenses');
        expect(res.status).toBe(401);
    });
});