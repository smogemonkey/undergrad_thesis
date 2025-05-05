#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${GREEN}Starting End-to-End Test...${NC}"

# 1. Check if PostgreSQL is running
if ! pg_isready -U postgres > /dev/null 2>&1; then
  echo -e "${RED}PostgreSQL is not running. Please start PostgreSQL first.${NC}"
  exit 1
fi

# 2. Run backend tests
echo -e "${GREEN}Running backend tests...${NC}"
cd api-server
chmod +x test.sh
./test.sh
BACKEND_RESULT=$?

if [ $BACKEND_RESULT -ne 0 ]; then
  echo -e "${RED}Backend tests failed${NC}"
  exit 1
fi

# 3. Run frontend tests
echo -e "${GREEN}Running frontend tests...${NC}"
cd ../frontend
chmod +x test.sh
./test.sh
FRONTEND_RESULT=$?

if [ $FRONTEND_RESULT -ne 0 ]; then
  echo -e "${RED}Frontend tests failed${NC}"
  exit 1
fi

echo -e "${GREEN}All tests completed successfully!${NC}" 