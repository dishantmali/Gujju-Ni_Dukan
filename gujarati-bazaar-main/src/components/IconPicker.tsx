import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { Icon } from '@iconify/react';
import { Search, Upload, X, Check, Sparkles, ImageIcon, Loader2 } from 'lucide-react';
import { useRecentIcons } from '@/hooks/useRecentIcons';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import api from '@/lib/api';

/* ── Curated Popular Icons ── */
const POPULAR_ICONS = [
  'mdi:shopping', 'mdi:tshirt-crew', 'mdi:shoe-formal', 'mdi:food-apple',
  'mdi:fruit-grapes', 'mdi:baby-carriage', 'mdi:cellphone', 'mdi:laptop',
  'mdi:headphones', 'mdi:television', 'mdi:home', 'mdi:sofa',
  'mdi:lamp', 'mdi:bed', 'mdi:silverware-fork-knife', 'mdi:cookie',
  'mdi:cupcake', 'mdi:ice-cream', 'mdi:coffee', 'mdi:bottle-wine',
  'mdi:heart', 'mdi:star', 'mdi:diamond-stone', 'mdi:ring',
  'mdi:watch', 'mdi:bag-personal', 'mdi:cart', 'mdi:store',
  'mdi:flower', 'mdi:leaf', 'mdi:paw', 'mdi:dumbbell',
  'mdi:football', 'mdi:basketball', 'mdi:palette', 'mdi:brush',
  'mdi:book-open-variant', 'mdi:music', 'mdi:car', 'mdi:bicycle',
  'mdi:airplane', 'mdi:camera', 'mdi:gamepad-variant', 'mdi:puzzle',
  'mdi:medical-bag', 'mdi:pill', 'mdi:hand-heart', 'mdi:gift',
];

const CATEGORY_SUGGESTIONS: Record<string, string[]> = {
  'Food & Grocery': [
    'mdi:food-apple', 'mdi:fruit-grapes', 'mdi:carrot', 'mdi:bread-slice',
    'mdi:rice', 'mdi:cookie', 'mdi:cupcake', 'mdi:candy',
    'mdi:ice-cream', 'mdi:coffee', 'mdi:bottle-wine', 'mdi:silverware-fork-knife',
  ],
  'Fashion & Style': [
    'mdi:tshirt-crew', 'mdi:shoe-formal', 'mdi:shoe-heel', 'mdi:hanger',
    'mdi:hat-fedora', 'mdi:sunglasses', 'mdi:bow-tie', 'mdi:bag-personal',
    'mdi:ring', 'mdi:watch', 'mdi:lipstick', 'mdi:necklace',
  ],
  'Tech & Gadgets': [
    'mdi:cellphone', 'mdi:laptop', 'mdi:headphones', 'mdi:television',
    'mdi:speaker', 'mdi:camera', 'mdi:gamepad-variant', 'mdi:mouse',
    'mdi:keyboard', 'mdi:printer', 'mdi:router-wireless', 'mdi:monitor',
  ],
  'Home & Living': [
    'mdi:home', 'mdi:sofa', 'mdi:bed', 'mdi:lamp',
    'mdi:shower', 'mdi:window-open', 'mdi:table-furniture', 'mdi:bookshelf',
    'mdi:flower', 'mdi:candle', 'mdi:mirror', 'mdi:ceiling-fan',
  ],
  'Spiritual & Puja': [
    'mdi:meditation', 'mdi:candle', 'mdi:flower-tulip', 'mdi:bell',
    'mdi:fire', 'mdi:hands-pray', 'mdi:star-four-points', 'mdi:water',
  ],
};

const SUGGESTION_TABS = ['Recent', 'Popular', ...Object.keys(CATEGORY_SUGGESTIONS)];

/* ── Debounce Hook ── */
function useDebounce(value: string, delay: number) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

/* ── Types ── */
interface IconPickerProps {
  value: string;
  iconType?: string;
  onChange: (value: string, iconType: string) => void;
}

