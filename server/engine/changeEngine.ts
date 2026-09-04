import { StockQuote, MarketIndex, MarketNews, SnapshotItem, UserSettings, MeaningfulChange, ChangeFactor, AttentionSeverity } from '../types.js';

export interface EvaluationContext {
  quotes: StockQuote[];
  previousSnapshotItems: Record<string, SnapshotItem>;
  indices: MarketIndex[];
  news: MarketNews[];
  settings: UserSettings;
  snapshotTimestamp: string;
}

export class MeaningfulChangeEngine {
  /**
   * Evaluates changes for a batch of stocks against previous snapshot baseline and market context.
   */
  evaluate(context: EvaluationContext): MeaningfulChange[] {
    const { quotes, previousSnapshotItems, indices, news, settings, snapshotTimestamp } = context;
    const niftyIndex = indices.find(i => i.symbol === 'NIFTY 50');
    const marketPctChange = niftyIndex ? niftyIndex.changePercent : 0;

    return quotes.map(quote => {
      const prev = previousSnapshotItems[quote.symbol];
      const previousPrice = prev ? prev.price : quote.previousClose;
      const priceDiff = Number((quote.price - previousPrice).toFixed(2));
      const pctChangeSinceSnapshot = previousPrice > 0 
        ? Number((((quote.price - previousPrice) / previousPrice) * 100).toFixed(2))
        : quote.changePercent;

      const volumeMultiplier = quote.avgVolume > 0 
        ? Number((quote.volume / quote.avgVolume).toFixed(2))
        : 1.0;

      // Find sector index move if available (e.g. NIFTY IT, NIFTY BANK)
      const sectorIndexName = quote.sector.toLowerCase().includes('it') 
        ? 'NIFTY IT' 
        : quote.sector.toLowerCase().includes('bank') 
          ? 'NIFTY BANK' 
          : null;
      const sectorIndex = sectorIndexName ? indices.find(i => i.symbol === sectorIndexName) : null;
      const sectorPctChange = sectorIndex ? sectorIndex.changePercent : marketPctChange * 0.8;

      // Relevant news for this company
      const relevantNews = news.filter(n => n.symbol === quote.symbol);
      const highNews = relevantNews.find(n => n.importance === 'high');
      const medNews = relevantNews.find(n => n.importance === 'medium');

      // 1. Price Factor (Max 35 pts)
      const priceFactor = this.calculatePriceFactor(pctChangeSinceSnapshot, settings.priceThreshold);

      // 2. Volume Factor (Max 25 pts)
      const volumeFactor = this.calculateVolumeFactor(volumeMultiplier, settings.volumeThreshold);

      // 3. Sector Factor (Max 15 pts)
      const sectorFactor = this.calculateSectorFactor(pctChangeSinceSnapshot, sectorPctChange, quote.sector);

      // 4. Market Factor (Max 10 pts)
      const marketFactor = this.calculateMarketFactor(pctChangeSinceSnapshot, marketPctChange);

      // 5. News Factor (Max 15 pts)
      const newsFactor = this.calculateNewsFactor(relevantNews, highNews, medNews, settings.newsSensitivity);

      // 6. Volatility Factor (Max 10 pts)
      const volatilityFactor = this.calculateVolatilityFactor(quote);

      const allFactors: ChangeFactor[] = [
        priceFactor,
        volumeFactor,
        sectorFactor,
        marketFactor,
        newsFactor,
        volatilityFactor,
      ];

      // Raw composite score: sum of factors (max theoretical ~110 before normalization)
      const rawScore = allFactors.reduce((sum, f) => sum + f.score, 0);

      // Personalization Tuning: Attention Preference Multiplier
      let preferenceMultiplier = 1.0;
      if (settings.attentionPreference === 'sensitive') {
        preferenceMultiplier = 1.15;
      } else if (settings.attentionPreference === 'conservative') {
        preferenceMultiplier = 0.88;
      }

      const finalScore = Math.min(100, Math.max(0, Math.round(rawScore * preferenceMultiplier)));

      // Classify Severity
      const severity = this.classifySeverity(finalScore);

      // Human-readable "Why this matters" explanation
      const explanation = this.generateExplanation({
        quote,
        previousPrice,
        priceDiff,
        pctChangeSinceSnapshot,
        volumeMultiplier,
        sectorPctChange,
        marketPctChange,
        highNews,
        medNews,
        settings,
        finalScore,
        severity,
        triggeredFactors: allFactors.filter(f => f.triggered),
      });

      return {
        symbol: quote.symbol,
        name: quote.name,
        sector: quote.sector,
        currentPrice: quote.price,
        previousPrice,
        priceDiff,
        pctChangeSinceSnapshot,
        dailyPctChange: quote.changePercent,
        currentVolume: quote.volume,
        avgVolume: quote.avgVolume,
        volumeMultiplier,
        changeScore: finalScore,
        severity,
        factors: allFactors,
        explanation,
        timestamp: quote.lastUpdated,
        snapshotTimestamp,
        freshness: quote.freshness,
        discrepancyWarning: quote.discrepancyWarning,
      };
    });
  }

