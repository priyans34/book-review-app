import { Stack } from "../contentstackClient";

const BOOK_CT_UID = "book";
const RATING_CT_UID = "rating";

// CMS API Configuration
const CMS_API_URL = "https://dev11-api.csnonprod.com/v3";
const API_KEY = process.env.REACT_APP_CS_API_KEY;
const MANAGEMENT_TOKEN = process.env.REACT_APP_CS_MANAGEMENT_TOKEN;
const ENVIRONMENT = process.env.REACT_APP_CS_ENVIRONMENT;
const BRANCH = "main";

// ============================================
// Contentstack Delivery API Functions
// ============================================

// Fetch all books
export async function fetchBooks() {
  const Query = Stack.ContentType(BOOK_CT_UID).Query();
  const result = await Query.toJSON().find();
  const [entries] = result;
  return entries || [];
}

// Fetch single book by slug
export async function fetchBookBySlug(slug) {
  const Query = Stack.ContentType(BOOK_CT_UID).Query();
  Query.where("slug", slug);

  const result = await Query.toJSON().find();
  const [entries] = result;
  if (entries && entries.length > 0) {
    return entries[0];
  }
  return null;
}

// Fetch all ratings from CMS
export async function fetchAllRatings() {
  const Query = Stack.ContentType(RATING_CT_UID).Query();
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
// Contentstack Management API Functions
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

// Create a new rating entry in CMS
export async function createRating(reviewData) {
  const url = `${CMS_API_URL}/content_types/${RATING_CT_UID}/entries?locale=en-us`;

  const entryData = {
    entry: {
      title: reviewData.title,
      book: reviewData.book, // Reference to book: [{ uid: "...", _content_type_uid: "book" }]
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
export async function updateRating(entryUid, reviewData) {
  const url = `${CMS_API_URL}/content_types/${RATING_CT_UID}/entries/${entryUid}?locale=en-us`;

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
export async function deleteRating(entryUid) {
  const url = `${CMS_API_URL}/content_types/${RATING_CT_UID}/entries/${entryUid}?locale=en-us`;

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
export async function publishRating(entryUid) {
  const url = `${CMS_API_URL}/content_types/${RATING_CT_UID}/entries/${entryUid}/publish`;

  const publishData = {
    entry: {
      environments: [ENVIRONMENT],
      locales: ["en-us"],
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
export async function createAndPublishRating(reviewData) {
  // First create the entry
  const entry = await createRating(reviewData);

  // Then publish it
  await publishRating(entry.uid);

  return entry;
}

// Update and publish a rating (combined operation)
export async function updateAndPublishRating(entryUid, reviewData) {
  // First update the entry
  const entry = await updateRating(entryUid, reviewData);

  // Then publish it
  await publishRating(entry.uid);

  return entry;
}
