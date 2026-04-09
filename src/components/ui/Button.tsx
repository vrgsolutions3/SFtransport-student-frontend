import { cn } from "@/lib/utils";
import { ButtonHTMLAttributes, forwardRef } from "react";
import { LucideIcon, Loader2 } from "lucide-react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline";
  size?: "sm" | "md" | "lg";
  fullWidth?: boolean;
  loading?: boolean;
  icon?: LucideIcon;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ children, variant = "primary", size = "md", fullWidth = false, loading = false, icon: Icon, className, disabled, ...props }, ref) => {
    
    const variants = {
      primary: "bg-primary text-white hover:bg-primary/90 shadow-lg shadow-primary/20",
      secondary: "bg-secondary text-white hover:bg-secondary/90 shadow-lg shadow-secondary/20",
      outline: "border-2 border-primary text-primary hover:bg-primary/10",
    };

    const sizes = {
      sm: "px-6 py-2.5 text-sm",
      md: "px-8 py-3 text-base",
      lg: "px-10 py-4 text-lg h-14",
    };

    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(
          "rounded-full font-bold transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-2",
          variants[variant],
          sizes[size],
          fullWidth && "w-full",
          className
        )}
        {...props}
      >
        {loading ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : (
          Icon && <Icon className="w-5 h-5" />
        )}
        {children}
      </button>
    );
  }
);
Button.displayName = "Button";