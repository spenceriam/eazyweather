import { GripVertical, X } from "lucide-react";
import type { ReactNode } from "react";
import type { CardSpan } from "../../types/prefs";

interface VariantOption {
  value: string;
  label: string;
}

interface CardChromeProps {
  label: string;
  actionLabel?: string;
  onAction?: () => void;
  editing?: boolean;
  span: CardSpan;
  onSpanToggle?: () => void;
  variantOptions?: VariantOption[];
  variantValue?: string;
  onVariantChange?: (value: string) => void;
  onRemove?: () => void;
  dragHandleAttributes?: React.HTMLAttributes<HTMLButtonElement>;
  children: ReactNode;
}

/**
 * Shared card shell: --surface background, 1px --line border, 3px radius,
 * --csh shadow, uppercase letter-spaced section label. In edit mode the
 * header swaps to drag handle / span toggle / variant toggle / remove.
 */
export function CardChrome({
  label,
  actionLabel,
  onAction,
  editing = false,
  span,
  onSpanToggle,
  variantOptions,
  variantValue,
  onVariantChange,
  onRemove,
  dragHandleAttributes,
  children,
}: CardChromeProps) {
  return (
    <div className="flex flex-col bg-surface border border-line rounded-card shadow-card h-full">
      <div className="flex items-center justify-between gap-2 px-4 pt-3 pb-2">
        {editing ? (
          <button
            type="button"
            className="cursor-grab active:cursor-grabbing text-mut hover:text-ink p-1 -ml-1 rounded-control"
            aria-label={`Drag to reorder ${label}`}
            {...dragHandleAttributes}
          >
            <GripVertical className="w-4 h-4" />
          </button>
        ) : (
          <span className="text-[11px] font-bold uppercase tracking-[0.08em] text-mut">
            {label}
          </span>
        )}

        {editing ? (
          <div className="flex items-center gap-1.5">
            {variantOptions && variantOptions.length > 0 && (
              <select
                value={variantValue}
                onChange={(e) => onVariantChange?.(e.target.value)}
                className="text-xs bg-panel border border-line rounded-control px-1.5 py-1 text-ink"
                aria-label={`${label} display style`}
              >
                {variantOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            )}
            {onSpanToggle && (
              <button
                type="button"
                onClick={onSpanToggle}
                className="text-xs px-2 py-1 rounded-control border border-line text-ink hover:bg-chip transition-colors"
              >
                {span === "full" ? "Full width" : "1 column"}
              </button>
            )}
            {onRemove && (
              <button
                type="button"
                onClick={onRemove}
                aria-label={`Remove ${label} card`}
                className="p-1 rounded-control text-mut hover:text-warnink hover:bg-warnbg transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        ) : (
          actionLabel &&
          onAction && (
            <button
              type="button"
              onClick={onAction}
              className="text-xs font-semibold text-link hover:underline"
            >
              {actionLabel}
            </button>
          )
        )}
      </div>
      <div className="flex-1 px-4 pb-4 min-w-0">{children}</div>
    </div>
  );
}
