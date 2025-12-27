# Analytics Quick Reference
Eyes of Azrael - Fast Access to Analytics Functions

---

## Quick Access Links

- **Google Analytics**: https://analytics.google.com (Property: Eyes of Azrael)
- **Firebase Console**: https://console.firebase.google.com (Project: eyesofazrael)
- **Full Guide**: See `ANALYTICS_GUIDE.md`
- **Setup Guide**: See `analytics-dashboard-setup.md`
- **Privacy Policy**: See `privacy-policy.md`

---

## Common Analytics Tasks

### Track Custom Event
```javascript
window.trackEvent('event_name', {
  param1: 'value1',
  param2: 'value2'
});
```

### Track Page View (SPA)
```javascript
window.trackPageView('#/path', 'Page Title');
```

### Track Search
```javascript
window.trackSearch('search query', { mythology: 'greek' }, 15);
```

### Track Mythology View
```javascript
window.trackMythologyView('greek', 'deity', 'zeus');
```

### Check Analytics Status
```javascript
console.log(window.AnalyticsManager.getSummary());
```

### Enable Debug Mode
Add to URL: `?debug=true`

---

## Important Events

| Event Name | When | Parameters |
|------------|------|------------|
| `mythology_viewed` | User views mythology | mythology, entity_type, entity_id |
| `deity_viewed` | User views deity | mythology, deity_name |
| `search` | User searches | search_term, filters, results_count |
| `search_result_clicked` | User clicks result | search_term, result_id, position |
| `theory_submitted` | User submits theory | theory_type, mythology |
| `entity_submitted` | User submits entity | entity_type, mythology |
| `scroll_depth` | User scrolls | depth (25/50/75/100), page |
| `page_load` | Page loads | page_load_time, dom_ready_time |
| `error` | Error occurs | type, message, stack |

---

## Key Metrics

### Daily Check
- Real-time users (GA4 > Realtime)
- Error rate (should be <1%)
- Page load time (should be <3s)

### Weekly Review
- Top mythologies (which content is popular?)
- Search queries (what are users looking for?)
- Bounce rate (should be <60%)

### Monthly Analysis
- User growth (target 20% MoM)
- Contribution rate (target 5% of users)
- Retention (target 30% 7-day retention)

---

## Dashboard Access

### Google Analytics 4
1. Go to analytics.google.com
2. Select "Eyes of Azrael" property
3. Key reports:
   - Realtime (current activity)
   - Engagement > Pages (popular content)
   - Engagement > Events (custom events)
   - User > Demographics (user info)

### Firebase Analytics
1. Go to console.firebase.google.com
2. Select "eyesofazrael" project
3. Analytics > Dashboard
4. Key views:
   - Events (event tracking)
   - StreamView (real-time)
   - DebugView (testing)

---

## Privacy Controls

### User Opt-Out
- Footer > "Privacy Settings"
- Toggle analytics off
- Saves in localStorage

### Check Consent
```javascript
console.log(localStorage.getItem('analytics_consent'));
// 'true' = opted in, 'false' = opted out
```

### Programmatic Opt-Out
```javascript
window.AnalyticsManager.optOut();
```

---

## Troubleshooting

### Events Not Appearing?
1. Check debug mode: `?debug=true`
2. Check console for errors
3. Verify consent: `window.AnalyticsManager.consentGiven`
4. Check Firebase DebugView

### Analytics Not Loading?
1. Check network tab for blocked requests
2. Disable ad blocker
3. Check console for initialization errors
4. Verify Firebase config

### Data Discrepancies?
- GA4 and Firebase may differ (normal)
- Allow 24-48 hours for GA4 data
- Check time zones match

---

## Alert Thresholds

| Metric | Good | Warning | Critical |
|--------|------|---------|----------|
| Error Rate | <1% | 1-5% | >5% |
| Page Load | <3s | 3-5s | >5s |
| Bounce Rate | <60% | 60-80% | >80% |
| Active Users | Steady | -50% | -75% |

---

## Configuration IDs

- **GA4 Measurement ID**: `G-ECC98XJ9W9`
- **Firebase Project**: `eyesofazrael`
- **Firebase App ID**: `1:533894778090:web:35b48ba34421b385569b93`

---

## Custom Dimensions (GA4)

To add in GA4 Admin > Custom Definitions:

**User-Level**:
- `user_type` (authenticated/anonymous)
- `theme_preference` (dark/light)

**Event-Level**:
- `mythology` (greek, norse, etc.)
- `entity_type` (deity, hero, creature, etc.)
- `entity_id` (specific entity)
- `search_term` (search query)
- `comparison_type` (comparison category)

---

## Support Contacts

- **Privacy Questions**: privacy@eyesofazrael.com
- **Security Issues**: security@eyesofazrael.com
- **General Support**: support@eyesofazrael.com
- **Response Time**: 3-5 business days

---

## Files Reference

| File | Purpose |
|------|---------|
| `js/analytics.js` | Main analytics module |
| `js/privacy-controls.js` | Privacy UI and consent |
| `ANALYTICS_GUIDE.md` | Complete documentation |
| `analytics-dashboard-setup.md` | Dashboard configuration |
| `privacy-policy.md` | Legal privacy policy |
| `ANALYTICS_IMPLEMENTATION_SUMMARY.md` | Implementation details |

---

**Last Updated**: December 27, 2024
**Version**: 1.0
