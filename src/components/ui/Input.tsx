"use client";

import { cn } from "@/lib/utils";
import { InputHTMLAttributes, forwardRef, useState } from "react";
import { Eye, EyeOff, AlertCircle, LucideIcon } from "lucide-react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: LucideIcon; // Agora aceita um componente Lucide
  rightElement?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, icon: Icon, rightElement, className, type, ...props }, ref) => {
    const [showPassword, setShowPassword] = useState(false);
    const inputType = type === "password" && showPassword ? "text" : type;

    return (
      <div className="space-y-1.5">
        {label && (
          <label className="text-sm font-medium text-on-surface-variant ml-1">
            {label}
          </label>
        )}

        <div className={cn(
          "relative flex items-center group bg-surface-container-low border-2 rounded-xl transition-all duration-150",
          error ? "border-error" : "border-outline hover:border-on-surface-variant focus-within:border-primary focus-within:shadow-[0_0_0_4px_var(--shadow-primary-soft)]"
        )}>
          
          {/* Ícone esquerdo */}
          {Icon && (
            <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
              <Icon 
                className={cn(
                  "w-5 h-5 transition-colors duration-150",
                  "group-focus-within:text-primary",
                  error ? "text-error" : "text-on-surface-variant"
                )}
              />
            </div>
          )}

          <input
            ref={ref}
            type={inputType}
            className={cn(
              "w-full bg-transparent border-none outline-none ring-0 focus:ring-0 h-14 text-base text-on-surface placeholder:text-on-surface-muted",
              Icon ? "pl-12" : "pl-4",
              rightElement || type === "password" ? "pr-12" : "pr-4",
              className
            )}
            {...props}
          />

          {/* Toggle senha Lucide */}
          {type === "password" && (
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute inset-y-0 right-4 flex items-center text-on-surface-variant hover:text-on-surface transition-colors"
              tabIndex={-1}
              aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          )}

          {rightElement && (
            <div className="absolute inset-y-0 right-4 flex items-center">
              {rightElement}
            </div>
          )}
        </div>

        {error && (
          <p className="flex items-center gap-1 text-xs text-error mt-1 ml-1">
            <AlertCircle size={14} />
            {error}
          </p>
        )}
      </div>
    );
  }
);
Input.displayName = "Input";