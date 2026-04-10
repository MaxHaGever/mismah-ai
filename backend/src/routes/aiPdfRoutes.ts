import express from 'express';
import {
  makeInvoiceDemandPdfUsingAi,
  makeLeakDetectionPdfUsingAi,
  makePriceQuotePdfUsingAi,
  makeServiceVisitPdfUsingAi,
} from '../controllers/aiPdfController';
import { protect } from '../middleware/authMiddleware';
import { upload } from '../controllers/uploadController';
import { requireOnboarding } from '../middleware/requireOnboarding';


const router = express.Router();

router.post('/ai/invoice-demand', protect, requireOnboarding, makeInvoiceDemandPdfUsingAi);
router.post('/ai/leak-detection', protect, requireOnboarding, makeLeakDetectionPdfUsingAi);
router.post('/ai/price-quote', protect, requireOnboarding, makePriceQuotePdfUsingAi);
router.post('/ai/service-visit', protect, requireOnboarding, makeServiceVisitPdfUsingAi);

export default router;
