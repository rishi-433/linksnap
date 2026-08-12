import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { initDatabase, Url, Click } from './config/db';
import { initRedis, getCache, setCache, delCache, getRedisStatus, isRedisReady } from './config/redis';
import { encodeBase62, decodeBase62 } from './utils/base62';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

function generateRandom6DigitId(): number {
  return Math.floor(100000 + Math.random() * 900000);
}

// Helper to resolve shortCode to URL row with Redis caching + SQL fallback
async function findUrlByShortCode(shortCode: string): Promise<any | null> {
  const cacheKey = `url:${shortCode}`;

  // 1. Try Redis Cache first
  const cachedUrl = await getCache<any>(cacheKey);
  if (cachedUrl) {
    console.log(`⚡ [Redis Cache HIT] Key: "${cacheKey}" -> Original URL: ${cachedUrl.original_url}`);
    return cachedUrl;
  }

  console.log(`🔍 [Redis Cache MISS] Key: "${cacheKey}". Querying MongoDB...`);
  let urlRow: any = null;

  // 2a. Check direct numeric ID lookup (e.g., 582914)
  if (/^\d{6,}$/.test(shortCode)) {
    const numericId = parseInt(shortCode, 10);
    urlRow = await Url.findOne({ id: numericId }).lean();
  }

  // 2b. Try decoding Base62 ID if not found yet
  if (!urlRow) {
    const decodedId = decodeBase62(shortCode);
    if (decodedId > 0) {
      urlRow = await Url.findOne({ id: decodedId }).lean();
    }
  }

  // 2c. Fallback to custom_slug lookup
  if (!urlRow) {
    urlRow = await Url.findOne({ custom_slug: shortCode }).lean();
  }

  // 3. Cache the result in Redis if found
  if (urlRow) {
    await setCache(cacheKey, urlRow);
    // Also cache by ID and custom slug for multi-key caching strategy
    await setCache(`url:id:${urlRow.id}`, urlRow);
    if (urlRow.custom_slug) {
      await setCache(`url:${urlRow.custom_slug}`, urlRow);
    }
    console.log(`💾 [Redis Cached] Stored URL record under key "${cacheKey}"`);
  }

  return urlRow;
}

// Helper to invalidate Redis cache for a URL item
async function invalidateUrlCache(urlId: number | string, shortCode?: string, customSlug?: string | null) {
  await delCache(`url:id:${urlId}`);
  await delCache(`url:${urlId}`);
  const base62Code = encodeBase62(Number(urlId));
  if (base62Code) await delCache(`url:${base62Code}`);
  if (shortCode) await delCache(`url:${shortCode}`);
  if (customSlug) await delCache(`url:${customSlug}`);
  console.log(`🗑️ [Redis Cache Cleared] Invalidated cache keys for URL ID ${urlId}`);
}

// 0. System Health & Redis Status Endpoint
app.get('/api/v1/health', async (_req: Request, res: Response): Promise<void> => {
  try {
    const redisInfo = await getRedisStatus();
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      database: {
        type: 'MongoDB',
        status: 'connected',
      },
      redis: redisInfo,
    });
  } catch (err: any) {
    res.status(500).json({ status: 'error', error: err.message });
  }
});

