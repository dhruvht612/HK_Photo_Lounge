# HK Photo Lounge — Product Requirements Document

> **Version:** 1.0
> **Date:** 2026-05-20
> **Status:** Draft

---

## 1. Executive Summary

HK Photo Lounge is a photography portfolio and booking platform for Harikishan (Harris) Thakar, a photographer based in Brampton, Ontario. The platform currently consists of a public-facing website and an admin dashboard, both powered by a client-side mock API (localStorage).

This PRD outlines the expansion into a full-stack application with:

- **Client Portal** — Registered clients can track bookings, communicate with the photographer, access delivered galleries, sign contracts, view invoices, and upload reference images.
- **Enhanced Admin Portal** — New booking management, client management, analytics, and gallery delivery tools.
- **Real Backend** — Supabase for authentication, PostgreSQL database, file storage, and real-time messaging.

---

## 2. Goals & Objectives

### Business Goals
- Streamline client communication and booking management
- Provide a professional, branded client experience post-inquiry
- Reduce manual follow-up work for the photographer
- Enable secure digital delivery of photo galleries
- Create a foundation for future online payments and scheduling

### Success Metrics
- Client portal adoption rate (% of inquiries that create an account)
- Reduction in email/SMS back-and-forth (use messaging instead)
- Gallery delivery turnaround time
- Booking conversion rate (inquiry → confirmed booking)

---

## 3. Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 18, Vite 6, Tailwind CSS 3, Framer Motion |now 
| **Backend** | Supabase (PostgreSQL, Auth, Storage, Realtime, Edge Functions) |
| **Auth** | Supabase Auth (email/password, magic link) |
| **Database** | PostgreSQL (via Supabase) |
| **File Storage** | Supabase Storage (S3-compatible) |
| **Real-time** | Supabase Realtime (WebSockets for messaging) |
| **Email** | Supabase Edge Functions + Resend / SendGrid |
| **Deployment** | Netlify / Vercel (frontend) + Supabase (backend) |

---

## 4. User Personas

### Persona A: The Photographer (Admin)
- **Name:** Harris
- **Needs:** Manage portfolio, services, categories, testimonials, inquiries; convert inquiries to bookings; manage clients; upload and deliver galleries; view analytics; communicate with clients
- **Pain points:** Currently no booking pipeline, no client history, no gallery delivery workflow
- **Permissions:** Full access to all data

### Persona B: The Client
- **Name:** Priya (engaged couple looking for wedding photography)
- **Needs:** Submit inquiry, create account, track booking status, message photographer, upload reference images, view/download delivered gallery, sign contract, view invoices
- **Pain points:** Currently no way to track inquiry after submission, communication via email only, no centralized gallery access
- **Permissions:** Own data only (bookings, messages, galleries, documents)

---

## 5. Database Schema

### Tables

#### `profiles`
| Column | Type | Notes |
|---|---|---|
| id | uuid | PK, FK → auth.users |
| email | text | |
| name | text | |
| phone | text | nullable |
| avatar_url | text | nullable |
| role | text | 'admin' or 'client', default 'client' |
| created_at | timestamptz | |

#### `categories`
| Column | Type | Notes |
|---|---|---|
| id | uuid | PK |
| name | text | |
| slug | text | unique |
| description | text | nullable |
| created_at | timestamptz | |

#### `portfolio`
| Column | Type | Notes |
|---|---|---|
| id | uuid | PK |
| title | text | |
| slug | text | unique |
| description | text | |
| category_id | uuid | FK → categories |
| cover_url | text | |
| published | boolean | default false |
| featured | boolean | default false |
| created_at | timestamptz | |

#### `portfolio_images`
| Column | Type | Notes |
|---|---|---|
| id | uuid | PK |
| portfolio_id | uuid | FK → portfolio |
| url | text | |
| alt | text | nullable |
| sort_order | integer | |

#### `services`
| Column | Type | Notes |
|---|---|---|
| id | uuid | PK |
| name | text | |
| slug | text | unique |
| description | text | |
| price_hint | text | nullable |
| published | boolean | default false |
| created_at | timestamptz | |

#### `testimonials`
| Column | Type | Notes |
|---|---|---|
| id | uuid | PK |
| client_name | text | |
| content | text | |
| rating | integer | nullable, 1-5 |
| avatar_url | text | nullable |
| published | boolean | default false |
| created_at | timestamptz | |

