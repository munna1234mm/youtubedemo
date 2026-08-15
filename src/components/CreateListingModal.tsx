import React, { useState } from 'react';
import { X, Plus, Sparkles, Tag, DollarSign, MapPin } from 'lucide-react';
import { MarketplaceItem, User } from '../types';
import { triggerHaptic, fireConfetti } from '../utils/telegram';

interface CreateListingModalProps {
  currentUser: User;
  onClose: () => void;
  onSubmitListing: (item: Partial<MarketplaceItem>) => void;
}

export const CreateListingModal: React.FC<CreateListingModalProps> = ({
  currentUser,
  onClose,
  onSubmitListing,
}) => {
  const [title, setTitle] = useState('');
  const [price, setPrice] = useState('');
  const [currency, setCurrency] = useState<'USD' | 'TON' | 'STARS'>('USD');
  const [category, setCategory] = useState('Electronics');
  const [condition, setCondition] = useState<'Brand New' | 'Like New' | 'Good' | 'Fair'>('Brand New');
  const [location, setLocation] = useState(currentUser.location || 'Dubai, UAE');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [images, setImages] = useState<string[]>([
    'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800&auto=format&fit=crop&q=80',
  ]);

  const categories = [
    'Electronics',
    'Collectibles',
    'Digital Goods',
    'Vehicles',
    'Fashion',
    'Home & Garden',
    'Gaming',
  ];

  const handleAddImage = () => {
    if (imageUrl.trim() && !images.includes(imageUrl.trim())) {
      setImages([...images, imageUrl.trim()]);
      setImageUrl('');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !price) return;

    const newItem: Partial<MarketplaceItem> = {
      title,
      price: parseFloat(price) || 0,
      currency,
      category,
      condition,
      location,
      description,
      images,
      seller: currentUser,
      createdAt: 'Just now',
      status: 'available',
    };

    triggerHaptic('success');
    fireConfetti();
    onSubmitListing(newItem);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-3 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="px-4 py-3 border-b border-slate-800 flex items-center justify-between">
          <h2 className="text-base font-bold text-white font-['Outfit']">List an Item for Sale</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-4 overflow-y-auto space-y-3.5 flex-1">
          
          {/* Title */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Title</label>
            <input
              type="text"
              placeholder="e.g. Apple MacBook Pro M3 Max"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-sky-500"
            />
          </div>

          {/* Price & Currency */}
          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Price</label>
              <input
                type="number"
                placeholder="0.00"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                required
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-sky-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Currency</label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value as any)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-sky-500"
              >
                <option value="USD">💵 USD ($)</option>
                <option value="TON">💎 TON Crypto</option>
                <option value="STARS">⭐ TG Stars</option>
              </select>
            </div>
          </div>

          {/* Category & Condition */}
          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-sky-500"
              >
                {categories.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Condition</label>
              <select
                value={condition}
                onChange={(e) => setCondition(e.target.value as any)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-sky-500"
              >
                <option value="Brand New">Brand New</option>
                <option value="Like New">Like New</option>
                <option value="Good">Good</option>
                <option value="Fair">Fair</option>
              </select>
            </div>
          </div>

          {/* Location */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Location</label>
            <input
              type="text"
              placeholder="e.g. Dubai Marina, UAE"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-sky-500"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Description</label>
            <textarea
              rows={3}
              placeholder="Describe details, specifications, warranty, or delivery options..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-sky-500 resize-none"
            />
          </div>

          {/* Images */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Photo URL</label>
            <div className="flex gap-2">
              <input
                type="url"
                placeholder="https://..."
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-sky-500"
              />
              <button
                type="button"
                onClick={handleAddImage}
                className="px-3 py-1.5 bg-slate-700 text-white rounded-xl text-xs font-bold hover:bg-slate-600"
              >
                Add
              </button>
            </div>
            {images.length > 0 && (
              <div className="flex gap-2 pt-2 overflow-x-auto no-scrollbar">
                {images.map((img, i) => (
                  <div key={i} className="relative w-16 h-16 rounded-xl overflow-hidden shrink-0 border border-slate-700">
                    <img src={img} alt="item" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => setImages(images.filter((_, idx) => idx !== i))}
                      className="absolute top-1 right-1 p-0.5 rounded-full bg-black/70 text-white hover:bg-rose-600"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Submit */}
          <button
            type="submit"
            className="w-full py-2.5 rounded-xl font-bold text-sm bg-gradient-to-r from-emerald-500 to-teal-600 text-white hover:brightness-110 shadow-lg mt-2"
          >
            Publish Listing to Marketplace
          </button>
        </form>

      </div>
    </div>
  );
};
