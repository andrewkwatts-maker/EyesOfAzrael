# AGENT 6: Auth Timeout Flow Diagram

## Authentication Flow with Error Handling

```
┌─────────────────────────────────────────────────────────────────┐
│                    SPANavigation Constructor                     │
└──────────────────────┬──────────────────────────────────────────┘
                       │
                       ▼
              ┌────────────────┐
              │ waitForAuth()  │
              └────────┬───────┘
                       │
         ┌─────────────┴─────────────┐
         │                           │
         ▼                           ▼
┌────────────────┐          ┌────────────────┐
│  Start Timeout │          │ Register Auth  │
│   (10 seconds) │          │    Listener    │
└────────┬───────┘          └────────┬───────┘
         │                           │
         │                           │
         │    ┌──────────────────────┴─────────────────────┐
         │    │                                              │
         │    ▼                                              ▼
         │  ┌─────────────────┐                   ┌──────────────────┐
         │  │ Auth Resolves   │                   │  Timeout Fires   │
         │  │  (< 10 sec)     │                   │   (≥ 10 sec)     │
         │  └────────┬────────┘                   └────────┬─────────┘
         │           │                                      │
         │           ▼                                      │
         │  ┌─────────────────┐                            │
         │  │ Clear Timeout   │                            │
         │  └────────┬────────┘                            │
         │           │                                      │
         │           ▼                                      │
         │  ┌─────────────────┐                            │
         │  │ Set authReady   │                            │
         │  │     = true      │                            │
         │  └────────┬────────┘                            │
         │           │                                      │
         │           ▼                                      │
         │  ┌─────────────────┐                            │
         │  │  Init Router    │                            │
         │  └────────┬────────┘                            │
         │           │                                      │
         │           ▼                                      │
         │  ┌─────────────────┐                            │
         │  │  Page Loaded!   │                            │
         │  └─────────────────┘                            │
         │                                                  │
         └──────────────────────────────────────────────────┘
                                                            │
                                                            ▼
                                              ┌──────────────────────────┐
                                              │ showAuthTimeoutError()   │
                                              │                          │
                                              │  ⏱️ Connection Timeout   │
                                              │                          │
                                              │  Firebase is taking...   │
                                              └────────┬─────────────────┘
                                                       │
                                      ┌────────────────┴────────────────┐
                                      │                                 │
                                      ▼                                 ▼
                            ┌──────────────────┐            ┌──────────────────────┐
                            │  User Clicks:    │            │   User Clicks:       │
                            │     "Retry"      │            │  "Continue Anyway"   │
                            └────────┬─────────┘            └────────┬─────────────┘
                                     │                                │
                                     ▼                                ▼
                            ┌──────────────────┐            ┌──────────────────────┐
                            │ location.reload()│            │ continueWithoutAuth()│
                            │                  │            │                      │
                            │ Restarts entire  │            │ Set authReady=true   │
                            │   auth process   │            │   Init Router        │
                            └──────────────────┘            └──────────────────────┘
```

## State Transitions

### State 1: Waiting for Auth
```
authReady = false
authResolved = false
timeout = active (10s countdown)
UI: Loading screen
```

### State 2A: Auth Success (Normal Path)
```
authResolved = true
timeout = cleared
authReady = true
UI: Router initialized, content loading
```

### State 2B: Auth Timeout (Error Path)
```
authResolved = true
timeout = fired
authReady = false
UI: Error screen with recovery options
```

### State 3A: User Clicks "Retry"
```
Action: location.reload()
Effect: Full page refresh
Result: Return to State 1
```

### State 3B: User Clicks "Continue Anyway"
```
Action: continueWithoutAuth()
authReady = true
UI: Router initialized
Result: Navigation enabled without auth
```

## Race Condition Prevention

The `authResolved` flag prevents these race conditions:

### Race 1: Auth completes exactly at 10 seconds
```
Solution: First to set authResolved=true wins
- If auth callback fires first: timeout becomes no-op
- If timeout fires first: auth callback becomes no-op
```

### Race 2: Multiple auth state changes
```
Solution: Only first change is processed
- authResolved checked at start of both handlers
- Early return if already resolved
```

## Code Flow

```javascript
// Setup
authResolved = false
timeout = setTimeout(10000) {
    if (!authResolved) {
        authResolved = true
        showAuthTimeoutError()
        reject()
    }
}

// Auth callback
onAuthStateChanged(user) {
    if (authResolved) return  // Guard
    authResolved = true
    clearTimeout(timeout)
    resolve(user)
}
```

## Error Recovery Paths

### Path 1: Temporary Network Issue
```
User Experience:
1. Sees timeout error
2. Clicks "Retry"
3. Page reloads
4. Network is back
5. Auth succeeds
```

### Path 2: Persistent Issue
```
User Experience:
1. Sees timeout error
2. Clicks "Retry" (fails again)
3. Sees timeout error again
4. Clicks "Continue Anyway"
5. Can browse site (limited functionality)
```

### Path 3: Firebase Service Outage
```
User Experience:
1. Sees timeout error
2. Clicks "Continue Anyway"
3. Can browse public content
4. Protected features show login prompt
```

## Timeout Behavior

```
Timeline:
0s    ─┬─ waitForAuth() called
      │
      ├─ onAuthStateChanged listener registered
      │
      ├─ setTimeout(10000) started
      │
      │  [Auth might complete here]
      │
9.5s  │  Still waiting...
      │
10s   ┴─ Timeout fires!
         ├─ Check authResolved
         ├─ Set authResolved = true
         ├─ Call showAuthTimeoutError()
         └─ Reject promise
```

## Success Scenarios

### Fast Auth (< 1 second)
```
0.0s: waitForAuth() called
0.1s: Auth state change detected
0.1s: Clear timeout
0.1s: Resolve promise
0.1s: Init router
```

### Normal Auth (1-5 seconds)
```
0.0s: waitForAuth() called
2.5s: Auth state change detected
2.5s: Clear timeout
2.5s: Resolve promise
2.5s: Init router
```

### Slow Auth (5-10 seconds)
```
0.0s: waitForAuth() called
8.0s: Auth state change detected
8.0s: Clear timeout
8.0s: Resolve promise
8.0s: Init router
```

### Very Slow Auth (> 10 seconds)
```
0.0s: waitForAuth() called
10.0s: Timeout fires
10.0s: Error UI shown
10.5s: User clicks "Retry" or "Continue"
```

---

**Visual Legend:**
- `│` = Execution flow
- `┬` `├` `┴` = Flow branching
- `▼` = Next step
- `[ ]` = User interaction required
