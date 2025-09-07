# Overview

This is a Telegram Web App game called "Септик-Серфер" (Septic Surfer), an endless runner game where players control a water droplet navigating through a septic system while avoiding pollution and collecting bonuses. The application is built as a full-stack web application with React frontend, Express backend, and PostgreSQL database using a modern TypeScript stack.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
- **Framework**: React 18 with TypeScript and Vite for build tooling
- **UI Library**: shadcn/ui components built on Radix UI primitives for accessible, customizable components
- **Styling**: Tailwind CSS with CSS variables for theming and Comic Neue font for playful appearance
- **State Management**: React hooks with custom `useGameState` hook for game logic
- **Routing**: Wouter for lightweight client-side routing
- **Data Fetching**: TanStack React Query for server state management

## Backend Architecture
- **Runtime**: Node.js with Express framework
- **Language**: TypeScript with ES modules
- **Development**: Hot reload via Vite middleware in development mode
- **Storage**: In-memory storage implementation with interface for future database integration
- **Session Management**: Express sessions with connect-pg-simple for PostgreSQL session store

## Game Architecture
- **Game Loop**: Canvas-based rendering with requestAnimationFrame
- **Physics**: Simple gravity and collision detection system
- **Game State**: Centralized state management through custom hooks
- **Components**: Modular game components (GameCanvas, GameUI, GameModals)
- **Educational Content**: Integrated educational messages about septic system maintenance

## Data Storage
- **Database**: PostgreSQL configured via Drizzle ORM
- **Schema**: User management system with username/password authentication
- **Migrations**: Drizzle Kit for database schema management
- **Connection**: Neon Database serverless PostgreSQL

## Authentication & Authorization
- **Strategy**: Session-based authentication with PostgreSQL session storage
- **User Model**: Basic username/password system with UUID primary keys
- **Session Storage**: connect-pg-simple for persistent sessions

# External Dependencies

## Database Services
- **Neon Database**: Serverless PostgreSQL hosting via `@neondatabase/serverless`
- **Connection**: Environment variable `DATABASE_URL` for database connection string

## Development Tools
- **Replit Integration**: Vite plugins for Replit development environment
- **Error Handling**: Runtime error overlay for development debugging

## UI Framework
- **Radix UI**: Comprehensive set of accessible UI primitives for all interactive components
- **Class Variance Authority**: Type-safe variant API for component styling
- **Lucide React**: Icon library for consistent iconography

## Telegram Integration
- **Telegram Web App**: Native integration with Telegram's Web App platform
- **Sharing**: Built-in score sharing functionality through Telegram's API

## Game Libraries
- **Embla Carousel**: For any carousel functionality in UI components
- **Date-fns**: Date manipulation and formatting utilities

## Build & Development
- **Vite**: Fast build tool and development server
- **TypeScript**: Type safety across frontend and backend
- **ESBuild**: Fast JavaScript bundling for production builds
- **PostCSS**: CSS processing with Tailwind CSS and Autoprefixer