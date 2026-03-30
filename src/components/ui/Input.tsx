import { forwardRef, type InputHTMLAttributes } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className = "", ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label className="text-sm font-medium text-[#1a1a1a]">{label}</label>
        )}
        <input
          ref={ref}
          className={`
            w-full px-4 py-2.5 rounded-lg border border-[#E8E6E1]
            bg-white text-[#1a1a1a] text-sm
            placeholder:text-[#9B9B9B]
            focus:outline-none focus:ring-2 focus:ring-[#E07A5F]/30 focus:border-[#E07A5F]
            transition-all duration-200
            ${error ? "border-red-400 focus:ring-red-400/30 focus:border-red-400" : ""}
            ${className}
          `}
          {...props}
        />
        {error && <p className="text-xs text-red-500">{error}</p>}
      </div>
    );
  },
);

Input.displayName = "Input";
