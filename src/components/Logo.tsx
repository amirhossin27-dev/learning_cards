/** Logo concept A: an index card with one line marked in highlighter yellow. */
export function LogoMark({ size = 32 }: { size?: number }) {
  return (
    <svg className="logo-mark" width={size} height={size} viewBox="0 0 120 120" aria-hidden="true">
      <rect width="120" height="120" rx="28" fill="#17181C" />
      <g transform="rotate(-8 60 60)">
        <rect x="22" y="32" width="76" height="56" rx="9" fill="#FFFFFF" />
        <rect x="31" y="43" width="34" height="5" rx="2.5" fill="#C9CAC4" />
        <rect x="28" y="54" width="58" height="13" rx="3" fill="#FFE14D" />
        <rect x="31" y="58" width="48" height="5" rx="2.5" fill="#17181C" />
        <rect x="31" y="73" width="26" height="5" rx="2.5" fill="#C9CAC4" />
      </g>
    </svg>
  );
}
