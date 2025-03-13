#!/bin/bash

# Firebase Deployment Script
echo "Starting Firebase deployment process..."

# Check if Firebase CLI is installed
if ! command -v firebase &> /dev/null; then
    echo "Firebase CLI not found. Installing..."
    npm install -g firebase-tools
fi

# Login to Firebase (if not already logged in)
echo "Checking Firebase login status..."
firebase login --no-localhost

# Initialize Firebase project (if not already initialized)
if [ ! -f "firebase.json" ]; then
    echo "Firebase project not initialized. Initializing..."
    firebase init
else
    echo "Firebase project already initialized."
fi

# Deploy Firestore security rules
echo "Deploying Firestore security rules..."
firebase deploy --only firestore:rules

# Deploy Firestore indexes
echo "Deploying Firestore indexes..."
firebase deploy --only firestore:indexes

# Deploy Firebase Hosting
echo "Deploying to Firebase Hosting..."
firebase deploy --only hosting

echo "Deployment completed successfully!"
echo "Your application is now live in production mode." 