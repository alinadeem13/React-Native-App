# LoveVerse - React Native Full Stack Ready

A multi-screen romantic app (iOS-ready with Expo) with interactive features, local persistence, and Firebase-ready services.

## Features
- Home: relationship timer + animated pulse + reason generator
- Notes: create/save romantic notes
- Memories: animated memory gallery
- Planner: date ideas + custom plan creation
- Challenges: playful couple challenges with points
- Profile: personalize names/anniversary
- Firebase-ready service layer (`src/firebase/services.js`)

## Run
1. `npm install`
2. `npm run ios`

## Firebase Connection
1. Copy `src/firebase/firebaseConfig.example.js` to `src/firebase/firebaseConfig.js`
2. Add your Firebase keys
3. Use services from `src/firebase/services.js`

## Repo Structure
- `src/App.js`
- `src/navigation/RootNavigator.js`
- `src/screens/*`
- `src/context/AppContext.js`
- `src/firebase/*`
- `src/components/*`
