import { ConstructionType, MaterialType, PileHeight, PileType, SurfaceFinish, DetailedPricing } from './types';

export const MATERIAL_TYPES: MaterialType[] = [
  { id: 'nz-wool', name: 'NZ Wool', tier: 'Standard' },
  { id: 'nz-wool-viscose', name: 'NZ Wool + Viscose', tier: 'Standard' },
  { id: 'nz-wool-bamboo-silk', name: 'NZ Wool + Bamboo Silk', tier: 'Premium' },
  { id: 'nz-wool-viscose-bamboo-silk', name: 'NZ Wool + Viscose + Bamboo Silk', tier: 'Premium' },
  { id: 'nz-wool-silk', name: 'NZ Wool + Silk', tier: 'Premium' },
  { id: 'viscose', name: 'Viscose', tier: 'Standard' },
  { id: 'bamboo-silk', name: 'Bamboo Silk', tier: 'Premium' },
  { id: 'merino-wool', name: 'Merino Wool', tier: 'Ultra Premium' },
  { id: 'alpaca-wool', name: 'Alpaca Wool', tier: 'Ultra Premium' },
  { id: 'lincoln-wool', name: 'Lincoln Wool', tier: 'Ultra Premium' },
  { id: 'mohair', name: 'Mohair Wool', tier: 'Ultra Premium' },
  { id: 'pet-wool', name: 'Pet Wool', tier: 'Premium' },
  { id: 'nylon-wool', name: 'Nylon Wool', tier: 'Premium' },
];

export const HAND_TUFTED_PRICING: Record<string, DetailedPricing> = {
  'nz-wool': { lowestMargin: 24, highestMargin: 36.20, mov: 450 },
  'nz-wool-viscose': { lowestMargin: 26, highestMargin: 36.20, mov: 450 },
  'nz-wool-bamboo-silk': { lowestMargin: 28, highestMargin: 39.76, mov: 450 },
  'nz-wool-viscose-bamboo-silk': { lowestMargin: 28, highestMargin: 39.76, mov: 450 },
  'nz-wool-silk': { lowestMargin: 42, highestMargin: 71.76, mov: 750 },
  'viscose': { lowestMargin: 26, highestMargin: 36.20, mov: 450 },
  'bamboo-silk': { lowestMargin: 28, highestMargin: 36.20, mov: 450 },
  'merino-wool': { lowestMargin: 120, highestMargin: 336.00, mov: 1800 },
  'alpaca-wool': { lowestMargin: 180, highestMargin: 560.00, mov: 2700 },
  'lincoln-wool': { lowestMargin: 80, highestMargin: 236.00, mov: 1200 },
  'mohair': { lowestMargin: 180, highestMargin: 568.00, mov: 2700 },
  'pet-wool': { lowestMargin: 35, highestMargin: 113.60, mov: 600 },
  'nylon-wool': { lowestMargin: 45, highestMargin: 151.84, mov: 750 },
};

export const HAND_KNOTTED_40_PRICING: Record<string, DetailedPricing> = {
  'nz-wool': { lowestMargin: 28, highestMargin: 89.31, mov: 450 },
  'nz-wool-viscose': { lowestMargin: 30, highestMargin: 89.31, mov: 450 },
  'nz-wool-bamboo-silk': { lowestMargin: 32, highestMargin: 89.31, mov: 600 },
  'nz-wool-viscose-bamboo-silk': { lowestMargin: 34, highestMargin: 89.31, mov: 600 },
  'nz-wool-silk': { lowestMargin: 68, highestMargin: 126.42, mov: 1050 },
  'viscose': { lowestMargin: 28, highestMargin: 89.31, mov: 450 },
  'bamboo-silk': { lowestMargin: 34, highestMargin: 89.31, mov: 600 },
  'merino-wool': { lowestMargin: 54, highestMargin: 161.78, mov: 900 },
  'alpaca-wool': { lowestMargin: 76, highestMargin: 325.09, mov: 1200 },
  'lincoln-wool': { lowestMargin: 58, highestMargin: 156.20, mov: 900 },
  'mohair': { lowestMargin: 126, highestMargin: 335.98, mov: 1950 },
  'pet-wool': { lowestMargin: 26, highestMargin: 163.40, mov: 450 },
  'nylon-wool': { lowestMargin: 38, highestMargin: 249.23, mov: 600 },
};

