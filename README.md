# Tododos - Modern Todo List Manager

A modern, responsive todo list application built with React 19, TypeScript, and Firebase Firestore. Features real-time synchronization, mobile-optimized UI, and smooth user interactions.

## ✨ Features

### 🗂️ **Multiple Lists Management**
- Create and manage multiple todo lists (e.g., Grocery Lists, Work Tasks, etc.)
- Real-time synchronization across all devices and browser tabs
- Confirmation dialogs for safe list deletion

### ✅ **Todo Items**
- Add, edit, and delete individual todo items
- Mark items as completed with visual feedback
- Inline editing with keyboard shortcuts (Enter to save, Escape to cancel)

### 🔄 **Real-time Sync**
- Powered by Firebase Firestore for instant synchronization
- Changes appear immediately on all connected devices
- Smooth updates using React 19's `useTransition` for optimal mobile performance

### 📱 **Mobile-First Design**
- Responsive design that works perfectly on all screen sizes
- Mobile-optimized touch interactions
- Prevents iOS Safari zoom on input focus (16px font size on mobile)

### 🎨 **Modern UI/UX**
- Glass-morphism design with backdrop blur effects
- Smooth animations and transitions
- Discrete toast notifications for user feedback
- Loading states and error handling

### ⚡ **Performance**
- Built with Vite for lightning-fast development and builds
- React 19 with React Compiler for optimized performance
- Efficient Firebase real-time subscriptions

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and Yarn
- Firebase project with Firestore enabled

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/kristkam/tododos.git
   cd tododos
   ```

2. **Install dependencies**
   ```bash
   yarn install
   ```

3. **Set up Firebase**
   ```bash
   cp .env.example .env.local
   ```
   
   Update `.env.local` with your Firebase configuration values.

4. **Start development server**
   ```bash
   yarn dev
   ```

5. **Open in browser**
   Navigate to `http://localhost:5173`

## 🛠️ Tech Stack

### Frontend
- **React 19** - Latest React with concurrent features
- **TypeScript** - Type-safe development
- **Vite** - Fast build tool and dev server
- **CSS3** - Modern CSS with animations and responsive design

### Backend & Database
- **Firebase Firestore** - Real-time NoSQL database
- **Firebase SDK v12** - Latest Firebase JavaScript SDK

### Development Tools
- **ESLint** - Code linting with React and TypeScript rules
- **React Compiler** - Automatic optimization compilation
- **React DevTools** - Enhanced debugging support

## 📁 Project Structure

```
src/
├── components/          # React components
│   ├── AppContent.tsx   # Main app logic with useOptimistic for lists
│   ├── ListSelector.tsx # List selection and creation
│   ├── TodoList.tsx     # Individual list view with useTransition
│   ├── TodoItem.tsx     # Todo item component
│   ├── ConfirmModal.tsx # Deletion confirmation modal
│   └── Toast.tsx        # Toast notification system
├── hooks/               # Custom React hooks
│   ├── useTodoLists.ts  # Firebase data management
│   └── useToast.ts      # Toast notifications
├── firebase/            # Firebase configuration and services
│   ├── config.ts        # Firebase app initialization
│   ├── todoService.ts   # Firestore operations
│   └── storageAdapter.ts # Data storage abstraction
├── contexts/            # React context providers
│   ├── toast.ts         # Toast context definition
│   └── ToastContext.tsx # Toast provider component
├── types.ts             # TypeScript type definitions
├── storage.ts           # localStorage utilities (UI state)
├── App.tsx              # Root app component
├── App.css              # Global styles and animations
└── main.tsx             # App entry point
```

## 🎯 Key Implementation Details

### Real-time Data Sync
- Uses Firestore's `onSnapshot` for real-time subscriptions
- Automatically handles connection states and offline scenarios
- Strategic use of `useOptimistic` for list creation and `useTransition` for item operations

### Mobile Optimization
- 16px font size on mobile inputs to prevent iOS Safari zoom
- Touch-optimized button sizes and spacing
- Responsive breakpoints for different screen sizes
- Optimized update patterns to prevent mobile flickering

### Error Handling
- Comprehensive error handling with user-friendly messages
- Network-aware error recovery
- Toast notifications for all user actions

### Performance Features
- React 19's concurrent features for smooth interactions
- `useTransition` for non-urgent updates to prevent UI blocking
- Efficient re-renders with proper dependency arrays
- Optimized Firestore queries with proper indexing

##  Acknowledgments

- Built with [Vite](https://vitejs.dev/) for amazing developer experience
- Powered by [Firebase](https://firebase.google.com/) for real-time capabilities
- Inspired by modern todo applications and productivity tools
