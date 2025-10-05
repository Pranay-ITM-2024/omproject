# 🔥 Firebase Console Setup Instructions

## Create User Documents Manually

### Step 1: Open Firebase Console
1. Go to: https://console.firebase.google.com/
2. Select project: **finaldestination-e3b5a**
3. Navigate to **Firestore Database → Data**

### Step 2: Create Users Collection
1. Click **"Start collection"**
2. Collection ID: `users`
3. Click **"Next"**

---

## 👤 Buyer User Document

### Document ID: `5KarqQeV1zUEWQUn9Prm5SlpJgu2`

**Add these fields one by one:**

| Field Name | Type | Value |
|------------|------|-------|
| `uid` | string | `5KarqQeV1zUEWQUn9Prm5SlpJgu2` |
| `email` | string | `buyer@example.com` |
| `role` | string | `buyer` |
| `createdAt` | timestamp | (click "Set to current time") |
| `lastLogin` | timestamp | (click "Set to current time") |
| `isActive` | boolean | `true` |

### Profile Sub-Document:
1. Create field: `profile` (type: map)
2. Inside profile map, add:

| Field Name | Type | Value |
|------------|------|-------|
| `firstName` | string | `John` |
| `lastName` | string | `Buyer` |
| `phone` | string | `+1-555-0001` |
| `address` | string | `123 Buyer Street, Buyer City, BC 12345` |

### Preferences Sub-Document:
1. Create field: `preferences` (type: map)
2. Inside preferences map, add:

| Field Name | Type | Value |
|------------|------|-------|
| `categories` | array | `["electronics", "clothing", "books"]` |
| `maxBudget` | number | `1000` |
| `notifications` | boolean | `true` |

### Stats Sub-Document:
1. Create field: `stats` (type: map)
2. Inside stats map, add:

| Field Name | Type | Value |
|------------|------|-------|
| `totalPurchases` | number | `0` |
| `totalSpent` | number | `0` |
| `averageRating` | number | `0` |

---

## 🏪 Seller User Document

### Document ID: `JnyqPLyJtOgsZxikrh7cPw6gZOD3`

**Add these fields one by one:**

| Field Name | Type | Value |
|------------|------|-------|
| `uid` | string | `JnyqPLyJtOgsZxikrh7cPw6gZOD3` |
| `email` | string | `seller@example.com` |
| `role` | string | `seller` |
| `createdAt` | timestamp | (click "Set to current time") |
| `lastLogin` | timestamp | (click "Set to current time") |
| `isActive` | boolean | `true` |

### Profile Sub-Document:
1. Create field: `profile` (type: map)
2. Inside profile map, add:

| Field Name | Type | Value |
|------------|------|-------|
| `firstName` | string | `Jane` |
| `lastName` | string | `Seller` |
| `phone` | string | `+1-555-0002` |
| `address` | string | `456 Seller Avenue, Seller City, SC 67890` |

### Business Info Sub-Document:
1. Create field: `businessInfo` (type: map)
2. Inside businessInfo map, add:

| Field Name | Type | Value |
|------------|------|-------|
| `businessName` | string | `Quality Products Inc.` |
| `businessType` | string | `Electronics & Gadgets` |
| `description` | string | `Providing high-quality electronics and gadgets at competitive prices.` |

### Stats Sub-Document:
1. Create field: `stats` (type: map)
2. Inside stats map, add:

| Field Name | Type | Value |
|------------|------|-------|
| `totalListings` | number | `0` |
| `activeListing` | number | `0` |
| `totalSales` | number | `0` |
| `totalRevenue` | number | `0` |
| `averageRating` | number | `0` |
| `totalReviews` | number | `0` |

### Seller Verification Sub-Document:
1. Create field: `sellerVerification` (type: map)
2. Inside sellerVerification map, add:

| Field Name | Type | Value |
|------------|------|-------|
| `isVerified` | boolean | `true` |
| `verifiedAt` | timestamp | (click "Set to current time") |
| `verificationLevel` | string | `basic` |

---

## ✅ After Creating Both User Documents

1. **Save both documents**
2. **Verify they appear in the users collection**
3. **Run the database initialization**: `http://localhost:8000/init-database.html`

---

## 🎯 Quick Copy-Paste Values

### Buyer UID: 
```
5KarqQeV1zUEWQUn9Prm5SlpJgu2
```

### Seller UID:
```
JnyqPLyJtOgsZxikrh7cPw6gZOD3
```

### Array Values:
```
["electronics", "clothing", "books"]
```

---

## 🚨 Troubleshooting

### If you get errors:
1. **Permission Denied**: Make sure you're logged into the correct Firebase account
2. **Project Not Found**: Verify you selected `finaldestination-e3b5a`
3. **Field Errors**: Double-check field types (string, number, boolean, timestamp, map, array)

### After completion:
1. Users should appear in Firestore → users collection
2. Each document should have the UID as the document ID
3. All nested maps (profile, stats, etc.) should be properly structured

This manual setup will bypass all permission issues and create the exact user structure needed for your marketplace!