interface UploadedIcon {
  id: number;
  name: string;
  icon_type: string;
  file_url: string;
}

/* ── Iconify Search API ── */
const ICONIFY_API = 'https://api.iconify.design/search';

async function searchIconify(query: string): Promise<string[]> {
  if (!query || query.length < 2) return [];
  try {
    const res = await fetch(`${ICONIFY_API}?query=${encodeURIComponent(query)}&limit=60`);
    const data = await res.json();
    return data.icons || [];
  } catch {
    return [];
  }
}

/* ══════════════════════════════════════════════════════════ */
/*                     ICON PICKER                           */
/* ══════════════════════════════════════════════════════════ */
export const IconPicker: React.FC<IconPickerProps> = ({ value, iconType = 'iconify', onChange }) => {
  const { recent } = useRecentIcons();
  const [activeTab, setActiveTab] = useState<'iconify' | 'upload'>('iconify');
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<string[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [activeSuggestion, setActiveSuggestion] = useState('Popular');
  const [uploadedIcons, setUploadedIcons] = useState<UploadedIcon[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const debouncedSearch = useDebounce(searchTerm, 300);

  // Fetch uploaded icons on mount
  useEffect(() => {
    api.get('/admin/icon-assets/').then((res: any) => {
      setUploadedIcons(res || []);
    }).catch(() => {});
  }, []);

  // Search Iconify API
  useEffect(() => {
    if (!debouncedSearch || debouncedSearch.length < 2) {
      setSearchResults([]);
      return;
    }
    setIsSearching(true);
    searchIconify(debouncedSearch).then(results => {
      setSearchResults(results);
      setIsSearching(false);
    });
  }, [debouncedSearch]);

  const handleSelect = useCallback((iconId: string, type: string) => {
    onChange(iconId, type);
  }, [onChange]);

  const handleUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate
    const validTypes = ['image/svg+xml', 'image/png', 'image/webp', 'image/jpeg', 'image/jpg'];
    if (!validTypes.includes(file.type) && !file.name.endsWith('.svg')) {
      alert('Only SVG, PNG, WEBP, JPG files are allowed');
      return;
    }
    if (file.size > 512000) {
      alert('File must be under 500KB');
      return;
    }

    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('name', file.name.replace(/\.[^.]+$/, ''));

    try {
      const res: any = await api.post('/admin/icon-assets/upload/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setUploadedIcons(prev => [res, ...prev]);
      onChange(res.file_url, res.icon_type);
    } catch (err: any) {
      alert(err?.response?.data?.error || 'Upload failed');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }, [onChange]);

  // Current suggestion grid
  const suggestionIcons = useMemo(() => {
    if (activeSuggestion === 'Recent') return recent.map(r => r.value);
    if (activeSuggestion === 'Popular') return POPULAR_ICONS;
    return CATEGORY_SUGGESTIONS[activeSuggestion] || [];
  }, [activeSuggestion, recent]);

  // Determine what to show in the icon grid
  const displayIcons = searchTerm.length >= 2 ? searchResults : suggestionIcons;
  const isSelected = (id: string) => value === id;

  return (
    <div className="flex flex-col gap-5 p-5 rounded-2xl bg-gradient-to-br from-white to-gray-50/50 border border-border/60 shadow-xl shadow-black/5 relative overflow-hidden">
      {/* Decorative blurs */}
      <div className="absolute -top-20 -right-20 w-40 h-40 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-amber-100/30 rounded-full blur-3xl pointer-events-none" />

      {/* ── Header: Live Preview ── */}
      <div className="flex items-center gap-5 z-10">
        <div className="relative group">
          <div className="w-[72px] h-[72px] rounded-2xl bg-white shadow-lg border border-border/40 flex items-center justify-center text-primary transition-all group-hover:scale-105 duration-300 group-hover:shadow-xl">
            {value ? (
              iconType === 'uploaded_svg' || iconType === 'uploaded_image' ? (
                <img src={value} alt="icon" className="w-9 h-9 object-contain" />
              ) : (
                <Icon icon={value} width={36} height={36} />
              )
            ) : (
              <Sparkles size={36} className="text-gray-300" />
            )}
          </div>
          {value && (
            <motion.div
              initial={{ scale: 0 }} animate={{ scale: 1 }}
              className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-green-500 text-white flex items-center justify-center shadow-lg border-2 border-white"
            >
              <Check size={10} strokeWidth={3} />
            </motion.div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em] mb-1">Selected Icon</p>
          <p className="text-sm font-mono text-foreground truncate">
            {value || 'None selected'}
          </p>
          <p className="text-[10px] text-muted-foreground mt-0.5">
            Type: <span className="font-semibold">{iconType || 'iconify'}</span>
          </p>
        </div>
      </div>

      {/* ── Tab Switcher ── */}
      <div className="flex rounded-xl bg-gray-100/80 p-1 gap-1 z-10">
        <button
          type="button"
          onClick={() => setActiveTab('iconify')}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold transition-all duration-200 ${
            activeTab === 'iconify'
              ? 'bg-white text-primary shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <Sparkles size={14} />
          Iconify Library
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('upload')}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold transition-all duration-200 ${
            activeTab === 'upload'
              ? 'bg-white text-primary shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <Upload size={14} />
          Upload Custom
        </button>
      </div>

      {/* ── Iconify Tab ── */}
      <AnimatePresence mode="wait">
        {activeTab === 'iconify' && (
          <motion.div
            key="iconify"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="space-y-4 z-10"
          >
            {/* Search */}
            <div className="relative group">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
              <Input
                placeholder="Search icons… shoes, grocery, electronics…"
                className="h-11 pl-10 pr-10 bg-white/80 border-border/60 focus:ring-primary/20 rounded-xl shadow-sm"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X size={14} />
                </button>
              )}
              {isSearching && (
                <Loader2 size={16} className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-primary" />
              )}
            </div>

            {/* Suggestion Tabs (only when not searching) */}
            {searchTerm.length < 2 && (
              <div className="flex gap-1.5 overflow-x-auto no-scrollbar pb-1">
                {SUGGESTION_TABS.map(tab => (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => setActiveSuggestion(tab)}
                    className={`shrink-0 px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all ${
                      activeSuggestion === tab
                        ? 'bg-primary text-white shadow-sm'
                        : 'bg-gray-100 text-muted-foreground hover:bg-gray-200'
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>
            )}

            {/* Icon Grid */}
            <div className="grid grid-cols-6 sm:grid-cols-7 lg:grid-cols-8 gap-2.5 max-h-[260px] overflow-y-auto p-2 rounded-xl bg-gray-50/50 border border-gray-100/50">
              {displayIcons.length > 0 ? (
                displayIcons.map(iconId => (
                  <IconCell
                    key={iconId}
                    iconId={iconId}
                    selected={isSelected(iconId)}
                    onClick={() => handleSelect(iconId, 'iconify')}
                  />
                ))
              ) : (
                <div className="col-span-full py-10 text-center flex flex-col items-center gap-2">
                  <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center text-gray-400">
                    {isSearching ? <Loader2 size={24} className="animate-spin" /> : <Search size={24} />}
                  </div>
                  <p className="text-sm text-muted-foreground font-medium">
                    {isSearching
                      ? 'Searching…'
                      : searchTerm.length >= 2
                        ? `No icons found for "${searchTerm}"`
                        : 'Type to search icons'}
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* ── Upload Tab ── */}
        {activeTab === 'upload' && (
          <motion.div
            key="upload"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="space-y-4 z-10"
          >
            {/* Upload Area */}
            <label
              className={`flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed p-6 cursor-pointer transition-all ${
                isUploading
                  ? 'border-primary/40 bg-primary/5'
                  : 'border-border hover:border-primary/40 hover:bg-primary/5'
              }`}
            >
              {isUploading ? (
                <Loader2 size={28} className="animate-spin text-primary" />
              ) : (
                <Upload size={28} className="text-muted-foreground" />
              )}
              <div className="text-center">
                <p className="text-sm font-semibold text-foreground">
                  {isUploading ? 'Uploading…' : 'Click to upload icon'}
                </p>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  SVG preferred · PNG, WEBP, JPG · Max 500KB
                </p>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".svg,.png,.webp,.jpg,.jpeg"
                className="hidden"
                onChange={handleUpload}
                disabled={isUploading}
              />
            </label>

            {/* Uploaded Icons Grid */}
            {uploadedIcons.length > 0 && (
              <div>
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2">
                  Uploaded Icons ({uploadedIcons.length})
                </p>
                <div className="grid grid-cols-5 sm:grid-cols-6 lg:grid-cols-7 gap-2.5 max-h-[200px] overflow-y-auto p-2 rounded-xl bg-gray-50/50 border border-gray-100/50">
                  {uploadedIcons.map(icon => (
                    <button
                      key={icon.id}
                      type="button"
                      onClick={() => handleSelect(icon.file_url, icon.icon_type)}
                      className={`group flex flex-col items-center justify-center aspect-square rounded-xl border transition-all duration-200 relative ${
                        value === icon.file_url
                          ? 'border-primary bg-primary/10 ring-4 ring-primary/5 shadow-sm'
                          : 'border-border/40 bg-white hover:border-primary/40 hover:shadow-md hover:-translate-y-0.5'
                      }`}
                      title={icon.name}
                    >
                      <img
                        src={icon.file_url}
                        alt={icon.name}
                        className="w-6 h-6 object-contain"
                        loading="lazy"
                      />
                      <span className="absolute bottom-0.5 left-0 right-0 text-[7px] text-center opacity-0 group-hover:opacity-60 transition-opacity truncate px-1">
                        {icon.name}
                      </span>
                      {value === icon.file_url && (
                        <div className="absolute top-1 right-1 w-2 h-2 rounded-full bg-primary" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {uploadedIcons.length === 0 && (
              <div className="py-8 text-center flex flex-col items-center gap-2 bg-gray-50/50 rounded-xl border border-gray-100/50">
                <ImageIcon size={32} className="text-gray-300" />
                <p className="text-sm text-muted-foreground">No custom icons uploaded yet</p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Footer */}
      <div className="flex items-center justify-between pt-2 border-t border-border/40 z-10">
        <p className="text-[10px] text-muted-foreground font-medium flex items-center gap-1.5 uppercase tracking-widest">
          <Sparkles size={10} className="text-primary/60" />
          Powered by Iconify · 200k+ icons
        </p>
      </div>
    </div>
  );
};

/* ── Single Icon Cell ── */
const IconCell = React.memo(({ iconId, selected, onClick }: {
  iconId: string;
  selected: boolean;
  onClick: () => void;
}) => (
  <button
    type="button"
    onClick={onClick}
    className={`group flex flex-col items-center justify-center aspect-square rounded-xl border transition-all duration-200 relative ${
      selected
        ? 'border-primary bg-primary/10 text-primary shadow-sm ring-4 ring-primary/5'
        : 'border-border/40 bg-white text-muted-foreground hover:border-primary/40 hover:text-primary hover:shadow-md hover:-translate-y-0.5'
    }`}
    title={iconId}
  >
    <Icon icon={iconId} width={22} height={22} />
    <span className="absolute bottom-0.5 left-0 right-0 text-[7px] text-center opacity-0 group-hover:opacity-60 transition-opacity truncate px-1">
      {iconId.split(':')[1] || iconId}
    </span>
    {selected && (
      <div className="absolute top-1 right-1 w-2 h-2 rounded-full bg-primary" />
    )}
  </button>
));

IconCell.displayName = 'IconCell';
