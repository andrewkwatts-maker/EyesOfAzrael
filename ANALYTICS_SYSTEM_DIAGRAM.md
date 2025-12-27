# Analytics System Architecture
Eyes of Azrael - Visual System Diagram

---

## System Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                         EYES OF AZRAEL                               │
│                    Analytics & Monitoring System                     │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
        ┌───────────────────────────────────────────────────┐
        │              USER INTERACTION LAYER                │
        │                                                    │
        │  • Page Views          • Form Submissions         │
        │  • Button Clicks       • Search Queries           │
        │  • Scroll Events       • Time on Page             │
        └───────────────────────────────────────────────────┘
                                    │
                                    ▼
        ┌───────────────────────────────────────────────────┐
        │            PRIVACY CONTROL LAYER                  │
        │                                                    │
        │  ┌──────────────────────────────────────────┐    │
        │  │  User Consent Check                      │    │
        │  │  • Opted In?  ────► Continue             │    │
        │  │  • Opted Out? ────► Queue/Block          │    │
        │  └──────────────────────────────────────────┘    │
        └───────────────────────────────────────────────────┘
                                    │
                    ┌───────────────┴───────────────┐
                    ▼                               ▼
        ┌──────────────────────┐      ┌──────────────────────┐
        │  ANALYTICS.JS        │      │ PRIVACY-CONTROLS.JS  │
        │  Core Engine         │      │ User Interface       │
        │                      │      │                      │
        │  • Event Tracking    │      │  • Consent Banner    │
        │  • Performance       │      │  • Settings Modal    │
        │  • Error Logging     │      │  • Opt-out Toggle    │
        │  • User Journeys     │      │  • Preference Save   │
        └──────────────────────┘      └──────────────────────┘
                    │
                    ▼
        ┌───────────────────────────────────────────────────┐
        │         EVENT PROCESSING PIPELINE                 │
        │                                                    │
        │  1. Event Captured                                │
        │  2. Standard Parameters Added                     │
        │  3. Privacy Check                                 │
        │  4. Data Anonymization                            │
        │  5. Queue if Not Ready                            │
        │  6. Transmit to Analytics Platforms               │
        └───────────────────────────────────────────────────┘
                                    │
                    ┌───────────────┴───────────────┐
                    ▼                               ▼
        ┌──────────────────────┐      ┌──────────────────────┐
        │  GOOGLE ANALYTICS 4  │      │  FIREBASE ANALYTICS  │
        │                      │      │                      │
        │  • Web Analytics     │      │  • Real-time Events  │
        │  • User Journeys     │      │  • Mobile-optimized  │
        │  • Acquisition       │      │  • StreamView        │
        │  • Custom Reports    │      │  • DebugView         │
        │  • BigQuery Export   │      │  • Audiences         │
        └──────────────────────┘      └──────────────────────┘
                    │                               │
                    └───────────────┬───────────────┘
                                    ▼
        ┌───────────────────────────────────────────────────┐
        │              DATA AGGREGATION                     │
        │                                                    │
        │  • Combine GA4 + Firebase Data                    │
        │  • Calculate Metrics                              │
        │  • Generate Insights                              │
        │  • Detect Anomalies                               │
        └───────────────────────────────────────────────────┘
                                    │
                                    ▼
        ┌───────────────────────────────────────────────────┐
        │              DASHBOARDS & REPORTS                 │
        │                                                    │
        │  ┌─────────────┐  ┌─────────────┐  ┌──────────┐  │
        │  │  Real-time  │  │   Custom    │  │  Alerts  │  │
        │  │ Monitoring  │  │ Dashboards  │  │  & Warn  │  │
        │  └─────────────┘  └─────────────┘  └──────────┘  │
        │                                                    │
        │  ┌─────────────┐  ┌─────────────┐  ┌──────────┐  │
        │  │  User       │  │Performance  │  │  Error   │  │
        │  │ Journeys    │  │ Metrics     │  │ Tracking │  │
        │  └─────────────┘  └─────────────┘  └──────────┘  │
        └───────────────────────────────────────────────────┘
                                    │
                                    ▼
        ┌───────────────────────────────────────────────────┐
        │              ACTIONABLE INSIGHTS                  │
        │                                                    │
        │  • Content Strategy                               │
        │  • UX Improvements                                │
        │  • Performance Optimization                       │
        │  • Bug Fixes                                      │
        │  • Feature Priorities                             │
        └───────────────────────────────────────────────────┘
```

---

## Event Flow Diagram

```
USER ACTION
    │
    ▼
┌─────────────────┐
│  Click Button   │
│  Search Query   │
│  View Page      │
│  Submit Form    │
└─────────────────┘
    │
    ▼
