# VulnView - Software Bill of Materials (SBOM) Analysis Platform

VulnView is a comprehensive platform designed to analyze and manage Software Bill of Materials (SBOM) for software projects. It helps identify vulnerabilities, track dependencies, and maintain software security through continuous monitoring and analysis.

## Project Structure

The project consists of two main components:

### Frontend (`vulnview-frontend/`)
- Next.js-based web application
- Modern UI with interactive visualizations
- Real-time vulnerability analysis dashboard
- Component comparison features
- Built with TypeScript and Tailwind CSS

### Backend (`vulnview-server/`)
- Spring Boot Java application
- RESTful API endpoints
- SBOM processing and analysis
- GitHub integration
- Vulnerability detection and tracking

## Key Features

- SBOM Upload and Analysis
- Dependency Tracking
- Vulnerability Detection
- Component Comparison
- Interactive Dependency Graph
- GitHub Integration
- Real-time Updates
- Customizable Dashboard
- Export and Reporting

## Getting Started

### Prerequisites
- Node.js 18+ (Frontend)
- Java 17+ (Backend)
- Maven
- Git

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/undergrad_thesis.git
cd undergrad_thesis
```

2. Frontend Setup:
```bash
cd vulnview-frontend
npm install
npm run dev
```

3. Backend Setup:
```bash
cd vulnview-server
mvn clean install
mvn spring-boot:run
```

## Development

- Frontend runs on `http://localhost:3000`
- Backend API runs on `http://localhost:8080`

## License

This project is part of an undergraduate thesis and is protected under applicable academic guidelines.