/**
 * A small antique wax-seal / medal in ochre gold, marking a claim that is
 * backed by a primary or official source.
 */
export function PrimarySeal({
  size = 44,
  className = "",
  title = "Verified against a primary or official source",
}: {
  size?: number;
  className?: string;
  title?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      role="img"
      aria-label={title}
      className={className}
    >
      <title>{title}</title>
      <g fill="none" stroke="var(--gold)" strokeLinecap="round">
        {/* milled / reeded outer edge */}
        <circle cx="32" cy="32" r="30" strokeWidth="1" strokeDasharray="1.6 2.4" />
        <circle cx="32" cy="32" r="25.5" strokeWidth="1.6" />
        <circle cx="32" cy="32" r="21.5" strokeWidth="0.8" opacity="0.8" />
      </g>
      {/* five-point star */}
      <path
        d="M32,22 L34.53,28.52 L41.51,28.91 L36.09,33.33 L37.88,40.09 L32,36.3 L26.12,40.09 L27.91,33.33 L22.49,28.91 L29.47,28.52 Z"
        fill="var(--gold)"
        opacity="0.92"
      />
    </svg>
  );
}
