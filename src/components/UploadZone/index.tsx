import { FileUp } from 'lucide-react';
import { MAX_FILE_SIZE } from '@/constants/config';

interface UploadZoneProps {
  isDark: boolean;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export const UploadZone = ({ isDark, onFileChange }: UploadZoneProps) => {
  const textPrimary = isDark ? 'text-white' : 'text-zinc-900';
  const textSecondary = isDark ? 'text-zinc-400' : 'text-zinc-500';

  return (
    <label
      className={`flex flex-col items-center justify-center w-full h-80 border-2 border-dashed rounded-2xl cursor-pointer transition-all group ${
        isDark
          ? 'border-zinc-800 hover:bg-zinc-800/50 hover:border-indigo-500/50'
          : 'border-zinc-200 hover:bg-zinc-50 hover:border-indigo-300'
      }`}
    >
      <div className="flex flex-col items-center justify-center pt-5 pb-6">
        <div
          className={`p-5 rounded-full mb-6 transition-transform duration-300 group-hover:scale-110 shadow-lg ${
            isDark
              ? 'bg-zinc-900 text-zinc-400 group-hover:text-indigo-400'
              : 'bg-white text-zinc-400 group-hover:text-indigo-600'
          }`}
        >
          <FileUp className="w-10 h-10" />
        </div>
        <p className={`mb-2 text-lg font-medium ${textPrimary}`}>Drop video here or click to upload</p>
        <p className={`text-sm ${textSecondary}`}>MP4, WEBM, MOV (Max {MAX_FILE_SIZE / 1024 / 1024}MB)</p>
      </div>
      <input type="file" className="hidden" accept="video/*" onChange={onFileChange} />
    </label>
  );
};

export const handleFileValidation = (file: File): { valid: boolean; error?: string } => {
  if (file.size > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: `File size exceeds ${MAX_FILE_SIZE / 1024 / 1024}MB limit for this browser-based demo.`,
    };
  }
  return { valid: true };
};
