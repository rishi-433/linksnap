import mongoose, { Document, Schema } from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/linksnap_db';

export interface IUrl extends Document {
  id: number;
  original_url: string;
  custom_slug: string | null;
  title: string | null;
  user_id: string;
  created_at: Date;
  expires_at: Date | null;
  status: 'active' | 'expired' | 'disabled';
}

const urlSchema = new Schema<IUrl>({
  id: { type: Number, required: true, unique: true },
  original_url: { type: String, required: true },
  custom_slug: { type: String, default: null, unique: true, sparse: true },
  title: { type: String, default: null },
  user_id: { type: String, default: 'usr_demo123' },
  created_at: { type: Date, default: Date.now },
  expires_at: { type: Date, default: null },
  status: { type: String, enum: ['active', 'expired', 'disabled'], default: 'active' }
});

export const Url = mongoose.model<IUrl>('Url', urlSchema);

export interface IClick extends Document {
  url_id: number;
  timestamp: Date;
  ip_address: string | null;
  country: string | null;
  city: string | null;
  device_type: string | null;
  browser: string | null;
  referer: string | null;
}

const clickSchema = new Schema<IClick>({
  url_id: { type: Number, required: true },
  timestamp: { type: Date, default: Date.now },
  ip_address: { type: String, default: null },
  country: { type: String, default: null },
  city: { type: String, default: null },
  device_type: { type: String, default: null },
  browser: { type: String, default: null },
  referer: { type: String, default: null }
});

export const Click = mongoose.model<IClick>('Click', clickSchema);

export async function initDatabase(): Promise<boolean> {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('✓ Successfully connected to MongoDB Database Server!');
    
    await seedInitialData();
    return true;
  } catch (err: any) {
    console.error(`⚠️ MongoDB Connection Error: ${err.message}`);
    throw err;
  }
}

async function seedInitialData() {
  const count = await Url.countDocuments();

  if (count === 0) {
    console.log('Seeding initial MongoDB data...');
    const seedUrls = [
      { id: 582914, original_url: 'https://github.com/aws/aws-sam-cli/releases/tag/v1.120.0', custom_slug: 'tech-launch-2026', title: 'AWS SAM CLI v1.120 Release Notes & Benchmarks', user_id: 'usr_demo123', status: 'active' as const },
      { id: 739102, original_url: 'https://react.dev/blog/2024/12/05/react-19', custom_slug: 'react-19-guide', title: 'React 19 Server Components Deep Dive', user_id: 'usr_demo123', status: 'active' as const },
      { id: 402918, original_url: 'https://aws.amazon.com/dynamodb/pricing/', custom_slug: null, title: 'Amazon DynamoDB On-Demand Pricing Calculator', user_id: 'usr_demo123', status: 'active' as const },
    ];

    for (const data of seedUrls) {
      await Url.create(data);

      const countries = ['United States', 'United Kingdom', 'Germany', 'India', 'Japan'];
      const cities = ['San Francisco', 'London', 'Berlin', 'Bengaluru', 'Tokyo'];
      const devices = ['Desktop', 'Mobile', 'Tablet'];
      const browsers = ['Chrome', 'Safari', 'Firefox', 'Edge'];
      const referrers = ['Direct', 'Twitter / X', 'Google Search', 'LinkedIn', 'GitHub'];

      const clicksToInsert = [];
      for (let i = 0; i < 20; i++) {
        clicksToInsert.push({
          url_id: data.id,
          ip_address: `192.168.1.${i + 1}`,
          country: countries[i % countries.length],
          city: cities[i % cities.length],
          device_type: devices[i % devices.length],
          browser: browsers[i % browsers.length],
          referer: referrers[i % referrers.length],
        });
      }
      await Click.insertMany(clicksToInsert);
    }
  }
}
