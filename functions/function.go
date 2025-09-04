package functions

import (
	"context"
	"crypto/sha256"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"strconv"
	"strings"
	"time"

	"cloud.google.com/go/firestore"
	"cloud.google.com/go/logging"
	"github.com/GoogleCloudPlatform/functions-framework-go/functions"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
)

var firestoreClient *firestore.Client
var loggingClient *logging.Client
var logger *log.Logger
var projectID = "url-shortener-470717"

type longURL struct {
	URL string `json:"url"`
}

type token struct {
	Value string `json:"value"`
}

func init() {
	var err error

	// create a firebase client
	firestoreClient, err = createFirestoreClient(context.Background())
	if err != nil {
		log.Fatalf("Failed to create Firestore firestoreClient: %v", err)
	}

	// create a logging client
	loggingClient, err = createLoggingClient(context.Background())
	if err != nil {
		log.Fatalf("Failed to create Logging client: %v", err)
	}

	// Initialise a logger
	logger = loggingClient.Logger("url-shortener").StandardLogger(logging.Debug)

	functions.HTTP("UrlShortener", UrlShortener)
}

// createFirestoreClient initializes a Firestore firestoreClient
func createFirestoreClient(ctx context.Context) (*firestore.Client, error) {
	return firestore.NewClient(ctx, projectID)
}

// createLoggingClient initializes a Cloud Logging loggingClient
func createLoggingClient(ctx context.Context) (*logging.Client, error) {
	return logging.NewClient(ctx, projectID)
}

// generateToken generates a token from a long URL
func generateToken(longUrl string) string {
	// Make long url unique by adding a timestamp
	timeNow := strconv.FormatInt(time.Now().Unix(), 10)
	uniqueURL := longUrl + timeNow

	// Hash the unique url
	hasher := sha256.New()
	hasher.Write([]byte(uniqueURL))
	hash := hasher.Sum(nil)

	// Encode the hash to base64 and return the first 7 characters
	encoded := base64.URLEncoding.EncodeToString(hash)

	return encoded[:7]
}

func UrlShortener(w http.ResponseWriter, r *http.Request) {
	// Set CORS headers for the preflight request
	if r.Method == http.MethodOptions {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "POST")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type")
		w.Header().Set("Access-Control-Max-Age", "3600")
		w.WriteHeader(http.StatusNoContent)
		return
	}

	// Set CORS headers for the main request.
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Header().Set("Access-Control-Allow-Methods", "POST, GET")
	w.Header().Set("Access-Control-Allow-Headers", "Content-Type")

	switch r.Method {
	case http.MethodPost:
		handlePostRequest(w, r)
	case http.MethodGet:
		handleGetRequest(w, r)
	default:
		http.Error(w, fmt.Sprintf("Unsupported method: %s", r.Method), http.StatusBadRequest)
	}
}

func handlePostRequest(w http.ResponseWriter, r *http.Request) {
	var longURL longURL

	// Decode the request body into the LongURL struct
	err := json.NewDecoder(r.Body).Decode(&longURL)
	if err != nil {
		logger.Printf("Error decoding request body: %v", err)
		http.Error(w, "Failed to decode request body", http.StatusBadRequest)
		return
	}
	defer r.Body.Close()

	// Generate slug from url
	slug := generateToken(longURL.URL)

	// Makes sure slug does not exist in firestore
	// If it does, create a new one
	// A slugs is a documents id
	docSnap, err := firestoreClient.Collection("shortener").Doc(slug).Get(context.Background())
	if err != nil {
		if status.Code(err) != codes.NotFound {
			// Error while cheking if slug exixts
			logger.Printf("Error checking for slug existance: %v", err)
			http.Error(w, "Failed shortening url", http.StatusInternalServerError)
			return
		}
	}

	for docSnap.Exists() {
		slug = generateToken(longURL.URL)
	}

	// Write into firestore if the generated slug does not exist
	_, err = firestoreClient.Collection("shortener").Doc(slug).Set(context.Background(), map[string]interface{}{
		"url":    longURL.URL,
		"clicks": 0,
	})
	if err != nil {
		logger.Printf("Error saving slug to Firestore: %v", err)
		http.Error(w, "Failed shortening url", http.StatusInternalServerError)
		return
	}

	// Set the Content-Type header
	w.Header().Set("Content-Type", "application/json")

	// Set the HTTP status code
	w.WriteHeader(http.StatusOK)

	// Write the response body
	resBody := token{Value: slug}
	err = json.NewEncoder(w).Encode(resBody)
	if err != nil {
		logger.Printf("Error encoding response: %v", err)
		http.Error(w, "Failed to write response", http.StatusInternalServerError)
	}
}

func handleGetRequest(w http.ResponseWriter, r *http.Request) {
	// Get token value from url path
	token := strings.TrimPrefix(r.URL.Path, "/")

	// Retrieve the corresponding document from Firestore
	docSnap, err := firestoreClient.Collection("shortener").Doc(token).Get(context.Background())
	if err != nil {
		if status.Code(err) == codes.NotFound {
			// Short URL does not exist
			logger.Printf("Document not found in firestore: %v", err)
			http.Error(w, "Short URL not found", http.StatusNotFound)
			return
		} else {
			logger.Printf("Error checking for slug existance: %v", err)
			http.Error(w, "Failed shortening url", http.StatusInternalServerError)
			return
		}
	}

	// Extract the URL from the document data
	data := docSnap.Data()
	url, ok := data["url"].(string)
	if !ok {
		http.Error(w, "Corrupted data", http.StatusInternalServerError)
		return
	}

	// Increment the click count
	document := firestoreClient.Collection("shortener").Doc(token)
	_, err = document.Update(context.Background(), []firestore.Update{
		{Path: "clicks", Value: firestore.Increment(1)},
	})
	if err != nil {
		logger.Printf("Error updating click count: %v", err)
		http.Error(w, "Something unexpected happen. Please try again later!", http.StatusInternalServerError)
	}

	// Redirect the user to the long URL
	http.Redirect(w, r, url, http.StatusFound)
}
