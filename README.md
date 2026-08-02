# K.DESIGNS & INTERIORS — Full Project Documentation

> **Premium Architecture & Interior Design Website with Full-Featured CMS Admin Panel**

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Technology Stack](#2-technology-stack)
3. [Project Structure](#3-project-structure)
4. [Getting Started](#4-getting-started)
5. [Database & Models](#5-database--models)
6. [Authentication & Roles](#6-authentication--roles)
7. [API Reference](#7-api-reference)
8. [Admin Panel](#8-admin-panel)
9. [Public Website Pages](#9-public-website-pages)
10. [Media & File Uploads](#10-media--file-uploads)
11. [Email System](#11-email-system)
12. [Logging System](#12-logging-system)
13. [Security Features](#13-security-features)
14. [Deployment](#14-deployment)

---

## 1. Project Overview

**K.DESIGNS & INTERIORS** is a full-stack web application for a professional architecture and interior design firm based in Gandhidham, Gujarat. The system consists of:

- A **public-facing website** with pages for services, portfolio, blogs, consultations, and contact.
- A **secure Admin Panel (CMS)** for managing all website content — services, projects, blogs, testimonials, team members, consultations, inquiries, and site-wide settings.

The backend is a **Node.js/Express REST API** backed by **MongoDB**, with image assets stored on **Cloudinary** (or locally as a fallback). The frontend is plain HTML/CSS/JS served as static files.

---

## 2. Technology Stack

| Layer | Technology |
|---|---|
| **Runtime** | Node.js |
| **Framework** | Express.js v4 |
| **Database** | MongoDB via Mongoose |
| **Authentication** | JWT (JSON Web Tokens) |
| **Password Hashing** | bcryptjs |
| **File Uploads** | Multer (disk storage to temp/) |
| **Image Hosting** | Cloudinary v1 (with local fallback) |
| **Email** | Nodemailer (SMTP) |
| **Security** | Helmet (CSP), CORS, express-rate-limit |
| **Frontend** | Vanilla HTML / CSS / JavaScript |
| **Dev Tool** | Nodemon |

---

## 3. Project Structure

```
k-designs-interiors/
|
|-- server.js                   # App entry point — Express server setup
|
|-- config/
|   `-- db.js                   # MongoDB connection + default data seeding
|
|-- middleware/
|   |-- authMiddleware.js        # JWT protect + checkPermission guards
|   `-- uploadMiddleware.js      # Multer config (temp disk storage)
|
|-- models/                     # Mongoose schemas
|   |-- Admin.js
|   |-- Blog.js
|   |-- BlogCategory.js
|   |-- City.js
|   |-- Consultation.js
|   |-- Contact.js
|   |-- Log.js
|   |-- Project.js
|   |-- ProjectCategory.js
|   |-- Service.js
|   |-- Settings.js
|   |-- TeamMember.js
|   `-- Testimonial.js
|
|-- controllers/                # Route handler logic
|   |-- authController.js
|   |-- blogController.js
|   |-- cityController.js
|   |-- consultationController.js
|   |-- contactController.js
|   |-- logController.js
|   |-- projectController.js
|   |-- serviceController.js
|   |-- settingController.js
|   |-- teamController.js
|   `-- testimonialController.js
|
|-- routes/
|   `-- api.js                  # All API routes mounted at /api
|
|-- utils/
|   |-- cloudinaryHelper.js     # uploadImage / deleteImage (Cloudinary or local)
|   |-- logger.js               # recordLog() — writes to Log model
|   |-- logMaintenance.js       # Background log cleanup worker
|   |-- mailer.js               # sendMail() via SMTP/Nodemailer
|   `-- slugify.js              # Auto slug generation utility
|
|-- public/                     # All static files served to browser
|   |-- index.html              # Homepage
|   |-- about.html
|   |-- services.html
|   |-- service-details.html
|   |-- portfolio.html
|   |-- project-details.html
|   |-- blogs.html
|   |-- blog-details.html
|   |-- consultation.html
|   |-- contact.html
|   |-- privacy-policy.html
|   |-- terms.html
|   |-- 404.html
|   |-- uploads/                # Local image fallback storage
|   |-- css/                    # Stylesheets
|   |-- js/                     # Frontend scripts
|   |-- components/             # Reusable HTML components (navbar, footer)
|   `-- admin/                  # Admin panel HTML pages
|       |-- login.html
|       |-- dashboard.html
|       |-- services.html
|       |-- projects.html
|       |-- categories.html
|       |-- blogs.html
|       |-- testimonials.html
|       |-- team.html
|       |-- consultations.html
|       |-- consultation-details.html
|       |-- contacts.html
|       |-- settings.html
|       |-- admins.html
|       |-- media.html
|       |-- logs.html
|       |-- profile.html
|       `-- components/         # Admin navbar/sidebar partials
|
|-- temp/                       # Temporary upload staging directory (Multer)
|-- .env                        # Environment variables (not committed)
|-- .env.example                # Template for environment variables
|-- .gitignore
`-- package.json
```

---

## 4. Getting Started

### Prerequisites

- **Node.js** v18 or higher
- **MongoDB** (local instance or MongoDB Atlas URI)
- **Cloudinary account** *(optional — local fallback is available)*
- **SMTP email credentials** *(optional — console mock available for dev)*

### Installation

```bash
# 1. Clone or download the project
cd k-designs-interiors

# 2. Install dependencies
npm install

# 3. Set up environment variables
cp .env.example .env
# Edit .env with your actual values
```

### Environment Variables

Copy `.env.example` to `.env` and fill in the values:

```env
# Server
PORT=5000

# MongoDB
MONGO_URI=mongodb://localhost:27017/k_designs

# JSON Web Token
JWT_SECRET=your_super_secret_key_here

# Cloudinary (optional — leave blank to use local uploads)
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=

# SMTP Email (optional — leave blank to use console mock)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
FROM_EMAIL=your_email@gmail.com

# Admin Panel Gatekeeper Secret
ADMIN_SECRET_KEY=kdesigns_gatekeeper
```

| Variable | Required | Description |
|---|---|---|
| `PORT` | No | Server port (default: `5000`) |
| `MONGO_URI` | Yes | MongoDB connection string |
| `JWT_SECRET` | Yes | Secret key for signing JWTs |
| `CLOUDINARY_*` | No | Cloudinary credentials; falls back to local `/uploads` |
| `SMTP_*` | No | SMTP credentials; falls back to console mock |
| `ADMIN_SECRET_KEY` | No | URL secret for first-time admin panel access |

### Running the Server

```bash
# Development (with auto-restart via nodemon)
npm run dev

# Production
npm start
```

The server starts at `http://localhost:5000` (or whichever `PORT` is set).

### Default Admin Account (Auto-seeded)

On first run, if no admin exists in the database, a default **SuperAdmin** is automatically created:

| Field | Value |
|---|---|
| Username | `admin` |
| Password | `AdminPassword123!` |
| Role | `SuperAdmin` |

> **Change this password immediately after first login.**

---

## 5. Database & Models

### Admin

| Field | Type | Description |
|---|---|---|
| `username` | String (unique) | Login username |
| `password` | String | bcrypt-hashed password |
| `role` | Enum: `SuperAdmin`, `Editor`, `Viewer` | Access level |
| `permissions` | [String] | Granular permission keys |
| `name` | String | Display name |
| `email` | String | Contact email |
| `phone` | String | Contact phone |
| `profilePicture` | `{ url, public_id }` | Cloudinary or local image |
| `currentSessionId` | String | Active session UUID (single-device enforcement) |

### Service

| Field | Type | Description |
|---|---|---|
| `title` | String | Service title |
| `slug` | String (unique) | URL-friendly identifier |
| `description` | String | Full HTML/text description |
| `image` | `{ url, public_id }` | Primary thumbnail image |
| `images` | Array of `{ url, public_id }` | Gallery images |
| `status` | Enum: `Active`, `Inactive` | Visibility toggle |
| `seo` | `{ metaTitle, metaDescription, keywords }` | SEO metadata |
| `isDeleted` | Boolean | Soft-delete flag |
| `deletedAt` | Date | Soft-delete timestamp |

### Project

| Field | Type | Description |
|---|---|---|
| `title` | String | Project name |
| `slug` | String (unique) | URL-friendly identifier |
| `description` | String | Project description |
| `category` | ObjectId to ProjectCategory | Linked category |
| `images` | Array of `{ url, public_id }` | Project images |
| `videoUrl` | String | Optional YouTube/video URL |
| `location` | String | Project location |
| `completionDate` | String | Completion date |
| `floorPlans` | Array of `{ url, public_id }` | Floor plan images |
| `status` | Enum: `Active`, `Inactive` | Visibility toggle |
| `testimonials` | String | Client testimonial text |
| `seo` | `{ metaTitle, metaDescription, keywords }` | SEO metadata |

### Blog

| Field | Type | Description |
|---|---|---|
| `title` | String | Blog post title |
| `slug` | String (unique) | URL-friendly identifier |
| `content` | String | Full HTML content |
| `category` | ObjectId to BlogCategory | Linked blog category |
| `featuredImage` | `{ url, public_id }` | Cover/thumbnail image |
| `images` | Array of `{ url, public_id }` | Inline content images |
| `status` | Enum: `Active`, `Inactive` | Publish toggle |
| `seo` | `{ metaTitle, metaDescription, keywords }` | SEO metadata |

### Consultation

| Field | Type | Description |
|---|---|---|
| `name` | String | Client name |
| `email` | String | Client email |
| `phone` | String | Client phone |
| `city` | String | Client city |
| `projectType` | String | E.g., Residential, Commercial |
| `projectSize` | String | Square footage / area |
| `budget` | String | Estimated budget |
| `timeline` | String | Expected timeline |
| `message` | String | Additional requirements |
| `floorPlan` | `{ url, public_id }` | Optional uploaded floor plan |
| `images` | Array of `{ url, public_id }` | Reference images |
| `status` | Enum: `Pending`, `Contacted`, `Completed` | Workflow status |
| `statusUpdatedBy` | String | Admin who last updated status |
| `statusUpdatedAt` | Date | Timestamp of last status update |

### Contact

| Field | Type | Description |
|---|---|---|
| `name` | String | Sender name |
| `email` | String | Sender email |
| `phone` | String | Sender phone |
| `subject` | String | Message subject |
| `message` | String | Message body |
| `status` | Enum: `Pending`, `Read`, `Replied` | Admin tracking status |
| `statusUpdatedBy` | String | Admin who updated status |
| `adminNotes` | String | Internal admin notes |

### Settings

| Field | Type | Description |
|---|---|---|
| `siteName` | String | Website name |
| `logo` | `{ url, public_id }` | Site logo |
| `contactEmail` | String | Public contact email |
| `isEmailVerified` | Boolean | Whether contact email is OTP-verified |
| `contactPhone` | String | Public contact phone |
| `whatsappNumber` | String | WhatsApp number (digits only) |
| `address` | String | Physical address |
| `socialLinks` | `{ facebook, instagram, linkedin, youtube }` | Social media URLs |
| `googleMapUrl` | String | Embedded Google Maps iframe URL |
| `seo` | `{ defaultMetaTitle, defaultMetaDescription, defaultKeywords }` | Site-wide SEO defaults |

### Log

| Field | Type | Description |
|---|---|---|
| `type` | Enum: `Activity`, `Error`, `Login`, `Logout` | Log category |
| `admin` | ObjectId to Admin | Admin who triggered the event |
| `adminUsername` | String | Username snapshot |
| `action` | String | Short action code (e.g., `LOGIN`, `CREATE_SERVICE`) |
| `description` | String | Human-readable description |
| `metadata` | Mixed | Additional contextual JSON data |
| `ipAddress` | String | Request IP address |
| `location` | String | Geo-resolved location from IP |

### Other Models

| Model | Key Fields |
|---|---|
| `ProjectCategory` | `name`, `slug`, `status` |
| `BlogCategory` | `name`, `slug`, `status` |
| `Testimonial` | `name`, `designation`, `company`, `message`, `rating`, `image`, `status` |
| `TeamMember` | `name`, `designation`, `bio`, `image`, `socialLinks`, `order`, `status` |
| `City` | `name`, `status` |

---

## 6. Authentication & Roles

### How Authentication Works

1. Client sends `POST /api/auth/login` with `{ username, password }`.
2. Server verifies credentials, generates a **UUID session ID** stored in the Admin document, and returns a **signed JWT** (expires in 30 days).
3. All protected routes require the header: `Authorization: Bearer <token>`.
4. The `protect` middleware verifies the token and cross-checks the `sessionId` against the database to enforce **single active session per admin**.

### Roles

| Role | Description |
|---|---|
| `SuperAdmin` | Full access to everything, including admin management. Bypasses all permission checks. |
| `Editor` | Has a configurable set of granular permissions. |
| `Viewer` | Can only read data; no write access unless permissions are specifically granted. |

### Granular Permission Keys

| Key | Controls |
|---|---|
| `services` / `services_add` / `services_edit` / `services_delete` | Service CRUD |
| `projects` / `projects_add` / `projects_edit` / `projects_delete` | Project CRUD |
| `categories` / `categories_add` / `categories_edit` / `categories_delete` | Categories |
| `blogs` / `blogs_add` / `blogs_edit` / `blogs_delete` | Blog CRUD |
| `testimonials` / `testimonials_add` / `testimonials_edit` / `testimonials_delete` | Testimonials |
| `team` / `team_add` / `team_edit` | Team members |
| `consultations` / `consultations_view` / `consultations_edit` / `consultations_delete` | Consultations |
| `contacts` / `contacts_view` / `contacts_edit` / `contacts_delete` | Contact inquiries |
| `settings` / `settings_edit` | Site settings |
| `logs` | View/clear activity logs |

> **Note:** `SuperAdmin` bypasses all permission checks. Providing a base key like `services` also grants all `services_*` sub-permissions via legacy fallback.

### Single-Session Enforcement

- Each login generates a unique `sessionId` embedded in the JWT and stored in the Admin record.
- If a new login occurs while a session is active, the server returns `ACTIVE_SESSION_EXISTS`.
- Passing `force: true` in the login body terminates the old session and issues a new one.
- Any request whose token `sessionId` does not match the stored one receives `SESSION_INVALIDATED`.

---

## 7. API Reference

**Base URL:** `/api`
**Auth Header (for protected routes):** `Authorization: Bearer <token>`

### Auth Routes

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `POST` | `/auth/login` | Public | Login with username & password |
| `GET` | `/auth/check-role/:username` | Public | Check if username exists and return role |
| `POST` | `/auth/logout` | Protected | Logout and clear session |
| `GET` | `/auth/profile` | Protected | Get own admin profile |
| `PUT` | `/auth/profile` | Protected | Update own profile (name, email, phone, picture) |
| `PUT` | `/auth/change-password` | Protected | Change own password |
| `GET` | `/auth/admins` | SuperAdmin | List all admin accounts |
| `POST` | `/auth/admins` | SuperAdmin | Create a new sub-admin |
| `PUT` | `/auth/admins/:id` | SuperAdmin | Update admin account & permissions |
| `DELETE` | `/auth/admins/:id` | SuperAdmin | Delete an admin account |

**Login Request Body:**
```json
{
  "username": "admin",
  "password": "AdminPassword123!",
  "force": false
}
```

**Login Response:**
```json
{
  "success": true,
  "token": "<jwt>",
  "admin": {
    "id": "...",
    "username": "admin",
    "role": "SuperAdmin",
    "permissions": ["..."]
  }
}
```

### Services

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/services` | Public | Get all active services |
| `GET` | `/services/slug/:slug` | Public | Get a single service by slug |
| `POST` | `/services` | `services_add` | Create a new service (with images) |
| `PUT` | `/services/:id` | `services_edit` | Update a service |
| `DELETE` | `/services/:id` | `services_delete` | Delete a service |

Multipart field: `images[]` (up to 10 files)

### Projects & Categories

**Project Categories**

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/project-categories` | Public | List all project categories |
| `POST` | `/project-categories` | `categories_add` | Create a category |
| `PUT` | `/project-categories/:id` | `categories_edit` | Update a category |
| `DELETE` | `/project-categories/:id` | `categories_delete` | Delete a category |

**Projects**

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/projects` | Public | List all active projects |
| `GET` | `/projects/slug/:slug` | Public | Get a single project by slug |
| `POST` | `/projects` | `projects_add` | Create a project (images + floor plans) |
| `PUT` | `/projects/:id` | `projects_edit` | Update a project |
| `DELETE` | `/projects/:id` | `projects_delete` | Delete a project |

Multipart fields: `images[]` (up to 10), `floorPlans[]` (up to 5)

### Blogs & Blog Categories

**Blog Categories**

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/blog-categories` | Public | List all blog categories |
| `POST` | `/blog-categories` | `categories_add` | Create a blog category |
| `PUT` | `/blog-categories/:id` | `categories_edit` | Update a blog category |
| `DELETE` | `/blog-categories/:id` | `categories_delete` | Delete a blog category |

**Blogs**

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/blogs` | Public | List all active blogs |
| `GET` | `/blogs/slug/:slug` | Public | Get a single blog post by slug |
| `POST` | `/blogs` | `blogs_add` | Create a blog post (with images) |
| `PUT` | `/blogs/:id` | `blogs_edit` | Update a blog post |
| `DELETE` | `/blogs/:id` | `blogs_delete` | Delete a blog post |

Multipart field: `images[]` (up to 3)

### Testimonials

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/testimonials` | Public | List all active testimonials |
| `POST` | `/testimonials` | `testimonials_add` | Create a testimonial (with image) |
| `PUT` | `/testimonials/:id` | `testimonials_edit` | Update a testimonial |
| `DELETE` | `/testimonials/:id` | `testimonials_delete` | Delete a testimonial |

Multipart field: `image` (single file)

### Team Members

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/team` | Public | List all active team members |
| `POST` | `/team` | `team_add` | Add a team member (with image) |
| `PUT` | `/team/:id` | `team_edit` | Update a team member |
| `DELETE` | `/team/:id` | `team` | Remove a team member |

Multipart field: `image` (single file)

### Consultations

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `POST` | `/consultations` | Public | Submit a consultation request |
| `GET` | `/consultations` | `consultations_view` | List all consultations |
| `PUT` | `/consultations/:id` | `consultations_edit` | Update consultation status |
| `DELETE` | `/consultations/:id` | `consultations_delete` | Delete a consultation |

Multipart fields (public submit): `floorPlan` (1 file), `images[]` (up to 5)
Status values: `Pending` -> `Contacted` -> `Completed`

### Contacts

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `POST` | `/contacts` | Public | Submit a contact inquiry |
| `GET` | `/contacts` | `contacts_view` | List all contact inquiries |
| `PUT` | `/contacts/:id` | `contacts_edit` | Update contact status / add notes |
| `DELETE` | `/contacts/:id` | `contacts_delete` | Delete a contact inquiry |

Status values: `Pending` -> `Read` -> `Replied`

### Settings

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/settings` | Public | Fetch current site settings |
| `PUT` | `/settings` | `settings_edit` | Update site settings (with logo upload) |
| `POST` | `/settings/send-otp` | `settings_edit` | Send OTP to verify contact email |
| `POST` | `/settings/verify-otp` | `settings_edit` | Verify OTP and mark email as verified |

Multipart field: `logo` (single file)

### Cities

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/cities` | Public | List all active serving cities |
| `POST` | `/cities` | `categories_add` | Add a serving city |
| `PUT` | `/cities/:id` | `categories_edit` | Update a city |
| `DELETE` | `/cities/:id` | `categories_delete` | Delete a city |

### Logs & Media

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/logs` | Protected | Get all activity/login/error logs |
| `DELETE` | `/logs` | Protected | Clear all logs |
| `GET` | `/media` | Protected | Get a list of all uploaded media files |

---

## 8. Admin Panel

The admin panel is served at `/admin/` and is secured by a **two-tier gatekeeper**.

### Accessing the Admin Panel

**Step 1 — URL Secret (First Time)**

Navigate to:
```
http://yourdomain.com/admin/login.html?secret=kdesigns_gatekeeper
```
This sets a cookie (`admin_access_authorized=true`) valid for 30 days, then redirects to the clean URL. Replace `kdesigns_gatekeeper` with the value of `ADMIN_SECRET_KEY` in your `.env`.

**Step 2 — JWT Login**
Enter admin credentials on the login page. The JWT is stored in `localStorage` and sent with all API calls.

### Admin Panel Pages

| Page | URL | Description |
|---|---|---|
| Login | `/admin/login.html` | Admin login form |
| Dashboard | `/admin/dashboard.html` | Overview stats |
| Services | `/admin/services.html` | Manage services |
| Projects | `/admin/projects.html` | Manage portfolio projects |
| Categories | `/admin/categories.html` | Project & blog categories |
| Blogs | `/admin/blogs.html` | Manage blog posts |
| Testimonials | `/admin/testimonials.html` | Manage client testimonials |
| Team | `/admin/team.html` | Manage team members |
| Consultations | `/admin/consultations.html` | View/manage consultation requests |
| Contacts | `/admin/contacts.html` | View/manage contact inquiries |
| Settings | `/admin/settings.html` | Site-wide settings, SEO, social links |
| Admins | `/admin/admins.html` | Manage sub-admins (SuperAdmin only) |
| Media | `/admin/media.html` | Browse all uploaded media |
| Logs | `/admin/logs.html` | View activity & system logs |
| Profile | `/admin/profile.html` | Edit own profile |

### Anti-Caching Security

All admin HTML pages are served with strict no-cache headers to prevent back-button access after logout:
```
Cache-Control: no-store, no-cache, must-revalidate, private
Pragma: no-cache
Expires: 0
```

---

## 9. Public Website Pages

The public website is served as static HTML with **clean URL support** (e.g., `/about` resolves to `/about.html`).

| Page | URL | Description |
|---|---|---|
| Home | `/` | Landing page with hero, services, featured projects |
| About | `/about` | About the firm |
| Services | `/services` | All services listing |
| Service Detail | `/service-details?slug=<slug>` | Single service page |
| Portfolio | `/portfolio` | All projects listing |
| Project Detail | `/project-details?slug=<slug>` | Single project page |
| Blogs | `/blogs` | Blog listing |
| Blog Detail | `/blog-details?slug=<slug>` | Single blog post |
| Consultation | `/consultation` | Free consultation request form |
| Contact | `/contact` | General contact form |
| Privacy Policy | `/privacy-policy` | Privacy policy page |
| Terms | `/terms` | Terms & conditions page |
| 404 | — | Custom not-found page |

All public pages dynamically fetch content from the `/api` endpoints and render it client-side.

---

## 10. Media & File Uploads

### How Uploads Work

1. **Multer** intercepts the multipart/form-data request and saves file(s) to the `temp/` directory.
2. The controller calls `uploadImage(filePath, folderName)` from `utils/cloudinaryHelper.js`.
3. **If Cloudinary is configured** — file is uploaded to Cloudinary, temp file is deleted, `{ url, public_id }` is stored in DB.
4. **If Cloudinary is not configured** — file is copied to `public/uploads/`, temp file is deleted, a local URL is stored.

### Upload Limits by Feature

| Feature | Field | Max Files |
|---|---|---|
| Services | `images` | 10 |
| Projects | `images` | 10 |
| Projects | `floorPlans` | 5 |
| Blogs | `images` | 3 |
| Testimonials | `image` | 1 |
| Team Members | `image` | 1 |
| Consultations | `floorPlan` | 1 |
| Consultations | `images` | 5 |
| Admin Profile | `profilePicture` | 1 |
| Site Logo | `logo` | 1 |

---

## 11. Email System

Email is handled by `utils/mailer.js` using **Nodemailer**.

If all `SMTP_*` variables are set, a real transporter is created and emails are dispatched. Otherwise, emails are mocked to the console (useful for development).

```js
const { sendMail } = require('./utils/mailer');
await sendMail(to, subject, plainTextBody, htmlBody);
```

**Where Emails Are Used:**
- Contact form submissions — confirmation to client + notification to admin
- Consultation requests — confirmation to client + notification to admin
- Email OTP verification — for verifying the site contact email in Settings

---

## 12. Logging System

All significant admin actions are recorded in the `Log` collection via `utils/logger.js`.

### Log Types

| Type | When It Is Recorded |
|---|---|
| `Login` | Successful admin login |
| `Logout` | Admin logout (including forced/session-takeover logouts) |
| `Activity` | CRUD operations on any entity |
| `Error` | System errors such as failed email dispatch |

Each log record includes the admin, action code, description, IP address, and geo-resolved location (via `ipapi.co`).

A background worker (`utils/logMaintenance.js`) auto-purges old logs to keep the collection manageable.

---

## 13. Security Features

| Feature | Details |
|---|---|
| **Helmet CSP** | Content Security Policy restricts scripts, styles, fonts, images, and frames to trusted sources |
| **CORS** | Cross-Origin Resource Sharing enabled globally |
| **Rate Limiting** | 200 requests per 15 minutes per IP on all `/api/*` routes |
| **JWT Authentication** | 30-day expiry tokens, verified on every protected request |
| **bcrypt Password Hashing** | Salt rounds: 10 |
| **Single Active Session** | Only one device per admin account may hold a valid session at a time |
| **Admin URL Gatekeeper** | Admin panel requires a secret URL parameter on first access, then a browser cookie |
| **No-Cache Admin Headers** | Admin pages are never cached, preventing post-logout back-button access |
| **Soft Deletes (Services)** | Services use `isDeleted` flag rather than hard deletion |
| **Trust Proxy** | Ensures correct IP resolution behind reverse proxies (e.g., Render) |

---

## 14. Deployment

### Deploying to Render (Recommended)

1. Push the project to a GitHub repository.
2. Create a new **Web Service** on [Render](https://render.com).
3. Set **Build Command**: `npm install`
4. Set **Start Command**: `npm start`
5. Add all required **Environment Variables** in the Render dashboard.
6. Set `NODE_ENV=production`.

### Important Production Notes

- Set `NODE_ENV=production` to enable secure cookies for the admin gatekeeper.
- Ensure `ADMIN_SECRET_KEY` is a strong, random string.
- Use **MongoDB Atlas** for the database.
- Configure **Cloudinary** for persistent image storage (local disk is not persistent on Render/Heroku).
- **Change the default admin password** (`AdminPassword123!`) immediately after first deployment.

---

## Project Information

| Field | Value |
|---|---|
| **Project Name** | K.DESIGNS & INTERIORS |
| **Version** | 1.0.0 |
| **License** | ISC |
| **Location** | 45, Silver Arc Complex, Plot No 57, Sector 8, Gandhidham - 370201, Gujarat, India |
| **Contact Email** | kdesignsinteriors1@gmail.com |

---

*Documentation written for K.DESIGNS & INTERIORS — Architecture & Interior Design Website & CMS.*
