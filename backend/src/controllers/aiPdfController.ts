import { Request, Response } from 'express';
import { generateDocFromPrompt } from '../services/aiService';
import { renderPdf } from '../services/pdfService';
import { AuthenticateRequest } from '../middleware/authMiddleware';
import { User } from '../models/User';
import { systemPrompts } from '../utils/systemPrompt';
import { fileToDataUrl } from '../utils/fileToDataUrl';
import { ReportLog } from '../models/reportLog'; 
import { buildLeakDetectionPrompt } from '../utils/leakPromptGuidance';
import path from 'path';
import fs from 'fs';

function parseAiJsonResponse(aiRaw: string) {
  const trimmed = aiRaw.trim();
  const withoutFences = trimmed
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/, '')
    .trim();
  const firstBrace = withoutFences.indexOf('{');
  const lastBrace = withoutFences.lastIndexOf('}');

  const jsonCandidate =
    firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace
      ? withoutFences.slice(firstBrace, lastBrace + 1)
      : withoutFences;

  return JSON.parse(jsonCandidate);
}

function getMonthlyUsageWindow() {
  const now = new Date();
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1, 0, 0, 0));
  const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1, 0, 0, 0));
  return { start, end };
}

async function enforceMonthlyDocumentLimit(userId: string) {
  const user = await User.findById(userId).select('monthlyDocumentLimit');
  if (!user) {
    const error = new Error('User not found');
    (error as Error & { statusCode?: number }).statusCode = 404;
    throw error;
  }

  const { start, end } = getMonthlyUsageWindow();
  const count = await ReportLog.countDocuments({
    user: userId,
    createdAt: { $gte: start, $lt: end },
  });

  const limit = user.monthlyDocumentLimit ?? 5;

  if (count >= limit) {
    const error = new Error('Monthly document quota reached');
    (error as Error & { statusCode?: number }).statusCode = 403;
    throw error;
  }
}

async function safeFileToDataUrl(filePath: string): Promise<string> {
  try {
    return fileToDataUrl(filePath);
  } catch (err) {
    console.warn(`Missing file at ${filePath}, skipping data URL.`);
    return '';
  }
}

async function loadUserForBusinessDocument(userId: string) {
  return User.findById(userId).select(
    'companyName companyLogo companyAddress companyPhone companyEmail companyWebsite companyPhone2 companyId'
  );
}

async function buildBusinessDocumentData(user: any, aiData: Record<string, any>) {
  let logoSrc = user.companyLogo || '';
  if (logoSrc.startsWith('/uploads/')) {
    logoSrc = await safeFileToDataUrl(logoSrc);
  }

  return {
    data: {
      ...aiData,
      companyName: user.companyName || '',
      companyLogo: user.companyLogo || '',
      companyAddress: user.companyAddress || '',
      companyPhone: user.companyPhone || '',
      companyEmail: user.companyEmail || '',
      companyWebsite: user.companyWebsite || '',
      companyPhone2: user.companyPhone2 || '',
      companyId: user.companyId || '',
    },
    logoSrc,
  };
}

