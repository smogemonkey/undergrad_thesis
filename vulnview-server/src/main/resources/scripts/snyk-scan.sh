#!/bin/bash

# Enable debug output
set -x

# Check if project path is provided
if [ -z "$1" ]; then
    echo "Error: Project path not provided" >&2
    exit 1
fi

PROJECT_PATH="$1"

# Check if project path exists
if [ ! -d "$PROJECT_PATH" ]; then
    echo "Error: Project path does not exist: $PROJECT_PATH" >&2
    exit 1
fi

# Check if Snyk is installed
if ! command -v snyk &> /dev/null; then
    echo "Error: Snyk CLI is not installed" >&2
    exit 1
fi

# Check if SNYK_TOKEN is set
if [ -z "$SNYK_TOKEN" ]; then
    echo "Error: SNYK_TOKEN environment variable is not set" >&2
    exit 1
fi

echo "Starting Snyk scan for project: $PROJECT_PATH" >&2

# Run Snyk test with JSON output
cd "$PROJECT_PATH" && snyk test --json

# Check if scan was successful
SCAN_EXIT_CODE=$?
if [ $SCAN_EXIT_CODE -eq 0 ] || [ $SCAN_EXIT_CODE -eq 1 ]; then
    # Exit code 1 means vulnerabilities were found, which is still a successful scan
    echo "Scan completed successfully" >&2
    exit 0
else
    echo "Error: Snyk scan failed with exit code $SCAN_EXIT_CODE" >&2
    exit $SCAN_EXIT_CODE
fi 