# Firebase Setup for Shop-GJ

This document explains how to set up Firebase authentication for the Shop-GJ application.

## Step 1: Create a Firebase Project

1. Go to the [Firebase Console](https://console.firebase.google.com/)
2. Click on "Add project"
3. Name your project (e.g., "Shop-GJ")
4. Follow the setup steps (you can disable Google Analytics if you don't need it)
5. Click "Create project"

## Step 2: Register Your Web App

1. From the project overview page, click on the web icon (</>) to add a web app
2. Register your app with a nickname (e.g., "shop-gj-web")
3. Check the "Also set up Firebase Hosting" option if you plan to deploy with Firebase
4. Click "Register app"

## Step 3: Copy Firebase Configuration

After registering your app, you'll be shown your Firebase configuration. Copy the config object:

```javascript
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_STORAGE_BUCKET",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};
```

## Step 4: Update Configuration in the App

1. Open the file `lib/firebase.ts` in your project
2. Replace the placeholder configuration with your copied Firebase config:

```javascript
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_STORAGE_BUCKET",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};
```

## Step 5: Enable Google Authentication

1. In the Firebase Console, go to "Authentication" from the left sidebar
2. Click on the "Sign-in method" tab
3. Click on "Google" in the list of providers
4. Enable Google authentication and select a project support email
5. Click "Save"

## Step 6: Set Up Authorized Domains

1. Still in the Authentication section, go to the "Settings" tab
2. Scroll down to "Authorized domains"
3. Add your domain(s) where the app will be hosted
4. For local development, `localhost` should already be added

## Step 7: Test the Integration

1. Run your app locally: `npm run dev`
2. Navigate to the Shopkeeper login page
3. Click "Continue with Google"
4. Complete the Google authentication flow
5. You should be redirected to the shopkeeper dashboard after successful login

## Troubleshooting

If you encounter issues:

1. Check browser console for errors
2. Verify that your Firebase configuration is correct
3. Ensure Google authentication is properly enabled in Firebase
4. Make sure your app is being served from an authorized domain

## Additional Resources

- [Firebase Authentication Documentation](https://firebase.google.com/docs/auth)
- [Google Sign-In Integration Guide](https://firebase.google.com/docs/auth/web/google-signin) 