export const HAND_KNOTTED_80_PRICING: Record<string, DetailedPricing> = {
  'nz-wool': { lowestMargin: 36, highestMargin: 66.51, mov: 600 },
  'nz-wool-viscose': { lowestMargin: 36, highestMargin: 66.51, mov: 600 },
  'nz-wool-bamboo-silk': { lowestMargin: 38, highestMargin: 66.51, mov: 600 },
  'nz-wool-viscose-bamboo-silk': { lowestMargin: 42, highestMargin: 66.51, mov: 750 },
  'nz-wool-silk': { lowestMargin: 70, highestMargin: 92.90, mov: 1050 },
  'viscose': { lowestMargin: 36, highestMargin: 66.51, mov: 600 },
  'bamboo-silk': { lowestMargin: 42, highestMargin: 66.51, mov: 750 },
  'merino-wool': { lowestMargin: 60, highestMargin: 116.51, mov: 900 },
  'alpaca-wool': { lowestMargin: 80, highestMargin: 216.51, mov: 1200 },
  'lincoln-wool': { lowestMargin: 62, highestMargin: 115.13, mov: 1050 },
  'mohair': { lowestMargin: 128, highestMargin: 244.29, mov: 1950 },
  'pet-wool': { lowestMargin: 34, highestMargin: 135.00, mov: 600 },
  'nylon-wool': { lowestMargin: 44, highestMargin: 184.90, mov: 750 },
};

export const HAND_KNOTTED_100_PRICING: Record<string, DetailedPricing> = {
  'nz-wool': { lowestMargin: 38, highestMargin: 138.53, mov: 600 },
  'nz-wool-viscose': { lowestMargin: 40, highestMargin: 143.73, mov: 600 },
  'nz-wool-bamboo-silk': { lowestMargin: 42, highestMargin: 143.73, mov: 750 },
  'nz-wool-viscose-bamboo-silk': { lowestMargin: 44, highestMargin: 143.73, mov: 750 },
  'nz-wool-silk': { lowestMargin: 74, highestMargin: 211.33, mov: 1200 },
  'viscose': { lowestMargin: 42, highestMargin: 148.93, mov: 750 },
  'bamboo-silk': { lowestMargin: 44, highestMargin: 148.93, mov: 750 },
  'merino-wool': { lowestMargin: 112, highestMargin: 460.93, mov: 1800 },
  'alpaca-wool': { lowestMargin: 92, highestMargin: 367.33, mov: 1500 },
  'lincoln-wool': { lowestMargin: 68, highestMargin: 138.53, mov: 1050 },
  'mohair': { lowestMargin: 138, highestMargin: 575.33, mov: 2100 },
  'pet-wool': { lowestMargin: 38, highestMargin: 248.00, mov: 600 },
  'nylon-wool': { lowestMargin: 48, highestMargin: 312.00, mov: 750 },
};

export const HAND_KNOTTED_120_PRICING: Record<string, DetailedPricing> = {
  'nz-wool': { lowestMargin: 46, highestMargin: 169.73, mov: 750 },
  'nz-wool-viscose': { lowestMargin: 48, highestMargin: 174.93, mov: 750 },
  'nz-wool-bamboo-silk': { lowestMargin: 48, highestMargin: 174.93, mov: 750 },
  'nz-wool-viscose-bamboo-silk': { lowestMargin: 48, highestMargin: 174.93, mov: 750 },
  'nz-wool-silk': { lowestMargin: 82, highestMargin: 242.53, mov: 1350 },
  'viscose': { lowestMargin: 48, highestMargin: 180.13, mov: 750 },
  'bamboo-silk': { lowestMargin: 48, highestMargin: 180.13, mov: 750 },
  'merino-wool': { lowestMargin: 122, highestMargin: 502.53, mov: 1950 },
  'alpaca-wool': { lowestMargin: 436, highestMargin: 419.33, mov: 6600 },
  'lincoln-wool': { lowestMargin: 76, highestMargin: 169.73, mov: 1200 },
  'mohair': { lowestMargin: 146, highestMargin: 606.53, mov: 2250 },
  'pet-wool': { lowestMargin: 44, highestMargin: 296.00, mov: 750 },
  'nylon-wool': { lowestMargin: 52, highestMargin: 344.00, mov: 900 },
};

