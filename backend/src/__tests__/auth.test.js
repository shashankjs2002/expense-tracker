const request = require('supertest');
const app = require('../app');
const User = require('../models/User');
const RefreshToken = require('../models/RefreshToken');
const { hashToken } = require('../utils/token');

describe('Authentication', () => {
    const userData = { email: 'test@example.com', password: 'StrongPass1', name: 'Test User' };

    // Helper to extract refresh token from Set-Cookie header
    const getRefreshCookie = (res) => {
        const cookies = res.headers['set-cookie'];
        return cookies?.[0]?.split(';')[0]?.split('=')[1];
    };

    // ---------- REGISTER ----------
    describe('POST /api/auth/register', () => {
        it('should register a new user and return user data + refresh cookie', async () => {
            const res = await request(app).post('/api/auth/register').send(userData);
            expect(res.status).toBe(201);
            expect(res.body.status).toBe('success');
            expect(res.body.data.user).toHaveProperty('id');
            expect(res.body.data.user.email).toBe(userData.email);
            expect(res.headers['set-cookie']).toBeDefined();
        });

        it('should reject duplicate email', async () => {
            await request(app).post('/api/auth/register').send(userData);
            const res = await request(app).post('/api/auth/register').send(userData);
            expect(res.status).toBe(409);
        });

        it('should reject missing fields', async () => {
            const res = await request(app).post('/api/auth/register').send({ email: 'a@b.com' });
            expect(res.status).toBe(422);
        });
    });

    // ---------- LOGIN ----------
    describe('POST /api/auth/login', () => {
        beforeEach(async () => {
            await request(app).post('/api/auth/register').send(userData);
        });

        it('should return access token and refresh cookie', async () => {
            const res = await request(app).post('/api/auth/login').send({
                email: userData.email,
                password: userData.password,
            });
            expect(res.status).toBe(200);
            expect(res.body.data.accessToken).toBeDefined();
            expect(res.headers['set-cookie']).toBeDefined();
        });

        it('should reject wrong password', async () => {
            const res = await request(app).post('/api/auth/login').send({
                email: userData.email,
                password: 'wrong',
            });
            expect(res.status).toBe(401);
        });
    });

    // ---------- REFRESH ----------
    describe('POST /api/auth/refresh', () => {
        let refreshToken;
        beforeEach(async () => {
            await request(app).post('/api/auth/register').send(userData);
            const loginRes = await request(app).post('/api/auth/login').send({
                email: userData.email,
                password: userData.password,
            });
            refreshToken = getRefreshCookie(loginRes);
        });

        it('should issue new access and rotate refresh token', async () => {
            const res = await request(app)
                .post('/api/auth/refresh')
                .set('Cookie', `refreshToken=${refreshToken}`);
            expect(res.status).toBe(200);
            expect(res.body.data.accessToken).toBeDefined();
            // New refresh token cookie
            expect(res.headers['set-cookie']).toBeDefined();
        });

        it('should reject missing refresh token', async () => {
            const res = await request(app).post('/api/auth/refresh');
            expect(res.status).toBe(401);
        });

        it('should detect token reuse (theft) and revoke family', async () => {
            // First refresh
            const res1 = await request(app)
                .post('/api/auth/refresh')
                .set('Cookie', `refreshToken=${refreshToken}`);
            const newToken = getRefreshCookie(res1);

            // Now reuse the OLD token (simulate theft)
            const res2 = await request(app)
                .post('/api/auth/refresh')
                .set('Cookie', `refreshToken=${refreshToken}`); // old token
            expect(res2.status).toBe(401);
            expect(res2.body.message).toMatch(/Suspicious|revoked/);

            // Even the new token should now be invalid because family is revoked
            const res3 = await request(app)
                .post('/api/auth/refresh')
                .set('Cookie', `refreshToken=${newToken}`);
            expect(res3.status).toBe(401);
        });
    });

    // ---------- LOGOUT ----------
    describe('POST /api/auth/logout', () => {
        let refreshToken;
        beforeEach(async () => {
            await request(app).post('/api/auth/register').send(userData);
            const loginRes = await request(app).post('/api/auth/login').send({
                email: userData.email,
                password: userData.password,
            });
            refreshToken = getRefreshCookie(loginRes);
        });

        it('should clear cookie and revoke token', async () => {
            const res = await request(app)
                .post('/api/auth/logout')
                .set('Cookie', `refreshToken=${refreshToken}`);
            expect(res.status).toBe(200);
            // Cookie should be cleared
            expect(res.headers['set-cookie']).toBeDefined();
            // Refresh with same token should fail
            const refreshRes = await request(app)
                .post('/api/auth/refresh')
                .set('Cookie', `refreshToken=${refreshToken}`);
            expect(refreshRes.status).toBe(401);
        });
    });
});