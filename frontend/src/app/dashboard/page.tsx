"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { 
  Compass, Sparkles, LogOut, User, MapPin, Calendar, 
  Wallet, Users, Trash2, Bell, AlertTriangle, Cloud, 
  ChevronRight, Trophy, BarChart3, Clock, Loader2
} from "lucide-react";
import api from "@/lib/api";

export default function DashboardPage() {
  const router = useRouter();
  
  // States
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [trips, setTrips] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [loadingTrips, setLoadingTrips] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState("");

  // Form States
  const [destination, setDestination] = useState("");
  const [budgetLimit, setBudgetLimit] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [travelStyle, setTravelStyle] = useState("Solo");
  const [interests, setInterests] = useState("");
  const [foodPreference, setFoodPreference] = useState("");
  const [travelerCount, setTravelerCount] = useState(1);

  // Authentication check
  useEffect(() => {
    const token = localStorage.getItem("travelmitra_token");
    if (!token) {
      router.push("/login");
      return;
    }
    
    // Load local user cache
    const cachedUser = localStorage.getItem("travelmitra_user");
    if (cachedUser) {
      setCurrentUser(JSON.parse(cachedUser));
    }
    
    fetchDashboardData();
  }, [router]);

  const fetchDashboardData = async () => {
    try {
      setLoadingTrips(true);
      const [tripsRes, notifyRes] = await Promise.all([
        api.getTrips(),
        api.getNotifications()
      ]);
      setTrips(tripsRes.trips || []);
      setNotifications(notifyRes.notifications || []);
    } catch (err) {
      console.error("Error loading dashboard data:", err);
    } finally {
      setLoadingTrips(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("travelmitra_token");
    localStorage.removeItem("travelmitra_user");
    router.push("/");
  };

  const handleGenerateTrip = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setGenerating(true);

    try {
      const response = await api.generateTrip({
        destination,
        budgetLimit,
        startDate,
        endDate,
        travelStyle,
        interests,
        foodPreference,
        travelerCount
      });
      // Redirect to newly generated trip
      router.push(`/trips/${response.trip.id}`);
    } catch (err: any) {
      setError(err.message || "Failed to generate AI trip. Please try again.");
      setGenerating(false);
    }
  };

  const handleDeleteTrip = async (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm("Are you sure you want to delete this trip? This cannot be undone.")) return;

    try {
      await api.deleteTrip(id);
      setTrips(prev => prev.filter(t => t.id !== id));
    } catch (err) {
      alert("Failed to delete trip.");
    }
  };

  const handleMarkAsRead = async (id: string) => {
    try {
      await api.markNotificationRead(id);
      setNotifications(prev => 
        prev.map(n => n.id === id ? { ...n, isRead: true } : n)
      );
    } catch (err) {
      console.error(err);
    }
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <div className="min-h-screen bg-gradient-mesh text-zinc-100 flex flex-col selection:bg-indigo-500 selection:text-white">
      {/* Header */}
      <header className="bg-zinc-950/40 backdrop-blur-md border-b border-zinc-800/60 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <Link href="/dashboard" className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 text-white">
                <path d="M3 20L10 6L16 15L18 12L21 20" />
                <path d="M10 6L9.5 4.5" stroke="#f43f5e" strokeWidth="1.5" />
                <circle cx="9.5" cy="3.5" r="1" fill="#f43f5e" />
                <path d="M10 6L11.5 7.5L12.5 9" />
              </svg>
            </div>
            <span className="font-bold tracking-tight text-white text-lg">
              Travel<span className="text-indigo-400">Mitra</span>
            </span>
          </Link>

          {/* User info & controls */}
          <div className="flex items-center space-x-4">
            {/* Notification Bell */}
            <div className="relative">
              <button 
                onClick={() => setShowNotifications(!showNotifications)}
                className="w-10 h-10 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-400 hover:text-white relative hover:bg-zinc-800 transition-colors"
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-2 right-2 w-2.5 h-2.5 rounded-full bg-rose-500 ring-2 ring-zinc-900" />
                )}
              </button>

              {/* Notification Dropdown */}
              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 glass-card border border-zinc-800/80 p-4 shadow-xl z-50">
                  <div className="flex justify-between items-center mb-3 pb-2 border-b border-zinc-800">
                    <h4 className="font-bold text-sm text-white">Alerts & Notifications</h4>
                    <span className="text-xs text-zinc-500">{unreadCount} unread</span>
                  </div>
                  <div className="max-h-60 overflow-y-auto space-y-2 scrollbar-hide">
                    {notifications.length === 0 ? (
                      <p className="text-xs text-zinc-500 text-center py-4">No notifications yet.</p>
                    ) : (
                      notifications.map(n => (
                        <div 
                          key={n.id} 
                          onClick={() => handleMarkAsRead(n.id)}
                          className={`p-3 rounded-lg border text-left cursor-pointer transition-all ${
                            n.isRead 
                              ? "bg-zinc-900/20 border-zinc-800/40 opacity-60" 
                              : "bg-indigo-950/15 border-indigo-900/30 hover:bg-indigo-950/25"
                          }`}
                        >
                          <div className="flex items-start space-x-2">
                            {n.type === "WeatherAlert" ? (
                              <Cloud className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
                            ) : n.type === "BudgetAlert" ? (
                              <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                            ) : (
                              <Sparkles className="w-4 h-4 text-indigo-400 flex-shrink-0 mt-0.5" />
                            )}
                            <div>
                              <p className="text-xs text-zinc-200 leading-tight">{n.message}</p>
                              <span className="text-[10px] text-zinc-500 block mt-1">
                                {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Profile/Logout */}
            <div className="flex items-center space-x-2 bg-zinc-900 border border-zinc-800 pl-3 pr-2 py-1.5 rounded-xl text-sm font-medium">
              <User className="w-4 h-4 text-indigo-400" />
              <span className="text-zinc-200">{currentUser?.name || "Traveler"}</span>
              <button 
                onClick={handleLogout}
                className="w-6 h-6 rounded-lg bg-zinc-800 hover:bg-rose-950/40 hover:text-rose-400 flex items-center justify-center transition-colors ml-2"
                title="Log Out"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Panel */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-6 py-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left 2 Cols: Form and Trips */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* AI Generator Form */}
          <div className="glass-card p-6 border border-zinc-800/80 relative overflow-hidden">
            {generating && (
              <div className="absolute inset-0 bg-zinc-950/80 backdrop-blur-sm z-30 flex flex-col items-center justify-center text-center p-6">
                <Loader2 className="w-12 h-12 text-indigo-500 animate-spin mb-4" />
                <h3 className="text-lg font-bold text-white mb-2">Generating Intelligent Itinerary...</h3>
                <p className="text-zinc-400 text-sm max-w-md">
                  Gemini AI is crafting custom daily routes, calculating budgets, creating your packing lists, and setting up emergency recommendations. Please wait a few seconds.
                </p>
              </div>
            )}

            <div className="flex items-center space-x-2 mb-6">
              <Sparkles className="w-5 h-5 text-indigo-400" />
              <h2 className="text-xl font-bold text-white">AI Custom Trip Planner</h2>
            </div>

            {error && (
              <div className="mb-4 p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm flex items-center space-x-2">
                <AlertTriangle className="w-4 h-4" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleGenerateTrip} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-zinc-400 text-xs font-semibold uppercase tracking-wider mb-2">
                  Destination
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-3.5 w-4 h-4 text-zinc-500" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. Paris, Tokyo, Bali"
                    className="w-full glass-input pl-9"
                    value={destination}
                    onChange={e => setDestination(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="block text-zinc-400 text-xs font-semibold uppercase tracking-wider mb-2">
                  Budget (USD Limit)
                </label>
                <div className="relative">
                  <Wallet className="absolute left-3 top-3.5 w-4 h-4 text-zinc-500" />
                  <input
                    type="number"
                    required
                    placeholder="e.g. 1500"
                    className="w-full glass-input pl-9"
                    value={budgetLimit}
                    onChange={e => setBudgetLimit(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="block text-zinc-400 text-xs font-semibold uppercase tracking-wider mb-2">
                  Start Date
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-3.5 w-4 h-4 text-zinc-500" />
                  <input
                    type="date"
                    required
                    className="w-full glass-input pl-9"
                    value={startDate}
                    onChange={e => setStartDate(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="block text-zinc-400 text-xs font-semibold uppercase tracking-wider mb-2">
                  End Date
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-3.5 w-4 h-4 text-zinc-500" />
                  <input
                    type="date"
                    required
                    className="w-full glass-input pl-9"
                    value={endDate}
                    onChange={e => setEndDate(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="block text-zinc-400 text-xs font-semibold uppercase tracking-wider mb-2">
                  Travel Style
                </label>
                <select
                  className="w-full glass-input appearance-none bg-zinc-950/40"
                  value={travelStyle}
                  onChange={e => setTravelStyle(e.target.value)}
                >
                  <option value="Solo">Solo Traveler</option>
                  <option value="Couple">Couple</option>
                  <option value="Family">Family</option>
                  <option value="Backpacker">Backpacker (Budget)</option>
                  <option value="Nomad">Digital Nomad</option>
                  <option value="Adventure">Adventure Traveler</option>
                  <option value="Luxury">Luxury Escape</option>
                </select>
              </div>

              <div>
                <label className="block text-zinc-400 text-xs font-semibold uppercase tracking-wider mb-2">
                  Travelers Count
                </label>
                <div className="relative">
                  <Users className="absolute left-3 top-3.5 w-4 h-4 text-zinc-500" />
                  <input
                    type="number"
                    min="1"
                    className="w-full glass-input pl-9"
                    value={travelerCount}
                    onChange={e => setTravelerCount(parseInt(e.target.value) || 1)}
                  />
                </div>
              </div>

              <div>
                <label className="block text-zinc-400 text-xs font-semibold uppercase tracking-wider mb-2">
                  Interests (Comma Separated)
                </label>
                <input
                  type="text"
                  placeholder="e.g. museums, beaches, nightlife"
                  className="w-full glass-input"
                  value={interests}
                  onChange={e => setInterests(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-zinc-400 text-xs font-semibold uppercase tracking-wider mb-2">
                  Food Preferences
                </label>
                <input
                  type="text"
                  placeholder="e.g. vegetarian, street food, local food"
                  className="w-full glass-input"
                  value={foodPreference}
                  onChange={e => setFoodPreference(e.target.value)}
                />
              </div>

              <div className="md:col-span-2 pt-2">
                <button
                  type="submit"
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white font-bold flex items-center justify-center space-x-2 shadow-lg shadow-indigo-500/25 transition-all hover:scale-[1.01]"
                >
                  <Sparkles className="w-5 h-5 animate-pulse" />
                  <span>Generate AI Itinerary</span>
                </button>
              </div>
            </form>
          </div>

          {/* Saved Trips Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-white flex items-center space-x-2">
              <Compass className="w-5 h-5 text-indigo-400" />
              <span>Your Saved Itineraries</span>
            </h3>

            {loadingTrips ? (
              <div className="glass-card p-12 text-center flex flex-col items-center justify-center">
                <Loader2 className="w-8 h-8 text-indigo-500 animate-spin mb-2" />
                <p className="text-zinc-500 text-sm">Retrieving your schedules...</p>
              </div>
            ) : trips.length === 0 ? (
              <div className="glass-card p-12 text-center border border-zinc-800/80">
                <p className="text-zinc-400 mb-4">No trips planned yet. Fill out the AI form above to generate your first adventure!</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {trips.map(trip => {
                  const startDateStr = new Date(trip.startDate).toLocaleDateString([], { month: "short", day: "numeric" });
                  const endDateStr = new Date(trip.endDate).toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" });
                  const isUpcoming = new Date(trip.startDate) > new Date();

                  return (
                    <Link href={`/trips/${trip.id}`} key={trip.id} className="block group">
                      <div className="glass-card p-5 border border-zinc-800/80 hover:border-indigo-500/30 transition-all flex justify-between items-start h-full">
                        <div className="space-y-3">
                          <div>
                            <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold mb-2 ${
                              isUpcoming ? "bg-indigo-500/10 text-indigo-300 border border-indigo-500/20" : "bg-zinc-800 text-zinc-400"
                            }`}>
                              {isUpcoming ? "Upcoming" : "Past Trip"}
                            </span>
                            <h4 className="font-bold text-white group-hover:text-indigo-400 transition-colors text-base line-clamp-1">
                              {trip.title}
                            </h4>
                          </div>

                          <div className="space-y-1.5 text-xs text-zinc-400">
                            <div className="flex items-center space-x-1.5">
                              <MapPin className="w-3.5 h-3.5 text-indigo-400" />
                              <span className="line-clamp-1">{trip.destination}</span>
                            </div>
                            <div className="flex items-center space-x-1.5">
                              <Calendar className="w-3.5 h-3.5 text-indigo-400" />
                              <span>{startDateStr} - {endDateStr}</span>
                            </div>
                            <div className="flex items-center space-x-1.5">
                              <Wallet className="w-3.5 h-3.5 text-indigo-400" />
                              <span>Budget: ${trip.budgetLimit}</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-col justify-between items-end h-full">
                          <button
                            onClick={(e) => handleDeleteTrip(trip.id, e)}
                            className="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-500 hover:text-rose-400 hover:bg-rose-950/20 transition-all"
                            title="Delete Trip"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                          <ChevronRight className="w-5 h-5 text-zinc-600 group-hover:text-indigo-400 transition-colors mt-8" />
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right 1 Col: Stats & Quick Weather Card */}
        <div className="space-y-6">
          {/* Quick Statistics */}
          <div className="glass-card p-6 border border-zinc-800/80">
            <h3 className="font-bold text-white text-base mb-4 flex items-center space-x-2">
              <BarChart3 className="w-5 h-5 text-indigo-400" />
              <span>Travel Statistics</span>
            </h3>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-zinc-900/40 rounded-xl border border-zinc-800/40 text-center">
                <span className="text-[10px] text-zinc-500 uppercase tracking-wider block mb-1">Trips Planned</span>
                <span className="text-xl font-black text-white">{trips.length}</span>
              </div>

              <div className="p-3 bg-zinc-900/40 rounded-xl border border-zinc-800/40 text-center">
                <span className="text-[10px] text-zinc-500 uppercase tracking-wider block mb-1">Days Explored</span>
                <span className="text-xl font-black text-white">
                  {trips.reduce((acc, t) => {
                    const diff = Math.floor((new Date(t.endDate).getTime() - new Date(t.startDate).getTime()) / (1000 * 60 * 60 * 24)) + 1;
                    return acc + diff;
                  }, 0)}
                </span>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-zinc-800 flex items-center justify-between text-xs text-zinc-400">
              <div className="flex items-center space-x-1">
                <Trophy className="w-3.5 h-3.5 text-amber-400" />
                <span>Level 2 Explorer Badge</span>
              </div>
              <span className="text-indigo-400 font-medium">85% Progress</span>
            </div>
          </div>

          {/* Quick Weather Watcher */}
          <div className="glass-card p-6 border border-zinc-800/80">
            <h3 className="font-bold text-white text-base mb-4 flex items-center space-x-2">
              <Cloud className="w-5 h-5 text-indigo-400" />
              <span>Global Weather Watch</span>
            </h3>

            <div className="space-y-3">
              {[
                { city: "Tokyo", temp: "22°C", condition: "Sunny", time: "Local: 17:15" },
                { city: "London", temp: "14°C", condition: "Rainy", time: "Local: 09:15" },
                { city: "Bali", temp: "30°C", condition: "Humid", time: "Local: 16:15" }
              ].map((w, idx) => (
                <div key={idx} className="flex justify-between items-center p-3 rounded-xl bg-zinc-900/40 border border-zinc-800/40">
                  <div>
                    <span className="font-bold text-zinc-200 text-sm block">{w.city}</span>
                    <span className="text-[10px] text-zinc-500 block">{w.time}</span>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-white text-sm block">{w.temp}</span>
                    <span className="text-[10px] text-indigo-400 block">{w.condition}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