async function makeGenericBusinessPdfUsingAi({
  req,
  res,
  reportType,
  promptKey,
  filenamePrefix,
}: {
  req: Request;
  res: Response;
  reportType: 'price-quote' | 'service-visit';
  promptKey: 'priceQuote' | 'serviceVisit';
  filenamePrefix: string;
}) {
  try {
    const userId = (req as AuthenticateRequest).userId;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const user = await loadUserForBusinessDocument(userId);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const { prompt } = req.body;
    const incomingImages = req.body.images;
    if (!prompt) return res.status(400).json({ error: 'Missing prompt' });
    await enforceMonthlyDocumentLimit(userId);

    const images: { url: string; description: string }[] =
      Array.isArray(incomingImages) ? incomingImages : [];
    const imageGuidance = images.length
      ? `\n\nתמונות שצורפו למסמך:\n${images
          .map((img, index) => `${index + 1}. ${img.description || 'ללא תיאור'}`)
          .join('\n')}`
      : '';

    const aiRaw = await generateDocFromPrompt(`${prompt}${imageGuidance}`, systemPrompts[promptKey]);
    const aiResponse = parseAiJsonResponse(aiRaw);
    const aiData: Record<string, any> = aiResponse.data ?? aiResponse;
    const { data, logoSrc } = await buildBusinessDocumentData(user, aiData);

    const optional: Record<string, any> = {};
    if (images.length) {
      optional.images = [];
      for (const img of images) {
        let imgSrc = img.url;
        if (imgSrc.startsWith('/uploads/')) {
          imgSrc = await safeFileToDataUrl(imgSrc);
        }
        optional.images.push({ url: imgSrc, description: img.description || '' });
      }
    }

    const pdfBuffer = await renderPdf({
      docType: reportType === 'price-quote' ? 'priceQuote' : 'serviceVisit',
      data,
      header: { logoUrl: logoSrc },
      optional,
    });

    const filename = `${filenamePrefix}-${Date.now()}.pdf`;
    const filepath = path.join(process.cwd(), 'uploads', filename);
    fs.writeFileSync(filepath, pdfBuffer);

    await ReportLog.create({
      user: userId,
      type: reportType,
      prompt,
      images,
      pdfUrl: `/uploads/${filename}`,
    });

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename=${filename}`,
    });
    res.send(pdfBuffer);
  } catch (error) {
    console.error(`Error generating ${reportType} PDF:`, error);
    res.status((error as Error & { statusCode?: number }).statusCode || 500).json({
      error:
        (error as Error).message === 'Monthly document quota reached'
          ? 'הגעת למכסת המסמכים החודשית לחשבון זה'
          : 'Failed to generate PDF',
    });
  }
}

export const makePriceQuotePdfUsingAi = async (req: Request, res: Response) =>
  makeGenericBusinessPdfUsingAi({
    req,
    res,
    reportType: 'price-quote',
    promptKey: 'priceQuote',
    filenamePrefix: 'price-quote',
  });

export const makeServiceVisitPdfUsingAi = async (req: Request, res: Response) =>
  makeGenericBusinessPdfUsingAi({
    req,
    res,
    reportType: 'service-visit',
    promptKey: 'serviceVisit',
    filenamePrefix: 'service-visit',
  });

export const makeInvoiceDemandPdfUsingAi = async (
  req: Request,
  res: Response
) => {
  try {
    const userId = (req as AuthenticateRequest).userId;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const user = await User.findById(userId).select(
      'companyName companyLogo companyAddress companyPhone companyEmail companyWebsite companyPhone2 companyId invoiceCounter'
    );
    if (!user) return res.status(404).json({ error: 'User not found' });

    const { prompt } = req.body;
    if (!prompt) return res.status(400).json({ error: 'Missing prompt' });
    await enforceMonthlyDocumentLimit(userId);

    const aiRaw = await generateDocFromPrompt(
      prompt,
      systemPrompts.invoiceDemand
    );
    const aiResponse = parseAiJsonResponse(aiRaw);
    const aiData: Record<string, any> = aiResponse.data ?? aiResponse;

    const data = {
      invoiceNumber: user.invoiceCounter || 1,
      companyName: user.companyName || '',
      companyLogo: user.companyLogo || '',
      companyAddress: user.companyAddress || '',
      companyPhone: user.companyPhone || '',
      companyEmail: user.companyEmail || '',
      companyWebsite: user.companyWebsite || '',
      companyPhone2: user.companyPhone2 || '',
      companyId: user.companyId || '',
      ...aiData,
    };

    let logoSrc = user.companyLogo || '';
    if (logoSrc.startsWith('/uploads/')) {
      logoSrc = await safeFileToDataUrl(logoSrc);
    }

    const pdfBuffer = await renderPdf({
      docType: 'invoiceDemand',
      data,
      header: { logoUrl: logoSrc },
      optional: {},
    });

    // Increment invoice counter
    user.invoiceCounter = (user.invoiceCounter || 1) + 1;
    await user.save();

    const filename = `invoice-demand-${Date.now()}.pdf`;
    const filepath = path.join(process.cwd(), 'uploads', filename);
    fs.writeFileSync(filepath, pdfBuffer);

    await ReportLog.create({
      user: userId,
      type: 'invoice-demand',
      prompt,
      images: [],
      pdfUrl: `/uploads/${filename}`,
    });

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename=${filename}`,
    });
    res.send(pdfBuffer);
  } catch (error) {
    console.error('Error generating invoice demand PDF:', error);
    res.status((error as Error & { statusCode?: number }).statusCode || 500).json({
      error:
        (error as Error).message === 'Monthly document quota reached'
          ? 'הגעת למכסת המסמכים החודשית לחשבון זה'
          : 'Failed to generate invoice demand PDF',
    });
  }
};

