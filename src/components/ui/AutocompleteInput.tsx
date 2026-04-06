"use client";

import {
  useState,
  useRef,
  useEffect,
  KeyboardEvent,
  ChangeEvent,
  useId,
} from "react";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils"; // ajuste se necessário

interface AutocompleteInputProps {
  label: string;
  icon?: LucideIcon;
  placeholder?: string;
  options: string[];
  value: string;
  onValueChange: (value: string) => void;
  disabled?: boolean;
  onBlur?: () => void;
  required?: boolean;
  error?: string;
}

export function AutocompleteInput({
  label,
  icon: Icon,
  placeholder,
  options,
  value,
  onValueChange,
  disabled = false,
  onBlur,
  required = false,
  error,
}: AutocompleteInputProps) {
  const id = useId();

  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [inputValue, setInputValue] = useState(value);

  const inputRef = useRef<HTMLInputElement>(null);
  const listboxRef = useRef<HTMLUListElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const filteredOptions = options.filter((opt) =>
    opt.toLowerCase().includes(inputValue.toLowerCase()),
  );

  useEffect(() => {
    if (value !== inputValue) {
      setInputValue(value);
    }
  }, [value]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!wrapperRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
        setActiveIndex(-1);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    onValueChange(newValue);
    setIsOpen(true);
    setActiveIndex(-1);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (!filteredOptions.length) return;

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setIsOpen(true);
        setActiveIndex((prev) =>
          prev < filteredOptions.length - 1 ? prev + 1 : 0,
        );
        break;

      case "ArrowUp":
        e.preventDefault();
        setIsOpen(true);
        setActiveIndex((prev) =>
          prev > 0 ? prev - 1 : filteredOptions.length - 1,
        );
        break;

      case "Enter":
        e.preventDefault();
        if (activeIndex >= 0) {
          handleSelectOption(filteredOptions[activeIndex]);
        }
        break;

      case "Escape":
        setIsOpen(false);
        setActiveIndex(-1);
        inputRef.current?.blur();
        break;
    }
  };

  const handleSelectOption = (option: string) => {
    setInputValue(option);
    onValueChange(option);
    setIsOpen(false);
    setActiveIndex(-1);
  };

  const handleInputFocus = () => {
    if (!disabled && filteredOptions.length > 0) {
      setIsOpen(true);
    }
  };

  const handleInputBlur = () => {
    setTimeout(() => {
      if (!wrapperRef.current?.contains(document.activeElement)) {
        setIsOpen(false);
        setActiveIndex(-1);
      }
    }, 120);

    onBlur?.();
  };

  return (
    <div ref={wrapperRef} className="relative space-y-1.5">
      {/* Label */}
      <label
        htmlFor={id}
        className="text-sm font-medium text-on-surface-variant ml-1"
      >
        {label} {required && <span className="text-error">*</span>}
      </label>

      {/* Input container */}
      <div
        className={cn(
          "relative w-full min-w-0 flex items-center group bg-surface-container-low border-2 rounded-xl transition-all duration-150",
          error
            ? "border-error"
            : "border-outline hover:border-on-surface-variant focus-within:border-primary focus-within:shadow-[0_0_0_4px_var(--shadow-primary-soft)]",
          disabled && "opacity-50 cursor-not-allowed",
        )}
      >
        {/* Ícone */}
        {Icon && (
          <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
            <Icon
              className={cn(
                "w-5 h-5 transition-colors duration-150",
                "group-focus-within:text-primary",
                error ? "text-error" : "text-on-surface-variant",
              )}
            />
          </div>
        )}

        {/* Input */}
        <input
          id={id}
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={handleInputFocus}
          onBlur={handleInputBlur}
          disabled={disabled}
          placeholder={placeholder}
          className={cn(
            "w-full min-w-0 bg-transparent border-none outline-none ring-0 focus:ring-0 h-14 text-sm sm:text-base text-on-surface placeholder:text-on-surface-muted",
            Icon ? "pl-12" : "pl-4",
            "pr-4",
          )}
        />
      </div>

      {/* Dropdown */}
      {isOpen && filteredOptions.length > 0 && (
        <ul
          ref={listboxRef}
          className="absolute left-0 right-0 top-full z-50 mt-1 w-full max-w-full overflow-auto rounded-xl border border-outline-variant/30 bg-surface-container-low shadow-lg"
          style={{ maxHeight: "min(16rem, 45vh)" }}
        >
          {filteredOptions.map((option, index) => (
            <li
              key={option}
              className={cn(
                "px-4 py-3 cursor-pointer text-sm font-medium transition-colors wrap-break-word",
                activeIndex === index
                  ? "bg-primary text-white"
                  : "text-on-surface hover:bg-surface-container-high",
              )}
              onClick={() => handleSelectOption(option)}
              onMouseEnter={() => setActiveIndex(index)}
            >
              {option}
            </li>
          ))}
        </ul>
      )}

      {/* Empty */}
      {isOpen && filteredOptions.length === 0 && inputValue && (
        <div className="absolute left-0 right-0 top-full z-50 mt-1 w-full max-w-full rounded-xl border border-outline-variant/30 bg-surface-container-low p-4 text-center text-on-surface-variant text-sm shadow-lg">
          Nenhuma opção encontrada
        </div>
      )}

      {/* Error */}
      {error && (
        <p className="text-xs text-error mt-1 ml-1">
          {error}
        </p>
      )}
    </div>
  );
}