export function Footer() {
  return (
    <footer className="border-t border-[#E8E6E1] bg-[#FAFAF8]">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-6 py-10 text-center sm:flex-row sm:text-left">
        <p className="font-serif text-sm italic text-[#6B6B6B]">
          Built for depth, not engagement.
        </p>

        <a
          href="https://github.com/placeholder/margins"
          target="_blank"
          rel="noreferrer"
          className="text-sm text-[#6B6B6B] transition-colors hover:text-[#1a1a1a]"
        >
          GitHub
        </a>
      </div>
    </footer>
  );
}