export const CONSTRUCTIONS: ConstructionType[] = [
  { id: 'tufted', name: 'Hand Tufted — Standard', multiplier: 0.7, tier: 'Standard' },
  { id: 'knotted-40', name: 'Hand Knotted — 40 Knot (Standard)', multiplier: 1.0, tier: 'Standard' },
  { id: 'knotted-80', name: 'Hand Knotted — 80 Knot (Fine)', multiplier: 2.0, tier: 'Fine' },
  { id: 'knotted-100', name: 'Hand Knotted — 100 Knot (Premium)', multiplier: 2.5, tier: 'Premium' },
  { id: 'knotted-120', name: 'Hand Knotted — 120 Knot (Ultra Premium)', multiplier: 3.0, tier: 'Ultra Premium' },
];

export const PILE_TYPES: PileType[] = [
  { id: 'cut', name: 'Cut Pile (Smooth)' },
  { id: 'loop', name: 'Loop Pile (Textured)' },
  { id: 'shag', name: 'Shag (High Texture)' },
];

export const PILE_HEIGHTS: PileHeight[] = [
  { id: 'low', name: 'Low Pile (4–6mm) — Minimal texture' },
  { id: 'standard', name: 'Standard Pile (8–10mm) — Balanced' },
  { id: 'high', name: 'High Pile (12–14mm) — Plush feel' },
];

export const PRICING_FACTORS = {
  LOW_CONFIDENCE: 0.95,
  HIGH_CONFIDENCE: 1.2,
  HIGH_BUFFER: 1.75,
  MARGIN_PROTECTION_FLOOR: 0.4,
  HIGH_FLOOR_MULTIPLIER: 1.25,
};

export const COMPLEXITY_MULTIPLIERS = {
  SIMPLE: 1.0,    // 1-5 colors
  MEDIUM: 1.15,   // 6-10 colors
  COMPLEX: 1.25,  // 11+ colors
};

export const PILE_HEIGHT_MULTIPLIERS = {
  LOW: 1.0,
  STANDARD: 1.0,
  HIGH: 1.1,
  SHAG: 1.2,
};

export const SIZE_MULTIPLIERS = {
  SMALL: 1.25,    // < 30 sqft
  MEDIUM: 1.1,    // 30-80 sqft
  STANDARD: 1.0,  // 80-150 sqft
  LARGE: 0.95,    // 150+ sqft
};

export const SHAPE_MULTIPLIERS = {
  RECTANGLE: 1.0,
  ROUND: 1.15,
  ORGANIC: 1.2,
};

export const SURFACE_FINISH_MULTIPLIERS: Record<string, number> = {
  'none': 1.0,
  'tip-shear': 1.05,
  'sculpted': 1.1,
  'carved': 1.15,
  'random-shear': 1.05,
};

export const SURFACE_FINISHES: SurfaceFinish[] = [
  { id: 'none', name: 'None — Smooth finish', pricePerSqFt: 0 },
  { id: 'tip-shear', name: 'Tip Shear — Soft variation', pricePerSqFt: 5 },
  { id: 'sculpted', name: 'Sculpted — Defined pattern', pricePerSqFt: 8 },
  { id: 'carved', name: 'Hand Carved — Detailed finish', pricePerSqFt: 12 },
  { id: 'random-shear', name: 'Random Shear — Organic texture', pricePerSqFt: 4 },
];

export const BASE_PRICE_PER_SQFT = 45;

