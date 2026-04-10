import request from 'supertest';
import mongoose from 'mongoose';
import app from '../index';
import { User } from '../models/User';
import * as aiService from '../services/aiService';
import { MongoMemoryServer } from 'mongodb-memory-server';
import fs from 'fs';
import path from 'path';

jest.mock('../services/aiService');
jest.mock('../services/pdfService', () => ({
  renderPdf: jest.fn().mockResolvedValue(Buffer.from('%PDF-1.4 fake pdf output')),
}));

let mongoServer: MongoMemoryServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
  const imgsDir = path.join(process.cwd(), 'uploads', 'images');
    if (fs.existsSync(imgsDir)) {
      for (const file of fs.readdirSync(imgsDir)) {
        fs.unlinkSync(path.join(imgsDir, file));
      }
    }
});

beforeEach(async () => {
  await User.deleteMany({});
});

describe('AI Leak Detection PDF Generation', () => {
  it('should generate a leak detection report PDF', async () => {
    const fakeAiJson = JSON.stringify({
      reportDate: '2024-01-01',
      propertyAddress: 'רחוב הנביאים 1, ירושלים',
      clientName: 'דוד לוי',
      performedBy: 'חברת איתור נזילות בע"מ',
      licenseNumber: '12345',
      contactNumber: '050-1234567',
      testMethods: ['בדיקת הצפה', 'מצלמה תרמית'],
      leakLocations: [
        { location: 'אמבטיה בקומה הראשונה', description: 'דליפה בקרקעית האמבטיה' }
      ],
      recommendations: ['החלפת אטימה', 'בדיקת צנרת בבית השחי'],
      additionalNotes: 'אין הערות נוספות'
    });
    (aiService.generateDocFromPrompt as jest.Mock).mockResolvedValue(fakeAiJson);

    const registerRes = await request(app)
      .post('/api/register')
      .send({
        email: 'max@test.com',
        password: '123456',
        companyName: 'מקס בע"מ',
        companyAddress: 'רחוב המייסדים 10, תל אביב',
        companyPhone: '03-1234567',
        companyWebsite: 'https://max.co.il',
        companyId: '155334124'
      });
    expect(registerRes.status).toBe(201);
    const token = registerRes.body.token;

    await User.findOneAndUpdate(
      { email: 'max@test.com' },
      {
        hasChangedPassword: true,
        hasAcceptedTerms: true,
        companyName: 'מקס בע"מ',
        companyAddress: 'רחוב המייסדים 10, תל אביב',
        companyPhone: '03-1234567',
        companyWebsite: 'https://max.co.il',
        companyId: '155334124',
      }
    );

    const uploadRes = await request(app)
      .post('/api/uploads/logo')
      .set('Authorization', `Bearer ${token}`)
      .attach('logo', path.join(__dirname, 'fixtures', 'logo.png'));
    expect(uploadRes.status).toBe(201);
    expect(uploadRes.body).toHaveProperty('url');

    const descriptions = Array.from({ length: 5 }, (_, i) => `תיאור ${i + 1}`);
    let imgReq = request(app)
      .post('/api/uploads/images')
      .set('Authorization', `Bearer ${token}`)
      .field('descriptions', JSON.stringify(descriptions));
    for (let i = 0; i < 5; i++) {
      imgReq = imgReq.attach(
        'images',
        path.join(__dirname, 'fixtures', 'logo.png') 
      );
    }
    const imgRes = await imgReq;
    expect(imgRes.status).toBe(201);
    expect(Array.isArray(imgRes.body.images)).toBe(true);
    expect(imgRes.body.images).toHaveLength(5);
    const images = imgRes.body.images;

    const pdfRes = await request(app)
      .post('/api/ai/leak-detection')
      .set('Authorization', `Bearer ${token}`)
      .buffer()
      .parse((res, cb) => {
        const chunks: Buffer[] = [];
        res.on('data', chunk => chunks.push(chunk));
        res.on('end', () => cb(null, Buffer.concat(chunks)));
      })
      .send({ prompt: 'מצא נזילה במערכת הביתית', images });

    expect(pdfRes.status).toBe(200);
    expect(pdfRes.headers['content-type']).toBe('application/pdf');
    expect(Buffer.isBuffer(pdfRes.body)).toBe(true);
    expect(pdfRes.body.length).toBeGreaterThan(10);

    const pdfPath = path.join(__dirname, 'output', 'leak-detection.pdf');
    fs.mkdirSync(path.dirname(pdfPath), { recursive: true });
    fs.writeFileSync(pdfPath, pdfRes.body);
  });
});