#### `settings`
| Column | Type | Notes |
|---|---|---|
| id | uuid | PK |
| key | text | unique |
| value | jsonb | |

#### `inquiries`
| Column | Type | Notes |
|---|---|---|
| id | uuid | PK |
| client_id | uuid | nullable, FK → profiles (set when client registers) |
| name | text | |
| email | text | |
| phone | text | nullable |
| service_id | uuid | nullable, FK → services |
| event_date | date | nullable |
| message | text | |
| status | text | pending / contacted / booked / closed |
| created_at | timestamptz | |

#### `bookings`
| Column | Type | Notes |
|---|---|---|
| id | uuid | PK |
| inquiry_id | uuid | FK → inquiries |
| client_id | uuid | FK → profiles |
| service_id | uuid | FK → services |
| event_date | date | |
| location | text | nullable |
| status | text | confirmed / completed / cancelled |
| notes | text | nullable (admin only) |
| created_at | timestamptz | |

#### `messages`
| Column | Type | Notes |
|---|---|---|
| id | uuid | PK |
| booking_id | uuid | FK → bookings |
| sender_id | uuid | FK → profiles |
| content | text | |
| attachments | jsonb | nullable, array of {name, url} |
| read | boolean | default false |
| created_at | timestamptz | |

#### `contracts`
| Column | Type | Notes |
|---|---|---|
| id | uuid | PK |
| booking_id | uuid | FK → bookings |
| title | text | |
| file_url | text | PDF in Supabase Storage |
| signed_at | timestamptz | nullable |
| signed_by_client | boolean | default false |
| created_at | timestamptz | |

#### `invoices`
| Column | Type | Notes |
|---|---|---|
| id | uuid | PK |
| booking_id | uuid | FK → bookings |
| amount | decimal | |
| status | text | pending / paid / overdue |
| due_date | date | |
| paid_at | timestamptz | nullable |
| file_url | text | nullable, PDF in storage |
| created_at | timestamptz | |

#### `gallery_deliveries`
| Column | Type | Notes |
|---|---|---|
| id | uuid | PK |
| booking_id | uuid | FK → bookings |
| title | text | |
| created_at | timestamptz | |

#### `gallery_images`
| Column | Type | Notes |
|---|---|---|
| id | uuid | PK |
| delivery_id | uuid | FK → gallery_deliveries |
| url | text | |
| filename | text | |
| width | integer | nullable |
| height | integer | nullable |
| file_size | integer | nullable |
| download_count | integer | default 0 |

---

## 6. Feature Specifications

### 6.1 Client Portal

#### 6.1.1 Authentication

| Feature | Details |
|---|---|
| Sign Up | Email + password, name, phone (optional) |
| Login | Email + password |
| Password Reset | Magic link via Supabase Auth |
| Session | Persistent via Supabase session in localStorage |
| Role Assignment | New users default to 'client' role |

#### 6.1.2 Dashboard (`/portal/dashboard`)
- Welcome message with client name
- Upcoming booking card (next event date, service, status)
- Recent unread messages count (with link)
- Pending actions (unsigned contracts, unpaid invoices)
- Quick links to galleries, inspiration board

#### 6.1.3 Bookings (`/portal/bookings`)
- List of all bookings tied to the client's profile
- Each card shows: service name, event date, status badge, location
- Statuses: **Pending** (inquiry submitted, no booking yet) → **Confirmed** (booking accepted) → **Completed** (shoot done, gallery ready) → **Cancelled**
- Click on a booking → detail page with full info, linked messages, gallery preview, documents

#### 6.1.4 Messaging (`/portal/messages`)
- Per-booking threaded conversation
- Message list with sender avatar, timestamp, content
- Text input with file attachment support
- Real-time updates via Supabase Realtime subscriptions
- Unread message indicators on nav and dashboard
- Admin sees all threads; client sees only their own

#### 6.1.5 Galleries (`/portal/galleries`)
- Grid of delivered gallery albums (title, thumbnail, date)
- Gallery detail: masonry grid of photos
- Full-screen lightbox viewer with navigation
- Download button per image; bulk download as ZIP (via Edge Function)
- Galleries visible only when booking status = "completed"

