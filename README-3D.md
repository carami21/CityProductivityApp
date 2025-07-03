# CityProductivityApp - 3D City Builder Focus Timer

A gamified productivity app that combines the Pomodoro Technique with 3D city building. Inspired by Forest App, this application lets you build a virtual city by completing focus sessions.

## 🌟 New 3D Features

### 3D City View
- **Toggle between 2D and 3D views** using the view toggle button
- **Auto-rotating camera** for a dynamic perspective (can be disabled)
- **Building growth animations** - Buildings grow like trees in Forest App when placed
- **Interactive 3D grid** - Click directly on the 3D grid to place buildings
- **Real-time 3D rendering** using Three.js

### Building Types & 3D Models
- **Houses**: Green residential buildings (boxes)
- **Shops**: Orange commercial buildings (medium boxes)  
- **Offices**: Blue tall buildings (tall boxes)
- **Parks**: Green cylindrical trees
- **Landmarks**: Purple cone monuments

### Forest App Inspired Features
- **Growth Animation**: Buildings "grow" from small to full size with a bouncy animation
- **Progressive Unlocks**: Buildings unlock as you complete more sessions
- **Visual Satisfaction**: Watch your city expand as you stay productive

## 🎮 How to Use 3D Mode

1. **Start a focus session** and complete it to earn bricks
2. **Click the 2D/3D toggle button** to switch to 3D view
3. **Select a building** from the building palette
4. **Click on empty grid spaces** in the 3D view to place buildings
5. **Watch buildings grow** with satisfying animations
6. **Use the rotate button** to enable/disable auto-rotation

## 🛠️ Technical Implementation

### Tech Stack
- **Frontend**: React + TypeScript + Three.js
- **3D Rendering**: Three.js with WebGL
- **Animation**: Custom easing functions for growth effects
- **Interaction**: Raycasting for 3D click detection

### Key Components
- `useThreeScene.ts` - Hook for managing Three.js scene setup
- `city-grid-3d-v2.tsx` - 3D city component with building placement
- **Raycasting** - Detects clicks on invisible grid tiles
- **Growth animations** - Bouncy easing for building appearance

### Building Geometries
```typescript
house: BoxGeometry(0.8, 1.2, 0.8)
shop: BoxGeometry(0.9, 1.0, 0.9)  
office: BoxGeometry(0.7, 2.0, 0.7)
park: CylinderGeometry(0.4, 0.4, 1.5, 8)
landmark: ConeGeometry(0.5, 2.5, 6)
```

## 🚀 Getting Started

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Open http://localhost:5000
```

## 🎯 Productivity Features

- **Pomodoro Timer**: 25min focus, 5min break, 50min deep work sessions
- **Brick Economy**: Earn bricks by completing sessions (1 brick per 3 minutes)
- **Building Unlocks**: Progress through building types as you complete more sessions
- **Daily Tracking**: Track sessions, focus time, and building progress
- **Streak System**: Maintain daily focus streaks

## 🌳 Forest App Inspiration

Like Forest App's growing trees, buildings in your city:
- Start as tiny objects and grow to full size
- Use satisfying bounce animations
- Provide visual feedback for completed work
- Create a sense of accomplishment and progress
- Encourage consistent daily productivity

The 3D view adds an extra dimension of satisfaction, letting you walk around your growing productivity city!
