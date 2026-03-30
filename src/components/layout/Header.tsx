import { BookOpen, User, Layers } from "lucide-react";
import { Button } from "@/components/ui/Button";

export type Page = "landing" | "reading" | "profile" | "depth";

interface HeaderProps {
  currentPage: Page;
  onNavigate: (page: Page) => void;
  scrolled?: boolean;
}

export function Header({ currentPage, onNavigate, scrolled = false }: HeaderProps) {
  return (
    <header
      className={`
        fixed top-0 left-0 right-0 z-50 transition-all duration-300
        ${scrolled ? "bg-[#FAFAF8]/90 backdrop-blur-md shadow-sm" : "bg-transparent"}
      `}
    >
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <button
          onClick={() => onNavigate("landing")}
          className="font-['Playfair_Display'] text-xl font-semibold text-[#1a1a1a] tracking-tight cursor-pointer"
        >
          Margins
        </button>

        {/* Navigation */}
        <nav className="flex items-center gap-1">
          <button
            onClick={() => onNavigate("reading")}
            className={`
              flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm cursor-pointer transition-colors
              ${currentPage === "reading"
                ? "text-[#E07A5F] bg-[#E07A5F]/5"
                : "text-[#6B6B6B] hover:text-[#1a1a1a] hover:bg-[#F5F5F0]"
              }
            `}
          >
            <BookOpen size={15} />
            <span className="hidden sm:inline">Read</span>
          </button>

          <button
            onClick={() => onNavigate("depth")}
            className={`
              flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm cursor-pointer transition-colors
              ${currentPage === "depth"
                ? "text-[#E07A5F] bg-[#E07A5F]/5"
                : "text-[#6B6B6B] hover:text-[#1a1a1a] hover:bg-[#F5F5F0]"
              }
            `}
          >
            <Layers size={15} />
            <span className="hidden sm:inline">Depth Levels</span>
          </button>

          <button
            onClick={() => onNavigate("profile")}
            className={`
              flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm cursor-pointer transition-colors
              ${currentPage === "profile"
                ? "text-[#E07A5F] bg-[#E07A5F]/5"
                : "text-[#6B6B6B] hover:text-[#1a1a1a] hover:bg-[#F5F5F0]"
              }
            `}
          >
            <User size={15} />
            <span className="hidden sm:inline">Profile</span>
          </button>

          {currentPage === "landing" && (
            <Button
              variant="primary"
              size="sm"
              onClick={() => onNavigate("reading")}
              className="ml-2"
            >
              Enter
            </Button>
          )}
        </nav>
      </div>
    </header>
  );
}
