type IconProps = { className?: string; size?: number };

const base = {
  fill: "none",
  strokeWidth: 2,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

export function SearchIcon({ className, size = 18 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...base} stroke="currentColor" className={className}>
      <circle cx="11" cy="11" r="7" />
      <path d="M21 21l-4.3-4.3" />
    </svg>
  );
}

export function GiftIcon({ className, size = 18 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...base} stroke="currentColor" className={className}>
      <path d="M20 12v9H4v-9M2 7h20v5H2zM12 22V7M12 7C10 3 5 3 5 6.5S9 10 12 7zM12 7c2-4 7-4 7-.5S15 10 12 7z" />
    </svg>
  );
}

export function ShieldIcon({ className, size = 18 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...base} stroke="currentColor" className={className}>
      <path d="M12 22s8-4.5 8-11.8V5l-8-3-8 3v5.2C4 17.5 12 22 12 22z" />
    </svg>
  );
}

export function ShieldCheckIcon({ className, size = 18 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...base} stroke="currentColor" className={className}>
      <path d="M12 22s8-4.5 8-11.8V5l-8-3-8 3v5.2C4 17.5 12 22 12 22z" />
      <path d="M9 12l2 2 4-4" />
    </svg>
  );
}

export function PillIcon({ className, size = 18 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...base} stroke="currentColor" className={className}>
      <rect x="3" y="9" width="18" height="8" rx="4" transform="rotate(-45 12 13)" />
      <path d="M9.5 9.5l4 4" />
    </svg>
  );
}

export function MapPinIcon({ className, size = 14 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...base} stroke="currentColor" className={className}>
      <path d="M12 21c-4-3.5-8-7.3-8-11.5A5.5 5.5 0 0112 5a5.5 5.5 0 018 4.5C20 13.7 16 17.5 12 21z" />
      <circle cx="12" cy="9.5" r="2" />
    </svg>
  );
}

export function PlusIcon({ className, size = 16 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...base} stroke="currentColor" className={className}>
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

export function ArrowRightIcon({ className, size = 16 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...base} stroke="currentColor" className={className}>
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  );
}

export function CheckIcon({ className, size = 13 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...base} strokeWidth={3} stroke="currentColor" className={className}>
      <path d="M20 6L9 17l-5-5" />
    </svg>
  );
}

export function PlaneIcon({ className, size = 16 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...base} stroke="currentColor" className={className}>
      <path d="M22 2L11 13" />
      <path d="M22 2l-7 20-4-9-9-4 20-7z" />
    </svg>
  );
}

export function UserIcon({ className, size = 18 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...base} stroke="currentColor" className={className}>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21c0-4 3.6-6.5 8-6.5s8 2.5 8 6.5" />
    </svg>
  );
}

export function GlobeIcon({ className, size = 14 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...base} stroke="currentColor" className={className}>
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18M12 3c2.5 2.7 2.5 15.3 0 18M12 3c-2.5 2.7-2.5 15.3 0 18" />
    </svg>
  );
}

export function CalendarIcon({ className, size = 14 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...base} stroke="currentColor" className={className}>
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M3 10h18M8 3v4M16 3v4" />
    </svg>
  );
}

export function TagIcon({ className, size = 14 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...base} stroke="currentColor" className={className}>
      <path d="M20.6 12.4L12.6 20.4a2 2 0 01-2.8 0l-7.2-7.2a2 2 0 010-2.8L10.6 2.4a2 2 0 011.4-.6h6.6a2 2 0 012 2v6.6a2 2 0 01-.6 1.4z" />
      <circle cx="15" cy="7" r="1.4" />
    </svg>
  );
}

export function BadgeCheckIcon({ className, size = 14 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...base} stroke="currentColor" className={className}>
      <path d="M12 2.5l2.4 2 3.1-.3 1 3 2.5 1.9-1.3 2.9 1.3 2.9-2.5 1.9-1 3-3.1-.3-2.4 2-2.4-2-3.1.3-1-3L3 15.9l1.3-2.9L3 10.1l2.5-1.9 1-3 3.1.3z" />
      <path d="M9 12.3l2 2 4-4.2" />
    </svg>
  );
}
