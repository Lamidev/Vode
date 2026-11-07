"use client";

import React from "react";
import {
  GTBankLogo,
  AccessBankLogo,
  ZenithBankLogo,
  FirstBankLogo,
  UBALogo,
  MoniepointLogo,
  OPayLogo,
  KudaLogo,
  WemaLogo,
  StanbicLogo,
  SterlingLogo,
  UnionBankLogo,
  FCMBLogo,
  FidelityLogo,
  PolarisLogo,
  EcobankLogo,
  KeystoneLogo,
  JaizLogo,
  TajLogo,
  LotusLogo,
  PalmPayLogo,
  NombaLogo,
  ProvidusLogo,
  CarbonLogo,
  FairMoneyLogo,
  VFDLogo,
  RubiesLogo,
  PagaLogo,
} from "./BankLogos";

interface BankItem {
  name: string;
  Logo: React.FC<{ className?: string }>;
}

const BANKS: BankItem[] = [
  { name: "GTBank", Logo: GTBankLogo },
  { name: "Access Bank", Logo: AccessBankLogo },
  { name: "Zenith Bank", Logo: ZenithBankLogo },
  { name: "FirstBank", Logo: FirstBankLogo },
  { name: "UBA", Logo: UBALogo },
  { name: "Moniepoint", Logo: MoniepointLogo },
  { name: "OPay", Logo: OPayLogo },
  { name: "Kuda", Logo: KudaLogo },
  { name: "PalmPay", Logo: PalmPayLogo },
  { name: "Wema Bank", Logo: WemaLogo },
  { name: "Stanbic IBTC", Logo: StanbicLogo },
  { name: "FCMB", Logo: FCMBLogo },
  { name: "Fidelity Bank", Logo: FidelityLogo },
  { name: "Nomba", Logo: NombaLogo },
  { name: "Sterling", Logo: SterlingLogo },
  { name: "Union Bank", Logo: UnionBankLogo },
  { name: "Polaris Bank", Logo: PolarisLogo },
  { name: "Ecobank", Logo: EcobankLogo },
  { name: "Providus Bank", Logo: ProvidusLogo },
  { name: "Keystone Bank", Logo: KeystoneLogo },
  { name: "Jaiz Bank", Logo: JaizLogo },
  { name: "Taj Bank", Logo: TajLogo },
  { name: "Lotus Bank", Logo: LotusLogo },
  { name: "Carbon", Logo: CarbonLogo },
  { name: "FairMoney", Logo: FairMoneyLogo },
  { name: "VFD MFB", Logo: VFDLogo },
  { name: "Rubies Bank", Logo: RubiesLogo },
  { name: "Paga", Logo: PagaLogo },
];

export default function BankTicker() {
  return (
    <div className="w-full overflow-hidden py-3 select-none">
      <div className="flex w-max gap-3 sm:gap-3.5 animate-marquee items-center">
        {/* Double sequence for a mathematically seamless infinite loop (-50%) */}
        {[...BANKS, ...BANKS].map((bank, idx) => {
          const LogoComponent = bank.Logo;
          return (
            <div
              key={idx}
              className="flex items-center gap-2.5 px-3 py-1.5 sm:px-3.5 sm:py-2 bg-white/95 border border-[#E2E8F0] hover:border-[#00D084]/50 rounded-xl shadow-[0_2px_8px_rgba(15,23,42,0.04)] flex-shrink-0 transition-all hover:scale-105"
            >
              <div className="w-6 h-6 rounded-md overflow-hidden flex items-center justify-center flex-shrink-0 shadow-2xs">
                <LogoComponent className="w-6 h-6" />
              </div>
              <span className="text-xs font-semibold text-[#090D16] whitespace-nowrap">
                {bank.name}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
