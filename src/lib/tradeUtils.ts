import { ObservationItem } from '@/types';

export interface ParsedTradeInfo {
  trade: string;
  subtrade: string;
  tradeId?: string;
  subtradeId?: string;
  displayLabel: string;
}

/**
 * Parses and separates trade and subtrade from an observation object or raw string.
 * Handles patterns such as "Structural - Rebar", "Structural / Rebar", "Architectural - Waterproofing", etc.
 */
export function parseTradeAndSubtrade(
  obsOrString?: Partial<ObservationItem> | string | null
): ParsedTradeInfo {
  if (!obsOrString) {
    return {
      trade: 'General Works',
      subtrade: '',
      displayLabel: 'General Works',
    };
  }

  let rawTrade = '';
  let rawTradeName = '';
  let rawSubtrade = '';
  let rawSubtradeName = '';
  let tradeId: string | undefined;
  let subtradeId: string | undefined;

  if (typeof obsOrString === 'string') {
    rawTrade = obsOrString;
  } else {
    rawTrade = obsOrString.trade || '';
    rawTradeName = obsOrString.tradeName || '';
    rawSubtrade = obsOrString.subtrade || '';
    rawSubtradeName = obsOrString.subtradeName || '';
    tradeId = obsOrString.tradeId;
    subtradeId = obsOrString.subtradeId;
  }

  let finalTrade = rawTradeName || rawTrade || '';
  let finalSubtrade = rawSubtradeName || rawSubtrade || '';

  // If subtrade is not separately specified, check if trade contains compound separator
  if (!finalSubtrade && finalTrade) {
    if (finalTrade.includes(' - ')) {
      const parts = finalTrade.split(' - ');
      finalTrade = parts[0].trim();
      finalSubtrade = parts.slice(1).join(' - ').trim();
    } else if (finalTrade.includes(' / ')) {
      const parts = finalTrade.split(' / ');
      finalTrade = parts[0].trim();
      finalSubtrade = parts.slice(1).join(' / ').trim();
    } else if (finalTrade.includes('›')) {
      const parts = finalTrade.split('›');
      finalTrade = parts[0].trim();
      finalSubtrade = parts.slice(1).join('›').trim();
    }
  }

  if (!finalTrade) finalTrade = 'General Works';

  const displayLabel = finalSubtrade ? `${finalTrade} • ${finalSubtrade}` : finalTrade;

  return {
    trade: finalTrade,
    subtrade: finalSubtrade,
    tradeId,
    subtradeId,
    displayLabel,
  };
}

/**
 * Combines trade and subtrade for canonical compound string representations if needed.
 */
export function formatCompoundTrade(trade?: string, subtrade?: string): string {
  const t = (trade || '').trim();
  const st = (subtrade || '').trim();
  if (t && st) return `${t} - ${st}`;
  return t || st || 'General Works';
}