┌─────────────────────────────────────┐
│  EVENT LISTENER (analytics.js)      │
│  • Capture event details            │
│  • Extract parameters                │
│  • Add timestamp                     │
└─────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────┐
│  PRIVACY CHECK                       │
│  Has user given consent?             │
└─────────────────────────────────────┘
    │
    ├─► NO ──► Queue Event ──► Wait for Consent
    │
    ▼ YES
┌─────────────────────────────────────┐
│  ANONYMIZATION                       │
│  • Anonymize IP                      │
│  • Remove PII                        │
│  • Add standard params               │
└─────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────┐
│  TRANSMISSION                        │
│  • Send to GA4 (gtag)                │
│  • Send to Firebase (logEvent)       │
└─────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────┐
│  ANALYTICS PLATFORMS                 │
│  • Process event                     │
│  • Update dashboards                 │
│  • Generate reports                  │
└─────────────────────────────────────┘
```

---

## Privacy Controls Flow

```
FIRST VISIT
    │
    ▼
┌─────────────────────────────────────┐
│  CHECK CONSENT STATUS                │
│  localStorage.getItem('consent')     │
└─────────────────────────────────────┘
    │
    ├─► FOUND ──► Use Saved Preference
    │
    ▼ NOT FOUND
┌─────────────────────────────────────┐
│  SHOW CONSENT BANNER                 │
│  ┌─────────────────────────────┐    │
│  │  "We use analytics..."      │    │
│  │  [Customize] [Accept] [Decline] │
│  └─────────────────────────────┘    │
└─────────────────────────────────────┘
    │
    ├─► ACCEPT ──┐
    ├─► DECLINE ─┤
    └─► CUSTOMIZE┤
                 │
                 ▼
        ┌─────────────────┐
        │  SAVE PREFERENCE │
        │  to localStorage │
        └─────────────────┘
                 │
                 ▼
        ┌─────────────────────┐
        │  INITIALIZE         │
        │  AnalyticsManager   │
        │  with consent state │
        └─────────────────────┘
                 │
    ┌────────────┴────────────┐
    ▼                         ▼
ACCEPTED                  DECLINED
    │                         │
    ▼                         ▼
Enable Analytics          Disable Analytics
Track Events              Queue Events
Send to GA4/Firebase      Block Transmission
```

---

## Data Flow Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      FRONTEND (Browser)                      │
│                                                              │
│  ┌────────────┐  ┌─────────────┐  ┌──────────────────┐     │
│  │   User     │  │  Analytics  │  │     Privacy      │     │
│  │ Interaction│─▶│   Engine    │◀─│    Controls      │     │
│  └────────────┘  └─────────────┘  └──────────────────┘     │
│                         │                                    │
└─────────────────────────┼────────────────────────────────────┘
                          │
                          ▼
                  ┌───────────────┐
                  │  HTTPS/TLS    │
                  │  Encryption   │
                  └───────────────┘
                          │
        ┌─────────────────┴─────────────────┐
        │                                   │
        ▼                                   ▼
┌────────────────┐                  ┌────────────────┐
│  Google        │                  │  Firebase      │
│  Analytics 4   │                  │  Analytics     │
│                │                  │                │
│  Processing    │                  │  Processing    │
│  Storage       │                  │  Storage       │
│  Reporting     │                  │  Reporting     │
└────────────────┘                  └────────────────┘
        │                                   │
        └─────────────────┬─────────────────┘
                          │
                          ▼
                  ┌───────────────┐
                  │  Data         │
                  │  Aggregation  │
                  └───────────────┘
                          │
                          ▼
        ┌──────────────────────────────────────┐
        │         INSIGHTS & ACTIONS           │
        │                                       │
        │  • Improve Content                   │
        │  • Optimize Performance              │
        │  • Fix Errors                        │
        │  • Enhance UX                        │
        └──────────────────────────────────────┘
```

---

## Event Types Hierarchy

```
ALL EVENTS
│
├─── CONTENT EVENTS
│    ├── mythology_viewed
│    ├── deity_viewed
│    └── entity_detail_opened
│
├─── SEARCH EVENTS
│    ├── search
│    └── search_result_clicked
│
├─── COMPARISON EVENTS
│    ├── mythology_comparison
│    └── comparison_viewed
│
├─── CONTRIBUTION EVENTS
│    ├── theory_submitted
│    ├── entity_submitted
│    └── user_contribution
│
├─── ENGAGEMENT EVENTS
│    ├── scroll_depth
│    ├── time_on_page
│    └── user_interaction
│
├─── PERFORMANCE EVENTS
│    ├── page_load
│    ├── firestore_read
│    └── performance_metric
│
└─── ERROR EVENTS
     └── error
```

---

## Analytics Stack