  private calculatePriceFactor(pctChange: number, threshold: number): ChangeFactor {
    const absChange = Math.abs(pctChange);
    const triggered = absChange >= threshold;
    const maxScore = 35;
    let score = 0;

    if (absChange >= threshold) {
      // Exceeds threshold: baseline 20 pts + up to 15 pts scaling
      const ratio = absChange / Math.max(threshold, 0.1);
      score = Math.min(maxScore, 20 + Math.round((ratio - 1) * 10));
    } else {
      // Sub-threshold proportional score
      const ratio = absChange / Math.max(threshold, 0.1);
      score = Math.round(ratio * 14);
    }

    return {
      type: 'price',
      label: 'Price Movement',
      score,
      weight: maxScore,
      triggered,
      metric: `${pctChange >= 0 ? '+' : ''}${pctChange.toFixed(1)}% (Threshold: ±${threshold}%)`,
      description: triggered 
        ? `Exceeded your configured ${threshold}% movement threshold.` 
        : `Within normal range of ${threshold}% threshold.`,
    };
  }

  private calculateVolumeFactor(multiplier: number, threshold: number): ChangeFactor {
    const triggered = multiplier >= threshold;
    const maxScore = 25;
    let score = 0;

    if (multiplier >= threshold) {
      // Exceeds volume threshold: baseline 14 pts + up to 11 pts scaling
      score = Math.min(maxScore, 14 + Math.round((multiplier - threshold) * 12));
    } else {
      score = Math.min(10, Math.round((multiplier / Math.max(threshold, 0.5)) * 9));
    }

    return {
      type: 'volume',
      label: 'Volume Abnormality',
      score,
      weight: maxScore,
      triggered,
      metric: `${multiplier}× 20-day average (Threshold: ${threshold}×)`,
      description: triggered 
        ? `Institutional volume surge at ${multiplier}× typical participation.` 
        : `Volume tracking close to historical baseline.`,
    };
  }

  private calculateSectorFactor(stockPct: number, sectorPct: number, sectorName: string): ChangeFactor {
    // Relative divergence from sector benchmark
    const diff = stockPct - sectorPct;
    const absDiff = Math.abs(diff);
    const maxScore = 15;
    // Triggered if divergence is > 1.2% or opposite direction
    const oppositeDir = (stockPct > 0.4 && sectorPct < -0.4) || (stockPct < -0.4 && sectorPct > 0.4);
    const triggered = absDiff >= 1.5 || oppositeDir;

    let score = 0;
    if (triggered) {
      score = Math.min(maxScore, 8 + Math.round(absDiff * 3));
    } else {
      score = Math.round(absDiff * 3);
    }

    const direction = diff >= 0 ? 'outperforming' : 'lagging';
    return {
      type: 'sector',
      label: 'Sector Relative Strength',
      score,
      weight: maxScore,
      triggered,
      metric: `${direction} ${sectorName} (${sectorPct >= 0 ? '+' : ''}${sectorPct.toFixed(1)}%) by ${absDiff.toFixed(1)}%`,
      description: triggered 
        ? `Significant decoupling from broader ${sectorName} peer group.` 
        : `Moving in line with ${sectorName} sector average.`,
    };
  }

  private calculateMarketFactor(stockPct: number, marketPct: number): ChangeFactor {
    const diff = stockPct - marketPct;
    const absDiff = Math.abs(diff);
    const maxScore = 10;
    const triggered = absDiff >= 2.0;
    const score = Math.min(maxScore, Math.round(absDiff * 3));

    return {
      type: 'market',
      label: 'Broad Market Alpha',
      score,
      weight: maxScore,
      triggered,
      metric: `NIFTY 50 (${marketPct >= 0 ? '+' : ''}${marketPct.toFixed(1)}%) divergence: ${diff >= 0 ? '+' : ''}${diff.toFixed(1)}%`,
      description: triggered 
        ? `Stock moving independently of general market tide.` 
        : `Consistent with overall market index trend.`,
    };
  }

