'use client';
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import ExploreContent from "@/components/explore/ExploreContent";

// Public Explore — same browsing surface the dashboards embed, wrapped in the
// marketing chrome so guests can look around before signing up.
const Explore = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-20 pb-16">
        <ExploreContent />
      </main>
      <Footer />
    </div>
  );
};

export default Explore;
