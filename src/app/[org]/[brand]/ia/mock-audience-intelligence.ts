// Showroom IA — section "Audience Intelligence" : données 100 % fictives,
// aucun appel réseau, aucune lecture Supabase. Jamais de username, de nom,
// de score individuel ni de catégorie sensible (santé, origine, religion,
// opinions, orientation) — uniquement des agrégats de démonstration.

export type Affinity = "VERY_HIGH" | "HIGH" | "MEDIUM";
export type Impact = "HIGH" | "MEDIUM_HIGH";
export type SignalDirection = "UP" | "DOWN";

export interface MockPersona {
  name: string;
  share: number;
  affinity: Affinity;
  description: string;
  interests: string[];
  emerging: boolean;
}

export interface MockShare {
  name: string;
  share: number;
}

export interface MockBrandFitDimension {
  name: string;
  score: number;
}

export interface MockSignal {
  name: string;
  change: number;
  direction: SignalDirection;
  description: string;
}

export interface MockRecommendation {
  title: string;
  impact: Impact;
  description: string;
}

export interface MockAudienceIntelligence {
  sampleSize: number;
  personaCount: number;
  brandFit: number;
  confidence: number;
  summary: string;
  personas: MockPersona[];
  interests: MockShare[];
  brandAffinities: MockShare[];
  brandFitDimensions: MockBrandFitDimension[];
  signals: MockSignal[];
  recommendations: MockRecommendation[];
}

export const MOCK_AUDIENCE_INTELLIGENCE: MockAudienceIntelligence = {
  sampleSize: 100,
  personaCount: 4,
  brandFit: 78,
  confidence: 84,

  summary:
    "Votre audience reste fortement alignée avec un positionnement casual premium et sport lifestyle. Le cœur historique rugby reste structurant, tandis qu'un segment plus urbain, orienté mode, voyage et expériences, gagne progressivement en importance.",

  personas: [
    {
      name: "Casual Premium",
      share: 32,
      affinity: "VERY_HIGH",
      description: "Mode masculine élégante et décontractée.",
      interests: ["Mode", "Gastronomie", "Voyage", "Golf"],
      emerging: false,
    },
    {
      name: "Rugby Lifestyle",
      share: 24,
      affinity: "VERY_HIGH",
      description: "Segment fortement connecté à l'ADN rugby et sport chic.",
      interests: ["Rugby", "Sport", "Lifestyle", "Événements"],
      emerging: false,
    },
    {
      name: "Urban Lifestyle",
      share: 27,
      affinity: "HIGH",
      description: "Audience plus contemporaine orientée mode, voyage et expériences.",
      interests: ["Mode", "Travel", "Restaurants", "Sneakers"],
      emerging: true,
    },
    {
      name: "Sport & Outdoor",
      share: 17,
      affinity: "MEDIUM",
      description: "Audience davantage orientée sport et activités extérieures.",
      interests: ["Running", "Outdoor", "Fitness", "Sport"],
      emerging: false,
    },
  ],

  interests: [
    { name: "Mode masculine", share: 76 },
    { name: "Sport", share: 68 },
    { name: "Voyage", share: 54 },
    { name: "Gastronomie", share: 43 },
    { name: "Rugby", share: 41 },
  ],

  brandAffinities: [
    { name: "Lacoste", share: 64 },
    { name: "Ralph Lauren", share: 51 },
    { name: "Boss", share: 44 },
    { name: "Tommy Hilfiger", share: 38 },
    { name: "Nike", share: 35 },
  ],

  brandFitDimensions: [
    { name: "Casual premium", score: 91 },
    { name: "Sport / Rugby", score: 84 },
    { name: "Premium accessible", score: 79 },
    { name: "Lifestyle", score: 74 },
    { name: "Mode contemporaine", score: 62 },
  ],

  signals: [
    {
      name: "Travel & expériences",
      change: 18,
      direction: "UP",
      description: "Les signaux liés au voyage progressent dans les profils lifestyle.",
    },
    {
      name: "Mode contemporaine",
      change: 14,
      direction: "UP",
      description: "Les codes premium contemporains apparaissent davantage dans les segments émergents.",
    },
    {
      name: "Rugby pur",
      change: -9,
      direction: "DOWN",
      description: "Le rugby reste structurant, mais représente proportionnellement moins de signaux chez les audiences les plus contemporaines.",
    },
  ],

  recommendations: [
    {
      title: "Moderniser sans casser l'ADN",
      impact: "HIGH",
      description: "Associer davantage les pièces historiques à des environnements urbains et lifestyle.",
    },
    {
      title: "Exploiter le territoire Travel",
      impact: "MEDIUM_HIGH",
      description: "Tester des campagnes autour du week-end, du city break et des expériences premium.",
    },
    {
      title: "Continuer à capitaliser sur le rugby",
      impact: "HIGH",
      description: "Le rugby reste l'un des territoires les plus différenciants de la marque.",
    },
  ],
};
