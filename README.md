# 📚 Bookshelf – Multilingual Book Review Platform

Bookshelf is a modern, multilingual book review web application built with **React**, **Vite**, and **Contentstack**.
It showcases how to combine a headless CMS with automations, localization, and a rich frontend experience.

![Bookshelf Banner](https://via.placeholder.com/1200x400/0d1117/ff6b35?text=📚+Bookshelf+-+Book+Review+Platform)

---

## ✨ Highlights

| Feature                        | Description                                                             |
| ------------------------------ | ----------------------------------------------------------------------- |
| 🌍 **Multilingual Content**    | Books and reviews in English, French, German, and Hindi                 |
| 🎯 **Auto Language Detection** | Detects browser language and serves localized content when available    |
| ⏱️ **Reading Time Estimation** | Automatically calculates and displays reading time per book             |
| ⭐ **Review System**            | Create, update, and delete reviews with star ratings                    |
| 🛡️ **Content Moderation**     | AI-assisted moderation with automatic flagging of inappropriate reviews |
| 🚀 **Launch Deployment**       | CI/CD with **Contentstack Launch** and GitHub integration               |
| 🔍 **Smart Search**            | Search by title, author, or genre                                       |
| 📱 **Responsive UI**           | Clean, responsive design that works well on desktop, tablet, and mobile |

---

## 🏗️ Architecture Overview

```txt
┌─────────────────────────────────────────────────────────────────┐
│                        CONTENTSTACK CMS                         │
├─────────────────────────────────────────────────────────────────┤
│  Content Types:                                                 │
│   • Book (catalogue)                                            │
│   • Rating (user reviews)                                       │
│   • Locales: en-us, fr-fr, de-de, hi-in                         │
│                                                                 │
│  Automations:                                                   │
│   • Translation (EN → FR/DE/HI)                                 │
│   • Reading time calculation                                    │
│   • AI-powered review moderation                                │
└───────────────────────────┬─────────────────────────────────────┘
                            │ Delivery / Management APIs
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                     REACT + VITE FRONTEND                       │
├─────────────────────────────────────────────────────────────────┤
│  • Browser language detection                                   │
│  • Locale context & switcher                                   │
│  • Contentstack JS SDK for data fetching                        │
│                                                                 │
│  Routes:                                                        │
│   • /books          → Book catalogue                            │
│   • /books/:slug    → Book details + reviews                    │
└───────────────────────────┬─────────────────────────────────────┘
                            │ Git push
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                     CONTENTSTACK LAUNCH                         │
├─────────────────────────────────────────────────────────────────┤
│  • Connects to GitHub repo                                      │
│  • Builds Vite app on push                                      │
│  • Deploys static site to global CDN                            │
└─────────────────────────────────────────────────────────────────┘
```


## 📦 Content Models


## 🌍 Internationalization

### Supported Locales

| Locale  | Language     |
| ------- | ------------ |
| `en-us` | English (US) |
| `fr-fr` | French       |
| `de-de` | German       |
| `hi-in` | Hindi        |

### Auto-Detection Flow

```txt
1. User visits app
2. App reads browser language (navigator.languages / navigator.language)
3. Tries to match to supported locales:
   - Exact match (e.g., fr-FR)
   - Language-only (e.g., fr → fr-fr)
   - Fallback to default (en-us)
4. Fetch content from Contentstack using the selected locale
5. Optional: show toast, e.g. “🌍 Language set to French based on your browser”
```

A manual language switcher lets users override auto-detection, and the choice is persisted in `localStorage`.

---

## ⚡ Contentstack Automations

### 1. Translation Workflow

* **Trigger**: Book or Rating entry created/updated in `en-us`
* **Action**: Translate relevant fields to `fr-fr`, `de-de`, `hi-in`
* **Typical Fields**:

  * Book: `title`, `description`
  * Rating: `title`, `comment`

### 2. Reading Time Calculation

* **Trigger**: Book entry saved
* **Inputs**:

  * Page count or estimated word count
* **Logic**:

  * Estimate total words (e.g., `pages × 250`)
  * Estimate reading speed (e.g., `200–250 wpm`)
  * Compute minutes and hours
* **Output Fields**:

  * `reading_time_metadata.estimated_minutes`
  * `reading_time_metadata.estimated_hours`
  * `reading_time_metadata.label`

### 3. AI-Powered Content Moderation

* **Trigger**: Rating entry created/updated
* **Steps**:

  1. Automation reads review `title` + `comment`.
  2. Sends text to an AI moderation service.
  3. Receives classification (safe / offensive / spam / etc.).
  4. Updates fields:

     * `flagged` (`true`/`false`)
     * `moderation_status` (`approved` / `pending` / `rejected`)
     * `moderation_reason` (short explanation)

This enables governance: the frontend can hide or visually mark reviews that are `pending` or `rejected`.


## 🎯 Feature Details

### 📚 Book Catalogue (`/books`)

* Responsive grid of book cards
* Each card shows:

  * Cover image
  * Title and author
  * Genres
  * Publication date / year
  * Reading time label (e.g., “about 5 hours”)
* Search by:

  * Title
  * Author
  * Genre

### 📖 Book Detail (`/books/:slug`)

* Large cover image and full description
* Book metadata (author, genres, publication year)
* Reading time estimation
* Average rating (computed from ratings)
* List of reviews for that book

### ⭐ Review System

* Star rating (1–5)
* Title and comment fields
* Reviewer name and email
* Ability to create and delete reviews
* Integration with moderation fields:

  * Pending/flagged reviews can be hidden or marked as “Awaiting moderation”

### 🌐 Language & Locale

* Auto-detected locale from browser
* Manual language switcher (e.g., EN / FR / DE / HI)
* Locale persisted in `localStorage`
* All content fetched from Contentstack in the chosen locale

### 🎨 UI / UX

* Modern dark-themed design with accent colors
* Responsive layout for mobile and desktop
* Loading states and basic error feedback
* Toast notifications for key actions (e.g., review submitted, language changed)

---

## 🚀 Deployment with Contentstack Launch

Bookshelf is deployed using **Contentstack Launch**, which handles:

* Building and deploying the Vite app
* Integration with GitHub for CI/CD
* Environment variable management
* Global CDN hosting

---

## 📊 Contentstack Product Usage

| Product              | How it’s used                                             |
| -------------------- | --------------------------------------------------------- |
| **CMS**              | Content modeling, localization, workflows                 |
| **Delivery API/SDK** | Fetching books and ratings from the frontend              |
| **Management API**   | Handling review CRUD operations                           |
| **Automations**      | Translation, reading time calculation, AI moderation      |
| **Launch**           | CI/CD, hosting, preview environments, environment secrets |

---

## 🎓 What This Project Demonstrates

1. **Headless CMS Integration** with React + Vite
2. **Content Modeling & Relationships** (Book ↔ Rating)
3. **Localization & Internationalization** with multiple locales
4. **Automation & AI Integration** (translation, reading time, moderation)
5. **Content Governance** for user-generated content
6. **API-Driven Architecture** using Delivery and Management APIs
7. **Modern Frontend Patterns** (hooks, routing, state management)
8. **CI/CD & Hosting** with Contentstack Launch

---

## 🚧 Future Enhancements

* [ ] Dark / light mode toggle
* [ ] Sort books by rating, date, or reading time
* [ ] Advanced genre filters and combined filters
* [ ] User authentication and profile-based reviews
* [ ] Favorites / reading list
* [ ] Social sharing for books and reviews
* [ ] Notifications for new reviews or recommendations

