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
      <circle cx="50" cy="50" r="28" stroke="#00B875" strokeWidth="11" />
      <circle cx="50" cy="50" r="10" fill="#00B875" />
    </svg>
  );
}

export function KudaLogo({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <rect width="100" height="100" rx="14" fill="#40196D" />
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
      <circle cx="50" cy="50" r="22" fill="#FFFFFF" />
      <circle cx="50" cy="50" r="10" fill="#E31837" />
    </svg>
  );
}

export function UnionBankLogo({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <rect width="100" height="100" rx="14" fill="#0054A6" />
      <path
        d="M32 64C36 58 38 52 42 48C46 44 54 44 60 40C64 36 66 30 70 26C72 30 68 36 74 38C70 42 66 46 62 48L68 64H60L56 52L48 56L44 64H32Z"
        fill="#FFFFFF"
      />
    </svg>
  );
}

export function FCMBLogo({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <rect width="100" height="100" rx="14" fill="#5C2D91" />
      <rect x="25" y="25" width="22" height="22" rx="3" fill="#FFB81C" />
      <rect x="53" y="25" width="22" height="22" rx="3" fill="#FFFFFF" opacity="0.9" />
      <rect x="25" y="53" width="22" height="22" rx="3" fill="#FFFFFF" opacity="0.9" />
      <rect x="53" y="53" width="22" height="22" rx="3" fill="#FFB81C" />
    </svg>
  );
}

export function FidelityLogo({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <rect width="100" height="100" rx="14" fill="#002D62" />
      <path d="M30 24C30 24 46 22 52 46C56 64 42 76 42 76C42 76 34 68 34 52C34 38 30 24 30 24Z" fill="#00A859" />
      <path d="M70 24C70 24 54 22 48 46C44 64 58 76 58 76C58 76 66 68 66 52C66 38 70 24 70 24Z" fill="#FFFFFF" />
    </svg>
  );
}

export function PolarisLogo({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <rect width="100" height="100" rx="14" fill="#49176D" />
      <path d="M26 68C24 46 42 30 64 26C74 24 76 32 68 36C52 44 42 56 42 68C42 76 30 76 26 68Z" fill="#D91B5B" />
      <circle cx="68" cy="32" r="7" fill="#FFFFFF" />
    </svg>
  );
}

export function EcobankLogo({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <rect width="100" height="100" rx="14" fill="#005B82" />
      <circle cx="50" cy="50" r="26" stroke="#FFFFFF" strokeWidth="3" strokeDasharray="4 4" opacity="0.4" />
      <path d="M25 50C25 36 36 25 50 25C64 25 75 36 75 50" stroke="#FFFFFF" strokeWidth="5" strokeLinecap="round" />
      <path d="M30 62C38 68 50 72 62 66" stroke="#00D084" strokeWidth="5" strokeLinecap="round" />
      <text x="50" y="55" fill="#FFFFFF" fontSize="13" fontWeight="900" fontFamily="sans-serif" textAnchor="middle" letterSpacing="0.5">
        eco
      </text>
    </svg>
  );
}

export function KeystoneLogo({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <rect width="100" height="100" rx="14" fill="#0A3063" />
      <path d="M50 22L76 48L50 74L24 48L50 22Z" fill="#00A3E0" />
      <path d="M50 32L66 48L50 64L34 48L50 32Z" fill="#FFFFFF" />
      <rect x="46" y="44" width="8" height="8" rx="1" fill="#0A3063" />
    </svg>
  );
}

export function JaizLogo({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <rect width="100" height="100" rx="14" fill="#006837" />
      <path d="M50 24L56 38L70 34L64 48L76 56L62 60L62 74L50 66L38 74L38 60L24 56L36 48L30 34L44 38L50 24Z" fill="#D4AF37" />
      <circle cx="50" cy="50" r="8" fill="#FFFFFF" />
    </svg>
  );
}

