"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Compass, Sparkles, CloudRain, Wallet, ShieldAlert, Heart, Calendar, ArrowRight } from "lucide-react";

export default function LandingPage() {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-mesh text-zinc-100 flex flex-col selection:bg-indigo-500 selection:text-white">
      {/* Header */}
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          isScrolled
            ? "bg-zinc-950/80 backdrop-blur-md border-b border-zinc-800/50 py-4"
            : "bg-transparent py-6"
        }`}
      >
        <div className="max-w-7xl mx-auto px-6 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6 text-white">
                <path d="M3 20L10 6L16 15L18 12L21 20" />
                <path d="M10 6L9.5 4.5" stroke="#f43f5e" strokeWidth="1.5" />
                <circle cx="9.5" cy="3.5" r="1" fill="#f43f5e" />
                <path d="M10 6L11.5 7.5L12.5 9" />
              </svg>
            </div>
            <span className="text-xl font-bold tracking-tight text-white">
              Travel<span className="text-indigo-400">Mitra</span>
            </span>
          </div>

          <nav className="hidden md:flex items-center space-x-8 text-sm font-medium text-zinc-400">
            <a href="#features" className="hover:text-white transition-colors">Features</a>
            <a href="#experience" className="hover:text-white transition-colors">Adaptability</a>
            <a href="#pricing" className="hover:text-white transition-colors">Pricing</a>
            <a href="#faq" className="hover:text-white transition-colors">FAQ</a>
          </nav>

          <div className="flex items-center space-x-4">
            <Link
              href="/login"
              className="text-sm font-medium text-zinc-300 hover:text-white transition-colors"
            >
              Sign In
            </Link>
            <Link
              href="/signup"
              className="px-4 py-2 rounded-xl text-sm font-medium bg-indigo-600 hover:bg-indigo-500 text-white transition-all shadow-md shadow-indigo-600/20 flex items-center space-x-1"
            >
              <span>Get Started</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-32 pb-24 md:pt-48 md:pb-36 flex flex-col items-center justify-center text-center px-6 overflow-hidden">
        <div className="absolute inset-0 z-0 flex items-center justify-center opacity-30">
          <div className="w-[500px] h-[500px] rounded-full bg-indigo-500/10 blur-[120px] animate-pulse" />
          <div className="w-[300px] h-[300px] rounded-full bg-rose-500/10 blur-[100px] delay-1000 animate-pulse" />
        </div>

        <div className="max-w-4xl mx-auto z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <span className="inline-flex items-center space-x-1 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 mb-6">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Next-Gen Travel AI is Here</span>
            </span>

            <h1 className="text-4xl md:text-7xl font-extrabold tracking-tight text-white mb-6 leading-tight">
              Plan and Adapt Trips <br />
              <span className="text-gradient">Intelligently In Real-Time</span>
            </h1>

            <p className="text-lg md:text-xl text-zinc-400 max-w-2xl mx-auto mb-10 leading-relaxed">
              TravelMitra doesn't just write generic itineraries. It creates beautiful schedules and automatically responds to sudden weather shifts, budget constraints, and group votes.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="flex flex-col sm:flex-row justify-center items-center space-y-4 sm:space-y-0 sm:space-x-4 mb-16"
          >
            <Link
              href="/signup"
              className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-semibold text-base shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 transition-all hover:scale-[1.02]"
            >
              Plan Your Free Trip
            </Link>
            <a
              href="#features"
              className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-zinc-900/80 border border-zinc-800 text-zinc-300 hover:text-white hover:bg-zinc-800 font-semibold text-base transition-all"
            >
              Explore Features
            </a>
          </motion.div>

          {/* Floating cards showcase */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto"
          >
            <div className="glass-card p-6 text-left relative overflow-hidden group hover:border-indigo-500/30 transition-all">
              <div className="w-12 h-12 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 mb-4 group-hover:scale-110 transition-transform">
                <Sparkles className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">AI Trip Generator</h3>
              <p className="text-zinc-400 text-sm">Input style, preferences, budget and instantly receive structured daily routes, accommodations, and custom packing checklists.</p>
            </div>

            <div className="glass-card p-6 text-left relative overflow-hidden group hover:border-purple-500/30 transition-all">
              <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-400 mb-4 group-hover:scale-110 transition-transform">
                <CloudRain className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Dynamic Weather Adapting</h3>
              <p className="text-zinc-400 text-sm">Heavy rain showers incoming? Our system replaces outdoor activities with backup indoor activities and updates your itinerary instantly.</p>
            </div>

            <div className="glass-card p-6 text-left relative overflow-hidden group hover:border-rose-500/30 transition-all">
              <div className="w-12 h-12 rounded-xl bg-rose-500/10 flex items-center justify-center text-rose-400 mb-4 group-hover:scale-110 transition-transform">
                <Wallet className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Expense Split & Tracker</h3>
              <p className="text-zinc-400 text-sm">Track real-time spendings by category (Food, Hotels, Transport) and calculate splits effortlessly with group travel friends.</p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Feature Section */}
      <section id="features" className="py-24 border-t border-zinc-900 bg-zinc-950/40">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl md:text-5xl font-bold text-white mb-4">Every Travel Feature You Need</h2>
            <p className="text-zinc-400 text-lg">We solve travel friction points so you can focus entirely on enjoying the journey.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Feature 1 */}
            <div className="glass-card p-6 hover:translate-y-[-4px] transition-transform">
              <div className="w-10 h-10 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-400 mb-4">
                <Compass className="w-5 h-5" />
              </div>
              <h4 className="text-lg font-bold text-white mb-2">Hidden Gems Finder</h4>
              <p className="text-zinc-400 text-sm">Discovers local street food stalls, secret view points, and cozy coffee spots hidden away from typical tourist crowds.</p>
            </div>

            {/* Feature 2 */}
            <div className="glass-card p-6 hover:translate-y-[-4px] transition-transform">
              <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center text-purple-400 mb-4">
                <Calendar className="w-5 h-5" />
              </div>
              <h4 className="text-lg font-bold text-white mb-2">Local Events recommendations</h4>
              <p className="text-zinc-400 text-sm">Recommends nearby concerts, food festivals, local flea markets, and sports taking place during your trip dates.</p>
            </div>

            {/* Feature 3 */}
            <div className="glass-card p-6 hover:translate-y-[-4px] transition-transform">
              <div className="w-10 h-10 rounded-lg bg-rose-500/10 flex items-center justify-center text-rose-400 mb-4">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <h4 className="text-lg font-bold text-white mb-2">Scam & Safety warnings</h4>
              <p className="text-zinc-400 text-sm">Notifies you of pickpocket risk spots, overpricing taxi traps, and common tourist scams for specific destinations.</p>
            </div>

            {/* Feature 4 */}
            <div className="glass-card p-6 hover:translate-y-[-4px] transition-transform">
              <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400 mb-4">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <h4 className="text-lg font-bold text-white mb-2">Emergency Mode</h4>
              <p className="text-zinc-400 text-sm">Locates the nearest hospitals, pharmacies, police stations, and embassies with offline-ready local emergency guides.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-24 border-t border-zinc-900">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl md:text-5xl font-bold text-white mb-4">Transparent Pricing</h2>
            <p className="text-zinc-400 text-lg">Choose a plan that fits your travel lifestyle.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Free Plan */}
            <div className="glass-card p-8 border border-zinc-800 text-left relative overflow-hidden flex flex-col justify-between">
              <div>
                <h3 className="text-xl font-bold text-white mb-2">Explorer</h3>
                <p className="text-zinc-400 text-sm mb-6">Perfect for occasional solo travelers.</p>
                <div className="text-3xl font-extrabold text-white mb-6">$0 <span className="text-zinc-500 text-sm font-medium">/ forever</span></div>
                <ul className="space-y-3 text-zinc-300 text-sm mb-8">
                  <li className="flex items-center space-x-2">✓ <span>AI Trip Generator</span></li>
                  <li className="flex items-center space-x-2">✓ <span>Interactive Itineraries</span></li>
                  <li className="flex items-center space-x-2">✓ <span>Packing Checklist</span></li>
                  <li className="flex items-center space-x-2">✓ <span>Expense Tracker</span></li>
                </ul>
              </div>
              <Link href="/signup" className="w-full py-3 rounded-xl bg-zinc-800 text-white font-medium text-center hover:bg-zinc-700 transition-colors">
                Start for Free
              </Link>
            </div>

            {/* Premium Plan */}
            <div className="glass-card p-8 border-2 border-indigo-500/50 text-left relative overflow-hidden flex flex-col justify-between">
              <div className="absolute top-0 right-0 bg-indigo-500 text-white text-xs font-semibold px-3 py-1 rounded-bl-xl">POPULAR</div>
              <div>
                <h3 className="text-xl font-bold text-white mb-2">Nomad Premium</h3>
                <p className="text-zinc-400 text-sm mb-6">Best for frequent flyers and group trips.</p>
                <div className="text-3xl font-extrabold text-white mb-6">$9 <span className="text-zinc-500 text-sm font-medium">/ month</span></div>
                <ul className="space-y-3 text-zinc-300 text-sm mb-8">
                  <li className="flex items-center space-x-2">✓ <span>Everything in Explorer</span></li>
                  <li className="flex items-center space-x-2">✓ <span>Dynamic Weather re-planning</span></li>
                  <li className="flex items-center space-x-2">✓ <span>Group Shared Itineraries & Voting</span></li>
                  <li className="flex items-center space-x-2">✓ <span>Offline Map & QR Ticket Caches</span></li>
                  <li className="flex items-center space-x-2">✓ <span>Emergency Support & Scam Alerts</span></li>
                </ul>
              </div>
              <Link href="/signup" className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-center shadow-lg shadow-indigo-600/25 transition-all">
                Upgrade Now
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto py-12 border-t border-zinc-900 bg-zinc-950/60 text-center text-sm text-zinc-500">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-500 flex items-center justify-center text-white">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 text-white">
                <path d="M3 20L10 6L16 15L18 12L21 20" />
              </svg>
            </div>
            <span className="font-bold text-white text-sm">TravelMitra</span>
          </div>
          <p className="text-xs">&copy; {new Date().getFullYear()} TravelMitra Inc. Designed for seamless global voyages.</p>
          <div className="flex space-x-6 text-xs">
            <a href="#" className="hover:text-zinc-300">Privacy Policy</a>
            <a href="#" className="hover:text-zinc-300">Terms of Service</a>
            <a href="#" className="hover:text-zinc-300">Contact Support</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
