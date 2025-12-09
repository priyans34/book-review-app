import { Stack } from "../contentstackClient";

const BOOK_CT_UID = "book";
const RATING_CT_UID = "rating";

// CMS API Configuration
const CMS_API_URL = "https://dev11-api.csnonprod.com/v3";
const API_KEY = process.env.REACT_APP_CS_API_KEY;
const MANAGEMENT_TOKEN = process.env.REACT_APP_CS_MANAGEMENT_TOKEN;
const ENVIRONMENT = process.env.REACT_APP_CS_ENVIRONMENT;
const BRANCH = "main";

// Default locale
const DEFAULT_LOCALE = "en-us";

// ============================================
// Contentstack Management API - Locales
// ============================================

// Common headers for Management API
function getManagementHeaders() {
  return {
    api_key: API_KEY,
    authorization: MANAGEMENT_TOKEN,
    "Content-Type": "application/json",
    branch: BRANCH,
  };
}

// Locale flag mapping (for display purposes)
const LOCALE_FLAGS = {
  "en-us": "🇺🇸",
  "en-gb": "🇬🇧",
  "en-au": "🇦🇺",
  "fr-fr": "🇫🇷",
  "fr-ca": "🇨🇦",
  "zh-cn": "🇨🇳",
  "zh-tw": "🇹🇼",
  "es-es": "🇪🇸",
  "es-mx": "🇲🇽",
  "de-de": "🇩🇪",
  "de-at": "🇦🇹",
  "ja-jp": "🇯🇵",
  "ko-kr": "🇰🇷",
  "pt-br": "🇧🇷",
  "pt-pt": "🇵🇹",
  "it-it": "🇮🇹",
  "nl-nl": "🇳🇱",
  "ru-ru": "🇷🇺",
  "ar-ae": "🇦🇪",
  "hi-in": "🇮🇳",
};

// Get flag for a locale code
function getLocaleFlag(code) {
  const lowerCode = code?.toLowerCase();
  return LOCALE_FLAGS[lowerCode] || "🌐";
}

// Fetch all supported locales from Contentstack
export async function fetchLocales() {
  const url = `${CMS_API_URL}/locales`;

  const response = await fetch(url, {
    method: "GET",
    headers: getManagementHeaders(),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error_message || "Failed to fetch locales");
  }

  const result = await response.json();
  const locales = result.locales || [];

  // Transform to our format with flags
  return locales.map((loc) => ({
    code: loc.code,
    name: loc.name,
    flag: getLocaleFlag(loc.code),
    isMaster: loc.fallback_locale === null,
  }));
}

// ============================================
// Contentstack Delivery API Functions
// ============================================

// Fetch all books with locale support
export async function fetchBooks(locale = DEFAULT_LOCALE) {
  const Query = Stack.ContentType(BOOK_CT_UID).Query();
  Query.language(locale);
  const result = await Query.toJSON().find();
  const [entries] = result;
  return entries || [];
}

// Fetch single book by slug with locale support
export async function fetchBookBySlug(slug, locale = DEFAULT_LOCALE) {
  const Query = Stack.ContentType(BOOK_CT_UID).Query();
  Query.language(locale);
  Query.where("slug", slug);

  const result = await Query.toJSON().find();
  const [entries] = result;
  if (entries && entries.length > 0) {
    return entries[0];
  }
  return null;
}

// Fetch all ratings from CMS with locale support
export async function fetchAllRatings(locale = DEFAULT_LOCALE) {
  const Query = Stack.ContentType(RATING_CT_UID).Query();
  Query.language(locale);
  const result = await Query.toJSON().find();
  const [entries] = result;
  return entries || [];
}

// Filter ratings for a specific book uid
export function filterRatingsForBook(allRatings, bookUid) {
  return allRatings.filter(
    (rating) => Array.isArray(rating.book) && rating.book[0]?.uid === bookUid
  );
}

// ============================================
// Contentstack Management API - CRUD Operations
// ============================================

// Create a new rating entry in CMS
export async function createRating(reviewData, locale = DEFAULT_LOCALE) {
  const url = `${CMS_API_URL}/content_types/${RATING_CT_UID}/entries?locale=${locale}`;

  const entryData = {
    entry: {
      title: reviewData.title,
      book: reviewData.book,
      rating_value: reviewData.rating_value,
      comment: reviewData.comment,
      reviewer_name: reviewData.reviewer_name,
      reviewer_email: reviewData.reviewer_email,
      tags: reviewData.tags || [],
    },
  };

  const response = await fetch(url, {
    method: "POST",
    headers: getManagementHeaders(),
    body: JSON.stringify(entryData),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error_message || "Failed to create rating");
  }

  const result = await response.json();
  return result.entry;
}

// Update an existing rating entry in CMS
export async function updateRating(
  entryUid,
  reviewData,
  locale = DEFAULT_LOCALE
) {
  const url = `${CMS_API_URL}/content_types/${RATING_CT_UID}/entries/${entryUid}?locale=${locale}`;

  const entryData = {
    entry: {
      title: reviewData.title,
      book: reviewData.book,
      rating_value: reviewData.rating_value,
      comment: reviewData.comment,
      reviewer_name: reviewData.reviewer_name,
      reviewer_email: reviewData.reviewer_email,
      tags: reviewData.tags || [],
    },
  };

  const response = await fetch(url, {
    method: "PUT",
    headers: getManagementHeaders(),
    body: JSON.stringify(entryData),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error_message || "Failed to update rating");
  }

  const result = await response.json();
  return result.entry;
}

// Delete a rating entry from CMS
export async function deleteRating(entryUid, locale = DEFAULT_LOCALE) {
  const url = `${CMS_API_URL}/content_types/${RATING_CT_UID}/entries/${entryUid}?locale=${locale}`;

  const response = await fetch(url, {
    method: "DELETE",
    headers: getManagementHeaders(),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error_message || "Failed to delete rating");
  }

  return true;
}

// Publish a rating entry
export async function publishRating(entryUid, locale = DEFAULT_LOCALE) {
  const url = `${CMS_API_URL}/content_types/${RATING_CT_UID}/entries/${entryUid}/publish`;

  const publishData = {
    entry: {
      environments: [ENVIRONMENT],
      locales: [locale],
    },
  };

  const response = await fetch(url, {
    method: "POST",
    headers: getManagementHeaders(),
    body: JSON.stringify(publishData),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error_message || "Failed to publish rating");
  }

  return true;
}

// Create and publish a rating (combined operation)
export async function createAndPublishRating(
  reviewData,
  locale = DEFAULT_LOCALE
) {
  const entry = await createRating(reviewData, locale);
  await publishRating(entry.uid, locale);
  return entry;
}

// Update and publish a rating (combined operation)
export async function updateAndPublishRating(
  entryUid,
  reviewData,
  locale = DEFAULT_LOCALE
) {
  const entry = await updateRating(entryUid, reviewData, locale);
  await publishRating(entry.uid, locale);
  return entry;
}
