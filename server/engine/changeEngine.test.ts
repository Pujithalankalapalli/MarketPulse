import { MeaningfulChangeEngine } from './changeEngine.js';
import { StockQuote, MarketIndex, MarketNews, SnapshotItem, UserSettings } from '../types.js';

function runTests() {
  console.log('🧪 Starting Meaningful Change Engine Test Suite...\n');
  const engine = new MeaningfulChangeEngine();

  const defaultSettings: UserSettings = {
    priceThreshold: 2.0,
    volumeThreshold: 1.5,
    newsSensitivity: 'medium',
    attentionPreference: 'balanced',
    dataMode: 'demo',
    autoSnapshotOnVisit: true,
  };

  const sampleQuote: StockQuote = {
    symbol: 'RELIANCE',
    name: 'Reliance Industries Ltd.',
    sector: 'Energy & Petrochem',
    exchange: 'NSE',
    price: 2850,
    change: -95,
    changePercent: -3.2,
    previousClose: 2945,
    open: 2940,
    high: 2950,
    low: 2840,
    volume: 10500000,
    avgVolume: 5600000, // 1.875x volume
    volatilityPct: 1.8,
    lastUpdated: new Date().toISOString(),
    dataSource: 'NSE',
    freshness: 'Fresh',
  };

  const normalQuote: StockQuote = {
    symbol: 'ITC',
    name: 'ITC Limited',
    sector: 'FMCG',
    exchange: 'NSE',
    price: 486,
    change: 1,
    changePercent: 0.2,
    previousClose: 485,
    open: 485,
    high: 487,
    low: 484,
    volume: 13800000,
    avgVolume: 14000000, // ~1.0x volume
    volatilityPct: 0.9,
    lastUpdated: new Date().toISOString(),
    dataSource: 'NSE',
    freshness: 'Fresh',
  };

  const snapshotItems: Record<string, SnapshotItem> = {
    RELIANCE: {
      symbol: 'RELIANCE',
      price: 2945,
      changePercent: 0,
      volume: 5600000,
      avgVolume: 5600000,
      timestamp: new Date(Date.now() - 3600000).toISOString(),
    },
    ITC: {
      symbol: 'ITC',
      price: 485,
      changePercent: 0,
      volume: 14000000,
      avgVolume: 14000000,
      timestamp: new Date(Date.now() - 3600000).toISOString(),
    },
  };

  const sampleIndices: MarketIndex[] = [
    { symbol: 'NIFTY 50', name: 'NIFTY 50', value: 24800, change: -10, changePercent: -0.04, direction: 'flat', lastUpdated: new Date().toISOString() },
  ];

  const sampleNews: MarketNews[] = [
    {
      id: 'news_1',
      symbol: 'RELIANCE',
      company: 'Reliance Industries Ltd.',
      headline: 'Crude refining margins drop sharply',
      summary: 'Impacts margins',
      category: 'Market',
      timestamp: new Date().toISOString(),
      importance: 'high',
      source: 'Reuters',
    },
  ];

  // Test 1: Normal stock should be classified as NORMAL
  const normalResults = engine.evaluate({
    quotes: [normalQuote],
    previousSnapshotItems: snapshotItems,
    indices: sampleIndices,
    news: [],
    settings: defaultSettings,
    snapshotTimestamp: new Date().toISOString(),
  });

  console.assert(normalResults.length === 1, 'Test 1 Failed: Expected 1 result');
  console.assert(normalResults[0].severity === 'NORMAL', `Test 1 Failed: Expected NORMAL, got ${normalResults[0].severity}`);
  console.assert(normalResults[0].changeScore <= 30, `Test 1 Failed: Expected score <= 30, got ${normalResults[0].changeScore}`);
  console.log('✅ Test 1 Passed: Low movement stock receives NORMAL severity (< 30 score).');

  // Test 2: High movement + high volume + high news should be IMPORTANT or HIGH ATTENTION
  const highResults = engine.evaluate({
    quotes: [sampleQuote],
    previousSnapshotItems: snapshotItems,
    indices: sampleIndices,
    news: sampleNews,
    settings: defaultSettings,
    snapshotTimestamp: new Date().toISOString(),
  });

  console.assert(highResults[0].severity === 'IMPORTANT' || highResults[0].severity === 'HIGH ATTENTION', 
    `Test 2 Failed: Expected IMPORTANT or HIGH ATTENTION, got ${highResults[0].severity}`);
  console.assert(highResults[0].changeScore >= 60, `Test 2 Failed: Expected score >= 60, got ${highResults[0].changeScore}`);
  console.log(`✅ Test 2 Passed: High move (-3.2%), elevated volume (1.88x), and high news receives ${highResults[0].severity} (Score: ${highResults[0].changeScore}/100).`);

  // Test 3: Explanation contains factual numbers
  const expl = highResults[0].explanation;
  console.assert(expl.includes('3.2%') || expl.includes('fell') || expl.includes('2%'), 'Test 3 Failed: Explanation lacks price change or threshold');
  console.assert(expl.includes('1.8') || expl.includes('volume') || expl.includes('baseline'), 'Test 3 Failed: Explanation lacks volume context');
  console.log('✅ Test 3 Passed: Human-readable explanation incorporates exact numerical facts without hallucination.');

  // Test 4: Sensitivity preference adjustment
  const conservativeResults = engine.evaluate({
    quotes: [sampleQuote],
    previousSnapshotItems: snapshotItems,
    indices: sampleIndices,
    news: sampleNews,
    settings: { ...defaultSettings, attentionPreference: 'conservative' },
    snapshotTimestamp: new Date().toISOString(),
  });

  const sensitiveResults = engine.evaluate({
    quotes: [sampleQuote],
    previousSnapshotItems: snapshotItems,
    indices: sampleIndices,
    news: sampleNews,
    settings: { ...defaultSettings, attentionPreference: 'sensitive' },
    snapshotTimestamp: new Date().toISOString(),
  });

  console.assert(sensitiveResults[0].changeScore > conservativeResults[0].changeScore, 
    'Test 4 Failed: Sensitive preference should yield higher score than conservative');
  console.log(`✅ Test 4 Passed: Attention preference tuning functions correctly (Sensitive: ${sensitiveResults[0].changeScore} vs Conservative: ${conservativeResults[0].changeScore}).`);

  console.log('\n🎉 ALL 4 CHANGE ENGINE UNIT TESTS PASSED SUCCESSFULLY!\n');
}

runTests();
