import { prefixRange } from "@/lib/mboa/countries/prefix-range"
import type { CountryConfig } from "@/lib/mboa/countries/types"

export const cm: CountryConfig = {
  iso: "CM",
  name: { fr: "Cameroun", en: "Cameroon" },
  callingCode: "237",
  nationalNumberLength: 9,
  groupSizes: [1, 2, 2, 2, 2],
  currency: "XAF",
  locales: ["fr", "en"],
  defaultLocale: "fr",
  operators: [
    {
      id: "mtn",
      name: "MTN",
      mobileMoneyName: "MTN Mobile Money",
      color: "#f5c518",
      // TODO: verify against current ART allocation
      // Ranges supplied by the maintainer on 2026-09-20.
      prefixes: [
        ...prefixRange("650", "653"),
        ...prefixRange("6540", "6545"),
        "65460",
        "65468",
        ...prefixRange("6547", "6549"),
        ...prefixRange("680", "683"),
      ],
    },
    {
      id: "orange",
      name: "Orange",
      mobileMoneyName: "Orange Money",
      color: "#ff7900",
      // TODO: verify against current ART allocation
      // Ranges supplied by the maintainer on 2026-09-20.
      prefixes: [
        ...prefixRange("655", "659"), // maintainer confirmed these are Orange, not MTN
        ...prefixRange("686", "687"),
        ...prefixRange("6880", "6888"), // 688 0XX XXX to 688 8XX XXX
        ...prefixRange("68890", "68895"), // 688 90X XXX to 688 95X XXX
        ...prefixRange("688960", "688964"), // 688 960 XXX to 688 964 XXX
      ],
    },
    {
      id: "nexttel",
      name: "Nexttel",
      color: "#e11d48",
      // TODO: verify against current ART allocation
      // Not in the ranges supplied on 2026-09-20; kept on the maintainer's instruction.
      prefixes: ["66"],
    },
    {
      id: "camtel",
      name: "Camtel",
      color: "#2563eb",
      // TODO: verify against current ART allocation
      // Ranges supplied by the maintainer on 2026-09-20.
      prefixes: [...prefixRange("620", "621"), "6220", "6225"],
    },
  ],
  // TODO: verify region and city lists (spelling, completeness)
  regions: [
    {
      id: "adamaoua",
      name: { fr: "Adamaoua", en: "Adamawa" },
      cities: ["Ngaoundéré", "Meiganga", "Tibati", "Banyo"],
    },
    {
      id: "centre",
      name: { fr: "Centre", en: "Centre" },
      cities: ["Yaoundé", "Mbalmayo", "Bafia", "Obala"],
    },
    {
      id: "est",
      name: { fr: "Est", en: "East" },
      cities: ["Bertoua", "Batouri", "Abong-Mbang", "Yokadouma"],
    },
    {
      id: "extreme-nord",
      name: { fr: "Extrême-Nord", en: "Far North" },
      cities: ["Maroua", "Kousséri", "Mokolo", "Yagoua"],
    },
    {
      id: "littoral",
      name: { fr: "Littoral", en: "Littoral" },
      cities: ["Douala", "Nkongsamba", "Edéa", "Loum"],
    },
    {
      id: "nord",
      name: { fr: "Nord", en: "North" },
      cities: ["Garoua", "Guider", "Poli"],
    },
    {
      id: "nord-ouest",
      name: { fr: "Nord-Ouest", en: "North-West" },
      cities: ["Bamenda", "Kumbo", "Wum", "Nkambé"],
    },
    {
      id: "ouest",
      name: { fr: "Ouest", en: "West" },
      cities: ["Bafoussam", "Dschang", "Mbouda", "Foumban", "Bafang"],
    },
    {
      id: "sud",
      name: { fr: "Sud", en: "South" },
      cities: ["Ebolowa", "Kribi", "Sangmélima", "Ambam"],
    },
    {
      id: "sud-ouest",
      name: { fr: "Sud-Ouest", en: "South-West" },
      cities: ["Buea", "Limbe", "Kumba", "Mamfe", "Tiko"],
    },
  ],
}
