# Firebase Database Setup Guide

## 🚀 Quick Setup Steps

### 1. Firebase Console Setup

1. **Go to [Firebase Console](https://console.firebase.google.com/)**
2. **Select your project**: `p2ptrade-3dcd0`
3. **Enable Authentication**:
   - Go to Authentication → Sign-in method
   - Enable "Email/Password" provider
   - Enable "Anonymous" provider (optional)

### 2. Firestore Database Setup

1. **Go to Firestore Database**
2. **Create database**:
   - Choose "Start in test mode" (we'll update rules)
   - Select a location (choose closest to your users)
3. **Deploy Security Rules**:
   ```bash
   firebase deploy --only firestore:rules
   ```

### 3. Required Collections

Your Firestore database needs these collections:

#### Core Collections:
- `users` - User profiles and roles
- `listings` - Product listings
- `purchaseRequests` - Buyer matching requests
- `matches` - Algorithm-generated matches
- `feedback` - Seller ratings and reviews
- `tickets` - Support tickets

#### Admin Collections:
- `analytics` - Platform analytics
- `settings` - System settings
- `auditLogs` - System audit logs
- `metrics` - Performance metrics

#### Optional Collections:
- `notifications` - User notifications
- `messages` - Chat messages
- `reports` - User reports
- `sessions` - User sessions
- `categories` - Product categories
- `announcements` - System announcements

### 4. Database Indexes

Create these composite indexes in Firestore:

#### For Listings:
- Collection: `listings`
- Fields: `status` (Ascending), `createdAt` (Descending)
- Fields: `category` (Ascending), `price` (Ascending)
- Fields: `sellerId` (Ascending), `createdAt` (Descending)

#### For Purchase Requests:
- Collection: `purchaseRequests`
- Fields: `buyerId` (Ascending), `createdAt` (Descending)
- Fields: `desiredCategory` (Ascending), `maxBudget` (Ascending)

#### For Matches:
- Collection: `matches`
- Fields: `buyerId` (Ascending), `createdAt` (Descending)
- Fields: `sellerId` (Ascending), `createdAt` (Descending)

#### For Tickets:
- Collection: `tickets`
- Fields: `status` (Ascending), `createdAt` (Descending)
- Fields: `priority` (Ascending), `createdAt` (Descending)

### 5. Initial Data Setup

Run this script to create initial data:

```javascript
// Run this in Firebase Console → Firestore → Data
// Or use the Firebase Admin SDK

// Create initial categories
const categories = [
  { id: 'electronics', name: 'Electronics', description: 'Electronic devices and gadgets' },
  { id: 'clothing', name: 'Clothing', description: 'Fashion and apparel' },
  { id: 'home', name: 'Home & Garden', description: 'Home improvement and gardening' },
  { id: 'books', name: 'Books', description: 'Books and educational materials' },
  { id: 'sports', name: 'Sports', description: 'Sports equipment and fitness' },
  { id: 'other', name: 'Other', description: 'Miscellaneous items' }
];

// Create system settings
const settings = {
  platformName: 'P2P Marketplace',
  version: '1.0.0',
  maintenanceMode: false,
  maxListingsPerUser: 50,
  maxPrice: 10000,
  minPrice: 0.01
};
```

## 🔧 Firebase CLI Setup

### Install Firebase CLI:
```bash
npm install -g firebase-tools
```

### Login and Initialize:
```bash
firebase login
firebase init
```

### Deploy Rules:
```bash
firebase deploy --only firestore:rules
```

## 📊 Database Structure

### Users Collection:
```javascript
{
  uid: "user123",
  email: "user@example.com",
  role: "buyer" | "seller" | "admin",
  createdAt: timestamp,
  profile: {
    firstName: "John",
    lastName: "Doe",
    phone: "+1234567890",
    address: "123 Main St"
  }
}
```

### Listings Collection:
```javascript
{
  id: "listing123",
  title: "Product Title",
  description: "Product description",
  category: "electronics",
  price: 299.99,
  condition: "new",
  keywords: "gaming, laptop, portable",
  location: "New York, NY",
  sellerId: "user123",
  sellerEmail: "seller@example.com",
  status: "active" | "paused" | "sold",
  views: 0,
  rating: 0,
  ratingCount: 0,
  createdAt: timestamp,
  updatedAt: timestamp
}
```

### Purchase Requests Collection:
```javascript
{
  id: "request123",
  desiredCategory: "electronics",
  maxBudget: 500,
  keywords: "gaming, laptop",
  preferredCondition: "new",
  locationPreference: "New York",
  buyerId: "user123",
  buyerEmail: "buyer@example.com",
  status: "active",
  createdAt: timestamp
}
```

### Matches Collection:
```javascript
{
  id: "match123",
  buyerId: "user123",
  sellerId: "user456",
  listingId: "listing789",
  matchScore: 85,
  matchConfidence: 85,
  algorithmUsed: "DSA Greedy Matching",
  createdAt: timestamp
}
```

## 🛡️ Security Rules Features

The updated security rules include:

1. **Helper Functions**: Clean, reusable functions for common checks
2. **Role-Based Access**: Proper role validation for all operations
3. **Data Ownership**: Users can only access their own data
4. **Admin Privileges**: Admins have full access to all collections
5. **Public Read Access**: Listings are publicly readable for browsing
6. **Secure Creation**: Proper validation for data creation

## 🚨 Important Security Notes

1. **Never expose API keys** in client-side code (they're safe in this context)
2. **Test rules thoroughly** before deploying to production
3. **Monitor Firestore usage** to prevent abuse
4. **Set up billing alerts** to avoid unexpected charges
5. **Regular security audits** of your rules

## 📈 Performance Optimization

1. **Use indexes** for all query combinations
2. **Limit query results** with pagination
3. **Cache frequently accessed data**
4. **Use compound queries** efficiently
5. **Monitor query performance** in Firebase Console

## 🔍 Testing Your Setup

1. **Test Authentication**: Try creating accounts with different roles
2. **Test Listings**: Create, read, update, delete listings
3. **Test Matching**: Create purchase requests and test matching
4. **Test Admin**: Verify admin-only collections are protected
5. **Test Security**: Try accessing data you shouldn't have access to

## 📞 Support

If you encounter issues:
1. Check Firebase Console for error logs
2. Verify your security rules are deployed
3. Test with Firebase Rules Simulator
4. Check the browser console for JavaScript errors

Your P2P marketplace is now ready to go! 🎉
