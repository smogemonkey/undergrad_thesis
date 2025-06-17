#!/bin/bash

# Check if SNYK_TOKEN is provided
if [ -z "$SNYK_TOKEN" ]; then
    echo "Error: SNYK_TOKEN environment variable is not set"
    exit 1
fi

# Authenticate with Snyk
snyk auth $SNYK_TOKEN

# Check authentication status
if [ $? -eq 0 ]; then
    echo "Successfully authenticated with Snyk"
    exit 0
else
    echo "Failed to authenticate with Snyk"
    exit 1
fi 