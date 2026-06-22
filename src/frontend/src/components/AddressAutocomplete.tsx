import React, { useEffect, useRef, useState } from 'react';
import { MapPin, X } from 'lucide-react';
import { autocompleteAddress, type AddressSuggestion } from '../api/geo';
import { useDebouncedValue } from '../hooks/useDebouncedValue';

interface Props {
  value: string;
  onChange: (value: string) => void;
  onSelect: (suggestion: AddressSuggestion) => void;
  placeholder?: string;
}

export const AddressAutocomplete: React.FC<Props> = ({
  value,
  onChange,
  onSelect,
  placeholder = 'Start typing your address…',
}) => {
  const debounced = useDebouncedValue(value, 350);
  const [results, setResults] = useState<AddressSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onDocClick = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, []);

  useEffect(() => {
    const run = async () => {
      const q = debounced.trim();
      if (q.length < 4) {
        setResults([]);
        return;
      }

      setLoading(true);
      try {
        const data = await autocompleteAddress(q);
        setResults(data);
        setOpen(true);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    run();
  }, [debounced]);

  return (
    <div ref={rootRef} className="relative">
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <MapPin className="h-4 w-4 text-text-muted" aria-hidden="true" />
        </div>
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => value.trim().length >= 4 && results.length > 0 && setOpen(true)}
          className="form-input pl-10 pr-10"
          placeholder={placeholder}
          aria-label="Search address"
          autoComplete="off"
        />
        {value && (
          <button
            type="button"
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-text-muted hover:text-text-secondary"
            onClick={() => {
              onChange('');
              setResults([]);
              setOpen(false);
            }}
            aria-label="Clear address search"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        )}
      </div>

      {open && (
        <div className="absolute z-50 mt-2 w-full bg-surface border border-border-default rounded-xl shadow-lg overflow-hidden">
          {loading ? (
            <div className="p-3 text-sm text-text-secondary">Searching…</div>
          ) : results.length === 0 ? (
            <div className="p-3 text-sm text-text-secondary">No matches</div>
          ) : (
            <ul className="max-h-64 overflow-auto">
              {results.map((r) => (
                <li key={String(r.placeId)}>
                  <button
                    type="button"
                    className="w-full text-left px-4 py-3 text-sm hover:bg-surface-alt"
                    onClick={() => {
                      onSelect(r);
                      setOpen(false);
                    }}
                  >
                    {r.displayName}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
};
