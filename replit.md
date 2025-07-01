# CityBuilder Focus - Replit Project Guide

## Overview

CityBuilder Focus is a gamified productivity timer application that allows users to build a virtual city as they complete focus sessions. The app combines the Pomodoro technique with city-building gameplay mechanics, where completing timer sessions earns "bricks" that can be used to construct buildings and grow a personal virtual city.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite for fast development and optimized builds
- **UI Library**: Shadcn/ui components built on Radix UI primitives
- **Styling**: Tailwind CSS with custom theme variables and design tokens
- **State Management**: React Context API for global app state, React Query for server state
- **Routing**: Wouter for lightweight client-side routing

### Backend Architecture
- **Runtime**: Node.js with Express.js server
- **Language**: TypeScript with ES modules
- **Database ORM**: Drizzle ORM with PostgreSQL dialect
- **Session Storage**: Connect-pg-simple for PostgreSQL session storage
- **API Design**: RESTful API with JSON responses

### Data Storage Solutions
- **Primary Database**: PostgreSQL (configured via Neon Database serverless)
- **ORM**: Drizzle ORM for type-safe database operations
- **Schema Management**: Drizzle Kit for migrations and schema management
- **Development Storage**: In-memory storage fallback for development/demo mode

## Key Components

### Timer System
- Multiple session types: Focus (25min), Break (5min), Deep (50min), Long (15min)
- Real-time countdown with start/pause/stop functionality
- Automatic brick calculation based on session duration (1 brick per 3 minutes)
- Achievement notifications for completed sessions

### City Building System
- 8x8 grid-based city layout stored as JSON in database
- Five building types with progressive unlock requirements:
  - House (0 sessions required)
  - Park (3 sessions)
  - Shop (5 sessions)
  - Office (10 sessions)
  - Landmark (20 sessions)
- Resource management system (bricks and coins)
- Visual building placement with drag-and-drop interface

### User Progress Tracking
- Session history with completion timestamps
- Statistics tracking: total sessions, focus time, streaks
- Achievement system with visual feedback
- Daily streak calculations with persistence

### UI/UX Components
- Responsive design with mobile-first approach
- Glass-morphism design with backdrop blur effects
- Icon-based UI using Font Awesome
- Toast notifications for user feedback
- Loading states and error handling

## Data Flow

1. **Session Completion Flow**:
   - User starts timer → Timer runs in context state → Session completes → API call to save session → Update user stats → Refresh city resources → Show achievement

2. **City Building Flow**:
   - User selects building → Check unlock requirements → Check resource availability → Place on grid → Update city state → Sync to database

3. **Data Synchronization**:
   - React Query manages server state caching and synchronization
   - Optimistic updates for better UX
   - Background refetching to keep data fresh

## External Dependencies

### Core Dependencies
- **@neondatabase/serverless**: PostgreSQL database connection
- **drizzle-orm**: Type-safe database ORM
- **@tanstack/react-query**: Server state management
- **@radix-ui/***: Accessible UI primitives
- **wouter**: Lightweight routing
- **date-fns**: Date manipulation utilities

### Development Dependencies
- **vite**: Build tool and dev server
- **typescript**: Type checking
- **tailwindcss**: Utility-first CSS framework
- **@replit/vite-plugin-***: Replit-specific development tools

### UI Component Library
- Complete Shadcn/ui component library with Radix UI primitives
- Custom theme with CSS variables for consistent styling
- Responsive design utilities and animations

## Deployment Strategy

### Build Process
1. **Frontend**: Vite builds optimized React bundle to `dist/public`
2. **Backend**: ESBuild compiles TypeScript server to `dist/index.js`
3. **Database**: Drizzle Kit handles schema migrations

### Environment Configuration
- **Development**: Uses Vite dev server with Express middleware
- **Production**: Serves static files from Express with API routes
- **Database**: Requires `DATABASE_URL` environment variable for PostgreSQL connection

### Scripts
- `npm run dev`: Start development server with hot reload
- `npm run build`: Build for production
- `npm run start`: Start production server
- `npm run db:push`: Push database schema changes

## Changelog
```
Changelog:
- July 01, 2025. Initial setup
```

## User Preferences
```
Preferred communication style: Simple, everyday language.
```