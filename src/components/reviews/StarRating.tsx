import React, { useState } from "react";
import { Star } from "lucide-react";

const STARS = [1, 2, 3, 4, 5];
const LABELS = ["", "Poor", "Fair", "Good", "Very good", "Excellent"];

/** Read-only stars; half values round to the nearest whole star. */
export const Stars: React.FC<{ value: number; className?: string }> = ({ value, className = "h-4 w-4" }) => (
  <span className="inline-flex items-center gap-0.5" aria-label={`${value} out of 5 stars`}>
    {STARS.map((n) => (
      <Star
        key={n}
        className={`${className} ${n <= Math.round(value) ? "fill-yellow-500 text-yellow-500" : "text-muted-foreground/40"}`}
      />
    ))}
  </span>
);

/** Star picker for writing a review. */
export const StarInput: React.FC<{ value: number; onChange: (v: number) => void; disabled?: boolean }> = ({
  value,
  onChange,
  disabled,
}) => {
  const [hover, setHover] = useState(0);
  const shown = hover || value;
  return (
    <div className="flex flex-col items-center gap-1">
      <div className="flex gap-1" role="radiogroup" aria-label="Rating" onMouseLeave={() => setHover(0)}>
        {STARS.map((n) => (
          <button
            key={n}
            type="button"
            role="radio"
            aria-checked={value === n}
            aria-label={`${n} star${n === 1 ? "" : "s"}`}
            disabled={disabled}
            onMouseEnter={() => setHover(n)}
            onClick={() => onChange(n)}
            className="rounded-md p-1 transition-transform hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <Star className={`h-8 w-8 ${n <= shown ? "fill-yellow-500 text-yellow-500" : "text-muted-foreground/40"}`} />
          </button>
        ))}
      </div>
      <span className="h-5 text-sm text-muted-foreground">{LABELS[shown]}</span>
    </div>
  );
};

/** "4.8 (12)" or "New" when nobody has reviewed yet. */
export const RatingBadge: React.FC<{ rating?: number | null; count?: number; className?: string }> = ({
  rating,
  count = 0,
  className = "",
}) => (
  <span className={`inline-flex items-center gap-1 font-bold text-yellow-500 ${className}`}>
    <Star className="h-3.5 w-3.5 fill-current" />
    {rating != null && count > 0 ? (
      <>
        {rating.toFixed(1)}
        <span className="font-normal text-muted-foreground">({count})</span>
      </>
    ) : (
      "New"
    )}
  </span>
);