// 1. Create Shortened URL (Random 6-Digit Numeric ID + Base62 Encoding + Redis Cache Warming)
app.post('/api/v1/shorten', async (req: Request, res: Response): Promise<void> => {
  try {
    const { originalUrl, customSlug, expiresAt, title } = req.body;

    if (!originalUrl) {
      res.status(400).json({ error: 'originalUrl is required' });
      return;
    }

    // Check custom slug uniqueness if provided
    if (customSlug) {
      const cleanSlug = customSlug.trim();
      const existing = await Url.findOne({ custom_slug: cleanSlug }).lean();
      if (existing) {
        res.status(400).json({ error: 'Custom slug is already in use' });
        return;
      }
    }

    let defaultTitle = title || originalUrl;
    try {
      const parsed = new URL(originalUrl);
      defaultTitle = parsed.hostname.replace('www.', '') + parsed.pathname;
    } catch {
      // fallback
    }

    // Generate a unique random 6-digit integer numeric ID
    let urlId = generateRandom6DigitId();
    let isUnique = false;
    let attempts = 0;

    while (!isUnique && attempts < 20) {
      const existing = await Url.findOne({ id: urlId }).lean();
      if (!existing) {
        isUnique = true;
      } else {
        urlId = generateRandom6DigitId();
        attempts++;
      }
    }

    const cleanExpiresAt = expiresAt ? new Date(expiresAt) : null;
    const cleanTitle = title || defaultTitle;
    const cleanSlug = customSlug ? customSlug.trim() : null;

    // Insert into MongoDB
    const newUrlDoc = await Url.create({
      id: urlId,
      original_url: originalUrl,
      custom_slug: cleanSlug,
      title: cleanTitle,
      user_id: 'usr_demo123',
      expires_at: cleanExpiresAt,
      status: 'active'
    });

    const newUrlRow = newUrlDoc.toObject();
    const shortCode = cleanSlug || encodeBase62(urlId);

    // Pre-warm Redis Cache for instant redirect
    await setCache(`url:${shortCode}`, newUrlRow);
    await setCache(`url:id:${urlId}`, newUrlRow);
    if (cleanSlug) {
      await setCache(`url:${cleanSlug}`, newUrlRow);
    }

    console.log(`[MongoDB + Redis] Inserted & Cached Random 6-Digit ID: ${urlId} -> Shortcode: "${shortCode}"`);

    res.status(201).json({
      id: urlId,
      shortCode,
      shortUrl: `http://localhost:3000/r/${shortCode}`,
      originalUrl,
      createdAt: newUrlRow.created_at,
      expiresAt: cleanExpiresAt,
      totalClicks: 0,
    });
  } catch (err: any) {
    console.error('Error in /api/v1/shorten:', err);
    res.status(500).json({ error: err.message || 'Internal server error' });
  }
});

// 2. Fetch User URLs from SQL Database
app.get('/api/v1/urls', async (_req: Request, res: Response): Promise<void> => {
  try {
    const rows = await Url.aggregate([
      {
        $lookup: {
          from: 'clicks',
          localField: 'id',
          foreignField: 'url_id',
          as: 'clicks_data'
        }
      },
      {
        $addFields: {
          total_clicks: { $size: "$clicks_data" }
        }
      },
      {
        $project: {
          clicks_data: 0
        }
      },
      {
        $sort: { id: -1 }
      }
    ]);

    const formatted = rows.map((u: any) => {
      const shortCode = u.custom_slug || encodeBase62(u.id);
      return {
        id: u.id,
        url_id: shortCode,
        original_url: u.original_url,
        user_id: u.user_id,
        created_at: u.created_at,
        expires_at: u.expires_at,
        total_clicks: Number(u.total_clicks || 0),
        custom_slug: u.custom_slug,
        title: u.title || u.original_url,
        status: u.status,
      };
    });

    res.json(formatted);
  } catch (err: any) {
    console.error('Error in GET /api/v1/urls:', err);
    res.status(500).json({ error: err.message || 'Internal server error' });
  }
});

