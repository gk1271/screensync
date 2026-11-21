# ScreenSync – Smart Digital Signage Management System

A real-time digital signage content management and display platform built with **React + Vite**, **Firebase Authentication**, and **Cloud Firestore**. Administrators can schedule, preview, toggle, and assign advertisements and announcements across remote screens, while display clients automatically filter active schedules and rotate slides in fullscreen.

## Features

- **Admin Authentication:** Secure Email/Password sign-in via Firebase Authentication with protected `/admin` routes.
- **Dashboard Analytics:** Live summary metrics for total items, live content right now, advertisements, announcements, and registered screens.
- **Full Content CRUD & Toggle:** Create, edit, enable/disable, and delete advertisements and announcements in real time.
- **Date, Time & Screen Scheduling:** Target specific screens (`SCREEN_LOBBY`, etc.) or `ALL` screens within defined start/end dates and 24-hour time windows.
- **Live Preview Modal:** Preview headline, description, image, badge, and schedule metadata before saving.
- **Fullscreen Digital Display Client:** Dedicated `/display` and `/display/:screenId` views with automatic slide rotation, live clock, browser fullscreen toggle, and a fallback state when no content is active.
- **Firestore Security Rules:** Public read access for display clients with authenticated-only write/update/delete access.

## Tech Stack

- **Frontend:** React, Vite, JavaScript, HTML5, CSS3, React Router, Lucide React
- **Backend & Auth:** Firebase Authentication, Cloud Firestore (Spark free tier)
- **Version Control & Hosting:** Git, GitHub, Netlify

## Architecture

```text
+-------------------------------------------------------------------+
|                             FIREBASE                              |
|  +-----------------------------+   +---------------------------+  |
|  | Firebase Authentication     |   | Cloud Firestore           |  |
|  | (Admin Email/Password Auth) |   | ('contents', 'screens')   |  |
|  +--------------+--------------+   +-------------+-------------+  |
+-----------------|---------------------------------|---------------+
                  | Auth State                      | Real-time onSnapshot
                  v                                 v
+---------------------------------+   +-----------------------------+
| ADMIN DASHBOARD (/admin)        |   | DISPLAY CLIENT (/display)   |
| - Stats & Content CRUD          |   | - Fullscreen Signage View   |
| - Date/Time & Screen Targeting  |   | - Auto Slide Rotation       |
| - Live Preview & Enable/Disable |   | - Schedule Filter & Fallback|
+---------------------------------+   +-----------------------------+