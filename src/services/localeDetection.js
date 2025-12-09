/**
 * Automatic Locale Detection Service
 * Detects user's preferred language/locale based on browser settings
 * and optionally their geographic location
 */

// Storage key for tracking if this is user's first visit
const FIRST_VISIT_KEY = "bookshelf_first_visit";
const LOCALE_KEY = "bookshelf_locale";

/**
 * Get browser's preferred languages
 * Returns an array of language codes in order of preference
 */
export function getBrowserLanguages() {
  // navigator.languages returns array of preferred languages
  // navigator.language returns single preferred language
  if (navigator.languages && navigator.languages.length > 0) {
    return [...navigator.languages];
  }
  if (navigator.language) {
    return [navigator.language];
  }
  return ["en-US"]; // Default fallback
}

/**
 * Normalize a locale code for comparison
 * e.g., "en-US" -> "en-us", "EN_US" -> "en-us"
 */
export function normalizeLocaleCode(code) {
  if (!code) return "";
  return code.toLowerCase().replace("_", "-");
}

/**
 * Find the best matching locale from available locales
 * @param {string[]} browserLocales - User's preferred locales from browser
 * @param {Array<{code: string, isMaster: boolean}>} availableLocales - Locales from CMS
 * @returns {string|null} - Best matching locale code or null
 */
export function findBestMatchingLocale(browserLocales, availableLocales) {
  if (!availableLocales || availableLocales.length === 0) {
    return null;
  }

  const normalizedAvailable = availableLocales.map((loc) => ({
    ...loc,
    normalizedCode: normalizeLocaleCode(loc.code),
  }));

  // Try each browser locale in order of preference
  for (const browserLocale of browserLocales) {
    const normalizedBrowser = normalizeLocaleCode(browserLocale);

    // 1. Exact match (e.g., "en-us" matches "en-us")
    const exactMatch = normalizedAvailable.find(
      (loc) => loc.normalizedCode === normalizedBrowser
    );
    if (exactMatch) {
      return exactMatch.code;
    }

    // 2. Language-only match (e.g., "en" from "en-US" matches "en-us" or "en-gb")
    const browserLang = normalizedBrowser.split("-")[0];
    const langMatch = normalizedAvailable.find(
      (loc) => loc.normalizedCode.split("-")[0] === browserLang
    );
    if (langMatch) {
      return langMatch.code;
    }
  }

  return null;
}

/**
 * Check if this is the user's first visit
 */
export function isFirstVisit() {
  return !localStorage.getItem(FIRST_VISIT_KEY);
}

/**
 * Mark that the user has visited before
 */
export function markAsVisited() {
  localStorage.setItem(FIRST_VISIT_KEY, "true");
}

/**
 * Check if user has a saved locale preference
 */
export function hasSavedLocale() {
  return !!localStorage.getItem(LOCALE_KEY);
}

/**
 * Get detected locale info for display
 */
export function getDetectionInfo(
  browserLocales,
  detectedLocale,
  availableLocales
) {
  const browserLang = browserLocales[0] || "Unknown";
  const matchedLocale = availableLocales.find(
    (loc) => loc.code === detectedLocale
  );

  return {
    browserLanguage: browserLang,
    detectedLocale: detectedLocale,
    localeName: matchedLocale?.name || detectedLocale,
    wasAutoDetected: true,
  };
}

/**
 * Main function: Detect and return the best locale for the user
 * @param {Array<{code: string, isMaster: boolean}>} availableLocales - Locales from CMS
 * @param {Object} options - Configuration options
 * @returns {Object} - { locale: string, wasAutoDetected: boolean, browserLanguage: string }
 */
export function detectUserLocale(availableLocales, options = {}) {
  const { forceDetection = false, defaultLocale = "en-us" } = options;

  // If not forcing detection and user has saved preference, use that
  if (!forceDetection && hasSavedLocale()) {
    const savedLocale = localStorage.getItem(LOCALE_KEY);
    return {
      locale: savedLocale,
      wasAutoDetected: false,
      browserLanguage: getBrowserLanguages()[0],
    };
  }

  // Get browsenr languages
  const browserLocales = getBrowserLanguages();

  // Find best match
  const bestMatch = findBestMatchingLocale(browserLocales, availableLocales);

  // If we found a match, use it
  if (bestMatch) {
    return {
      locale: bestMatch,
      wasAutoDetected: true,
      browserLanguage: browserLocales[0],
    };
  }

  // Fall back to master locale or default
  const masterLocale = availableLocales.find((loc) => loc.isMaster);
  return {
    locale: masterLocale?.code || defaultLocale,
    wasAutoDetected: true,
    browserLanguage: browserLocales[0],
  };
}

/**
 * Optional: IP-based geolocation detection
 * Uses free ipapi.co service (no API key required for basic use)
 * Note: This is a backup method and may not always be accurate
 */
export async function detectLocaleByIP() {
  try {
    const response = await fetch("https://ipapi.co/json/", {
      method: "GET",
      headers: { Accept: "application/json" },
    });

    if (!response.ok) {
      throw new Error("Failed to fetch geolocation");
    }

    const data = await response.json();

    // Map country code to locale (simplified mapping)
    const countryToLocale = {
      US: "en-us",
      GB: "en-gb",
      AU: "en-au",
      CA: "en-us", // or fr-ca based on region
      FR: "fr-fr",
      DE: "de-de",
      ES: "es-es",
      MX: "es-mx",
      BR: "pt-br",
      PT: "pt-pt",
      IT: "it-it",
      NL: "nl-nl",
      JP: "ja-jp",
      KR: "ko-kr",
      CN: "zh-cn",
      TW: "zh-tw",
      RU: "ru-ru",
      IN: "hi-in",
      AE: "ar-ae",
    };

    return {
      locale: countryToLocale[data.country_code] || null,
      country: data.country_name,
      countryCode: data.country_code,
      city: data.city,
      region: data.region,
    };
  } catch (error) {
    console.warn("IP-based locale detection failed:", error);
    return null;
  }
}