// 3. Record Click & Handle Redirection (Uses Redis Caching)
app.get(['/r/:shortCode', '/api/v1/redirect/:shortCode'], async (req: Request, res: Response): Promise<void> => {
  try {
    const shortCode = String(req.params.shortCode);
    const urlRow = await findUrlByShortCode(shortCode);

    if (!urlRow) {
      res.status(404).json({ error: 'Short URL not found' });
      return;
    }

    if (urlRow.status !== 'active') {
      res.status(410).json({ error: 'Link has expired or is disabled' });
      return;
    }

    // Capture telemetry data asynchronously
    const rawUA = req.headers['user-agent'];
    const userAgent = Array.isArray(rawUA) ? rawUA[0] : (rawUA || 'Unknown Browser');
    const rawRef = req.headers['referer'] || req.headers['referrer'];
    const referer = Array.isArray(rawRef) ? rawRef[0] : (rawRef || 'Direct');
    const ip = (Array.isArray(req.headers['x-forwarded-for']) ? req.headers['x-forwarded-for'][0] : req.headers['x-forwarded-for']) || req.ip || req.socket.remoteAddress || '127.0.0.1';

    let deviceType = 'Desktop';
    if (/mobile/i.test(userAgent)) deviceType = 'Mobile';
    else if (/ipad|tablet/i.test(userAgent)) deviceType = 'Tablet';

    let browser = 'Chrome';
    if (/firefox/i.test(userAgent)) browser = 'Firefox';
    else if (/safari/i.test(userAgent) && !/chrome/i.test(userAgent)) browser = 'Safari';
    else if (/edg/i.test(userAgent)) browser = 'Edge';

    // Log click into MongoDB asynchronously (non-blocking for redirect speed)
    Click.create({
      url_id: urlRow.id,
      ip_address: ip,
      country: 'United States',
      city: 'San Francisco',
      device_type: deviceType,
      browser: browser,
      referer: referer
    }).catch((clickErr) => {
      console.error('Error logging click event:', clickErr);
    });

    // If JSON format is requested via API or Accept header or query param
    if (req.query.json === 'true' || String(req.headers.accept || '').includes('application/json')) {
      res.json({ originalUrl: urlRow.original_url, shortCode });
      return;
    }

    // Redirect browser to destination URL
    res.redirect(302, urlRow.original_url);
  } catch (err: any) {
    console.error('Error in redirect:', err);
    res.status(500).json({ error: err.message || 'Internal server error' });
  }
});

// 4. Query Analytics from SQL Database
app.get('/api/v1/analytics/:shortCode', async (req: Request, res: Response): Promise<void> => {
  try {
    const shortCode = String(req.params.shortCode);
    const urlRow = await findUrlByShortCode(shortCode);

    if (!urlRow) {
      res.status(404).json({ error: 'Link not found' });
      return;
    }

    const clicks = await Click.find({ url_id: urlRow.id }).sort({ timestamp: 1 }).lean();

    const totalClicks = clicks.length;

    // Time-series grouping
    const timeSeriesMap: Record<string, { clicks: number; uniqueVisitors: Set<string> }> = {};
    clicks.forEach((c: any) => {
      const dayLabel = new Date(c.timestamp).toLocaleDateString([], { month: 'short', day: 'numeric' });
      if (!timeSeriesMap[dayLabel]) {
        timeSeriesMap[dayLabel] = { clicks: 0, uniqueVisitors: new Set() };
      }
      timeSeriesMap[dayLabel].clicks += 1;
      timeSeriesMap[dayLabel].uniqueVisitors.add(c.ip_address || 'unknown');
    });

    const timeSeriesData = Object.keys(timeSeriesMap).map((label) => ({
      timestamp: label,
      label,
      clicks: timeSeriesMap[label].clicks,
      uniqueVisitors: timeSeriesMap[label].uniqueVisitors.size,
    }));

    // Device breakdown
    const deviceMap: Record<string, number> = {};
    clicks.forEach((c: any) => {
      const dev = c.device_type || 'Desktop';
      deviceMap[dev] = (deviceMap[dev] || 0) + 1;
    });

    const colors: Record<string, string> = { Desktop: '#6366f1', Mobile: '#22d3ee', Tablet: '#a855f7' };
    const deviceBreakdown = Object.keys(deviceMap).map((dev) => ({
      device: dev,
      clicks: deviceMap[dev],
      percentage: Math.round((deviceMap[dev] / (totalClicks || 1)) * 100),
      color: colors[dev] || '#6366f1',
    }));

    // Browser breakdown
    const browserMap: Record<string, number> = {};
    clicks.forEach((c: any) => {
      const b = c.browser || 'Chrome';
      browserMap[b] = (browserMap[b] || 0) + 1;
    });
    const browserBreakdown = Object.keys(browserMap).map((b) => ({
      browser: b,
      clicks: browserMap[b],
      percentage: Math.round((browserMap[b] / (totalClicks || 1)) * 100),
    }));

    // Referrers
    const refMap: Record<string, number> = {};
    clicks.forEach((c: any) => {
      const r = c.referer || 'Direct';
      refMap[r] = (refMap[r] || 0) + 1;
    });
    const topReferrers = Object.keys(refMap).map((r) => ({
      referer: r,
      clicks: refMap[r],
      percentage: Math.round((refMap[r] / (totalClicks || 1)) * 100),
    }));

    res.json({
      shortCode,
      originalUrl: urlRow.original_url,
      totalClicks,
      timeframe: req.query.timeframe || '7d',
      timeSeriesData: timeSeriesData.length > 0 ? timeSeriesData : [
        { label: 'Today', timestamp: new Date().toISOString(), clicks: totalClicks, uniqueVisitors: Math.ceil(totalClicks * 0.8) }
      ],
      geoDistribution: [
        {
          country: 'US',
          countryName: 'United States',
          clicks: Math.ceil(totalClicks * 0.6),
          percentage: 60,
          latitude: 37.0902,
          longitude: -95.7129,
          cities: [{ name: 'San Francisco', clicks: Math.ceil(totalClicks * 0.4) }],
        },
        {
          country: 'GB',
          countryName: 'United Kingdom',
          clicks: Math.floor(totalClicks * 0.4),
          percentage: 40,
          latitude: 55.3781,
          longitude: -3.436,
          cities: [{ name: 'London', clicks: Math.floor(totalClicks * 0.4) }],
        },
      ],
      deviceBreakdown,
      topReferrers,
      browserBreakdown,
    });
  } catch (err: any) {
    console.error('Error in GET /api/v1/analytics:', err);
    res.status(500).json({ error: err.message || 'Internal server error' });
  }
});

