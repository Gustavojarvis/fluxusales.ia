import { Navbar } from '@/components/landing/navbar';
import { Hero } from '@/components/landing/hero';
import { HowItWorks } from '@/components/landing/how-it-works';
import { Benefits } from '@/components/landing/benefits';
import { Demo } from '@/components/landing/demo';
import { Plans } from '@/components/landing/plans';
import { FAQ } from '@/components/landing/faq';
import { CTA } from '@/components/landing/cta';
import { Footer } from '@/components/landing/footer';

export default function Home() {
  return (
    <div className="relative min-h-screen bg-background">
      <Navbar />
      <main>
        <Hero />
        <HowItWorks />
        <Benefits />
        <Demo />
        <Plans />
        <FAQ />
        <CTA />
      </main>
      <Footer />
    </div>
  );
}
