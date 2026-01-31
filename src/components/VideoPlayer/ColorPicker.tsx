interface ColorPickerProps {
  label: string;
  value: string;
  onChange: (color: string) => void;
  isDark: boolean;
}

export const ColorPicker = ({ label, value, onChange, isDark }: ColorPickerProps) => {
  const textPrimary = isDark ? 'text-white' : 'text-zinc-900';

  return (
    <div className="flex items-center gap-3">
      <div className={`text-xs font-medium ${textPrimary}`}>{label}</div>
      <input
        type="color"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-10 h-8 rounded cursor-pointer border-2 border-zinc-600 bg-transparent"
      />
    </div>
  );
};
