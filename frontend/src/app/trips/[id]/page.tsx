"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Compass, ArrowLeft, Calendar, Wallet, MapPin, Sparkles,
  CloudRain, ShieldAlert, CheckSquare, Users, MessageSquare,
  AlertTriangle, Plus, Landmark, Coffee, HelpCircle, Loader2,
  Share2, ThumbsUp, ThumbsDown, Info, Send, PhoneCall, AlertCircle
} from "lucide-react";
import api from "@/lib/api";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function TripDetailsPage({ params }: PageProps) {
  const router = useRouter();
  const { id } = use(params);

  // Data States
  const [trip, setTrip] = useState<any>(null);
  const [activeTab, setActiveTab] = useState("itinerary");
  const [activeDay, setActiveDay] = useState(1);
  const [loading, setLoading] = useState(true);
  const [adaptingWeather, setAdaptingWeather] = useState(false);
  const [weatherCondition, setWeatherCondition] = useState("Heavy Rain");

  // Chat States
  const [chatOpen, setChatOpen] = useState(false);
  const [chatMessage, setChatMessage] = useState("");
  const [chatHistory, setChatHistory] = useState<any[]>([]);
  const [sendingChat, setSendingChat] = useState(false);

  // Expense Form States
  const [expenseAmount, setExpenseAmount] = useState("");
  const [expenseCategory, setExpenseCategory] = useState("Food");
  const [expenseDesc, setExpenseDesc] = useState("");
  const [addingExpense, setAddingExpense] = useState(false);
  const [expenseSummary, setExpenseSummary] = useState<any>(null);

  // Share Form States
  const [shareEmail, setShareEmail] = useState("");
  const [shareRole, setShareRole] = useState("Viewer");
  const [sharing, setSharing] = useState(false);

  // Packing list state
  const [packingList, setPackingList] = useState<any[]>([]);

  useEffect(() => {
    const token = localStorage.getItem("travelmitra_token");
    if (!token) {
      router.push("/login");
      return;
    }
    fetchTripDetails();
    fetchChatHistory();
  }, [id, router]);

  const fetchTripDetails = async () => {
    try {
      setLoading(true);
      const res = await api.getTripById(id);
      setTrip(res.trip);
      setPackingList(res.trip.packingItems || []);
      
      // Fetch budget summary
      const budgetRes = await api.getExpensesSummary(id);
      setExpenseSummary(budgetRes);
    } catch (err) {
      console.error("Error loading trip:", err);
      // Fallback redirect
      router.push("/dashboard");
    } finally {
      setLoading(false);
    }
  };

  const fetchChatHistory = async () => {
    try {
      const res = await api.getChatHistory();
      setChatHistory(res.history || []);
    } catch (err) {
      console.error(err);
    }
  };

  // Weather adaptation simulation
  const handleTriggerWeatherAdapt = async () => {
    setAdaptingWeather(true);
    try {
      const res = await api.adaptWeather(id, {
        dayNumber: activeDay,
        condition: weatherCondition
      });
      
      // Update local trip state with adapted activities
      const updatedDays = trip.itineraryDays.map((d: any) => 
        d.dayNumber === activeDay ? res.updatedDay : d
      );
      
      setTrip({ ...trip, itineraryDays: updatedDays });
      alert(`Weather adaptation successful! Outdoor activities for Day ${activeDay} have been rewritten into indoor alternatives.`);
    } catch (err) {
      alert("Failed to adapt itinerary for weather.");
    } finally {
      setAdaptingWeather(false);
    }
  };

  // Chat message send
  const handleSendChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatMessage.trim()) return;

    const userMsg = chatMessage;
    setChatMessage("");
    setSendingChat(true);

    // Optimistically update chat history
    setChatHistory(prev => [...prev, { message: userMsg, response: "Thinking...", id: "temp" }]);

    try {
      const res = await api.sendChatMessage(userMsg, id);
      setChatHistory(prev => 
        prev.map(c => c.id === "temp" ? res.chatLog : c)
      );
    } catch (err) {
      setChatHistory(prev => 
        prev.map(c => c.id === "temp" ? { message: userMsg, response: "I encountered an error replying to that, please try again." } : c)
      );
    } finally {
      setSendingChat(false);
    }
  };

  // Add expense
  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!expenseAmount || !expenseDesc) return;
    setAddingExpense(true);

    try {
      await api.addExpense(id, {
        amount: parseFloat(expenseAmount),
        category: expenseCategory,
        description: expenseDesc
      });
      setExpenseAmount("");
      setExpenseDesc("");
      
      // Refresh trip details & budget summary
      const res = await api.getTripById(id);
      setTrip(res.trip);
      const budgetRes = await api.getExpensesSummary(id);
      setExpenseSummary(budgetRes);
    } catch (err) {
      alert("Failed to record expense.");
    } finally {
      setAddingExpense(false);
    }
  };

  // Share Trip
  const handleShareTrip = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!shareEmail) return;
    setSharing(true);

    try {
      await api.shareTrip(id, shareEmail, shareRole);
      setShareEmail("");
      
      // Refresh details
      const res = await api.getTripById(id);
      setTrip(res.trip);
      alert("Trip shared successfully!");
    } catch (err: any) {
      alert(err.message || "Failed to share trip.");
    } finally {
      setSharing(false);
    }
  };

  // Toggle checklist item
  const handleTogglePackingItem = (itemId: string) => {
    setPackingList(prev => 
      prev.map(item => item.id === itemId ? { ...item, isChecked: !item.isChecked } : item)
    );
  };

  // Vote helper (simulated voting counts)
  const [votes, setVotes] = useState<Record<string, number>>({});
  const handleVote = async (itemId: string, val: number) => {
    try {
      await api.voteOnItem(id, {
        itemType: "Activity",
        itemId,
        voteValue: val
      });
      setVotes(prev => ({
        ...prev,
        [itemId]: (prev[itemId] || 0) + val
      }));
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center text-zinc-100">
        <Loader2 className="w-10 h-10 text-indigo-500 animate-spin mb-4" />
        <p className="text-zinc-500 text-sm">Loading dynamic itinerary dashboard...</p>
      </div>
    );
  }

  if (!trip) return null;

  const currentDayDetails = trip.itineraryDays.find((d: any) => d.dayNumber === activeDay);

  return (
    <div className="min-h-screen bg-gradient-mesh text-zinc-100 flex flex-col relative selection:bg-indigo-500 selection:text-white">
      {/* Navigation Header */}
      <header className="bg-zinc-950/40 backdrop-blur-md border-b border-zinc-800/60 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <Link href="/dashboard" className="w-9 h-9 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-400 hover:text-white transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h2 className="font-bold text-white text-base line-clamp-1">{trip.title}</h2>
              <span className="text-xs text-zinc-400 flex items-center space-x-1">
                <MapPin className="w-3.5 h-3.5 text-indigo-400" />
                <span>{trip.destination}</span>
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button 
              onClick={() => setChatOpen(!chatOpen)}
              className="px-4 py-2 rounded-xl text-sm font-semibold bg-indigo-600 hover:bg-indigo-500 text-white flex items-center space-x-1.5 shadow-md shadow-indigo-600/20"
            >
              <MessageSquare className="w-4 h-4" />
              <span>AI Chat Assistant</span>
            </button>
          </div>
        </div>
      </header>

      {/* Hero Banner Details */}
      <div className="max-w-7xl mx-auto w-full px-6 pt-8 grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: "Destination", val: trip.destination, icon: MapPin },
          { label: "Travel Dates", val: `${new Date(trip.startDate).toLocaleDateString([], {month: 'short', day: 'numeric'})} - ${new Date(trip.endDate).toLocaleDateString([], {month: 'short', day: 'numeric'})}`, icon: Calendar },
          { label: "Travel Style", val: trip.travelStyle, icon: Compass },
          { label: "Remaining Budget", val: `$${expenseSummary ? expenseSummary.remainingBudget.toFixed(0) : trip.budgetLimit}`, icon: Wallet }
        ].map((item, idx) => (
          <div key={idx} className="glass-card p-4 flex items-center space-x-3.5 border border-zinc-800/40 bg-zinc-900/30">
            <div className="w-10 h-10 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-400">
              <item.icon className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] text-zinc-500 uppercase tracking-wider block">{item.label}</span>
              <span className="text-sm font-bold text-white">{item.val}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="max-w-7xl mx-auto w-full px-6 pt-8">
        <div className="flex space-x-2 border-b border-zinc-850 pb-px">
          {[
            { id: "itinerary", label: "Smart Itinerary", icon: Compass },
            { id: "budget", label: "Budget & Expenses", icon: Wallet },
            { id: "packing", label: "Packing Checklists", icon: CheckSquare },
            { id: "collaboration", label: "Group & Voting", icon: Users },
            { id: "safety", label: "Safety & Emergency", icon: ShieldAlert }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center space-x-1.5 pb-4 px-2 text-sm font-semibold border-b-2 transition-all ${
                activeTab === tab.id
                  ? "border-indigo-500 text-white"
                  : "border-transparent text-zinc-500 hover:text-zinc-300"
              }`}
            >
              <tab.icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Content Body */}
      <main className="max-w-7xl mx-auto w-full px-6 py-8 flex-1 grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left 2 Columns */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Tab 1: Itinerary */}
          {activeTab === "itinerary" && (
            <div className="space-y-6">
              {/* Day selection timeline */}
              <div className="flex space-x-2 overflow-x-auto pb-2 scrollbar-hide">
                {trip.itineraryDays.map((d: any) => (
                  <button
                    key={d.id}
                    onClick={() => setActiveDay(d.dayNumber)}
                    className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all border flex-shrink-0 ${
                      activeDay === d.dayNumber
                        ? "bg-indigo-600 border-indigo-500 text-white shadow-md shadow-indigo-600/10"
                        : "bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white"
                    }`}
                  >
                    Day {d.dayNumber}
                  </button>
                ))}
              </div>

              {/* Weather simulation widget */}
              <div className="glass-card p-4 border border-zinc-800/80 bg-zinc-900/15 flex flex-col md:flex-row justify-between items-center space-y-3 md:space-y-0">
                <div className="flex items-center space-x-2 text-left">
                  <CloudRain className="w-5 h-5 text-indigo-400" />
                  <div>
                    <span className="text-xs font-bold text-zinc-300 block">Weather Adaptation Radar</span>
                    <span className="text-[10px] text-zinc-500">Simulate severe weather to swap outdoor activities for indoor alternatives</span>
                  </div>
                </div>

                <div className="flex items-center space-x-2 w-full md:w-auto">
                  <select 
                    value={weatherCondition} 
                    onChange={e => setWeatherCondition(e.target.value)}
                    className="glass-input text-xs py-1.5 px-3 min-w-32 bg-zinc-950/40"
                  >
                    <option value="Heavy Rain">Heavy Rain</option>
                    <option value="Typhoon Storm">Typhoon Storm</option>
                    <option value="Severe Blizzard">Severe Blizzard</option>
                    <option value="Heatwave (40°C)">Extreme Heatwave</option>
                  </select>

                  <button
                    onClick={handleTriggerWeatherAdapt}
                    disabled={adaptingWeather}
                    className="px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white flex items-center space-x-1.5 shadow-md disabled:opacity-50"
                  >
                    {adaptingWeather ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Adapting...</span>
                      </>
                    ) : (
                      <span>Simulate & Rewrite</span>
                    )}
                  </button>
                </div>
              </div>

              {/* Today's Forecast display */}
              {currentDayDetails && (
                <div className="glass-card p-5 border border-zinc-800/80">
                  <div className="flex justify-between items-center mb-6 border-b border-zinc-800 pb-4">
                    <div>
                      <h3 className="font-bold text-white text-base">Day {activeDay} Schedule</h3>
                      <span className="text-xs text-zinc-500">
                        {new Date(currentDayDetails.date).toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric' })}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-xs text-indigo-400 font-bold block">Day Forecast</span>
                      <span className="text-sm font-semibold text-zinc-300">
                        {currentDayDetails.weatherSummary || "Sunny and pleasant"}
                      </span>
                    </div>
                  </div>

                  {/* Day Activities Time slots */}
                  <div className="space-y-6 relative before:absolute before:left-3.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-zinc-800">
                    {currentDayDetails.activities.map((act: any) => (
                      <div key={act.id} className="relative pl-10 group">
                        {/* Bullet */}
                        <div className="absolute left-1 top-2.5 w-5 h-5 rounded-full bg-zinc-900 border-2 border-indigo-500 flex items-center justify-center">
                          <div className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                        </div>

                        {/* Card */}
                        <div className="glass-card p-4 border border-zinc-850 hover:border-zinc-800 transition-all flex flex-col sm:flex-row justify-between items-start">
                          <div className="space-y-2">
                            <div className="flex items-center space-x-2">
                              <span className="text-[10px] font-black uppercase text-indigo-400 tracking-wider">
                                {act.timeSlot}
                              </span>
                              {act.isIndoorBackup && (
                                <span className="px-2 py-0.5 rounded text-[8px] bg-rose-500/10 text-rose-400 border border-rose-500/20 font-bold">
                                  Weather Adapted (Indoor)
                                </span>
                              )}
                              {act.isHiddenGem && (
                                <span className="px-2 py-0.5 rounded text-[8px] bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 font-bold">
                                  Hidden Gem
                                </span>
                              )}
                            </div>
                            <h4 className="font-bold text-white text-sm">{act.title}</h4>
                            <p className="text-zinc-400 text-xs leading-relaxed max-w-lg">{act.description}</p>
                            
                            <div className="flex items-center space-x-4 text-[10px] text-zinc-500">
                              <span className="flex items-center space-x-1">
                                <MapPin className="w-3 h-3 text-indigo-400" />
                                <span>{act.locationName}</span>
                              </span>
                              <span>•</span>
                              <span>Est: ${act.estimatedCost}</span>
                            </div>
                          </div>

                          {/* Voting widget in itinerary */}
                          <div className="flex items-center space-x-2 mt-4 sm:mt-0">
                            <button 
                              onClick={() => handleVote(act.id, 1)}
                              className="w-7 h-7 rounded bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-400 hover:text-white"
                            >
                              <ThumbsUp className="w-3.5 h-3.5" />
                            </button>
                            <span className="text-xs font-bold text-zinc-300">
                              {votes[act.id] !== undefined ? votes[act.id] : 0}
                            </span>
                            <button 
                              onClick={() => handleVote(act.id, -1)}
                              className="w-7 h-7 rounded bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-400 hover:text-white"
                            >
                              <ThumbsDown className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Tab 2: Budget & Expenses */}
          {activeTab === "budget" && (
            <div className="space-y-6">
              {/* Progress Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="glass-card p-4 border border-zinc-800/80 bg-zinc-900/10">
                  <span className="text-[10px] text-zinc-500 uppercase tracking-wider block mb-1">Total Budget Limit</span>
                  <span className="text-xl font-bold text-white">${expenseSummary?.budgetLimit || trip.budgetLimit}</span>
                </div>
                <div className="glass-card p-4 border border-zinc-800/80 bg-zinc-900/10">
                  <span className="text-[10px] text-zinc-500 uppercase tracking-wider block mb-1">Total Spent</span>
                  <span className="text-xl font-bold text-indigo-400">${expenseSummary?.totalSpent || 0}</span>
                </div>
                <div className="glass-card p-4 border border-zinc-800/80 bg-zinc-900/10">
                  <span className="text-[10px] text-zinc-500 uppercase tracking-wider block mb-1">Remaining Balance</span>
                  <span className="text-xl font-bold text-emerald-400">${expenseSummary?.remainingBudget || trip.budgetLimit}</span>
                </div>
              </div>

              {/* Progress Bar */}
              {expenseSummary && (
                <div className="glass-card p-5 border border-zinc-800/80">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs font-bold text-zinc-400">Budget Spent</span>
                    <span className="text-xs font-bold text-white">
                      {Math.round((expenseSummary.totalSpent / expenseSummary.budgetLimit) * 100)}%
                    </span>
                  </div>
                  <div className="w-full bg-zinc-800 h-3 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all duration-500 ${
                        expenseSummary.totalSpent > expenseSummary.budgetLimit 
                          ? "bg-rose-500" 
                          : "bg-gradient-to-r from-indigo-500 to-purple-500"
                      }`}
                      style={{ width: `${Math.min(100, (expenseSummary.totalSpent / expenseSummary.budgetLimit) * 100)}%` }}
                    />
                  </div>
                  {expenseSummary.totalSpent > expenseSummary.budgetLimit && (
                    <div className="mt-3 text-xs text-rose-400 flex items-center space-x-1">
                      <AlertCircle className="w-4 h-4 flex-shrink-0" />
                      <span>Warning: Budget limit exceeded. Consider cheaper food/lodging.</span>
                    </div>
                  )}
                </div>
              )}

              {/* Add Expense Form & List */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Form */}
                <div className="glass-card p-5 border border-zinc-800/80">
                  <h4 className="font-bold text-white text-sm mb-4 flex items-center space-x-2">
                    <Plus className="w-4 h-4 text-indigo-400" />
                    <span>Record New Expense</span>
                  </h4>
                  <form onSubmit={handleAddExpense} className="space-y-4">
                    <div>
                      <label className="block text-zinc-400 text-[10px] font-bold uppercase tracking-wider mb-1">
                        Amount (USD)
                      </label>
                      <input
                        type="number"
                        required
                        placeholder="e.g. 24.50"
                        className="w-full glass-input text-sm py-2"
                        value={expenseAmount}
                        onChange={e => setExpenseAmount(e.target.value)}
                      />
                    </div>

                    <div>
                      <label className="block text-zinc-400 text-[10px] font-bold uppercase tracking-wider mb-1">
                        Category
                      </label>
                      <select
                        className="w-full glass-input text-sm py-2 bg-zinc-950/40"
                        value={expenseCategory}
                        onChange={e => setExpenseCategory(e.target.value)}
                      >
                        <option value="Accommodation">Accommodation</option>
                        <option value="Food">Food & Dining</option>
                        <option value="Transport">Transport</option>
                        <option value="Activities">Activities</option>
                        <option value="Shopping">Shopping</option>
                        <option value="Emergency">Emergency Reserve</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-zinc-400 text-[10px] font-bold uppercase tracking-wider mb-1">
                        Description / Vendor
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Starbucks, Taxi to hotel"
                        className="w-full glass-input text-sm py-2"
                        value={expenseDesc}
                        onChange={e => setExpenseDesc(e.target.value)}
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={addingExpense}
                      className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 font-bold text-xs text-white transition-colors"
                    >
                      {addingExpense ? "Recording..." : "Record Expense"}
                    </button>
                  </form>
                </div>

                {/* List */}
                <div className="glass-card p-5 border border-zinc-800/80 flex flex-col">
                  <h4 className="font-bold text-white text-sm mb-4">Expense Log</h4>
                  <div className="flex-1 max-h-60 overflow-y-auto space-y-2.5 scrollbar-hide text-left">
                    {trip.expenses.length === 0 ? (
                      <p className="text-xs text-zinc-500 text-center py-8">No expenses logged yet.</p>
                    ) : (
                      trip.expenses.map((exp: any) => (
                        <div key={exp.id} className="flex justify-between items-center p-3 rounded-lg bg-zinc-900/30 border border-zinc-800/50">
                          <div>
                            <span className="font-bold text-white text-xs block">{exp.description}</span>
                            <span className="text-[9px] px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400 font-medium mt-1 inline-block">
                              {exp.category}
                            </span>
                          </div>
                          <div className="text-right">
                            <span className="font-extrabold text-sm text-white block">${exp.amount}</span>
                            <span className="text-[9px] text-zinc-500 block">by {exp.payer?.name || "you"}</span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Tab 3: Packing checklist */}
          {activeTab === "packing" && (
            <div className="glass-card p-6 border border-zinc-800/80">
              <h3 className="font-bold text-white text-base mb-2">Smart Packing Assistant</h3>
              <p className="text-xs text-zinc-400 mb-6">Generated by Gemini AI based on weather, duration, and travel style.</p>

              <div className="space-y-4 text-left">
                {packingList.length === 0 ? (
                  <p className="text-xs text-zinc-500 text-center py-6">No items required.</p>
                ) : (
                  ["Documents", "Clothing", "Gear", "Medical", "Toiletries"].map(category => {
                    const items = packingList.filter(i => i.category.toLowerCase() === category.toLowerCase());
                    if (items.length === 0) return null;

                    return (
                      <div key={category} className="space-y-2 border-b border-zinc-850/40 pb-4 last:border-0 last:pb-0">
                        <span className="text-[10px] font-black uppercase text-indigo-400 tracking-wider block mb-2">{category}</span>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          {items.map(item => (
                            <label 
                              key={item.id}
                              className="flex items-center space-x-3 p-2.5 rounded-lg bg-zinc-900/30 border border-zinc-800/40 cursor-pointer hover:bg-zinc-900/50 transition-colors"
                            >
                              <input
                                type="checkbox"
                                className="rounded text-indigo-500 bg-zinc-950 border-zinc-800 w-4 h-4 focus:ring-0"
                                checked={item.isChecked}
                                onChange={() => handleTogglePackingItem(item.id)}
                              />
                              <span className={`text-xs ${item.isChecked ? "line-through text-zinc-500" : "text-zinc-200"}`}>
                                {item.name}
                              </span>
                              {item.isRequired && (
                                <span className="text-[8px] font-bold text-rose-400 bg-rose-500/10 px-1 rounded">Required</span>
                              )}
                            </label>
                          ))}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* Tab 4: Collaboration */}
          {activeTab === "collaboration" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Share trip form */}
              <div className="glass-card p-5 border border-zinc-800/80">
                <h4 className="font-bold text-white text-sm mb-2 flex items-center space-x-2">
                  <Share2 className="w-4 h-4 text-indigo-400" />
                  <span>Invite Friends & Co-planners</span>
                </h4>
                <p className="text-[10px] text-zinc-500 mb-4">Share this trip with other travelers to split expenses and coordinate schedules.</p>

                <form onSubmit={handleShareTrip} className="space-y-4">
                  <div>
                    <label className="block text-zinc-400 text-[10px] font-bold uppercase tracking-wider mb-1">
                      Friend's Email Address
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="friend@domain.com"
                      className="w-full glass-input text-sm py-2"
                      value={shareEmail}
                      onChange={e => setShareEmail(e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="block text-zinc-400 text-[10px] font-bold uppercase tracking-wider mb-1">
                      Permission Level
                    </label>
                    <select
                      className="w-full glass-input text-sm py-2 bg-zinc-950/40"
                      value={shareRole}
                      onChange={e => setShareRole(e.target.value)}
                    >
                      <option value="Viewer">Viewer (Read-only)</option>
                      <option value="Editor">Editor (Can add expenses / vote)</option>
                    </select>
                  </div>

                  <button
                    type="submit"
                    disabled={sharing}
                    className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 font-bold text-xs text-white transition-colors"
                  >
                    {sharing ? "Sharing..." : "Share Trip"}
                  </button>
                </form>
              </div>

              {/* Shared with users list */}
              <div className="glass-card p-5 border border-zinc-800/80 flex flex-col text-left">
                <h4 className="font-bold text-white text-sm mb-4">Trip Shared With</h4>
                <div className="space-y-3 flex-1 overflow-y-auto scrollbar-hide">
                  <div className="flex items-center space-x-2.5 p-3 rounded-lg bg-indigo-950/10 border border-indigo-900/30">
                    <div className="w-7 h-7 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center text-xs font-bold">Y</div>
                    <div>
                      <span className="font-bold text-zinc-200 text-xs block">You (Organizer)</span>
                      <span className="text-[10px] text-zinc-500 block">Host</span>
                    </div>
                  </div>
                  {trip.sharedWith && trip.sharedWith.map((share: any) => (
                    <div key={share.id} className="flex items-center space-x-2.5 p-3 rounded-lg bg-zinc-900/30 border border-zinc-800/50">
                      <div className="w-7 h-7 rounded-full bg-zinc-800 text-zinc-400 flex items-center justify-center text-xs font-bold">
                        {share.user?.name ? share.user.name[0].toUpperCase() : "F"}
                      </div>
                      <div>
                        <span className="font-bold text-zinc-200 text-xs block">{share.user?.name || "Friend"}</span>
                        <span className="text-[10px] text-zinc-400 block">{share.role}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Tab 5: Safety & Emergency */}
          {activeTab === "safety" && (
            <div className="space-y-6">
              {/* Emergency mode offline indicators */}
              <div className="glass-card p-6 border border-zinc-800/80">
                <div className="flex items-center space-x-2.5 mb-4">
                  <ShieldAlert className="w-6 h-6 text-rose-500" />
                  <div>
                    <h3 className="font-bold text-white text-base">Emergency Support Hotspot</h3>
                    <span className="text-[10px] text-zinc-500 uppercase font-black">Offline Mode Active: Numbers are cached in your device storage</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
                  <div className="p-4 rounded-xl bg-zinc-900/30 border border-zinc-850 flex items-center space-x-3.5">
                    <div className="w-10 h-10 rounded bg-rose-500/10 flex items-center justify-center text-rose-400">
                      <PhoneCall className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-[10px] text-zinc-500 uppercase tracking-wider block">Nearest Hospital</span>
                      <span className="text-sm font-bold text-white block">Metropolitan Health Clinic</span>
                      <span className="text-[11px] text-indigo-400">+1 (415) 555-0199</span>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-zinc-900/30 border border-zinc-850 flex items-center space-x-3.5">
                    <div className="w-10 h-10 rounded bg-rose-500/10 flex items-center justify-center text-rose-400">
                      <PhoneCall className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-[10px] text-zinc-500 uppercase tracking-wider block">National Police</span>
                      <span className="text-sm font-bold text-white block">Central Station Police Office</span>
                      <span className="text-[11px] text-indigo-400">112 or 911</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Scam warnings */}
              <div className="glass-card p-6 border border-zinc-800/80 text-left">
                <h4 className="font-bold text-white text-sm mb-4 flex items-center space-x-2">
                  <AlertTriangle className="w-4 h-4 text-amber-500" />
                  <span>Local Scam & Safety Alerts</span>
                </h4>

                <div className="space-y-3.5 text-xs">
                  <div className="p-3.5 rounded-lg border border-amber-900/30 bg-amber-950/10">
                    <h5 className="font-bold text-amber-400 mb-1">Taxi Meter Scam</h5>
                    <p className="text-zinc-300 leading-relaxed">Taxi drivers around transport hubs might insist on a fixed price instead of using the meter, which is often 3x the standard fare. Insist on the meter or use ride-hail apps.</p>
                  </div>

                  <div className="p-3.5 rounded-lg border border-amber-900/30 bg-amber-950/10">
                    <h5 className="font-bold text-amber-400 mb-1">Unregulated Tour Guides</h5>
                    <p className="text-zinc-300 leading-relaxed">Avoid individuals waiting outside historical sites offering cheap packages. Always book tickets inside the ticket booths.</p>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Right 1 Column: Maps & Side stats */}
        <div className="space-y-6">
          {/* Map placeholder */}
          <div className="glass-card border border-zinc-800/80 overflow-hidden text-left">
            <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
              <span className="text-xs font-bold text-white">Dynamic Map Explorer</span>
              <span className="text-[9px] bg-zinc-800 text-zinc-400 px-1.5 py-0.5 rounded font-mono">MAPBOX</span>
            </div>
            
            {/* Mock Map Image */}
            <div className="h-60 bg-zinc-900 relative flex items-center justify-center overflow-hidden">
              {/* Radial grids */}
              <div className="absolute inset-0 bg-[radial-gradient(#1e1b4b_1px,transparent_1px)] [background-size:16px_16px] opacity-40" />
              {/* Glowing Route path */}
              <svg className="absolute w-full h-full text-indigo-500/20" xmlns="http://www.w3.org/2000/svg">
                <path d="M 50 150 Q 120 70 200 130 T 350 80" fill="none" stroke="#6366f1" strokeWidth="4" strokeLinecap="round" className="animate-pulse" />
              </svg>
              {/* Glowing nodes */}
              <div className="absolute top-[140px] left-[50px] w-4 h-4 rounded-full bg-indigo-500 border-4 border-zinc-900 shadow-[0_0_12px_#6366f1]" />
              <div className="absolute top-[125px] left-[200px] w-4 h-4 rounded-full bg-rose-500 border-4 border-zinc-900 shadow-[0_0_12px_#f43f5e]" />
              <div className="absolute top-[75px] left-[340px] w-4 h-4 rounded-full bg-purple-500 border-4 border-zinc-900 shadow-[0_0_12px_#a855f7]" />

              <span className="text-[10px] text-zinc-500 absolute bottom-3 left-4 bg-zinc-950/80 px-2 py-1 rounded border border-zinc-800">
                Centred at: {trip.destination}
              </span>
            </div>
            <div className="p-4 text-xs text-zinc-400 flex items-center space-x-1.5">
              <Info className="w-4 h-4 text-indigo-400 flex-shrink-0" />
              <span>Pins represent your Day {activeDay} schedules (Morning to Night)</span>
            </div>
          </div>

          {/* Local Events list */}
          <div className="glass-card p-6 border border-zinc-800/80 text-left">
            <h3 className="font-bold text-white text-base mb-4">Local Events Discovery</h3>
            <div className="space-y-3">
              {[
                { name: "Traditional Food & Street Festival", date: "Friday evening", loc: "Town Center Square" },
                { name: "Symphony Orchestra Concert", date: "Saturday night", loc: "Symphony Concert Hall" }
              ].map((ev, idx) => (
                <div key={idx} className="p-3 rounded-lg bg-zinc-900/30 border border-zinc-800/50">
                  <span className="font-bold text-zinc-200 text-xs block">{ev.name}</span>
                  <span className="text-[9px] text-zinc-500 block mt-1">{ev.date} • {ev.loc}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>

      {/* Floating Chat Assistant Overlay */}
      {chatOpen && (
        <div className="fixed inset-y-0 right-0 w-full sm:w-96 bg-zinc-950/95 border-l border-zinc-850 z-50 flex flex-col shadow-2xl backdrop-blur-md">
          {/* Header */}
          <div className="p-4 border-b border-zinc-800 flex justify-between items-center bg-zinc-900/50">
            <div className="flex items-center space-x-2">
              <Sparkles className="w-5 h-5 text-indigo-400" />
              <span className="font-bold text-sm text-white">TravelMitra Chat Advisor</span>
            </div>
            <button 
              onClick={() => setChatOpen(false)}
              className="text-zinc-500 hover:text-white text-xs font-bold border border-zinc-800 px-2 py-1 rounded"
            >
              Close
            </button>
          </div>

          {/* Chat Logs */}
          <div className="flex-1 p-4 overflow-y-auto space-y-4 scrollbar-hide">
            <div className="p-3 rounded-lg bg-indigo-950/15 border border-indigo-900/20 text-xs text-indigo-300 leading-relaxed text-left">
              Hi! I'm your TravelMitra assistant. I know the full details of your trip to {trip.destination}. Ask me things like:
              <ul className="list-disc list-inside mt-2 space-y-1 text-zinc-400">
                <li>"Where should I eat nearby?"</li>
                <li>"Suggest activities under $12."</li>
                <li>"What should I pack?"</li>
              </ul>
            </div>

            {chatHistory.map((c, idx) => (
              <div key={idx} className="space-y-2.5">
                {/* User Message */}
                <div className="flex justify-end">
                  <div className="bg-indigo-600 text-white rounded-2xl rounded-tr-none px-4 py-2.5 max-w-[85%] text-xs text-left">
                    {c.message}
                  </div>
                </div>

                {/* AI Response */}
                <div className="flex justify-start">
                  <div className="bg-zinc-900/80 border border-zinc-800 text-zinc-200 rounded-2xl rounded-tl-none px-4 py-2.5 max-w-[85%] text-xs text-left leading-relaxed">
                    {c.response}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Input Form */}
          <form onSubmit={handleSendChat} className="p-3 border-t border-zinc-850 bg-zinc-950 flex items-center space-x-2">
            <input
              type="text"
              placeholder="Ask anything about this trip..."
              className="flex-1 glass-input py-2 text-xs"
              value={chatMessage}
              onChange={e => setChatMessage(e.target.value)}
            />
            <button 
              type="submit" 
              disabled={sendingChat || !chatMessage.trim()}
              className="p-2.5 rounded-xl bg-indigo-600 text-white hover:bg-indigo-500 transition-colors disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