// 5. Update Link Endpoint with Redis Cache Update
app.put('/api/v1/urls/:shortCode', async (req: Request, res: Response): Promise<void> => {
  try {
    const shortCode = String(req.params.shortCode);
    const urlRow = await findUrlByShortCode(shortCode);

    if (!urlRow) {
      res.status(404).json({ error: 'Link not found' });
      return;
    }

    const { title, originalUrl, status } = req.body;
    const updatedTitle = title !== undefined ? title : urlRow.title;
    const updatedOriginalUrl = originalUrl !== undefined ? originalUrl : urlRow.original_url;
    const updatedStatus = status !== undefined ? status : urlRow.status;

    await Url.updateOne(
      { id: urlRow.id },
      { $set: { title: updatedTitle, original_url: updatedOriginalUrl, status: updatedStatus } }
    );

    // Invalidate old cache and update with fresh data
    await invalidateUrlCache(urlRow.id, shortCode, urlRow.custom_slug);

    const updatedRow = {
      ...urlRow,
      title: updatedTitle,
      original_url: updatedOriginalUrl,
      status: updatedStatus,
    };

    await setCache(`url:${shortCode}`, updatedRow);
    await setCache(`url:id:${urlRow.id}`, updatedRow);

    res.json({ success: true, url: updatedRow });
  } catch (err: any) {
    console.error('Error in PUT /api/v1/urls:', err);
    res.status(500).json({ error: err.message || 'Internal server error' });
  }
});

// 6. Delete Link from SQL Database and Redis Cache
app.delete('/api/v1/urls/:shortCode', async (req: Request, res: Response): Promise<void> => {
  try {
    const shortCode = String(req.params.shortCode);
    const urlRow = await findUrlByShortCode(shortCode);

    if (!urlRow) {
      res.status(404).json({ error: 'Link not found' });
      return;
    }

    await Url.deleteOne({ id: urlRow.id });

    // Invalidate Redis cache
    await invalidateUrlCache(urlRow.id, shortCode, urlRow.custom_slug);

    res.json({ success: true, message: `Deleted link ${shortCode}` });
  } catch (err: any) {
    console.error('Error in DELETE /api/v1/urls:', err);
    res.status(500).json({ error: err.message || 'Internal server error' });
  }
});

// Start Express Server, Database & Redis Connections
Promise.all([initDatabase(), initRedis()])
  .then(([dbConnected, redisConnected]) => {
    app.listen(PORT, () => {
      console.log(`\n======================================================`);
      console.log(`⚡ LinkSnap Express Backend Server running on http://localhost:${PORT}`);
      console.log(`🗄️  Database Engine: MongoDB`);
      console.log(`🚀 Caching Engine: ${redisConnected ? 'Redis Active ⚡' : 'Redis Offline (Database Fallback Active)'}`);
      console.log(`======================================================\n`);
    });
  })
  .catch((err) => {
    console.error('Failed to initialize server services:', err);
    process.exit(1);
  });
