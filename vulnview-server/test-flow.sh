#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'

echo "Starting workflow test..."

# 1. Admin Login
echo -e "\n${GREEN}1. Testing Admin Login${NC}"
ADMIN_TOKEN=$(curl -s -X POST http://localhost:8080/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"admin123"}' | jq -r '.token')

if [ -z "$ADMIN_TOKEN" ]; then
  echo -e "${RED}Admin login failed${NC}"
  exit 1
fi
echo "Admin login successful"

# 2. Add New User
echo -e "\n${GREEN}2. Testing Add New User${NC}"
NEW_USER_RESPONSE=$(curl -s -X POST http://localhost:8080/api/v1/users \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "user123",
    "name": "Test User",
    "role": "USER"
  }')

if [ $? -ne 0 ]; then
  echo -e "${RED}Failed to add new user${NC}"
  exit 1
fi
echo "New user added successfully"

# 3. Create Project
echo -e "\n${GREEN}3. Testing Project Creation${NC}"
PROJECT_RESPONSE=$(curl -s -X POST http://localhost:8080/api/v1/projects \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Project",
    "description": "Test project for workflow verification"
  }')

PROJECT_ID=$(echo $PROJECT_RESPONSE | jq -r '.id')
if [ -z "$PROJECT_ID" ]; then
  echo -e "${RED}Failed to create project${NC}"
  exit 1
fi
echo "Project created successfully"

# 4. Add User to Project
echo -e "\n${GREEN}4. Testing Add User to Project${NC}"
ADD_USER_RESPONSE=$(curl -s -X POST http://localhost:8080/api/v1/projects/$PROJECT_ID/users \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com"
  }')

if [ $? -ne 0 ]; then
  echo -e "${RED}Failed to add user to project${NC}"
  exit 1
fi
echo "User added to project successfully"

# 5. User Login
echo -e "\n${GREEN}5. Testing User Login${NC}"
USER_TOKEN=$(curl -s -X POST http://localhost:8080/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"user123"}' | jq -r '.token')

if [ -z "$USER_TOKEN" ]; then
  echo -e "${RED}User login failed${NC}"
  exit 1
fi
echo "User login successful"

# 6. Upload SBOM
echo -e "\n${GREEN}6. Testing SBOM Upload${NC}"
SBOM_RESPONSE=$(curl -s -X POST -F "file=@test-sbom.json" \
  -F "projectName=Test Project" \
  http://localhost:8080/api/v1/sbom/upload \
  -H "Authorization: Bearer $USER_TOKEN")

if [ $? -ne 0 ]; then
  echo -e "${RED}Failed to upload SBOM${NC}"
  exit 1
fi
echo "SBOM uploaded successfully"

# 7. Start Vulnerability Scan
echo -e "\n${GREEN}7. Testing Vulnerability Scan${NC}"
SCAN_ID=$(curl -s -X POST http://localhost:8080/api/v1/vulnerabilities/scan \
  -H "Authorization: Bearer $USER_TOKEN" | jq -r '.scanId')

if [ -z "$SCAN_ID" ]; then
  echo -e "${RED}Failed to start vulnerability scan${NC}"
  exit 1
fi
echo "Vulnerability scan started"

# Wait for scan to complete
echo "Waiting for scan to complete..."
while true; do
  STATUS=$(curl -s http://localhost:8080/api/v1/vulnerabilities/scan/status/$SCAN_ID \
    -H "Authorization: Bearer $USER_TOKEN" | jq -r '.status')
  if [ "$STATUS" = "COMPLETED" ]; then
    break
  fi
  sleep 2
done
echo "Vulnerability scan completed"

# 8. Get Scan Results
echo -e "\n${GREEN}8. Testing Get Scan Results${NC}"
RESULTS=$(curl -s http://localhost:8080/api/v1/vulnerabilities/scan/$SCAN_ID \
  -H "Authorization: Bearer $USER_TOKEN")

VULN_COUNT=$(echo $RESULTS | jq '.vulnerabilities | length')
if [ "$VULN_COUNT" -gt 0 ]; then
  echo "Found $VULN_COUNT vulnerabilities"
  echo "Sample vulnerability:"
  echo $RESULTS | jq '.vulnerabilities[0]'
else
  echo -e "${RED}No vulnerabilities found${NC}"
  exit 1
fi

echo -e "\n${GREEN}Workflow test completed successfully!${NC}" 