#### 6.1.6 Documents (`/portal/documents`)
- Contract viewer (PDF inline or iframe)
- Digital signature field (canvas-based, embedded in UI)
- Download PDF contract (signed or unsigned)
- Invoice list with status badges (paid, pending, overdue)

#### 6.1.7 Inspiration Board (`/portal/inspiration`)
- Upload reference images per booking
- Grid/mood board layout
- Drag-and-drop reordering
- Delete individual images
- Visible to both client and admin

### 6.2 Admin Portal Enhancements

#### 6.2.1 Booking Management (`/admin/bookings`)
- Table of all bookings with status filter tabs
- Convert inquiry → booking (fills in date, location, service, notes)
- Change booking status (confirm, complete, cancel)
- Inline status updates via dropdown
- Link to client profile, inquiry details

#### 6.2.2 Client Management (`/admin/clients`)
- Table of all registered clients with email, phone, total bookings, last activity
- Click to view client detail: booking history, inquiry history, message history
- Search/filter by name or email

#### 6.2.3 Gallery Delivery (`/admin/deliveries`)
- Create delivery albums linked to a completed booking
- Bulk upload photos (drag-and-drop, progress bar)
- Thumbnail generation (client-side or via Edge Function)
- Manage images: delete, reorder, set cover
- Toggle downloadable status per image

#### 6.2.4 Analytics (`/admin/analytics`)
- Monthly inquiry & booking trends (line chart)
- Service popularity breakdown (bar/pie chart)
- Conversion funnel: inquiry → booking → completed
- Client acquisition over time
- Revenue tracking (if invoices are used)

#### 6.2.5 Email Notifications
- **New Inquiry:** Email to admin when inquiry submitted
- **Booking Confirmed:** Email to client when booking is confirmed
- **Gallery Ready:** Email to client with link to gallery
- **New Message:** Email notification for unread messages (digest or real-time)
- Implementation: Supabase Edge Function triggered by DB INSERT/UPDATE

### 6.3 Migration from localStorage

- Existing seed data will remain in localStorage for fallback
- Feature flag `VITE_USE_SUPABASE` toggles between mock API and Supabase
- Admin CRUD features will be migrated to Supabase first
- Public site can remain on mock API until migration is complete

---

## 7. Routing Plan

### Public Routes (unchanged)
| Path | Component |
|---|---|
| `/` | Home |
| `/portfolio` | Portfolio |
| `/portfolio/:slug` | PortfolioDetail |
| `/services` | Services |
| `/services/:slug` | ServiceDetail |
| `/about` | About |
| `/contact` | Contact |
| `/privacy` | Privacy |
| `/terms` | Terms |

### Client Portal Routes
| Path | Component | Auth |
|---|---|---|
| `/portal/login` | PortalLogin | No |
| `/portal/register` | PortalRegister | No |
| `/portal` | PortalDashboard | Yes |
| `/portal/bookings` | PortalBookings | Yes |
| `/portal/bookings/:id` | PortalBookingDetail | Yes |
| `/portal/galleries` | PortalGalleries | Yes |
| `/portal/galleries/:id` | PortalGalleryView | Yes |
| `/portal/messages` | PortalMessages | Yes |
| `/portal/documents` | PortalDocuments | Yes |
| `/portal/inspiration` | PortalInspiration | Yes |

### Admin Routes (enhanced)
| Path | Component | Auth |
|---|---|---|
| `/admin/login` | AdminLogin | No |
| `/admin` | AdminDashboard | Yes |
| `/admin/portfolio` | AdminPortfolio | Yes |
| `/admin/portfolio/new` | AdminPortfolioEdit | Yes |
| `/admin/portfolio/:id` | AdminPortfolioEdit | Yes |
| `/admin/categories` | AdminCategories | Yes |
| `/admin/services` | AdminServices | Yes |
| `/admin/testimonials` | AdminTestimonials | Yes |
| `/admin/inquiries` | AdminInquiries | Yes |
| `/admin/settings` | AdminSettings | Yes |
| `/admin/bookings` | AdminBookings | Yes |
| `/admin/clients` | AdminClients | Yes |
| `/admin/clients/:id` | AdminClientDetail | Yes |
| `/admin/analytics` | AdminAnalytics | Yes |
| `/admin/deliveries` | AdminDeliveries | Yes |
| `/admin/deliveries/new` | AdminDeliveryEdit | Yes |
| `/admin/deliveries/:id` | AdminDeliveryEdit | Yes |

