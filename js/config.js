// ═══════════════════════════════════════════════════════
// MEDSTATION PHARMACY CATALOG — CONFIGURATION
// ═══════════════════════════════════════════════════════

export const SUPABASE_URL = 'https://nfjlhfyombyzjknsdtfp.supabase.co';
export const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5mamxoZnlvbWJ5emprbnNkdGZwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM1MDIxMjMsImV4cCI6MjA4OTA3ODEyM30.ajU8Kpzd2gdM_kRx5nqsI-WTuE6i1cHlS84MWAdV1qI';

export const PHARM_COLORS = {
  'RXCS':       { bg: '#1a2744', text: '#7eb8ff', accent: '#3b82f6' },
  'Absolute':   { bg: '#1a3328', text: '#6ee7b7', accent: '#10b981' },
  'Epiq':       { bg: '#2d1a3d', text: '#c4b5fd', accent: '#8b5cf6' },
  'Rush':       { bg: '#3d2a1a', text: '#fbbf24', accent: '#f59e0b' },
  'Hallandale': { bg: '#1a2d3d', text: '#67e8f9', accent: '#06b6d4' },
  'Texas Star': { bg: '#3d1a1a', text: '#fca5a5', accent: '#ef4444' },
  'Brooksville':{ bg: '#2a2a1a', text: '#d4d4aa', accent: '#a3a33a' },
  'Olympia':    { bg: '#1a2a2a', text: '#99d4d4', accent: '#4a9a9a' },
};

// Maps pharmacy short name to state coverage matrix key
export const PHARM_TO_MATRIX = {
  'RXCS': 'RXCS', 'Absolute': 'Absolute', 'Epiq': 'Epiq',
  'Rush': 'Rush', 'Hallandale': 'Hallandale', 'Texas Star': 'Texas Star',
  'Brooksville': null, 'Olympia': null,
};