// Generate a Leak Detection PDF using AI
export const makeLeakDetectionPdfUsingAi = async (
  req: Request,
  res: Response
) => {
  try {
    const userId = (req as AuthenticateRequest).userId;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const user = await User.findById(userId).select(
      'companyName companyLogo companyAddress companyPhone companyEmail companyWebsite companyPhone2 companyId'
    );
    if (!user) return res.status(404).json({ error: 'User not found' });

    const { prompt, images: incomingImages } = req.body;
    if (!prompt) return res.status(400).json({ error: 'Missing prompt' });
    await enforceMonthlyDocumentLimit(userId);

    const images: { url: string; description: string }[] =
      Array.isArray(incomingImages) ? incomingImages : [];
    const guidedPrompt = buildLeakDetectionPrompt(prompt, images);

    const aiRaw = await generateDocFromPrompt(
      guidedPrompt,
      systemPrompts.leakDetection
    );
    const aiResponse = parseAiJsonResponse(aiRaw);
    const aiData: Record<string, any> = aiResponse.data ?? aiResponse;

    const data = {
      ...aiData,
      companyName: user.companyName || '',
      companyLogo: user.companyLogo || '',
      companyAddress: user.companyAddress || '',
      companyPhone: user.companyPhone || '',
      companyEmail: user.companyEmail || '',
      companyWebsite: user.companyWebsite || '',
      companyPhone2: user.companyPhone2 || '',
      companyId: user.companyId || '',
    };

    let logoSrc = user.companyLogo || '';
    if (logoSrc.startsWith('/uploads/')) {
      logoSrc = await safeFileToDataUrl(logoSrc);
    }

    const optional: Record<string, any> = {};

    if (images.length) {
      optional.images = [];
      for (const img of images) {
        let imgSrc = img.url;
        if (imgSrc.startsWith('/uploads/')) {
          imgSrc = await safeFileToDataUrl(imgSrc);
        }
        optional.images.push({ url: imgSrc, description: img.description || '' });
      }
    }

    const pdfBuffer = await renderPdf({
      docType: 'leakDetection',
      data,
      header: { logoUrl: logoSrc },
      optional,
    });

    // Persist PDF and log report
    const filename = `leak-${Date.now()}.pdf`;
    const filepath = path.join(process.cwd(), 'uploads', filename);
    fs.writeFileSync(filepath, pdfBuffer);

    await ReportLog.create({
      user: userId,
      type: 'leak-detection',
      prompt,
      images,
      pdfUrl: `/uploads/${filename}`,
    });

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename=${filename}`,
    });
    res.send(pdfBuffer);
  } catch (error) {
    console.error('Error generating leak detection PDF:', error);
    res.status((error as Error & { statusCode?: number }).statusCode || 500).json({
      error:
        (error as Error).message === 'Monthly document quota reached'
          ? 'הגעת למכסת המסמכים החודשית לחשבון זה'
          : 'Failed to generate leak detection PDF',
    });
  }
};
