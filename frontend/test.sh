#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${GREEN}Starting Frontend Test Setup...${NC}"

# 1. Install dependencies
echo -e "${GREEN}Installing dependencies...${NC}"
npm install

# 2. Set up environment variables
echo -e "${GREEN}Setting up environment variables...${NC}"
cat > .env << EOL
VITE_API_URL=http://localhost:8080/api/v1
EOL

# 3. Run the development server
echo -e "${GREEN}Starting development server...${NC}"
npm run dev &

# Store the process ID
FRONTEND_PID=$!

# Wait for the server to start
sleep 5

# 4. Run tests (if you have any)
echo -e "${GREEN}Running tests...${NC}"
npm test

# 5. Check if the application is running
if curl -s http://localhost:5173 > /dev/null; then
  echo -e "${GREEN}Frontend is running successfully!${NC}"
else
  echo -e "${RED}Frontend failed to start${NC}"
  kill $FRONTEND_PID
  exit 1
fi

echo -e "${GREEN}Test completed successfully!${NC}" 