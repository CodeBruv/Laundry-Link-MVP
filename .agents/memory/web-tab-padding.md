---
name: Web tab-bar padding
description: All tab-screen ScrollViews in LaundryLink need web paddingBottom=100 (not 34).
---

## Rule
The Expo Router tab bar on web uses `position: absolute` with `height: 84px`. Screen content extends behind it. Every `ScrollView` on a tab screen needs:
```ts
paddingBottom: insets.bottom + (Platform.OS === "web" ? 100 : 90)
```

**Why:** With 34px on web, the last card/button in any scroll list is hidden behind the 84px tab bar. A value of 100 gives 16px clearance above the tab bar.

**How to apply:** Whenever adding a new tab screen with a ScrollView, use `100` for the web value. Auth screens (no tab bar) can use smaller values.

**Affected file pattern:** `app/(customer|business|dispatcher|admin)/*.tsx` — all fixed to 100 in June 2026.
