import { useState, useEffect } from "react";
import { Header, type Page } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import LandingPage from "@/app/page";
import ReadArticlePage from "@/app/read/[articleId]/page";
import ProfilePage from "@/app/profile/[userId]/page";
import { DepthLevelsPage } from "@/pages/DepthLevelsPage";

export default function App() {
  const [currentPage, setCurrentPage] = useState<Page>("landing");
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Scroll to top on page change
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [currentPage]);

  const renderPage = () => {
    switch (currentPage) {
      case "landing":
        return <LandingPage onNavigate={setCurrentPage} />;
      case "reading":
        return <ReadArticlePage />;
      case "profile":
        return <ProfilePage />;
      case "depth":
        return <DepthLevelsPage />;
      default:
        return <LandingPage onNavigate={setCurrentPage} />;
    }
  };

  return (
    <div className="min-h-screen bg-[#FAFAF8]">
      <Header
        currentPage={currentPage}
        onNavigate={setCurrentPage}
        scrolled={scrolled}
      />
      <main>{renderPage()}</main>
      {currentPage !== "reading" && <Footer />}
    </div>
  );
}
