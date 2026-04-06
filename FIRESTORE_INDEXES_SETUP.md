# Firestore Indexes Setup

## Overview

CargoGuardian uses Firestore composite indexes to optimize query performance. The index configuration is defined in `firestore.indexes.json`.

## Missing Index Warning

You may see this warning in production logs:

```
[CargoGuardian] Missing Firestore index for telemetry_history trainId+createdAt. 
Falling back to unordered scan for train [trainId].
```

This warning indicates that the Firestore index defined in your configuration has not yet been deployed to your Firebase project.

## How to Deploy Firestore Indexes

### Prerequisites

- Firebase CLI installed: `npm install -g firebase-tools`
- Authenticated with Firebase: `firebase login`
- Your Firebase project ID

### Deployment Steps

#### Option 1: Deploy via Firebase CLI (Recommended)

1. Navigate to your project root:
   ```bash
   cd /path/to/cargo-guardian
   ```

2. Deploy the Firestore indexes:
   ```bash
   firebase deploy --only firestore:indexes
   ```

3. Firebase will prompt you to confirm the index creation. Review the index details and confirm.

4. Wait for the index to be built. This can take 5-15 minutes depending on your data size.

5. Once complete, the warning will stop appearing in your logs.

#### Option 2: Deploy via Google Cloud Console

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Select your Firebase project
3. Navigate to **Firestore Database** → **Indexes**
4. Look for the pending index creation for `telemetry_history` with fields `trainId` + `createdAt`
5. If not present, you can manually create it:
   - Collection: `telemetry_history`
   - Fields:
     - `trainId` (Ascending)
     - `createdAt` (Descending)

#### Option 3: Deploy via GitHub Actions (For CI/CD)

Add this workflow to your `.github/workflows/deploy.yml`:

```yaml
name: Deploy Firestore Indexes

on:
  push:
    branches:
      - main
    paths:
      - 'firestore.indexes.json'

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Deploy Firestore Indexes
        uses: FirebaseExtended/action-hosting-deploy@v0
        with:
          firebaseServiceAccount: ${{ secrets.FIREBASE_SERVICE_ACCOUNT }}
          projectId: ${{ secrets.FIREBASE_PROJECT_ID }}
          channelId: live
```

## Index Details

The Firestore index used by CargoGuardian:

**Collection:** `telemetry_history`

**Fields:**
- `trainId` (Ascending) - Groups telemetry records by train
- `createdAt` (Descending) - Orders records most recent first

**Query Example:**
```typescript
await db
  .collection("telemetry_history")
  .where("trainId", "==", trainId)
  .orderBy("createdAt", "desc")
  .limit(limit)
  .get();
```

## Fallback Behavior

If the index is missing, CargoGuardian automatically:

1. Catches the Firestore index error (code 9)
2. Falls back to an unordered scan of all records for the train
3. Sorts results in memory by `createdAt` descending
4. Returns the requested limit of records

This ensures the application continues to work even if the index hasn't been deployed yet, with a slight performance cost.

## Monitoring

After deployment, monitor these metrics:

- **Firestore Latency**: Should decrease after index is active
- **Read Operations**: Should decrease as index enables more efficient queries
- **Log Warnings**: `telemetry_history trainId+createdAt` warnings should stop

## Troubleshooting

### Index Still Shows as Missing After Deployment

1. Confirm the deployment completed: `firebase deploy --only firestore:indexes --dry-run`
2. Check index status in Google Cloud Console under Firestore → Indexes
3. Wait 5-15 minutes for index to be fully built
4. Verify `firestore.indexes.json` contains the correct index configuration

### Multiple Index Errors

If you see errors for multiple collections:
- Check `firestore.indexes.json` for all defined indexes
- Deploy all indexes at once: `firebase deploy --only firestore:indexes`
- Verify no syntax errors in the JSON file

### Permission Denied When Deploying

Ensure your Firebase service account has these permissions:
- `datastore.indexes.create`
- `datastore.indexes.update`
- `datastore.databases.get`

## Next Steps

Once the index is deployed and active:
1. Monitor logs to confirm `telemetry_history trainId+createdAt` warnings are gone
2. Verify query performance improvements in Firebase Console
3. Consider adding additional indexes for other frequently queried fields if needed
