import { BankInfo } from "./banking.interface";
import { BankingService } from "./banking.service";

// Canonical Nigerian bank codes & common synonyms
const POPULAR_BANKS: Array<{ code: string; names: string[] }> = [
  { code: "058", names: ["gtb", "gtbank", "gt bank", "guaranty trust", "guaranty trust bank", "guaranty"] },
  { code: "044", names: ["access", "access bank", "diamond", "access diamond"] },
  { code: "057", names: ["zenith", "zenith bank"] },
  { code: "011", names: ["first bank", "firstbank", "fbn", "first"] },
  { code: "033", names: ["uba", "united bank for africa"] },
  { code: "50515", names: ["moniepoint", "moniepoint mfb", "monie point"] },
  { code: "999992", names: ["opay", "paycom", "opay digital services"] },
  { code: "50211", names: ["kuda", "kuda bank", "kuda mfb"] },
  { code: "999991", names: ["palmpay", "palm pay"] },
  { code: "035", names: ["wema", "wema bank", "alat", "alat by wema"] },
  { code: "221", names: ["stanbic", "stanbic ibtc", "stanbic bank"] },
  { code: "214", names: ["fcmb", "first city monument bank"] },
  { code: "070", names: ["fidelity", "fidelity bank"] },
  { code: "032", names: ["union", "union bank"] },
  { code: "232", names: ["sterling", "sterling bank"] },
  { code: "076", names: ["polaris", "polaris bank", "skye", "skye bank"] },
  { code: "050", names: ["ecobank", "eco bank", "eco"] },
  { code: "101", names: ["providus", "providus bank"] },
  { code: "082", names: ["keystone", "keystone bank"] },
  { code: "301", names: ["jaiz", "jaiz bank"] },
  { code: "302", names: ["taj", "taj bank"] },
  { code: "303", names: ["lotus", "lotus bank"] },
  { code: "50584", names: ["carbon", "one finance"] },
  { code: "51253", names: ["fairmoney", "fairmoney mfb", "fair money"] },
  { code: "50767", names: ["vfd", "vfd mfb", "vfd microfinance bank"] },
  { code: "50711", names: ["rubies", "rubies bank"] },
  { code: "100002", names: ["paga"] },
];

export class BankMatcher {
  /**
   * Resolve a user's conversational text query into a valid bank code and canonical bank name
   */
  static async resolveBank(input: string): Promise<{ code: string; name: string } | null> {
    const cleanInput = input.trim().toLowerCase().replace(/[^a-z0-9]/g, "");

    // 1. Direct code match (e.g. "058", "044")
    const byCode = POPULAR_BANKS.find((b) => b.code === cleanInput);
    if (byCode) {
      return { code: byCode.code, name: byCode.names[1] || byCode.names[0] };
    }

    // 2. Synonyms match
    for (const bank of POPULAR_BANKS) {
      for (const alias of bank.names) {
        const cleanAlias = alias.replace(/[^a-z0-9]/g, "");
        if (cleanInput === cleanAlias || cleanInput.includes(cleanAlias) || cleanAlias.includes(cleanInput)) {
          return { code: bank.code, name: bank.names[1] || bank.names[0].toUpperCase() };
        }
      }
    }

    // 3. Fallback to active banking provider's live bank directory
    try {
      const liveBanks = await BankingService.getBanks();
      const match = liveBanks.find(
        (b) =>
          b.name.toLowerCase().includes(input.toLowerCase()) ||
          input.toLowerCase().includes(b.name.toLowerCase())
      );
      if (match) {
        return { code: match.code, name: match.name };
      }
    } catch {
      // Ignore directory lookup error
    }

    return null;
  }
}

