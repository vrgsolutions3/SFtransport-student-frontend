import { AlertCircle } from "lucide-react";

interface LicenseErrorBannerProps {
  error: string;
}

export function LicenseErrorBanner({ error }: LicenseErrorBannerProps) {
  if (!error) return null;

  return (
    <div className="bg-error-container border border-error-border text-error text-sm rounded-xl px-4 py-3 mb-5 flex items-center gap-2">
      <AlertCircle size={16} />
      {error}
    </div>
  );
}
