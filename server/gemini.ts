import { GoogleGenAI } from '@google/genai';
import { MeaningfulChange, MarketIndex } from './types.js';

let aiClient: GoogleGenAI | null = null;

function getAiClient(): GoogleGenAI | null {
  if (!process.env.GEMINI_API_KEY) {
    return null;
  }
  if (!aiClient) {
    try {
      aiClient = new GoogleGenAI({
        apiKey: process.env.GEMINI_API_KEY,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      });
    } catch {
      return null;
    }
  }
  return aiClient;
}

export interface SummaryContext {
  watchlistName: string;
  changes: MeaningfulChange[];
  indices: MarketIndex[];
  highPriorityCount: number;
  importantCount: number;
}

// In-memory summary cache with 60s TTL to prevent hammering upstream APIs
interface CachedSummary {
  summary: string;
  provider: 'gemini' | 'deterministic';
  timestamp: number;
}
const summaryCache = new Map<string, CachedSummary>();
const CACHE_TTL_MS = 60000; // 60 seconds

function buildCacheKey(context: SummaryContext): string {
  const { watchlistName, changes, highPriorityCount, importantCount } = context;
  const changesDigest = changes
    .map(c => `${c.symbol}:${c.severity}:${c.pctChangeSinceSnapshot.toFixed(1)}`)
    .sort()
    .join('|');
  return `${watchlistName}_${highPriorityCount}_${importantCount}_${changesDigest}`;
}

/**
 * Generates an executive market summary based STRICTLY on provided factual backend data.
 * If Gemini API is experiencing high demand (503) or is unavailable, seamlessly falls back
 * to a lightweight secondary model or a deterministic factual template.
 */
export async function generateExecutiveSummary(
  context: SummaryContext
): Promise<{ summary: string; provider: 'gemini' | 'deterministic' }> {
  const { watchlistName, changes, indices, highPriorityCount, importantCount } = context;

  // Check in-memory cache first
  const cacheKey = buildCacheKey(context);
  const cached = summaryCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return { summary: cached.summary, provider: cached.provider };
  }

  // Fallback deterministic factual summary generator
  const generateDeterministicSummary = (): string => {
    if (changes.length === 0) {
      return `Your ${watchlistName} watchlist is currently steady with minimal volatility and no threshold breaches since your last snapshot.`;
    }

    const sortedByMove = [...changes].sort(
      (a, b) => Math.abs(b.pctChangeSinceSnapshot) - Math.abs(a.pctChangeSinceSnapshot)
    );
    const biggestMover = sortedByMove[0];
    const highVolumeStocks = changes.filter(c => c.volumeMultiplier >= 1.5);
    const nifty = indices.find(i => i.symbol === 'NIFTY 50');

    const directionText = biggestMover.pctChangeSinceSnapshot >= 0 ? 'gained' : 'shed';
    const moverNote = `${biggestMover.symbol} led activity, having ${directionText} ${Math.abs(
      biggestMover.pctChangeSinceSnapshot
    ).toFixed(1)}% to ₹${biggestMover.currentPrice.toLocaleString('en-IN')}.`;

    const volumeNote =
      highVolumeStocks.length > 0
        ? ` Abnormal institutional volume was detected in ${highVolumeStocks
            .map(s => `${s.symbol} (${s.volumeMultiplier}×)`)
            .join(', ')}.`
        : '';

    const priorityNote =
      highPriorityCount > 0
        ? ` ${highPriorityCount} stock(s) currently require high attention due to compounded price/volume triggers.`
        : importantCount > 0
          ? ` ${importantCount} stock(s) are flagged as important for your review.`
          : ' Market movements remain largely within standard parameters.';

    const marketNote = nifty
      ? ` NIFTY 50 stood at ${nifty.value.toLocaleString('en-IN')} (${
          nifty.changePercent >= 0 ? '+' : ''
        }${nifty.changePercent.toFixed(2)}%).`
      : '';

    return `${moverNote}${volumeNote}${priorityNote}${marketNote}`;
  };

  const ai = getAiClient();
  if (!ai) {
    const result = { summary: generateDeterministicSummary(), provider: 'deterministic' as const };
    summaryCache.set(cacheKey, { ...result, timestamp: Date.now() });
    return result;
  }

  const dataFacts = {
    watchlist: watchlistName,
    indices: indices.map(i => ({ symbol: i.symbol, changePct: i.changePercent, value: i.value })),
    keyStocks: changes.map(c => ({
      symbol: c.symbol,
      price: c.currentPrice,
      pctChangeSinceLastCheck: c.pctChangeSinceSnapshot,
      volumeMultiplier: c.volumeMultiplier,
      severity: c.severity,
      score: c.changeScore,
      explanation: c.explanation,
    })),
    highPriorityCount,
    importantCount,
  };

  const prompt = `You are the chief quantitative strategist for MarketPulse.
Synthesize a concise, highly professional 2-3 sentence executive intelligence briefing for the investor based STRICTLY on these numerical facts:
${JSON.stringify(dataFacts, null, 2)}

STRICT RULES:
1. Do NOT invent or hallucinate any numbers, prices, news events, or percentages not in the JSON.
2. Directly explain what meaningfully changed since the user last checked and why it matters right now.
3. Keep it crisp, readable, and jargon-free (max 50 words).`;

  // Candidate models: Primary 'gemini-3.8-flash', fallback 'gemini-3.1-flash-lite'
  const candidateModels = ['gemini-3.8-flash', 'gemini-3.1-flash-lite'];

  for (const model of candidateModels) {
    try {
      const response = await ai.models.generateContent({
        model,
        contents: prompt,
        config: {
          systemInstruction:
            'You are a disciplined financial market analyst. Ground every single claim in the provided factual JSON data.',
          temperature: 0.2,
        },
      });

      const text = response.text?.trim();
      if (text && text.length > 20) {
        const result = { summary: text, provider: 'gemini' as const };
        summaryCache.set(cacheKey, { ...result, timestamp: Date.now() });
        return result;
      }
    } catch {
      // Upstream busy or rate-limited; continue to next candidate model or fallback gracefully
      continue;
    }
  }

  // Gracefully fallback to deterministic summary without loud console errors
  const fallbackResult = { summary: generateDeterministicSummary(), provider: 'deterministic' as const };
  summaryCache.set(cacheKey, { ...fallbackResult, timestamp: Date.now() });
  return fallbackResult;
}
