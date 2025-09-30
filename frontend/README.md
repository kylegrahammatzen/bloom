# Bloom Frontend

<div align="center">

[![License: AGPL](https://img.shields.io/badge/License-AGPL-red.svg)](../LICENSE)
[![React](https://img.shields.io/badge/React-17-blue.svg)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue.svg)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-blue.svg)](https://tailwindcss.com/)

</div>

React TypeScript frontend for Bloom, an open-source project to show how authentication really works.

## Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start development server:
   ```bash
   npm start
   ```

3. Open http://localhost:3000 to view the application

## Available Scripts

```bash
# Start development server
npm start

# Build for production
npm run build

# Run linting (if configured)
npm run lint
```

## Features

- Interactive tabbed interface with Overview, Authentication, Icebox, and Scenarios
- Clean, responsive design with Tailwind CSS
- Real-time visualization components (planned)
- Educational content presentation
- Safe environment indicators for security demonstrations

## Tech Stack

- React 17 with TypeScript
- Tailwind CSS for styling
- Create React App for build tooling
- Modern ES6+ features

## Project Structure

```
frontend/
├── public/           # Static assets
├── src/
│   ├── App.tsx      # Main application component
│   ├── index.tsx    # Application entry point
│   └── index.css    # Tailwind CSS imports
├── package.json     # Dependencies and scripts
└── tsconfig.json    # TypeScript configuration
```

## Development Notes

- The application uses functional components with React hooks
- All components are typed with TypeScript
- Tailwind CSS provides utility-first styling
- The interface is designed to be educational and user-friendly

## Connecting to Backend

The frontend is configured to communicate with the Express.js backend running on port 5000. API integration will be added as backend endpoints become available.
