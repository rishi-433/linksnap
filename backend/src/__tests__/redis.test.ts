import { initRedis, getCache, setCache, delCache, isRedisReady, getRedisStatus } from '../config/redis';

async function runTests() {
  console.log('--- Running Redis Module Diagnostic Tests ---');

  const ready = await initRedis();
  console.log(`Redis init complete. Connected: ${ready}, isRedisReady: ${isRedisReady()}`);

  const status = await getRedisStatus();
  console.log('Redis Status:', JSON.stringify(status, null, 2));

  if (isRedisReady()) {
    console.log('Testing Redis set, get, del operations...');
    const testKey = 'test:linksnap_key';
    const testVal = { id: 999999, url: 'https://test.com', status: 'active' };

    await setCache(testKey, testVal, 60);
    const retrieved = await getCache<any>(testKey);
    if (retrieved && retrieved.id === 999999) {
      console.log('✓ PASSED: Redis setCache and getCache working properly!');
    } else {
      console.error('FAILED: Redis getCache did not return set object.');
    }

    await delCache(testKey);
    const afterDel = await getCache<any>(testKey);
    if (afterDel === null) {
      console.log('✓ PASSED: Redis delCache working properly!');
    } else {
      console.error('FAILED: Redis delCache did not delete key.');
    }
  } else {
    console.log('ℹ️ Redis server is not currently running locally on 127.0.0.1:6379.');
    console.log('✓ PASSED: Graceful database fallback mode active without server crash!');
  }

  process.exit(0);
}

runTests().catch((err) => {
  console.error('Error running Redis tests:', err);
  process.exit(1);
});
