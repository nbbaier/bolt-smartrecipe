import { FC } from "react";
import { Input } from "../ui/input";

interface SettingsInputProps {
  label: string;
  value: number | boolean;
  onChange: (value: number | boolean) => void;
  loading?: boolean;
  type?: "number" | "checkbox";
  min?: number;
  max?: number;
}

export const SettingsInput: FC<SettingsInputProps> = ({
  label,
  value,
  onChange,
  loading,
  type = "number",
  min,
  max,
}) => {
  if (type === "checkbox") {
    return (
      <div className="flex items-center space-x-2">
        <label className="text-sm font-medium text-secondary-700">
          {label}
        </label>
        <input
          type="checkbox"
          checked={!!value}
          onChange={(e) => onChange(e.target.checked)}
          disabled={loading}
          className="w-5 h-5 accent-primary"
        />
      </div>
    );
  }

  return (
    <div className="flex items-center space-x-2">
      <label className="text-sm font-medium text-secondary-700">{label}</label>
      <Input
        type="number"
        min={min}
        max={max}
        value={value as number}
        onChange={(e) => onChange(parseInt(e.target.value) || (min ?? 1))}
        disabled={loading}
        className="w-20 text-sm rounded-lg border border-secondary-300 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
      />
    </div>
  );
};
