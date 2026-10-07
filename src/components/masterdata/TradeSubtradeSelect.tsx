import React, { useEffect, useState } from 'react';
import { dbService } from '@/lib/db';
import { MasterTrade } from '@/types';
import { Wrench, Tag, Edit2, List } from 'lucide-react';
import { parseTradeAndSubtrade } from '@/lib/tradeUtils';

export interface TradeSelection {
  tradeId: string;
  tradeName: string;
  subtradeId?: string;
  subtradeName?: string;
}

export interface TradeSubtradeSelectProps {
  companyId?: string;
  trades?: any[];
  subtrades?: any[];
  // Object mode
  value?: TradeSelection | null;
  onChange?: (selection: TradeSelection) => void;
  // Direct props mode
  selectedTradeId?: string;
  selectedTradeName?: string;
  selectedSubtrade?: string;
  onTradeChange?: (tradeId: string, tradeName: string) => void;
  onSubtradeChange?: (subtradeName: string) => void;
  required?: boolean;
  className?: string;
}

export const TradeSubtradeSelect: React.FC<TradeSubtradeSelectProps> = ({
  companyId = '',
  trades: passedTrades,
  subtrades: passedSubtrades,
  value,
  onChange,
  selectedTradeId: propTradeId,
  selectedTradeName: propTradeName,
  selectedSubtrade: propSubtrade,
  onTradeChange,
  onSubtradeChange,
  required = false,
  className = '',
}) => {
  const [trades, setTrades] = useState<MasterTrade[]>([]);
  const [availableSubtrades, setAvailableSubtrades] = useState<string[]>([]);
  const [isCustomSubtrade, setIsCustomSubtrade] = useState(false);

  // Load trades if not passed
  useEffect(() => {
    if (passedTrades && passedTrades.length > 0) {
      setTrades(passedTrades);
    } else {
      dbService.getTrades(companyId).then((list) => {
        if (list && list.length > 0) {
          setTrades(list);
        }
      }).catch(console.error);
    }
  }, [passedTrades, companyId]);

  // Determine effective trade ID and name from value or direct props
  const rawTradeId = value?.tradeId || propTradeId || '';
  const rawTradeName = value?.tradeName || propTradeName || '';
  const rawSubtrade = value?.subtradeName || value?.subtradeId || propSubtrade || '';

  const parsed = parseTradeAndSubtrade({
    tradeName: rawTradeName,
    trade: rawTradeName,
    subtradeName: rawSubtrade,
  });

  const activeTrade = trades.find((t) => {
    if (rawTradeId && t.id === rawTradeId) return true;
    if (parsed.trade && t.name.toLowerCase() === parsed.trade.toLowerCase()) return true;
    if (parsed.trade && t.codePrefix && t.codePrefix.toLowerCase() === parsed.trade.toLowerCase()) return true;
    if (parsed.trade && t.name.toLowerCase().includes(parsed.trade.toLowerCase())) return true;
    return false;
  });

  const effectiveTradeId = rawTradeId || (activeTrade ? activeTrade.id : '');
  const effectiveSubtrade = rawSubtrade || parsed.subtrade || '';

  useEffect(() => {
    if (passedSubtrades && passedSubtrades.length > 0) {
      setAvailableSubtrades(passedSubtrades.map((s: any) => (typeof s === 'string' ? s : s.name || '')));
      return;
    }
    if (activeTrade && activeTrade.subtrades) {
      setAvailableSubtrades(activeTrade.subtrades);
    } else {
      setAvailableSubtrades([]);
    }
  }, [activeTrade?.id, trades, passedSubtrades]);

  const handleTradeChangeInternal = (tradeId: string) => {
    const matched = trades.find((t) => t.id === tradeId);
    const tradeName = matched?.name || '';

    if (onChange) {
      onChange({
        tradeId,
        tradeName,
        subtradeId: '',
        subtradeName: '',
      });
    }
    if (onTradeChange) {
      onTradeChange(tradeId, tradeName);
    }
    if (onSubtradeChange) {
      onSubtradeChange('');
    }
  };

  const handleSubtradeChangeInternal = (subtradeName: string) => {
    if (onChange) {
      onChange({
        tradeId: effectiveTradeId,
        tradeName: activeTrade?.name || rawTradeName,
        subtradeId: subtradeName,
        subtradeName,
      });
    }
    if (onSubtradeChange) {
      onSubtradeChange(subtradeName);
    }
  };

  return (
    <div className={`grid grid-cols-1 sm:grid-cols-2 gap-3 ${className}`}>
      {/* Trade Discipline Selection */}
      <div>
        <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1.5">
          <Wrench className="w-3.5 h-3.5 text-[#ea580c]" />
          <span>Trade Discipline {required && <span className="text-red-500">*</span>}</span>
        </label>
        <select
          value={effectiveTradeId}
          onChange={(e) => handleTradeChangeInternal(e.target.value)}
          required={required}
          className="w-full px-3.5 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl text-[13px] font-medium bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:border-[#ea580c] transition shadow-sm"
        >
          <option value="">-- Select Trade --</option>
          {trades.map((t) => (
            <option key={t.id} value={t.id}>
              {t.codePrefix ? `[${t.codePrefix}] ` : ''}{t.name}
            </option>
          ))}
        </select>
      </div>

      {/* Subtrade / Activity Selection */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <Tag className="w-3.5 h-3.5 text-[#ea580c]" />
            <span>Subtrade / Activity</span>
          </label>
          <button
            type="button"
            onClick={() => setIsCustomSubtrade(!isCustomSubtrade)}
            className="text-[10px] text-brand-600 dark:text-brand-400 hover:underline flex items-center gap-1 font-semibold transition"
          >
            {isCustomSubtrade ? (
              <>
                <List className="w-3 h-3" />
                <span>Choose from List</span>
              </>
            ) : (
              <>
                <Edit2 className="w-3 h-3" />
                <span>Custom Subtrade</span>
              </>
            )}
          </button>
        </div>

        {isCustomSubtrade ? (
          <input
            type="text"
            value={effectiveSubtrade}
            onChange={(e) => handleSubtradeChangeInternal(e.target.value)}
            placeholder="e.g. Rebar Fixing, Formwork, Curing..."
            className="w-full px-3.5 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl text-[13px] font-medium bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:border-[#ea580c] transition shadow-sm"
          />
        ) : (
          <select
            value={effectiveSubtrade}
            onChange={(e) => {
              if (e.target.value === '__custom__') {
                setIsCustomSubtrade(true);
              } else {
                handleSubtradeChangeInternal(e.target.value);
              }
            }}
            className="w-full px-3.5 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl text-[13px] font-medium bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:border-[#ea580c] transition shadow-sm"
          >
            <option value="">-- General / All Subtrades --</option>
            {availableSubtrades.map((st) => (
              <option key={st} value={st}>
                {st}
              </option>
            ))}
            {effectiveSubtrade && !availableSubtrades.includes(effectiveSubtrade) && (
              <option value={effectiveSubtrade}>{effectiveSubtrade} (Custom)</option>
            )}
            <option value="__custom__">➕ Type Custom Subtrade...</option>
          </select>
        )}
      </div>
    </div>
  );
};

export default TradeSubtradeSelect;