export const PRICING_MATRIX: Record<string, Record<string, number>> = {
  'knotted-40': {
    'nz-wool': 89.31,
    'nz-wool-viscose': 89.31,
    'nz-wool-bamboo-silk': 89.31,
    'nz-wool-viscose-bamboo-silk': 89.31,
    'nz-wool-silk': 126.42,
    'viscose': 89.31,
    'bamboo-silk': 89.31,
    'merino-wool': 161.78,
    'alpaca-wool': 325.09,
    'lincoln-wool': 156.20,
    'mohair': 335.98,
    'pet-wool': 163.40,
    'nylon-wool': 249.23,
  },
  'knotted-80': {
    'nz-wool': 66.51,
    'nz-wool-viscose': 66.51,
    'nz-wool-bamboo-silk': 66.51,
    'nz-wool-viscose-bamboo-silk': 66.51,
    'nz-wool-silk': 92.90,
    'viscose': 66.51,
    'bamboo-silk': 66.51,
    'merino-wool': 116.51,
    'alpaca-wool': 216.51,
    'lincoln-wool': 115.13,
    'mohair': 244.29,
    'pet-wool': 135.00,
    'nylon-wool': 184.90,
  },
  'knotted-100': {
    'nz-wool': 138.53,
    'nz-wool-viscose': 143.73,
    'nz-wool-bamboo-silk': 143.73,
    'nz-wool-viscose-bamboo-silk': 143.73,
    'nz-wool-silk': 211.33,
    'viscose': 148.93,
    'bamboo-silk': 148.93,
    'merino-wool': 460.93,
    'alpaca-wool': 367.33,
    'lincoln-wool': 138.53,
    'mohair': 575.33,
    'pet-wool': 248.00,
    'nylon-wool': 312.00,
  },
  'knotted-120': {
    'nz-wool': 169.73,
    'nz-wool-viscose': 174.93,
    'nz-wool-bamboo-silk': 174.93,
    'nz-wool-viscose-bamboo-silk': 174.93,
    'nz-wool-silk': 242.53,
    'viscose': 180.13,
    'bamboo-silk': 180.13,
    'merino-wool': 502.53,
    'alpaca-wool': 419.33,
    'lincoln-wool': 169.73,
    'mohair': 606.53,
    'pet-wool': 296.00,
    'nylon-wool': 344.00,
  },
  'tufted': {
    'nz-wool': 36.20,
    'nz-wool-viscose': 36.20,
    'nz-wool-bamboo-silk': 39.76,
    'nz-wool-viscose-bamboo-silk': 39.76,
    'nz-wool-silk': 71.76,
    'viscose': 36.20,
    'bamboo-silk': 36.20,
    'merino-wool': 336.00,
    'alpaca-wool': 560.00,
    'lincoln-wool': 236.00,
    'mohair': 568.00,
    'pet-wool': 113.60,
    'nylon-wool': 151.84,
  },
};

export const REJECT_RULES = [
  "Offensive or inappropriate content",
  "Vague prompts (must be more than 3 words)",
  "Copyrighted characters or logos",
  "Non-rug related imagery"
];

export const PRICING_TIERS = [
  {
    id: 'free',
    name: 'Free',
    price: 0,
    credits: 5,
    description: 'Try the design experience',
    features: [
      '5 design credits',
      '1 saved design',
      'Basic materials',
      'Standard resolution',
      'Limited production preview'
    ]
  },
  {
    id: 'creator',
    name: 'Creator',
    price: 20,
    credits: 20,
    description: 'Design with production in mind',
    features: [
      '20 design credits',
      'Full material library (Premium & Ultra Premium unlocked)',
      'Save & manage designs',
      'High-resolution exports',
      'Priority generation speed',
      'Access to pricing estimates',
      'Ready for sampling & production workflow'
    ],
    popular: true
  }
];

export const API_COSTS = {
  variation: 1,      // 1 credit per image variation
  generation: 4,     // 4 variations = 4 credits
  regeneration: 1,   // 1 credit for regeneration
};
