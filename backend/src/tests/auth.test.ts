import request from 'supertest';
import mongoose from 'mongoose';
import app from '../index';
import { User } from '../models/User';
import { MongoMemoryServer } from 'mongodb-memory-server';

let mongoServer: MongoMemoryServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri);
});

afterAll(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
  await mongoServer.stop();
});

describe('Authentication API', () => {
  it('should register a new user', async () => {
    const res = await request(app)
      .post('/api/register')
      .send({
        email: 'testuser@example.com',
        password: 'testpassword',
        companyName: 'Test Company',
      });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('token');
    expect(res.body.user).toMatchObject({
      email: 'testuser@example.com',
      isAdmin: true,
      hasChangedPassword: false,
      hasAcceptedTerms: false,
    });
  });
  it('should not register an existing user', async () => {
    const res = await request(app)
      .post('/api/register')
      .send({
        email: 'testuser@example.com',
        password: 'testpassword',
        companyName: 'Test Company',
      });

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error');
  });
    it('should login an existing user', async () => {
        const res = await request(app)
        .post('/api/login')
        .send({
            email: 'testuser@example.com',
            password: 'testpassword'
        });
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('token');
    });
    it('should preserve onboarding and admin flags in profile updates', async () => {
        const registerRes = await request(app)
        .post('/api/register')
        .send({
            email: 'profileupdate@example.com',
            password: 'testpassword'
        });
        const token = registerRes.body.token;

        await User.findOneAndUpdate(
          { email: 'profileupdate@example.com' },
          { hasChangedPassword: true, hasAcceptedTerms: true, isAdmin: true }
        );

        const res = await request(app)
        .patch('/api/update-profile')
        .set('Authorization', `Bearer ${token}`)
        .send({
          companyName: 'Updated Company',
          companyPhone: '050-0000000'
        });

        expect(res.status).toBe(200);
        expect(res.body.user).toMatchObject({
          companyName: 'Updated Company',
          companyPhone: '050-0000000',
          isAdmin: true,
          hasChangedPassword: true,
          hasAcceptedTerms: true,
        });
    });
    it('should not login with incorrect email', async () => {
        const res = await request(app)
        .post('/api/login')
        .send({
            email: 'wronguser@example.com',
            password: 'testpassword'
        });
        expect(res.status).toBe(400);
        expect(res.body).toHaveProperty('error');
    });
    it('should not login with incorrect password', async () => {
        const res = await request(app)
        .post('/api/login')
        .send({
            email: 'testuser@example.com',
            password: 'wrongpassword'
        });
        expect(res.status).toBe(400);
        expect(res.body).toHaveProperty('error');
    });
    it('should not update password with incorrect old password', async () => {
        let token:string;
        const user = await User.findOne({ email: 'testuser@example.com' });
        const res = await request(app)
        .post('/api/register')
        .send({
            email: 'updateTest@example.com',
            password: 'testpassword',
            companyName: 'Test Company',
        });
        token = res.body.token;
        const updateRes = await request(app)
        .patch('/api/update-password')
        .set('Authorization', `Bearer ${token}`)
        .send({
            oldPassword: 'wrongpassword',
            newPassword: 'newtestpassword'
        });
        expect(updateRes.status).toBe(400);
        expect(updateRes.body).toHaveProperty('error');
    });
    it('should not update password for non-authenticated user', async () => {
        const res = await request(app)
        .patch('/api/update-password')
        .send({
            oldPassword: 'testpassword',
            newPassword: 'newtestpassword'
        });
        expect(res.status).toBe(401);
        expect(res.body).toHaveProperty('error');
    });
});
