echo "Testing SBOM upload..."
curl -X POST -F "file=@../vulnview-frontend/sample-vulnerable-sbom.json" -F "projectName=test-project" http://localhost:8080/api/v1/sbom/upload -H "Authorization: Bearer $TOKEN"
echo -e "\n"

echo "Testing vulnerability scan with CVSS scores..."
# Start a new scan
SCAN_ID=$(curl -s -X POST http://localhost:8080/api/v1/vulnerabilities/scan -H "Authorization: Bearer $TOKEN" | jq -r '.scanId')
echo "Started scan with ID: $SCAN_ID"

# Wait for scan to complete
echo "Waiting for scan to complete..."
while true; do
    STATUS=$(curl -s http://localhost:8080/api/v1/vulnerabilities/scan/status/$SCAN_ID -H "Authorization: Bearer $TOKEN" | jq -r '.status')
    if [ "$STATUS" = "COMPLETED" ]; then
        break
    fi
    sleep 2
done

# Get scan results and verify CVSS scores
echo "Getting scan results..."
RESULTS=$(curl -s http://localhost:8080/api/v1/vulnerabilities/scan/$SCAN_ID -H "Authorization: Bearer $TOKEN")

# Verify that we have vulnerabilities with CVSS scores
VULN_COUNT=$(echo $RESULTS | jq '.vulnerabilities | length')
if [ "$VULN_COUNT" -gt 0 ]; then
    echo "Found $VULN_COUNT vulnerabilities"
    
    # Check if any vulnerability has a CVSS score
    HAS_CVSS=$(echo $RESULTS | jq '.vulnerabilities[] | select(.cvssScore != null) | .cvssScore' | head -n 1)
    if [ ! -z "$HAS_CVSS" ]; then
        echo "Successfully retrieved CVSS scores"
        echo "Sample vulnerability with CVSS score:"
        echo $RESULTS | jq '.vulnerabilities[] | select(.cvssScore != null) | {cveId: .cveId, cvssScore: .cvssScore, riskLevel: .riskLevel}' | head -n 1
    else
        echo "Error: No CVSS scores found in vulnerabilities"
        exit 1
    fi
else
    echo "Error: No vulnerabilities found"
    exit 1
fi
echo -e "\n"

echo "Testing vulnerability search..." 