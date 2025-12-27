# Analytics Dashboard Setup Guide
Eyes of Azrael - Comprehensive Analytics Configuration

## Table of Contents
1. [Google Analytics 4 Setup](#google-analytics-4-setup)
2. [Firebase Analytics Setup](#firebase-analytics-setup)
3. [Custom Dashboard Configuration](#custom-dashboard-configuration)
4. [Real-Time Monitoring](#real-time-monitoring)
5. [Custom Reports](#custom-reports)
6. [Conversion Funnels](#conversion-funnels)
7. [User Journey Analysis](#user-journey-analysis)
8. [Performance Monitoring](#performance-monitoring)

---

## Google Analytics 4 Setup

### Initial Configuration

1. **Access Google Analytics**
   - Go to https://analytics.google.com
   - Use account: Eyes of Azrael
   - Property: Eyes of Azrael
   - Measurement ID: `G-ECC98XJ9W9`

2. **Verify Installation**
   - Navigate to Admin > Data Streams
   - Click on your web stream
   - Verify Enhanced Measurement is enabled
   - Check "View tag instructions" to confirm setup

### Custom Dimensions

Configure these custom dimensions in GA4:

1. **User-Level Dimensions**
   - `user_type`: authenticated, anonymous
   - `theme_preference`: dark, light, auto
   - `first_visit_date`: Date of first visit

2. **Event-Level Dimensions**
   - `mythology`: Which mythology was viewed
   - `entity_type`: deity, hero, creature, ritual, etc.
   - `entity_id`: Specific entity identifier
   - `search_term`: Search query
   - `comparison_type`: Type of comparison made

3. **Page-Level Dimensions**
   - `page_category`: mythology, archetype, theory, magic, herbalism
   - `mythology_category`: greek, norse, egyptian, etc.

**To Add Custom Dimensions:**
1. Go to Admin > Custom Definitions > Custom Dimensions
2. Click "Create custom dimension"
3. Enter dimension name and scope (User or Event)
4. Select parameter name (must match what's sent in code)
5. Save

### Custom Metrics

Configure these custom metrics:

1. **Engagement Metrics**
   - `scroll_depth`: Percentage scrolled
   - `time_on_page`: Seconds spent on page
   - `interaction_count`: Number of interactions

2. **Performance Metrics**
   - `page_load_time`: Milliseconds
   - `firestore_read_time`: Database read duration
   - `search_results_count`: Number of search results

**To Add Custom Metrics:**
1. Go to Admin > Custom Definitions > Custom Metrics
2. Click "Create custom metric"
3. Enter metric name and unit
4. Select parameter name
5. Save

---

## Firebase Analytics Setup

### Dashboard Access

1. **Firebase Console**
   - Go to https://console.firebase.google.com
   - Select "eyesofazrael" project
   - Navigate to Analytics > Dashboard

2. **Enable Analytics Features**
   - Go to Analytics > Events
   - Enable "Enhanced Analytics"
   - Enable "User Properties"
   - Enable "Audiences"

### Custom Events Configuration

The following custom events are automatically tracked:

**Mythology Events:**
- `mythology_viewed`: User views mythology content
- `deity_viewed`: User views deity details
- `entity_detail_opened`: User opens entity modal

**Search Events:**
- `search`: User performs search
- `search_result_clicked`: User clicks search result

**Comparison Events:**
- `mythology_comparison`: User compares mythologies
- `comparison_viewed`: User views comparison results

**Contribution Events:**
- `theory_submitted`: User submits theory
- `entity_submitted`: User submits entity
- `user_contribution`: Generic contribution event

**Engagement Events:**
- `scroll_depth`: User scrolls to milestone
- `time_on_page`: Session duration tracking
- `user_interaction`: Button clicks, form submissions

**Performance Events:**
- `performance_metric`: Load times, database operations
- `error`: JavaScript errors, Firebase errors

### Event Parameters

Each event includes standard parameters:
- `timestamp`: ISO 8601 timestamp
- `page`: Current page/route
- `user_type`: authenticated/anonymous
- `theme_preference`: User's theme choice

---

## Custom Dashboard Configuration

### Main Dashboard Layout

Create a custom dashboard in GA4 with these cards:

#### 1. **Overview Section**
- **Real-Time Users**: Current active users
- **Total Users**: Last 7 days
- **Sessions**: Last 7 days
- **Engagement Rate**: Engaged sessions / total sessions

#### 2. **Popular Content**
- **Top Mythologies**: Most viewed mythology categories
  - Dimension: `mythology`
  - Metric: `Event count`
  - Filter: `event_name = mythology_viewed`

- **Top Deities**: Most viewed deities
  - Dimension: `entity_id`
  - Metric: `Event count`
  - Filter: `event_name = deity_viewed`

- **Top Pages**: Most visited pages
  - Dimension: `page_path`
  - Metric: `Views`

#### 3. **Search Analytics**
- **Top Search Queries**: Most common searches
  - Dimension: `search_term`
  - Metric: `Event count`
  - Filter: `event_name = search`

- **Search Success Rate**: % of searches with clicks
  - Create calculated metric:
    `search_result_clicked / search * 100`

#### 4. **User Engagement**
- **Average Session Duration**: Time spent per session
- **Pages per Session**: Average pages viewed
- **Scroll Depth Distribution**: How far users scroll
  - Dimension: `depth` (from scroll_depth parameter)
  - Metric: `Event count`

#### 5. **Contributions**
- **Theory Submissions**: Count over time
  - Filter: `event_name = theory_submitted`
  - Dimension: `Date`
  - Metric: `Event count`

- **Entity Submissions**: Count over time
  - Filter: `event_name = entity_submitted`

#### 6. **Performance Metrics**
- **Average Page Load Time**:
  - Filter: `event_name = page_load`
  - Metric: Average `page_load_time`

- **Database Performance**:
  - Filter: `event_name = firestore_read`
  - Metric: Average `duration`

- **Error Rate**: Errors per 100 sessions
  - Create calculated metric: `error / sessions * 100`

### Creating Custom Dashboards in GA4

1. Go to Explore > Blank
2. Click "Create new exploration"
3. Add dimensions and metrics
4. Configure visualizations:
   - Line charts for trends over time
   - Bar charts for comparisons
   - Tables for detailed breakdowns
   - Scatter plots for correlations
5. Add filters as needed
6. Save and name your dashboard

---

## Real-Time Monitoring

### Real-Time Dashboard

1. **Navigate to Real-Time Report**
   - In GA4, go to Reports > Realtime

2. **Key Metrics to Monitor**
   - Users by page: What are people viewing right now?
   - Events per minute: Activity level
   - User locations: Geographic distribution
   - Traffic sources: How users are arriving

3. **Custom Real-Time Report**
   Create a custom real-time exploration:
   - Dimension: `event_name`
   - Metric: `Event count`
   - Time range: Last 30 minutes
   - Breakdown by: `mythology`, `entity_type`

### Firebase Real-Time Dashboard

1. **StreamView** (Firebase Console)
   - Go to Analytics > StreamView
   - Watch events flow in real-time
   - See user properties and event parameters
   - Monitor for errors or anomalies

2. **DebugView** (For Testing)
   - Enable debug mode: Add `?debug=true` to URL
   - Go to Analytics > DebugView
   - See detailed event information
   - Verify events are firing correctly

---

## Custom Reports

### Popular Mythologies Report

**Purpose**: Understand which mythologies are most popular

**Configuration**:
- Primary dimension: `mythology`
- Secondary dimension: `entity_type`
- Metrics:
  - Event count
  - Unique users
  - Average time on page
- Filter: `event_name = mythology_viewed`
- Date range: Last 30 days
- Visualization: Bar chart

**Insights to Look For**:
- Which mythologies drive the most engagement?
- Are certain entity types more popular?
- Seasonal trends in mythology interest

### Search Performance Report

**Purpose**: Optimize search functionality

**Configuration**:
- Primary dimension: `search_term`
- Secondary dimension: `results_count`
- Metrics:
  - Search count
  - Click-through rate (search_result_clicked / search)
  - Average results per search
- Visualization: Table with sparklines

**Insights to Look For**:
- What are users searching for?
- Which searches return no results? (improve content)
- Which searches have low CTR? (improve relevance)

### User Journey Report

**Purpose**: Understand how users navigate the site

**Configuration**:
1. Go to Explore > Path exploration
2. Start point: First page view
3. End point: Conversion (theory_submitted, entity_submitted)
4. Node type: Page path
5. Show: Top 10 paths

**Insights to Look For**:
- Common entry points
- Drop-off points
- Successful conversion paths
- Areas for navigation improvement

### Contribution Funnel Report

**Purpose**: Track user contribution process

**Funnel Steps**:
1. Page view (any page)
2. Sign in (if required)
3. Open contribution form
4. Submit contribution
5. Contribution approved (backend tracking)

**Configuration**:
1. Go to Explore > Funnel exploration
2. Add each step as a condition
3. Breakdown by user_type
4. Analyze drop-off at each step

**Optimization Actions**:
- If drop-off at sign-in: Simplify auth
- If drop-off at form: Improve UX
- If drop-off at submit: Check for errors

---

## Conversion Funnels

### Theory Submission Funnel

**Steps**:
1. View theory page
2. Click "Submit Theory" button
3. Complete theory form
4. Submit theory

**Setup in GA4**:
```
Exploration > Funnel exploration
Step 1: event_name = page_view AND page_path contains 'theory'
Step 2: event_name = button_click AND label = 'Submit Theory'
Step 3: event_name = form_interaction
Step 4: event_name = theory_submitted
```

**KPIs**:
- Overall conversion rate: Step 4 / Step 1
- Form completion rate: Step 4 / Step 3
- Average time to submit

### Search to Engagement Funnel

**Steps**:
1. Perform search
2. Click search result
3. View entity details
4. Interact with content (scroll, click)

**Setup**:
```
Step 1: event_name = search
Step 2: event_name = search_result_clicked
Step 3: event_name = entity_detail_opened
Step 4: event_name = user_interaction
```

**KPIs**:
- Search effectiveness: Step 2 / Step 1
- Content engagement: Step 4 / Step 3

---

## User Journey Analysis

### Cohort Analysis

**Purpose**: Track user behavior over time

**Setup in Firebase**:
1. Go to Analytics > Cohorts
2. Create cohort: "First Time Users - [Date]"
3. Include condition: First open date = [date range]
4. Track metrics:
   - Retention rate (1 day, 7 day, 30 day)
   - Average session duration
   - Contribution rate

**Analysis**:
- Compare cohorts from different periods
- Identify what drove higher retention
- Correlate with feature releases or content updates

### User Lifetime Value

**Metrics to Track**:
- Total sessions per user
- Total contributions per user
- Total time engaged
- Pages per user lifetime

**Setup**:
1. Create calculated metric: User Lifetime Sessions
2. Segment by acquisition channel
3. Compare LTV across segments

### Behavior Flow

**Purpose**: Visualize user paths through site

**Setup in GA4**:
1. Go to Explore > Path exploration
2. Select starting point (home page, landing pages)
3. Configure:
   - Step +1: Next page
   - Step +2: Next page
   - Step +3: Next page
4. Add segments to compare different user types

**Look For**:
- Common paths to contributions
- Pages that lead to exits
- Unexpected navigation patterns

---

## Performance Monitoring

### Page Performance Dashboard

**Metrics**:
- Average page load time
- Time to first byte
- DOM content loaded
- First contentful paint
- Largest contentful paint

**Setup**:
1. Create custom report in GA4
2. Dimension: `page_path`
3. Metrics: All performance timing metrics
4. Add chart: Distribution of load times
5. Set alerts for pages exceeding thresholds

**Thresholds**:
- Page load time: < 3 seconds (good), < 5 seconds (acceptable)
- First contentful paint: < 1.8 seconds
- Largest contentful paint: < 2.5 seconds

### Database Performance

**Firebase Firestore Metrics**:
- Read/Write latency
- Query complexity
- Cache hit rate

**Tracked via**:
- Custom event: `performance_metric`
- Parameters: `metric_name`, `duration`, `collection`

**Analysis**:
1. Identify slow queries
2. Optimize indexes
3. Implement caching strategies
4. Monitor after optimizations

### Error Tracking Dashboard

**Error Types**:
- JavaScript errors
- Unhandled promise rejections
- Firebase auth errors
- Network errors

**Setup**:
1. Create error report
2. Dimension: `error_type`, `error_message`
3. Metrics: Error count, affected users
4. Segment by browser, device type
5. Set up alerts for error spikes

**Response Plan**:
1. Monitor error dashboard daily
2. Prioritize errors affecting most users
3. Create issues in bug tracker
4. Verify fixes reduce error rate

---

## Alert Configuration

### Set Up Alerts

#### High Error Rate Alert
- Condition: Error events > 50 per hour
- Notification: Email to dev team
- Action: Investigate immediately

#### Traffic Spike Alert
- Condition: Users > 200% of 7-day average
- Notification: Email notification
- Action: Monitor performance, scale if needed

#### Conversion Drop Alert
- Condition: Contributions < 50% of 7-day average
- Notification: Email to product team
- Action: Check for bugs or UX issues

#### Performance Degradation Alert
- Condition: Average page load > 5 seconds
- Notification: Email to dev team
- Action: Investigate performance bottleneck

### Creating Alerts in GA4

1. Go to Admin > Property Settings > Custom Alerts
2. Click "Create custom alert"
3. Name the alert
4. Select condition and threshold
5. Choose notification method
6. Save

---

## Data Export & Integration

### BigQuery Integration (Optional)

For advanced analysis, export GA4 data to BigQuery:

1. **Enable BigQuery Export**
   - Go to Admin > BigQuery Linking
   - Link to BigQuery project
   - Choose daily or streaming export

2. **Benefits**:
   - Run complex SQL queries
   - Join with other data sources
   - Create custom visualizations
   - Machine learning on user data

3. **Example Queries**:
```sql
-- Most popular mythology by hour
SELECT
  EXTRACT(HOUR FROM timestamp) as hour,
  event_params.mythology,
  COUNT(*) as views
FROM `project.analytics.events_*`
WHERE event_name = 'mythology_viewed'
GROUP BY hour, mythology
ORDER BY views DESC;

-- User retention by cohort
SELECT
  user_first_touch_date,
  COUNT(DISTINCT user_id) as users,
  COUNTIF(days_since_first_touch = 7) as day_7_retention
FROM user_cohorts
GROUP BY user_first_touch_date;
```

### Data Studio Dashboards

Create visualizations in Google Data Studio:

1. Connect GA4 as data source
2. Create dashboard with:
   - Executive summary
   - Content performance
   - User engagement
   - Conversion metrics
3. Share with stakeholders
4. Schedule email reports

---

## Best Practices

### Regular Reviews

- **Daily**: Check real-time, error rates
- **Weekly**: Review top content, search queries, conversions
- **Monthly**: Deep dive into user journeys, cohort analysis
- **Quarterly**: Strategic review, identify opportunities

### Data Hygiene

- Regularly check for spam traffic
- Filter out bot traffic
- Verify event implementations
- Clean up old custom dimensions/metrics

### Privacy Compliance

- Anonymize IP addresses (already configured)
- Respect user opt-outs
- Don't track PII in event parameters
- Maintain data retention policies

### Optimization Cycle

1. **Measure**: Collect data
2. **Analyze**: Identify patterns and issues
3. **Hypothesize**: Form improvement theories
4. **Test**: Implement changes
5. **Validate**: Verify improvements
6. **Repeat**: Continuous improvement

---

## Support & Resources

### Google Analytics Resources
- [GA4 Documentation](https://support.google.com/analytics/answer/10089681)
- [GA4 Event Reference](https://support.google.com/analytics/answer/9267735)
- [Measurement Protocol](https://developers.google.com/analytics/devguides/collection/protocol/ga4)

### Firebase Analytics Resources
- [Firebase Analytics Docs](https://firebase.google.com/docs/analytics)
- [Event Reference](https://firebase.google.com/docs/reference/js/analytics)
- [Best Practices](https://firebase.google.com/docs/analytics/best-practices)

### Support
- For technical issues: Check Firebase Console logs
- For implementation questions: Review `ANALYTICS_GUIDE.md`
- For advanced analysis: Consider BigQuery export

---

**Last Updated**: 2024-12-27
**Version**: 1.0
**Maintained By**: Eyes of Azrael Development Team
