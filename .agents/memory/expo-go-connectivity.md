---
name: Expo Go connectivity on Replit
description: What breaks and what fixes Expo Go device scanning/connection in the Replit environment.
---

## Rule
For Expo Go on physical devices (Android/iOS) to connect via Replit, three things must all be correct.

**1. REACT_NATIVE_PACKAGER_HOSTNAME must be $REPLIT_EXPO_DEV_DOMAIN**
The dev script must use `REACT_NATIVE_PACKAGER_HOSTNAME=$REPLIT_EXPO_DEV_DOMAIN` (the `*.expo.worf.replit.dev` domain), NOT `$REPLIT_DEV_DOMAIN`. Metro uses this variable to build bundle URLs embedded in the manifest. If it points to the wrong host, devices receive bundle URLs they can't reach.

**2. expo-router must NOT have an origin: "..." config pointing to a wrong host**
The `expo-router` plugin in `app.json` plugins array must be a bare string `"expo-router"`, NOT an object with `"origin": "https://replit.com/"` (or any non-Expo URL). That origin value is used in deep link routing; a wrong origin causes all native in-app routing to fail after the device connects.

**3. EXPO_PACKAGER_PROXY_URL must be https://$REPLIT_EXPO_DEV_DOMAIN**
Already correct in the scaffold but verify it's present. This sets the QR code URL that devices scan.

**Why:** Devices scan a QR code → connect to the Expo dev domain → receive a manifest → fetch bundle from `REACT_NATIVE_PACKAGER_HOSTNAME`. If any link in that chain is wrong, the app either fails to connect or silently routes incorrectly.

**How to apply:** Any time the Expo dev script is modified or a new expo-router plugin config is added, verify all three points above.

**Bonus: react-native-maps version**
The correct version for `react-native-maps` changes with the Expo SDK. The skill note saying "1.18.0 only" was for an older SDK. For SDK 54.0.35, Expo's compatibility matrix expects `1.20.1`. Always trust `expo start`'s own version warning over static documentation.

**@types/react workspace catalog conflict**
The workspace catalog forces `@types/react: ^19.2.0` which is higher than what Expo SDK 54 expects (`~19.1.10`). This produces a runtime-harmless warning on every `expo start`. It cannot be fixed at the artifact level; it's a deliberate workspace-wide dedupe override.
