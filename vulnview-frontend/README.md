# VulnView Frontend

A modern web interface for vulnerability management and analysis.

## Features

- Project membership management with role-based access control
- Vulnerability trend analysis and visualization
- AI-powered vulnerability analysis
- Real-time notifications
- Interactive dashboards

## Prerequisites

- Node.js 18.x or later
- npm 9.x or later

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd vulnview-frontend
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env.local` file in the root directory with the following variables:
```env
NEXT_PUBLIC_API_URL=http://localhost:8080
```

## Development

Run the development server:
```bash
npm run dev
```

The application will be available at `http://localhost:3000`.

## Testing

1. Start the backend server (vulnview-server)
2. Start the frontend development server:
```bash
npm run dev
```

3. Navigate to `http://localhost:3000/projects/[project-id]/settings` to test:
   - Project membership management
   - Vulnerability trends
   - AI analysis
   - Notification settings

## API Endpoints

The frontend expects the following API endpoints to be available:

- `GET /api/projects/:id/members` - Get project members
- `POST /api/projects/:id/members` - Add project member
- `PATCH /api/projects/:id/members/:memberId` - Update member role
- `DELETE /api/projects/:id/members/:memberId` - Remove member
- `GET /api/projects/:id/vulnerability-trends` - Get vulnerability trends
- `GET /api/projects/:id/vulnerability-distribution` - Get severity distribution
- `POST /api/projects/:id/ai-analyze` - Get AI analysis

## Building for Production

```bash
npm run build
npm start
```

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request 