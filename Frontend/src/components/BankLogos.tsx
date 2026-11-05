import React from "react";

export function GTBankLogo({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <rect width="100" height="100" rx="14" fill="#F26522" />
      <rect x="22" y="22" width="26" height="26" fill="#FFFFFF" />
      <text x="54" y="42" fill="#FFFFFF" fontSize="20" fontWeight="900" fontFamily="sans-serif">GT</text>
      <text x="22" y="74" fill="#FFFFFF" fontSize="17" fontWeight="700" fontFamily="sans-serif" letterSpacing="-0.5">Bank</text>
    </svg>
  );
}

export function AccessBankLogo({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <rect width="100" height="100" rx="14" fill="#FFFFFF" stroke="#E2E8F0" strokeWidth="2" />
      {/* Orange Interlocking Chevrons */}
      <path d="M26 50L44 32L62 50L44 68L26 50Z" fill="#F58220" />
      <path d="M44 50L62 32L80 50L62 68L44 50Z" fill="#002E6D" />
      <path d="M44 50L53 41L62 50L53 59L44 50Z" fill="#F58220" opacity="0.9" />
    </svg>
  );
}

export function ZenithBankLogo({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <rect width="100" height="100" rx="14" fill="#FFFFFF" stroke="#E2E8F0" strokeWidth="2" />
      <path d="M20 25H80L48 55H80V75H20L52 45H20V25Z" fill="#D81E05" />
      <rect x="44" y="46" width="12" height="8" fill="#111827" />
    </svg>
  );
}

export function FirstBankLogo({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <rect width="100" height="100" rx="14" fill="#00205B" />
      {/* Gold Elephant Silhouette & Star */}
      <path
        d="M32 38C34 33 42 30 52 32C64 34 68 40 70 48C72 56 68 62 68 70H60V62C58 60 52 61 50 63V70H42L41 58C36 57 32 53 32 46C32 42 30 40 26 40C24 40 22 43 24 48C26 52 28 56 28 62H22C20 54 18 48 20 42C22 36 26 34 32 38Z"
        fill="#FFC72C"
      />
      <polygon points="68,26 71,32 77,32 72,36 74,42 68,38 63,42 65,36 60,32 66,32" fill="#FFC72C" />
    </svg>
  );
}

export function UBALogo({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <rect width="100" height="100" rx="14" fill="#CD1414" />
      {/* UBA stylized text and wing drop */}
      <text x="50" y="58" fill="#FFFFFF" fontSize="28" fontWeight="900" fontFamily="sans-serif" textAnchor="middle" letterSpacing="1">
        UBA
      </text>
      <circle cx="50" cy="74" r="4" fill="#FFFFFF" />
    </svg>
  );
}

export function MoniepointLogo({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <rect width="100" height="100" rx="14" fill="#03369D" />
      {/* Moniepoint Interlocking "M" shield */}
      <path
        d="M26 68V42C26 34 33 28 41 28C48 28 54 33 56 39C58 33 64 28 71 28C79 28 86 34 86 42V68H72V45C72 40 68 37 64 37C60 37 56 40 56 45V68H44V45C44 40 40 37 36 37C32 37 28 40 28 45V68H26Z"
        fill="#00DF89"
      />
    </svg>
  );
}

export function OPayLogo({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <rect width="100" height="100" rx="14" fill="#FFFFFF" stroke="#E2E8F0" strokeWidth="2" />
      {/* OPay Green Ring with dot */}
      <circle cx="50" cy="50" r="28" stroke="#00B875" strokeWidth="11" />
      <circle cx="50" cy="50" r="10" fill="#00B875" />
    </svg>
  );
}

export function KudaLogo({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <rect width="100" height="100" rx="14" fill="#40196D" />
      {/* Kuda white "K" */}
      <text x="50" y="66" fill="#FFFFFF" fontSize="48" fontWeight="900" fontFamily="sans-serif" textAnchor="middle">
        K
      </text>
    </svg>
  );
}

export function WemaLogo({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <rect width="100" height="100" rx="14" fill="#7A1C5A" />
      <path d="M26 30L38 70L50 42L62 70L74 30H64L56 58L48 36H52L44 36L40 36L34 58L28 30H26Z" fill="#FFFFFF" />
    </svg>
  );
}

export function StanbicLogo({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <rect width="100" height="100" rx="14" fill="#0033A0" />
      {/* Blue shield with white & red emblem */}
      <path d="M50 20L76 32V56C76 72 50 84 50 84C50 84 24 72 24 56V32L50 20Z" fill="#FFFFFF" />
      <path d="M50 24L72 34V54C72 68 50 78 50 78C50 78 28 68 28 54V34L50 24Z" fill="#0033A0" />
      <path d="M38 48H62V54H38V48Z" fill="#E31837" />
    </svg>
  );
}

export function SterlingLogo({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <rect width="100" height="100" rx="14" fill="#E31837" />
      {/* White circle with pin */}
      <circle cx="50" cy="50" r="22" fill="#FFFFFF" />
      <circle cx="50" cy="50" r="10" fill="#E31837" />
    </svg>
  );
}

export function UnionBankLogo({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <rect width="100" height="100" rx="14" fill="#0054A6" />
      {/* Galloping Stallion */}
      <path
        d="M32 64C36 58 38 52 42 48C46 44 54 44 60 40C64 36 66 30 70 26C72 30 68 36 74 38C70 42 66 46 62 48L68 64H60L56 52L48 56L44 64H32Z"
        fill="#FFFFFF"
      />
    </svg>
  );
}

