import request from 'supertest';
import mongoose from 'mongoose';
import app from '../index';
import { User } from '../models/User';
import * as aiService from '../services/aiService';
import { MongoMemoryServer } from 'mongodb-memory-server';
import fs from 'fs';
import path from 'path';

jest.mock('../services/aiService');

let mongoServer: MongoMemoryServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

beforeEach(async () => {
  await User.deleteMany({});
});

describe('AI Invoice Demand PDF Generation', () => {
  it('should generate an invoice demand PDF', async () => {
    const fakeAiJson = JSON.stringify({
      issueDate: '2024-01-01',
      dueDate: '2024-01-07',
      clientName: 'לקוח',
      items: [{ description: 'שירות', quantity: 1, unitPrice: 400, total: 400 }],
      total: 400,
      vat: 68,
      paymentDetails: {
        bankName: 'בנק לאומי',
        accountOwner: 'עלא בע"מ',
        branchNumber: '123',
        accountNumber: '4567890'
      }
    });
    (aiService.generateDocFromPrompt as jest.Mock).mockResolvedValue(fakeAiJson);

    const registerRes = await request(app)
      .post('/api/register')
      .send({
        email: 'max@test.com',
        password: '123456',
        companyName: 'מקס בע"מ'
      });
    expect(registerRes.status).toBe(201);
    const token = registerRes.body.token;

    const uploadRes = await request(app)
      .post('/api/uploads/logo')
      .set('Authorization', `Bearer ${token}`)
      .attach('logo', path.join(__dirname, 'fixtures', 'logo.png'));
    expect(uploadRes.status).toBe(201);
    expect(uploadRes.body).toHaveProperty('url');

    const user = await User.findOne({ email: 'max@test.com' }).lean();
    console.log('🕵️‍♀️ User at PDF time:', JSON.stringify(user, null, 2));

    const pdfRes = await request(app)
      .post('/api/ai/invoice-demand')
      .set('Authorization', `Bearer ${token}`)
      .buffer()
      .parse((res, cb) => {
        const data: Buffer[] = [];
        res.on('data', chunk => data.push(chunk));
        res.on('end', () => cb(null, Buffer.concat(data)));
      })
      .send({ prompt: 'הפק חשבונית ללקוח' });

    expect(pdfRes.status).toBe(200);
    expect(pdfRes.headers['content-type']).toContain('application/pdf');
    expect(Buffer.isBuffer(pdfRes.body)).toBe(true);
    expect(pdfRes.body.length).toBeGreaterThan(1000);

    const pdfPath = path.join(__dirname, 'output', 'invoice-demand.pdf');
    fs.mkdirSync(path.dirname(pdfPath), { recursive: true });
    fs.writeFileSync(pdfPath, pdfRes.body);

    const logosDir = path.join(process.cwd(), 'uploads', 'logos');
    if (fs.existsSync(logosDir)) {
      for (const file of fs.readdirSync(logosDir)) {
        fs.unlinkSync(path.join(logosDir, file));
      }
    }
  });
});
