export function Brand() {
  return (
    <span className="brand">
      <svg viewBox="0 0 40 40" fill="none" aria-hidden="true">
        <rect width="40" height="40" rx="12" fill="currentColor" />
        <path
          d="M12 12h10a6 6 0 0 1 0 12H12V12Zm0 12v5m10-5 6 5"
          stroke="var(--page)"
          strokeWidth="2.3"
          strokeLinejoin="round"
        />
        <circle cx="29" cy="11" r="2" fill="var(--highlighter)" />
      </svg>
      <span>recall.</span>
    </span>
  );
}
