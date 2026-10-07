import React from "react";
import { LucideIcon } from "lucide-react";

export interface SmartFieldProps {
  label: string;
  value: string | number;
  onChange: (val: string) => void;
  unit?: string;
  type?: "text" | "number";
  placeholder?: string;
  hint?: string;
  icon?: LucideIcon | React.ElementType;
  disabled?: boolean;
  required?: boolean;
  inputRef?: React.Ref<HTMLInputElement>;
  className?: string;
  step?: string;
}

export const SmartField: React.FC<SmartFieldProps> = ({
  label,
  value,
  onChange,
  unit,
  type = "text",
  placeholder,
  hint,
  icon: Icon,
  disabled = false,
  required = false,
  inputRef,
  className = "",
  step = "any",
}) => {
  return (
    <div className={`space-y-1.5 ${className}`}>
      <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
        {label} {required && <span className="text-red-500 dark:text-red-400">*</span>}
      </label>
      <div className="relative flex items-center">
        {Icon && (
          <div className="absolute left-3 text-slate-400 dark:text-slate-500 pointer-events-none flex items-center">
            <Icon size={14} />
          </div>
        )}
        <input
          ref={inputRef}
          type={type}
          step={type === "number" ? step : undefined}
          disabled={disabled}
          required={required}
          value={value ?? ""}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
          className={`w-full px-3 py-2 text-[13px] font-mono font-bold rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-600 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-all ${
            Icon ? "pl-8" : ""
          } ${unit ? "pr-10" : ""} ${disabled ? "opacity-60 cursor-not-allowed bg-slate-100 dark:bg-slate-950" : ""}`}
        />
        {unit && (
          <div className="absolute right-2.5 px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[10px] font-bold font-mono text-slate-600 dark:text-slate-400 pointer-events-none">
            {unit}
          </div>
        )}
      </div>
      {hint && (
        <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight">{hint}</p>
      )}
    </div>
  );
};
