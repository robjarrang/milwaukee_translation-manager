export interface RegionDefinition {
  code: string;
  label: string;
  sfmcName: string;
}

export const REGIONS: RegionDefinition[] = [
  { code: "AR-AE", label: "Arabic (UAE)", sfmcName: "AllSubs_AR-AE" },
  { code: "BG-BG", label: "Bulgarian (Bulgaria)", sfmcName: "AllSubs_BG-BG" },
  { code: "CS-CZ", label: "Czech (Czech Republic)", sfmcName: "AllSubs_CS-CZ" },
  { code: "DA-DK", label: "Danish (Denmark)", sfmcName: "AllSubs_DA-DK" },
  { code: "DE-AT", label: "German (Austria)", sfmcName: "AllSubs_DE-AT" },
  { code: "DE-CH", label: "German (Switzerland)", sfmcName: "AllSubs_DE-CH" },
  { code: "DE-DE", label: "German (Germany)", sfmcName: "AllSubs_DE-DE" },
  { code: "DE-LU", label: "German (Luxembourg)", sfmcName: "AllSubs_DE-LU" },
  { code: "EN-GB", label: "English (UK)", sfmcName: "AllSubs_EN-GB" },
  { code: "EN-ZA", label: "English (South Africa)", sfmcName: "AllSubs_EN-ZA" },
  { code: "ES-ES", label: "Spanish (Spain)", sfmcName: "AllSubs_ES-ES" },
  { code: "ET-EE", label: "Estonian (Estonia)", sfmcName: "AllSubs_ET-EE" },
  { code: "FI-FI", label: "Finnish (Finland)", sfmcName: "AllSubs_FI-FI" },
  { code: "FR-BE", label: "French (Belgium)", sfmcName: "AllSubs_FR-BE" },
  { code: "FR-CH", label: "French (Switzerland)", sfmcName: "AllSubs_FR-CH" },
  { code: "FR-FR", label: "French (France)", sfmcName: "AllSubs_FR-FR" },
  { code: "FR-LU", label: "French (Luxembourg)", sfmcName: "AllSubs_FR-LU" },
  { code: "HR-HR", label: "Croatian (Croatia)", sfmcName: "AllSubs_HR-HR" },
  { code: "HU-HU", label: "Hungarian (Hungary)", sfmcName: "AllSubs_HU-HU" },
  { code: "IT-IT", label: "Italian (Italy)", sfmcName: "AllSubs_IT-IT" },
  { code: "LT-LT", label: "Lithuanian (Lithuania)", sfmcName: "AllSubs_LT-LT" },
  { code: "LV-LV", label: "Latvian (Latvia)", sfmcName: "AllSubs_LV-LV" },
  { code: "NL-BE", label: "Dutch (Belgium)", sfmcName: "AllSubs_NL-BE" },
  { code: "NN-NO", label: "Norwegian Nynorsk (Norway)", sfmcName: "AllSubs_NN-NO" },
  { code: "PL-PL", label: "Polish (Poland)", sfmcName: "AllSubs_PL-PL" },
  { code: "SL-SI", label: "Slovenian (Slovenia)", sfmcName: "AllSubs_SL-SI" },
  { code: "SV-SE", label: "Swedish (Sweden)", sfmcName: "AllSubs_SV-SE" },
  { code: "TR-TR", label: "Turkish (Turkey)", sfmcName: "AllSubs_TR-TR" },
];

export function getRegionByCode(code: string): RegionDefinition | undefined {
  return REGIONS.find((r) => r.code === code);
}
