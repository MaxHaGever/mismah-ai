import ejs from 'ejs';
import path from 'path';
import fs from 'fs';

export async function renderPdf({
  docType,
  data,
  header = {},
  optional = {},
}: {
  docType: string;
  data: Record<string, any>;
  header?: Record<string, any>;
  optional?: Record<string, any>;
}): Promise<Buffer> {
  header.date ||= new Date().toISOString();
  const generationDate = new Date(header.date);
  const hebrewDateFormatter = new Intl.DateTimeFormat('he-IL', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  });

  const parseDateLike = (value: unknown): Date | null => {
    if (!value) return null;
    if (value instanceof Date && !Number.isNaN(value.getTime())) {
      return value;
    }
    if (typeof value !== 'string') return null;

    const isoMatch = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (isoMatch) {
      const [, year, month, day] = isoMatch;
      return new Date(Date.UTC(Number(year), Number(month) - 1, Number(day), 12, 0, 0));
    }

    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  };

  const formatHebrewDate = (value: unknown): string => {
    const parsed = parseDateLike(value) ?? generationDate;
    return hebrewDateFormatter.format(parsed);
  };

  const resolveReportDate = (value: unknown): string => {
    const parsed = parseDateLike(value);
    if (!parsed) return formatHebrewDate(generationDate);

    const diffDays = Math.abs(parsed.getTime() - generationDate.getTime()) / (1000 * 60 * 60 * 24);
    if (diffDays > 365) return formatHebrewDate(generationDate);

    return formatHebrewDate(parsed);
  };

  let viewsDir = path.resolve(process.cwd(), 'views');
  if (!fs.existsSync(viewsDir)) {
    viewsDir = path.resolve(process.cwd(), 'src', 'views');
  }

  const templateFile = fs.existsSync(path.join(viewsDir, `${docType}.ejs`))
    ? `${docType}.ejs`
    : 'default.ejs';
  const templatePath = path.join(viewsDir, templateFile);

  // Convert local image paths in data to base64 before rendering HTML
  const convertImagesToBase64 = (obj: any) => {
    if (typeof obj !== 'object' || obj === null) return;
    for (const key in obj) {
      if (typeof obj[key] === 'string' && /\.(png|jpg|jpeg|gif|svg)$/i.test(obj[key])) {
        const imgPath = path.isAbsolute(obj[key])
          ? obj[key]
          : path.join(process.cwd(), obj[key]);
        if (fs.existsSync(imgPath)) {
          const ext = path.extname(imgPath).slice(1);
          const mime = ext === 'svg' ? 'image/svg+xml' : `image/${ext}`;
          const base64 = fs.readFileSync(imgPath).toString('base64');
          obj[key] = `data:${mime};base64,${base64}`;
        }
      } else if (typeof obj[key] === 'object') {
        convertImagesToBase64(obj[key]);
      }
    }
  };
  convertImagesToBase64(data);

  const html = await ejs.renderFile(
    templatePath,
    {
      docType,
      data,
      header,
      optional,
      formatHebrewDate,
      resolveReportDate,
    },
    { async: true, views: [viewsDir] }
  );

  const debugPath = path.join(__dirname, '../tests/output/debug.html');
  fs.mkdirSync(path.dirname(debugPath), { recursive: true });
  fs.writeFileSync(debugPath, html, 'utf-8');

  const puppeteer = await import('puppeteer');
  const browser = await puppeteer.default.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });
  const page = await browser.newPage();

  await page.emulateMediaType('screen');

  await page.setContent(html, { waitUntil: 'networkidle0' });

  // Convert all image src to base64 data URLs
  await page.evaluate(async () => {
    const images = Array.from(document.images);
    await Promise.all(
      images.map(async (img) => {
        if (img.src && !img.src.startsWith('data:')) {
          try {
            const response = await fetch(img.src);
            const blob = await response.blob();
            const reader = new FileReader();
            const dataUrlPromise = new Promise<string>((resolve) => {
              reader.onloadend = () => resolve(reader.result as string);
            });
            reader.readAsDataURL(blob);
            const dataUrl = await dataUrlPromise;
            img.src = dataUrl;
          } catch (e) {
            // Ignore errors and leave the src as is
          }
        }
      })
    );
  });

  const pdf = await page.pdf({ format: 'A4', printBackground: true });
  await browser.close();

  return Buffer.from(pdf);
}
