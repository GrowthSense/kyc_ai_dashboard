# Redux Toolkit Integration Guide

This document explains the Redux Toolkit setup for the KYC & AML API integration.

## Project Structure

```
src/redux/
├── api/
│   ├── client.ts          # Axios HTTP client with interceptors
│   ├── kycApi.ts          # KYC endpoints and async thunks
│   └── amlApi.ts          # AML endpoints and async thunks
├── slices/
│   ├── kycSlice.ts        # KYC state management
│   ├── amlSlice.ts        # AML state management
│   └── authSlice.ts       # Authentication state
├── store.ts               # Redux store configuration
└── hooks.ts               # Custom Redux hooks
```

## Setup Instructions

### 1. Install Dependencies

```bash
npm install @reduxjs/toolkit react-redux axios
```

### 2. Environment Configuration

Create a `.env` file in the project root:

```env
VITE_API_BASE_URL=http://localhost:3000/api
```

### 3. Redux Store Provider

The store is already configured in `src/main.tsx` with the Redux Provider wrapping your React app.

## API Endpoints

### KYC Endpoints

- `POST /kyc/cases` - Create a new case
- `GET /kyc/cases` - Fetch all KYC cases
- `GET /kyc/cases/{id}` - Fetch a specific case
- `PATCH /kyc/cases/{id}/status` - Update case status
- `POST /kyc/cases/{id}/evaluate-ai` - Evaluate case with AI
- `GET /kyc/users/{userId}/status` - Get user KYC status
- `POST /kyc/users/{userId}/documents` - Upload user documents
- `POST /kyc/users/{userId}/documents/replace` - Replace user documents
- `PATCH /kyc/users/{userId}/resubmit` - Resubmit user KYC

### AML Endpoints

- `POST /aml/screen` - Screen user for AML
- `GET /aml/screens` - Get all AML screens

## Usage Examples

### Using Redux Hooks in Components

```typescript
import { useAppDispatch, useKYCCases, useKYCLoading } from '@/redux/hooks';
import { fetchKYCCases, createKYCCase } from '@/redux/api/kycApi';

function MyComponent() {
  const dispatch = useAppDispatch();
  const cases = useKYCCases();
  const loading = useKYCLoading();

  // Fetch cases on mount
  useEffect(() => {
    dispatch(fetchKYCCases());
  }, [dispatch]);

  // Create a new case
  const handleCreateCase = (caseData) => {
    dispatch(createKYCCase(caseData));
  };

  return (
    <div>
      {loading && <p>Loading...</p>}
      {cases.map(c => <div key={c.id}>{c.id}</div>)}
    </div>
  );
}
```

### Using Redux Actions

#### KYC Actions

```typescript
import { 
  createKYCCase,
  fetchKYCCases,
  fetchKYCCaseById,
  updateCaseStatus,
  evaluateCaseWithAI,
  fetchUserKYCStatus,
  uploadUserDocuments,
  replaceUserDocuments,
  resubmitUserKYC
} from '@/redux/api/kycApi';

// Create a case
dispatch(createKYCCase({
  userId: 'user123',
  // ... other case data
}));

// Update case status
dispatch(updateCaseStatus({
  caseId: 'case123',
  status: 'approved'
}));

// Evaluate with AI
dispatch(evaluateCaseWithAI({
  caseId: 'case123',
  notes: 'Verified'
}));

// Upload documents
dispatch(uploadUserDocuments({
  userId: 'user123',
  documentType: 'passport',
  file: fileObject
}));
```

#### AML Actions

```typescript
import { 
  screenUserForAML,
  fetchAMLScreens
} from '@/redux/api/amlApi';

// Screen user
dispatch(screenUserForAML({
  userId: 'user123',
  firstName: 'John',
  lastName: 'Doe',
  dateOfBirth: '1990-01-01',
  country: 'US'
}));

// Fetch screens
dispatch(fetchAMLScreens());
```

### Available Hooks

#### KYC Hooks
- `useKYCCases()` - Get all KYC cases
- `useCurrentKYCCase()` - Get currently viewed case
- `useUserKYCStatus()` - Get user KYC status
- `useKYCLoading()` - Get loading state
- `useKYCError()` - Get error state
- `useKYCSuccess()` - Get success state

#### AML Hooks
- `useAMLScreens()` - Get all AML screens
- `useCurrentAMLScreen()` - Get current AML screen
- `useAMLLoading()` - Get loading state
- `useAMLError()` - Get error state
- `useAMLSuccess()` - Get success state

#### Auth Hooks
- `useAuthToken()` - Get auth token
- `useAuthUser()` - Get current user
- `useAuthLoading()` - Get loading state
- `useIsAuthenticated()` - Check if authenticated

## HTTP Client Features

The Axios HTTP client includes:

1. **Base URL Configuration**: Automatically adds the base URL from environment variables
2. **Authorization Headers**: Automatically includes Bearer token from localStorage
3. **Error Handling**: Redirects to login on 401 errors
4. **Request/Response Interceptors**: Ready to customize for your needs

## State Management

Each slice (KYC, AML, Auth) manages its own state with:

- `loading`: Boolean indicating async operation in progress
- `error`: Error message if operation failed
- `success`: Boolean indicating successful operation

### Clearing States

```typescript
import { useAppDispatch } from '@/redux/hooks';
import { clearError, clearSuccess } from '@/redux/slices/kycSlice';

function MyComponent() {
  const dispatch = useAppDispatch();

  const handleClearError = () => {
    dispatch(clearError());
  };

  const handleClearSuccess = () => {
    dispatch(clearSuccess());
  };

  return (
    // Component JSX
  );
}
```

## Backend Integration

Update your backend API base URL in `.env`:

```env
# Development
VITE_API_BASE_URL=http://localhost:3000/api

# Production
VITE_API_BASE_URL=https://api.yourdomain.com/api
```

The HTTP client will automatically use this URL for all API requests.

## Type Safety

All API responses are fully typed:

- `KYCCase` - Case response type
- `UserKYCStatus` - User status response type
- `AMLScreen` - AML screen response type
- `AMLMatch` - AML match details

## Error Handling

Errors are automatically captured and stored in the Redux state. Components can display them:

```typescript
const error = useKYCError();

if (error) {
  return <ErrorAlert message={error} />;
}
```

## Best Practices

1. **Always dispatch actions from components**: Use `useAppDispatch()` to dispatch async thunks
2. **Check loading states**: Disable buttons and show spinners while loading
3. **Clear errors**: Clear error messages after displaying them
4. **Use TypeScript**: Leverage full type safety with Redux Toolkit
5. **Organize selectors**: Use the provided hooks instead of creating new selectors