export function TajLogo({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <rect width="100" height="100" rx="14" fill="#E30613" />
      <text x="50" y="58" fill="#FFFFFF" fontSize="24" fontWeight="900" fontFamily="sans-serif" textAnchor="middle" letterSpacing="1">
        TAJ
      </text>
      <rect x="36" y="66" width="28" height="4" rx="2" fill="#FFFFFF" />
    </svg>
  );
}

export function LotusLogo({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <rect width="100" height="100" rx="14" fill="#4A154B" />
      <path d="M50 26C50 26 38 42 38 56C38 66 44 72 50 72C56 72 62 66 62 56C62 42 50 26 50 26Z" fill="#FFFFFF" />
      <path d="M34 42C34 42 22 52 24 64C26 72 34 74 40 70C36 64 34 54 34 42Z" fill="#FFFFFF" opacity="0.8" />
      <path d="M66 42C66 42 78 52 76 64C74 72 66 74 60 70C64 64 66 54 66 42Z" fill="#FFFFFF" opacity="0.8" />
    </svg>
  );
}

export function PalmPayLogo({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <rect width="100" height="100" rx="14" fill="#39008F" />
      <circle cx="50" cy="50" r="26" fill="#FF6800" />
      <path d="M42 38C42 34 46 32 50 32C54 32 58 34 58 38V54C58 58 54 62 50 62C46 62 42 58 42 54V38Z" fill="#FFFFFF" />
      <circle cx="50" cy="42" r="4" fill="#39008F" />
    </svg>
  );
}

export function NombaLogo({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <rect width="100" height="100" rx="14" fill="#111827" />
      <rect x="22" y="22" width="56" height="56" rx="14" fill="#FFC727" />
      <path d="M38 60V40H44L56 56V40H62V60H56L44 44V60H38Z" fill="#111827" />
    </svg>
  );
}

export function ProvidusLogo({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <rect width="100" height="100" rx="14" fill="#0D2040" />
      <rect x="32" y="32" width="26" height="26" stroke="#C5A059" strokeWidth="5" transform="rotate(45 45 45)" />
      <rect x="42" y="42" width="26" height="26" stroke="#FFFFFF" strokeWidth="4" transform="rotate(45 55 55)" opacity="0.9" />
    </svg>
  );
}

export function CarbonLogo({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <rect width="100" height="100" rx="14" fill="#0B0E14" />
      <circle cx="50" cy="50" r="24" stroke="#FF007A" strokeWidth="8" strokeDasharray="110 50" transform="rotate(-40 50 50)" />
    </svg>
  );
}

export function FairMoneyLogo({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <rect width="100" height="100" rx="14" fill="#FFFFFF" stroke="#E2E8F0" strokeWidth="2" />
      <circle cx="44" cy="50" r="18" fill="#00C975" />
      <circle cx="56" cy="50" r="18" fill="#009A55" opacity="0.85" />
      <path d="M47 38H53V62H47V38Z" fill="#FFFFFF" />
    </svg>
  );
}

export function VFDLogo({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <rect width="100" height="100" rx="14" fill="#2B2D42" />
      <path d="M26 30L44 68H56L74 30H60L50 52L40 30H26Z" fill="#E30613" />
      <circle cx="50" cy="74" r="3.5" fill="#FFFFFF" />
    </svg>
  );
}

export function RubiesLogo({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <rect width="100" height="100" rx="14" fill="#5B21B6" />
      <polygon points="34,36 66,36 78,50 50,76 22,50" fill="#F43F5E" />
      <polygon points="34,36 50,50 22,50" fill="#FDA4AF" opacity="0.7" />
      <polygon points="66,36 50,50 78,50" fill="#E11D48" />
      <polygon points="50,50 78,50 50,76" fill="#BE123C" />
      <polygon points="50,50 22,50 50,76" fill="#E11D48" opacity="0.9" />
    </svg>
  );
}

export function PagaLogo({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <rect width="100" height="100" rx="14" fill="#FF6A00" />
      <circle cx="40" cy="50" r="14" stroke="#FFFFFF" strokeWidth="6" />
      <circle cx="60" cy="50" r="14" stroke="#FFFFFF" strokeWidth="6" />
    </svg>
  );
}