  private calculateNewsFactor(
    allNews: MarketNews[], 
    highNews?: MarketNews, 
    medNews?: MarketNews, 
    sensitivity: 'low' | 'medium' | 'high' = 'medium'
  ): ChangeFactor {
    const maxScore = 15;
    let baseScore = 0;
    let headline = 'No high-impact corporate filings';

    if (highNews) {
      baseScore = 15;
      headline = highNews.headline;
    } else if (medNews) {
      baseScore = 8;
      headline = medNews.headline;
    } else if (allNews.length > 0) {
      baseScore = 4;
      headline = allNews[0].headline;
    }

    // Weight by news sensitivity setting
    const sensitivityMult = sensitivity === 'high' ? 1.2 : sensitivity === 'low' ? 0.6 : 1.0;
    const score = Math.min(maxScore, Math.round(baseScore * sensitivityMult));
    const triggered = Boolean(highNews || (medNews && sensitivity !== 'low'));

    return {
      type: 'news',
      label: 'Corporate News & Filings',
      score,
      weight: maxScore,
      triggered,
      metric: highNews ? `High Impact (${highNews.category})` : medNews ? `Medium Impact` : 'Routine',
      description: headline,
    };
  }

  private calculateVolatilityFactor(quote: StockQuote): ChangeFactor {
    const maxScore = 10;
    const intradayRangePct = quote.low > 0 ? ((quote.high - quote.low) / quote.low) * 100 : 0;
    const triggered = intradayRangePct >= 2.5;
    const score = Math.min(maxScore, Math.round(intradayRangePct * 2.5));

    return {
      type: 'volatility',
      label: 'Intraday Spread / Volatility',
      score,
      weight: maxScore,
      triggered,
      metric: `Intraday Range: ${intradayRangePct.toFixed(1)}% (Historical: ${quote.volatilityPct}%)`,
      description: triggered 
        ? `Elevated price swing between high and low levels.` 
        : `Intraday expansion within normal statistical bounds.`,
    };
  }

  private classifySeverity(score: number): AttentionSeverity {
    if (score >= 80) return 'HIGH ATTENTION';
    if (score >= 60) return 'IMPORTANT';
    if (score >= 30) return 'WATCH';
    return 'NORMAL';
  }

  /**
   * Generates a clear, human-readable narrative explaining WHY this stock deserves attention.
   * Factually grounded entirely in backend data.
   */
  private generateExplanation(data: {
    quote: StockQuote;
    previousPrice: number;
    priceDiff: number;
    pctChangeSinceSnapshot: number;
    volumeMultiplier: number;
    sectorPctChange: number;
    marketPctChange: number;
    highNews?: MarketNews;
    medNews?: MarketNews;
    settings: UserSettings;
    finalScore: number;
    severity: AttentionSeverity;
    triggeredFactors: ChangeFactor[];
  }): string {
    const { quote, pctChangeSinceSnapshot, volumeMultiplier, sectorPctChange, highNews, settings, severity } = data;
    const action = pctChangeSinceSnapshot < 0 ? 'fell' : 'rose';
    const absPct = Math.abs(pctChangeSinceSnapshot);

    const priceSentence = absPct >= settings.priceThreshold
      ? `${quote.name} ${action} ${absPct.toFixed(1)}% since your last check, surpassing your ${settings.priceThreshold}% threshold.`
      : `${quote.name} is relatively steady (${pctChangeSinceSnapshot >= 0 ? '+' : ''}${pctChangeSinceSnapshot.toFixed(1)}%).`;

    const volumeSentence = volumeMultiplier >= settings.volumeThreshold
      ? `Trading volume surged to ${volumeMultiplier}× its 20-day baseline, indicating institutional repositioning.`
      : volumeMultiplier >= 1.2
        ? `Trading activity is somewhat active at ${volumeMultiplier}× typical volume.`
        : '';

    const sectorSentence = Math.abs(pctChangeSinceSnapshot - sectorPctChange) >= 1.5
      ? pctChangeSinceSnapshot > sectorPctChange
        ? `It strongly outperformed its ${quote.sector} peers (${sectorPctChange >= 0 ? '+' : ''}${sectorPctChange.toFixed(1)}%).`
        : `It lagged the broader ${quote.sector} index (${sectorPctChange >= 0 ? '+' : ''}${sectorPctChange.toFixed(1)}%).`
      : '';

    const newsSentence = highNews
      ? `Catalyst: "${highNews.headline}".`
      : '';

    const parts = [priceSentence, volumeSentence, sectorSentence, newsSentence].filter(Boolean);

    if (severity === 'NORMAL') {
      return `${quote.name} is currently within normal volatility bounds (${pctChangeSinceSnapshot >= 0 ? '+' : ''}${pctChangeSinceSnapshot.toFixed(1)}%) with no abnormal volume or urgent regulatory alerts.`;
    }

    return parts.join(' ');
  }
}

export const changeEngine = new MeaningfulChangeEngine();
