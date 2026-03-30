import type { HTMLAttributes, ReactNode } from "react";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  variant?: "default" | "annotation" | "elevated";
  padding?: "sm" | "md" | "lg";
}

const variantStyles = {
  default: "bg-white border border-[#E8E6E1]",
  annotation: "bg-white border-l-3 border-l-[#E07A5F] border border-[#E8E6E1] border-l-[#E07A5F]",
  elevated: "bg-white shadow-lg shadow-black/5 border border-[#E8E6E1]",
};

const paddingStyles = {
  sm: "p-3",
  md: "p-5",
  lg: "p-7",
};

export function Card({
  children,
  variant = "default",
  padding = "md",
  className = "",
  ...props
}: CardProps) {
  return (
    <div
      className={`rounded-lg ${variantStyles[variant]} ${paddingStyles[padding]} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