```
┌─────────────────────────────────────────────────────────┐
│                   PRESENTATION LAYER                     │
│                                                          │
│  GA4 Dashboard │ Firebase Console │ Custom Reports      │
└─────────────────────────────────────────────────────────┘
                            │
┌─────────────────────────────────────────────────────────┐
│                   ANALYTICS LAYER                        │
│                                                          │
│  Google Analytics 4      │      Firebase Analytics      │
│  • Event Processing      │      • Real-time Streaming   │
│  • User Segmentation     │      • Mobile Optimization   │
│  • Funnel Analysis       │      • Audience Building     │
└─────────────────────────────────────────────────────────┘
                            │
┌─────────────────────────────────────────────────────────┐
│                 COLLECTION LAYER                         │
│                                                          │
│  analytics.js            │      privacy-controls.js     │
│  • Event Tracking        │      • Consent Management    │
│  • Performance Monitor   │      • User Preferences      │
│  • Error Logging         │      • Privacy UI            │
└─────────────────────────────────────────────────────────┘
                            │
┌─────────────────────────────────────────────────────────┐
│                    APPLICATION LAYER                     │
│                                                          │
│  Eyes of Azrael Site                                    │
│  • User Interactions                                    │
│  • Page Navigation                                      │
│  • Feature Usage                                        │
└─────────────────────────────────────────────────────────┘
```

---

## Key Metrics Dashboard Layout

```
┌──────────────────────────────────────────────────────────────┐
│                     ANALYTICS DASHBOARD                       │
├──────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐          │
│  │   Active    │  │   Total     │  │  Sessions   │          │
│  │   Users     │  │   Users     │  │   Today     │          │
│  │     47      │  │   1,234     │  │     892     │          │
│  └─────────────┘  └─────────────┘  └─────────────┘          │
│                                                               │
│  ┌────────────────────────────────────────────────┐          │
│  │         Top Mythologies (Last 7 Days)          │          │
│  │  1. Greek      ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓  45%      │          │
│  │  2. Norse      ▓▓▓▓▓▓▓▓▓▓▓▓▓▓        28%      │          │
│  │  3. Egyptian   ▓▓▓▓▓▓▓▓              15%      │          │
│  │  4. Hindu      ▓▓▓▓                  8%       │          │
│  │  5. Celtic     ▓▓                    4%       │          │
│  └────────────────────────────────────────────────┘          │
│                                                               │
│  ┌───────────────────────┐  ┌───────────────────────┐        │
│  │  Search Queries       │  │  Performance          │        │
│  │  • zeus: 234          │  │  • Load Time: 2.3s    │        │
│  │  • odin: 189          │  │  • Error Rate: 0.4%   │        │
│  │  • norse myth: 156    │  │  • Bounce: 42%        │        │
│  │  • egyptian gods: 134 │  │  • Pages/Session: 4.2 │        │
│  └───────────────────────┘  └───────────────────────┘        │
│                                                               │
│  ┌─────────────────────────────────────────────────┐         │
│  │         User Journey (Top Path)                 │         │
│  │  Home ──► Search ──► Deity ──► Compare ──► Exit │         │
│  │  100%     67%        45%       23%        100%   │         │
│  └─────────────────────────────────────────────────┘         │
│                                                               │
└──────────────────────────────────────────────────────────────┘
```

---

## System Dependencies

```
Eyes of Azrael Analytics System
├── Google Analytics 4
│   ├── gtag.js (loaded async)
│   └── Measurement ID: G-ECC98XJ9W9
│
├── Firebase Platform
│   ├── firebase-app-compat.js
│   ├── firebase-analytics-compat.js
│   ├── firebase-firestore-compat.js
│   └── firebase-auth-compat.js
│
├── Custom Modules
│   ├── analytics.js
│   │   ├── AnalyticsManager class
│   │   ├── Event tracking methods
│   │   ├── Performance monitoring
│   │   └── Error tracking
│   │
│   └── privacy-controls.js
│       ├── PrivacyControls class
│       ├── Consent banner
│       └── Settings modal
│
└── Documentation
    ├── ANALYTICS_GUIDE.md
    ├── analytics-dashboard-setup.md
    ├── privacy-policy.md
    └── ANALYTICS_QUICK_REFERENCE.md
```

---

## Integration Points

```
index.html
├── <head>
│   ├── Google Analytics script
│   ├── Firebase SDK scripts
│   └── Firebase config
│
└── <body>
    └── Before </body>
        ├── Core scripts
        ├── Firebase scripts
        ├── Component scripts
        ├── analytics.js ◄── ANALYTICS
        ├── privacy-controls.js ◄── PRIVACY
        └── app-init-simple.js

Footer
└── <footer>
    └── Privacy Settings link ◄── USER CONTROL
```

---

**Last Updated**: December 27, 2024
**Version**: 1.0
