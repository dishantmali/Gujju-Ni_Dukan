import React, { useState, useCallback, useEffect } from 'react';
import { Sparkles, X, Check, Clock, Trash2 } from 'lucide-react';
import { IconPicker } from './IconPicker';
import { CategoryIcon } from './CategoryIcon';
import { useRecentIcons } from '@/hooks/useRecentIcons';

interface IconPickerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  value: string;
  iconType?: string;
  onChange: (value: string, iconType: string) => void;
  title?: string;
  description?: string;
}

export const IconPickerModal: React.FC<IconPickerModalProps> = ({
  open,
  onOpenChange,
  value,
  iconType = 'iconify',
  onChange,
  title = 'Choose Category Icon',
  description = 'Search thousands of icons or upload your own.',
}) => {
  const { recent, addRecent, clearRecent } = useRecentIcons();

  // Internal draft state while modal is open
  const [draftValue, setDraftValue] = useState(value);
  const [draftType, setDraftType] = useState(iconType);

  // Sync draft when modal opens
  useEffect(() => {
    if (open) {
      setDraftValue(value);
      setDraftType(iconType);
    }
  }, [open, value, iconType]);

  const handlePickerChange = useCallback((v: string, t: string) => {
    setDraftValue(v);
    setDraftType(t);
  }, []);

  const handleSave = useCallback(() => {
    if (!draftValue) return;
    onChange(draftValue, draftType);
    addRecent(draftValue, draftType);
    onOpenChange(false);
  }, [draftValue, draftType, onChange, addRecent, onOpenChange]);

  const handleCancel = useCallback(() => {
    onOpenChange(false);
  }, [onOpenChange]);

  const selectRecent = useCallback((r: { value: string; type: string }) => {
    setDraftValue(r.value);
    setDraftType(r.type);
  }, []);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      onClick={handleCancel}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      {/* Modal Card */}
      <div
        className="relative w-full max-w-2xl max-h-[90vh] bg-background rounded-2xl border border-border/60 shadow-2xl flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 pt-6 pb-2 shrink-0">
          <div className="flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-base font-semibold">
              <Sparkles size={18} className="text-primary" />
              {title}
            </h2>
            <button
              type="button"
              onClick={handleCancel}
              className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center transition-colors"
            >
              <X size={16} />
            </button>
          </div>
          <p className="text-xs text-muted-foreground mt-1">{description}</p>
        </div>

        {/* Scrollable Body */}
        <div className="px-6 py-4 space-y-5 overflow-y-auto custom-scrollbar">
          {/* ── Live Preview Banner ── */}
          <div className="flex items-center gap-4 p-4 rounded-2xl bg-gradient-to-r from-gray-50 to-gray-100/50 border border-border/40">
            <div className="relative">
              <div className="w-16 h-16 rounded-xl bg-white border border-border/50 shadow-sm flex items-center justify-center">
                {draftValue ? (
                  <CategoryIcon
                    name={draftValue}
                    iconType={draftType}
                    size={32}
                    className="text-primary"
                  />
                ) : (
                  <Sparkles size={32} className="text-gray-300" />
                )}
              </div>
              {draftValue && (
                <div className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-green-500 text-white flex items-center justify-center shadow-md border-2 border-white">
                  <Check size={10} strokeWidth={3} />
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em]">
                Selected Icon
              </p>
              <p className="text-sm font-mono text-foreground truncate mt-0.5">
                {draftValue || 'None selected'}
              </p>
              <p className="text-[10px] text-muted-foreground mt-0.5">
                Type: <span className="font-semibold">{draftType || 'iconify'}</span>
              </p>
            </div>
          </div>

          {/* ── Recent Icons ── */}
          {recent.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-1.5">
                  <Clock size={10} />
                  Recently Used
                </p>
                <button
                  type="button"
                  onClick={clearRecent}
                  className="text-[10px] text-red-500 hover:text-red-600 transition-colors flex items-center gap-1"
                  title="Clear recent"
                >
                  <Trash2 size={10} />
                  Clear
                </button>
              </div>
              <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
                {recent.map((r, idx) => (
                  <button
                    key={`${r.value}-${idx}`}
                    type="button"
                    onClick={() => selectRecent(r)}
                    className={`shrink-0 w-10 h-10 rounded-xl border transition-all duration-200 flex items-center justify-center ${
                      draftValue === r.value
                        ? 'border-primary bg-primary/10 ring-2 ring-primary/10 shadow-sm'
                        : 'border-border/40 bg-white hover:border-primary/30 hover:shadow-sm'
                    }`}
                    title={r.label || r.value}
                  >
                    <CategoryIcon
                      name={r.value}
                      iconType={r.type}
                      size={18}
                      className={draftValue === r.value ? 'text-primary' : 'text-muted-foreground'}
                    />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ── Main Icon Picker ── */}
          <IconPicker
            value={draftValue}
            iconType={draftType}
            onChange={handlePickerChange}
          />
        </div>

        {/* ── Footer Actions ── */}
        <div className="px-6 py-4 border-t border-border/40 flex items-center justify-between bg-gray-50/50 shrink-0">
          <p className="text-[10px] text-muted-foreground font-medium flex items-center gap-1.5">
            <Sparkles size={10} className="text-primary/60" />
            Powered by Iconify
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCancel}
              className="px-3 h-9 rounded-lg text-xs font-medium border border-border bg-background hover:bg-gray-50 transition-colors flex items-center gap-1"
            >
              <X size={14} />
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={!draftValue}
              className="px-3 h-9 rounded-lg text-xs font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center gap-1"
            >
              <Check size={14} />
              Save Icon
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
