import React, { useState } from 'react';
import { 
  Plus, 
  Search, 
  MapPin, 
  Tag, 
  Sparkles, 
  MessageCircle, 
  Send, 
  X, 
  Bookmark, 
  Check, 
  Share2 
} from 'lucide-react';
import { MarketplaceItem, User } from '../types';
import { triggerHaptic, fireConfetti, shareToTelegram } from '../utils/telegram';
import { CreateListingModal } from './CreateListingModal';

interface MarketplaceViewProps {
  items: MarketplaceItem[];
  currentUser: User;
  onOpenChatWithUser: (user: User) => void;
  onAddNewListing: (item: Partial<MarketplaceItem>) => void;
}

export const MarketplaceView: React.FC<MarketplaceViewProps> = ({
  items,
  currentUser,
  onOpenChatWithUser,
  onAddNewListing,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedItem, setSelectedItem] = useState<MarketplaceItem | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [boughtSuccess, setBoughtSuccess] = useState(false);

  const categories = [
    'All',
    'Electronics',
    'Collectibles',
    'Digital Goods',
    'Vehicles',
    'Fashion',
    'Gaming',
  ];

  const filteredItems = items.filter((item) => {
    const matchesCat = selectedCategory === 'All' || item.category === selectedCategory;
    const matchesSearch = searchQuery === '' || 
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.location.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  const getCurrencySymbol = (curr: 'USD' | 'TON' | 'STARS') => {
    if (curr === 'USD') return '$';
    if (curr === 'TON') return '💎 TON ';
    if (curr === 'STARS') return '⭐ ';
    return '$';
  };

  const handleInstantBuy = (item: MarketplaceItem) => {
    triggerHaptic('success');
    fireConfetti();
    setBoughtSuccess(true);
    setTimeout(() => {
      setBoughtSuccess(false);
      setSelectedItem(null);
    }, 2000);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-4 pb-12">
      
      {/* Marketplace Top Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-md">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-white font-['Outfit']">Marketplace</h2>
            <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              TON & TG Stars
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Buy & sell physical gadgets, NFTs, and digital goods directly in Telegram
          </p>
        </div>

        {/* Sell Button */}
        <button
          onClick={() => {
            triggerHaptic('medium');
            setIsCreateOpen(true);
          }}
          className="w-full sm:w-auto px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:brightness-110 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-500/20 transition"
        >
          <Plus className="w-4 h-4" />
          <span>Create New Listing</span>
        </button>
      </div>

      {/* Category Filter Chips & Search */}
      <div className="space-y-2.5">
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => {
                triggerHaptic('selection');
                setSelectedCategory(cat);
              }}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition cursor-pointer border ${
                selectedCategory === cat
                  ? 'bg-sky-500 text-white border-sky-400 shadow-md shadow-sky-500/20'
                  : 'bg-slate-800/90 text-slate-300 border-slate-700/80 hover:border-slate-500'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search Marketplace listings, locations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-100 placeholder-slate-400 focus:outline-none focus:border-sky-500"
          />
        </div>
      </div>

      {/* Items Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {filteredItems.map((item) => (
          <div
            key={item.id}
            onClick={() => {
              triggerHaptic('light');
              setSelectedItem(item);
            }}
            className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden hover:border-slate-700 hover:shadow-xl transition duration-200 cursor-pointer group flex flex-col justify-between"
          >
            {/* Image */}
            <div className="relative h-40 w-full overflow-hidden bg-slate-800">
              <img
                src={item.images[0]}
                alt={item.title}
                className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
              />
              <div className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-black/60 backdrop-blur-md text-[10px] font-bold text-white border border-white/10">
                {item.condition}
              </div>
            </div>

            {/* Content */}
            <div className="p-3 flex flex-col justify-between flex-1">
              <div>
                <div className="text-base font-bold text-emerald-400">
                  {getCurrencySymbol(item.currency)}{item.price.toLocaleString()}
                </div>
                <h3 className="text-xs font-semibold text-white line-clamp-2 mt-0.5 group-hover:text-sky-400 transition">
                  {item.title}
                </h3>
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-400 mt-2.5 pt-2 border-t border-slate-800/80">
                <span className="flex items-center gap-1 line-clamp-1">
                  <MapPin className="w-3 h-3 text-slate-500 shrink-0" />
                  {item.location.split(',')[0]}
                </span>
                <span className="text-[10px] text-slate-500">{item.createdAt}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Item Detail Modal */}
      {selectedItem && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-3 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-slate-900 border border-slate-700 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            
            {/* Header */}
            <div className="px-4 py-3 border-b border-slate-800 flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                {selectedItem.category}
              </span>
              <button
                onClick={() => setSelectedItem(null)}
                className="w-8 h-8 rounded-full bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="overflow-y-auto p-4 space-y-4 flex-1">
              {/* Main Image */}
              <div className="rounded-2xl overflow-hidden h-60 bg-black/50 border border-slate-800">
                <img
                  src={selectedItem.images[0]}
                  alt={selectedItem.title}
                  className="w-full h-full object-contain"
                />
              </div>

              {/* Price & Title */}
              <div>
                <div className="text-2xl font-extrabold text-emerald-400">
                  {getCurrencySymbol(selectedItem.currency)}{selectedItem.price.toLocaleString()}
                </div>
                <h1 className="text-base font-bold text-white mt-1">
                  {selectedItem.title}
                </h1>
                <div className="flex items-center gap-2 mt-1.5 text-xs text-slate-400">
                  <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-semibold border border-slate-700">
                    {selectedItem.condition}
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-slate-500" />
                    {selectedItem.location}
                  </span>
                </div>
              </div>

              {/* Description */}
              <div className="bg-slate-800/60 p-3.5 rounded-2xl border border-slate-700/60 text-xs text-slate-300 leading-relaxed whitespace-pre-line">
                <span className="font-bold text-white block mb-1">Details</span>
                {selectedItem.description}
              </div>

              {/* Seller Card */}
              <div className="p-3 bg-slate-800/90 rounded-2xl border border-slate-700 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <img
                    src={selectedItem.seller.avatar}
                    alt={selectedItem.seller.name}
                    className="w-10 h-10 rounded-full object-cover border border-sky-400"
                  />
                  <div>
                    <span className="text-xs font-bold text-white block">
                      {selectedItem.seller.name}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      @{selectedItem.seller.username} • {selectedItem.seller.starsCount} Stars
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => {
                    setSelectedItem(null);
                    onOpenChatWithUser(selectedItem.seller);
                  }}
                  className="px-3 py-1.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-white text-xs font-bold flex items-center gap-1 shadow"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  <span>Chat</span>
                </button>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="p-4 border-t border-slate-800 bg-slate-900 flex items-center gap-2.5">
              <button
                onClick={() => {
                  setSelectedItem(null);
                  onOpenChatWithUser(selectedItem.seller);
                }}
                className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 border border-slate-700"
              >
                <MessageCircle className="w-4 h-4 text-sky-400" />
                <span>Message Seller</span>
              </button>

              <button
                onClick={() => handleInstantBuy(selectedItem)}
                className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:brightness-110 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-lg"
              >
                {boughtSuccess ? (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Purchase Completed!</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Instant Checkout</span>
                  </>
                )}
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Create Listing Modal */}
      {isCreateOpen && (
        <CreateListingModal
          currentUser={currentUser}
          onClose={() => setIsCreateOpen(false)}
          onSubmitListing={onAddNewListing}
        />
      )}

    </div>
  );
};