---

## 8. Supabase Configuration

### Authentication
- Providers: Email + Password, Magic Link
- Site URL: production domain
- Redirect URLs: `/portal/*` paths

### Storage Buckets
| Bucket | Access | Purpose |
|---|---|---|
| `portfolio-images` | Public read, admin write | Portfolio gallery images |
| `gallery-deliveries` | Client + admin read, admin write | Delivered client galleries |
| `contracts` | Client + admin read, admin write | PDF contracts |
| `invoices` | Client + admin read, admin write | PDF invoices |
| `message-attachments` | Sender + recipient + admin read | Message file attachments |
| `inspiration-images` | Client + admin read, both write | Reference/mood board images |

### Row Level Security (RLS) Policies
- **Clients:** Can read/write only their own profile, bookings, messages, galleries, contracts, invoices
- **Admin:** Can read/write all rows
- **Public:** Can read published portfolio, services, testimonials; can create inquiries

---

## 9. UI / Design Guidelines

- Maintain existing dark theme with ink/sand/accent color palette
- Use existing Tailwind design tokens
- Client portal should feel clean and professional, distinct from the public site but visually consistent
- Admin portal keeps existing sidebar layout; new nav items added
- Mobile responsive across all portals
- Loading states (skeleton screens), empty states, and error states for all data views

---

## 10. Implementation Phases

### Phase 1 — Foundation
- [ ] Create Supabase project
- [ ] Set up database schema (all tables)
- [ ] Configure auth (providers, redirects)
- [ ] Create Supabase client in the app
- [ ] Set up storage buckets and RLS policies
- [ ] Update AuthContext to support Supabase

### Phase 2 — Client Auth & Profile
- [ ] Portal login page
- [ ] Portal registration page
- [ ] Password reset flow
- [ ] Protected route guard (client role)
- [ ] Portal layout shell
- [ ] Client dashboard page

### Phase 3 — Client Bookings & Status
- [ ] Bookings list page
- [ ] Booking detail page (with status timeline)
- [ ] Link inquiries to client accounts on registration

### Phase 4 — Client Communication
- [ ] Messaging UI (threaded per booking)
- [ ] Real-time message delivery (Supabase Realtime)
- [ ] File attachment support
- [ ] Unread indicators

### Phase 5 — Client Galleries & Documents
- [ ] Gallery list page
- [ ] Gallery viewer (lightbox, download)
- [ ] Contract viewer with digital signature
- [ ] Invoice list with status badges

### Phase 6 — Client Inspiration Board
- [ ] Upload UI per booking
- [ ] Grid/mood board layout
- [ ] Drag-and-drop reordering

### Phase 7 — Admin Enhancements
- [ ] Booking management page
- [ ] Client management page
- [ ] Gallery delivery upload tool
- [ ] Analytics dashboard with charts

### Phase 8 — Email & Polish
- [ ] Edge Function for email notifications
- [ ] Loading/empty/error states across all pages
- [ ] Responsive testing
- [ ] Production deployment

---

## 11. Future Considerations (v2)

- Online payment processing (Stripe integration)
- Direct booking calendar (client selects available date)
- SMS notifications (Twilio)
- Automated contract generation from templates
- Public client review/rating submission after completed booking
- Multi-language support

---

## 12. Security Considerations

- All Supabase RLS policies must be tested before deployment
- File upload validation (type, size limits) on client + Edge Function
- No sensitive data exposed in client-side code
- Session tokens handled exclusively by Supabase SDK
- Admin routes require both authentication and role check
- Rate limiting on auth endpoints (Supabase handles this)
- CORS configuration for production domain

---

## 13. Glossary

| Term | Definition |
|---|---|
| Inquiry | A contact form submission from a potential client |
| Booking | A confirmed appointment for photography services |
| Gallery Delivery | A collection of photos delivered to a client after a shoot |
| RLS | Row Level Security — Supabase's per-row access control |
| Magic Link | Passwordless login via email link |

---

## 14. Revision History

| Version | Date | Author | Changes |
|---|---|---|---|
| 1.0 | 2026-05-20 | — | Initial draft |
