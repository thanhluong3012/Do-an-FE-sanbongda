import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import HeroSection from "@/components/sections/HeroSection";
import FieldsSection from "@/components/sections/FieldsSection";
import BookingSection from "@/components/sections/BookingSection";
import MatchesSection from "@/components/sections/MatchesSection";
import FeaturesSection from "@/components/sections/FeaturesSection";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        <HeroSection />
        <FieldsSection />
        <BookingSection />
        <MatchesSection />
        <FeaturesSection />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
