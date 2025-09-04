## Serverless URL Shortener
A lightweight, serverless URL shortener built using Golang, Google Cloud Run, and Firebase. 
It allows users to create short URLs that redirect to longer ones, with usage data stored in Cloud Firestore.

Live Demo: https://url-shortener-470717.web.app/

## Features:
- Backend: Google Cloud Run HTTP Function written in Go 
- Database: Cloud Firestore to store short URLs and metadata 
- Frontend: React-based UI for generating and accessing short links 
- Tracking: Click counts are recorded for each short URL

## How Are Short URLs Generated
1. The user inputs a long URL in the frontend, which is first validated using JavaScript's built-in URL validator. 
2. The long URL is combined with a timestamp to ensure uniqueness. 
3. This string is then hashed and encoded using Base64 URL encoding. 
4. The first 7 characters of the encoded string are used as the short URL token. 
5. This token is used as the document ID in Firestore.

**Note**: The same long URL can result in multiple different short URLs due to the added timestamp.

## Data Storage in Firestore
Each short URL is stored as a document in a Firestore collection, with the following structure:

    {
        "clicks": 5
        "created_at": "September 3, 2025 at 12:00:00 PM UTC-4"
        "original_url": "https://example.com/very-long-url"
    }

The document ID is the short URL token itself, which simplifies lookup and redirection.

## Future Improvements
- Add custom aliases (e.g., /my-link)
- Expiration dates for links 
- Analytics dashboard


