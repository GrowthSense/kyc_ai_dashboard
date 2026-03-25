# Redux API Endpoints Reference

Complete reference for all KYC & AML API endpoints and their Redux integration.

## KYC Endpoints

### 1. Create KYC Case
**Endpoint:** `POST /kyc/cases`
**Redux Action:** `createKYCCase`

```typescript
// Usage
dispatch(createKYCCase({
  userId: 'user123',
  userName: 'John Doe',
  userEmail: 'john@example.com',
  // ... other case data
}) as any);

// Redux State
{
  kyc: {
    cases: [..., newCase],
    currentCase: newCase,
    loading: false,
    success: true
  }
}
```

**Hook:** `useKYCSuccess()`

---

### 2. Get All KYC Cases
**Endpoint:** `GET /kyc/cases`
**Redux Action:** `fetchKYCCases`

```typescript
// Usage
useEffect(() => {
  dispatch(fetchKYCCases() as any);
}, [dispatch]);

// In component
const cases = useKYCCases();
const loading = useKYCLoading();

// Redux State
{
  kyc: {
    cases: [{ id: '1', ...}, { id: '2', ...}],
    loading: false
  }
}
```

**Hooks:**
- `useKYCCases()` - Get all cases
- `useKYCLoading()` - Get loading state
- `useKYCError()` - Get error state

---

### 3. Get Case by ID
**Endpoint:** `GET /kyc/cases/{id}`
**Redux Action:** `fetchKYCCaseById`

```typescript
// Usage
dispatch(fetchKYCCaseById(caseId) as any);

// In component
const currentCase = useCurrentKYCCase();

// Redux State
{
  kyc: {
    currentCase: {
      id: 'case123',
      status: 'pending',
      // ... case details
    }
  }
}
```

**Hook:** `useCurrentKYCCase()`

---

### 4. Update Case Status
**Endpoint:** `PATCH /kyc/cases/{id}/status`
**Redux Action:** `updateCaseStatus`

```typescript
// Usage
dispatch(updateCaseStatus({
  caseId: 'case123',
  status: 'approved' // 'pending', 'approved', 'rejected', 'under_review'
}) as any);

// In component
const handleStatusUpdate = (newStatus) => {
  dispatch(updateCaseStatus({
    caseId: currentCase.id,
    status: newStatus
  }) as any);
};

// Redux State
{
  kyc: {
    currentCase: {
      ...case,
      status: 'approved'
    },
    cases: [...updated cases array]
  }
}
```

---

### 5. Evaluate Case with AI
**Endpoint:** `POST /kyc/cases/{id}/evaluate-ai`
**Redux Action:** `evaluateCaseWithAI`

```typescript
// Usage
dispatch(evaluateCaseWithAI({
  caseId: 'case123',
  notes: 'Manual review completed'
}) as any);

// In component
const handleAIEvaluation = () => {
  dispatch(evaluateCaseWithAI({
    caseId: currentCase.id,
    notes: 'Ready for AI evaluation'
  }) as any);
};

// Redux State
{
  kyc: {
    success: true,
    loading: false
  }
}
```

**Hook:** `useKYCSuccess()`

---

### 6. Get User KYC Status
**Endpoint:** `GET /kyc/users/{userId}/status`
**Redux Action:** `fetchUserKYCStatus`

```typescript
// Usage
dispatch(fetchUserKYCStatus(userId) as any);

// In component
const userStatus = useUserKYCStatus();
// Returns: { userId, status: 'incomplete|submitted|verified|rejected' }

// Redux State
{
  kyc: {
    userStatus: {
      userId: 'user123',
      status: 'submitted',
      completedAt: '2024-01-21T...'
    }
  }
}
```

**Hook:** `useUserKYCStatus()`

---

### 7. Upload User Documents
**Endpoint:** `POST /kyc/users/{userId}/documents`
**Redux Action:** `uploadUserDocuments`

```typescript
// Usage
const fileInput = document.getElementById('fileInput') as HTMLInputElement;
const file = fileInput.files?.[0];

if (file) {
  dispatch(uploadUserDocuments({
    userId: 'user123',
    documentType: 'passport', // 'passport', 'id_card', 'proof_of_address', etc.
    file: file
  }) as any);
}

// In component
const handleDocumentUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
  const file = event.target.files?.[0];
  if (file) {
    dispatch(uploadUserDocuments({
      userId: userId,
      documentType: 'passport',
      file
    }) as any);
  }
};

// Redux State
{
  kyc: {
    loading: true -> false,
    success: true,
    error: null
  }
}
```

---

### 8. Replace User Documents
**Endpoint:** `POST /kyc/users/{userId}/documents/replace`
**Redux Action:** `replaceUserDocuments`

```typescript
// Usage
dispatch(replaceUserDocuments({
  userId: 'user123',
  documentId: 'doc456',
  file: newFile
}) as any);

// In component
const handleReplaceDocument = (documentId, newFile) => {
  dispatch(replaceUserDocuments({
    userId,
    documentId,
    file: newFile
  }) as any);
};

// Redux State
{
  kyc: {
    success: true,
    loading: false
  }
}
```

---

### 9. Resubmit User KYC
**Endpoint:** `PATCH /kyc/users/{userId}/resubmit`
**Redux Action:** `resubmitUserKYC`

```typescript
// Usage
dispatch(resubmitUserKYC({
  userId: 'user123',
  reason: 'Document update'
}) as any);

// In component
const handleResubmit = (reason) => {
  dispatch(resubmitUserKYC({
    userId: currentUser.id,
    reason
  }) as any);
};

// Redux State
{
  kyc: {
    success: true,
    userStatus: {
      status: 'submitted'
    }
  }
}
```

---

## AML Endpoints

### 1. Screen User for AML
**Endpoint:** `POST /aml/screen`
**Redux Action:** `screenUserForAML`

```typescript
// Usage
dispatch(screenUserForAML({
  userId: 'user123',
  firstName: 'John',
  lastName: 'Doe',
  dateOfBirth: '1990-01-01',
  country: 'US',
  documentNumber: 'passport123'
}) as any);

// In component
const handleScreenUser = () => {
  dispatch(screenUserForAML({
    userId: user.id,
    firstName: user.firstName,
    lastName: user.lastName,
    dateOfBirth: user.dob,
    country: user.country
  }) as any);
};

// Redux State
{
  aml: {
    currentScreen: {
      id: 'screen123',
      userId: 'user123',
      status: 'completed',
      riskLevel: 'low|medium|high',
      matches: [...]
    },
    screens: [..., newScreen],
    loading: false,
    success: true
  }
}
```

**Hooks:**
- `useCurrentAMLScreen()`
- `useAMLSuccess()`
- `useAMLLoading()`

---

### 2. Get All AML Screens
**Endpoint:** `GET /aml/screens`
**Redux Action:** `fetchAMLScreens`

```typescript
// Usage
dispatch(fetchAMLScreens({
  limit: 10,
  offset: 0
}) as any);

// In component
useEffect(() => {
  dispatch(fetchAMLScreens({}) as any);
}, [dispatch]);

const screens = useAMLScreens();
const loading = useAMLLoading();

// Redux State
{
  aml: {
    screens: [
      {
        id: 'screen1',
        userId: 'user1',
        status: 'completed',
        riskLevel: 'high',
        matches: [...]
      },
      // ...
    ],
    loading: false
  }
}
```

**Hooks:**
- `useAMLScreens()` - Get all screens
- `useAMLLoading()` - Get loading state
- `useAMLError()` - Get error state

---

## Complete Hook Reference

### KYC Hooks
```typescript
useKYCCases()         // KYCCase[]
useCurrentKYCCase()   // KYCCase | null
useUserKYCStatus()    // UserKYCStatus | null
useKYCLoading()       // boolean
useKYCError()         // string | null
useKYCSuccess()       // boolean
```

### AML Hooks
```typescript
useAMLScreens()       // AMLScreen[]
useCurrentAMLScreen() // AMLScreen | null
useAMLLoading()       // boolean
useAMLError()         // string | null
useAMLSuccess()       // boolean
```

### Auth Hooks
```typescript
useAuthToken()        // string | null
useAuthUser()         // any | null
useAuthLoading()      // boolean
useAuthError()        // string | null
useIsAuthenticated()  // boolean
```

### Generic Hooks
```typescript
useAppDispatch()      // AppDispatch
useAppSelector(fn)    // T
```

---

## Error Handling

All endpoints include error handling:

```typescript
// Try-catch with Redux
try {
  await dispatch(fetchKYCCases() as any);
} catch (error) {
  // Error is automatically in Redux state
  const error = useKYCError();
}

// Or check error state
const error = useKYCError();
if (error) {
  return <ErrorAlert message={error} />;
}
```

---

## Loading States

All endpoints provide loading states:

```typescript
const loading = useKYCLoading();

return (
  <>
    {loading && <Spinner />}
    {cases.map(c => <CaseCard key={c.id} case={c} />)}
  </>
);
```

---

## Success States

Actions that modify data provide success states:

```typescript
const success = useKYCSuccess();

useEffect(() => {
  if (success) {
    toast.success('Operation successful');
    dispatch(clearSuccess()); // Clear success state
  }
}, [success]);
```

---

## File Upload Support

Document upload endpoints support:
- Multiple file types (passport, ID card, proof of address, etc.)
- Automatic FormData handling
- Progress tracking (via axios interceptors)

```typescript
// File upload
const file = event.target.files?.[0];
dispatch(uploadUserDocuments({
  userId: 'user123',
  documentType: 'passport',
  file
}) as any);

// Check upload status
const loading = useKYCLoading();
if (loading) return <UploadProgress />;
```

---

## Pagination Support

AML screens endpoint supports pagination:

```typescript
// Fetch with pagination
dispatch(fetchAMLScreens({
  limit: 20,
  offset: 40  // Skip first 40 records
}) as any);
```

---

## Type Safety

All endpoints are fully typed with TypeScript:

```typescript
import {
  KYCCase,
  UserKYCStatus,
  AMLScreen,
  AMLMatch,
  AMLScreeningPayload
} from '@/redux/api/kycApi';

const handleCreate = (payload: KYCCase) => {
  dispatch(createKYCCase(payload) as any);
};
```

---

## Best Practices

1. **Always dispatch with `as any`** for async thunks:
   ```typescript
   dispatch(fetchKYCCases() as any);
   ```

2. **Use hooks instead of selectors**:
   ```typescript
   const cases = useKYCCases(); // ✅ Good
   const cases = useAppSelector(state => state.kyc.cases); // ❌ Avoid
   ```

3. **Clear error/success states after display**:
   ```typescript
   useEffect(() => {
     if (error) {
       showError(error);
       dispatch(clearError());
     }
   }, [error]);
   ```

4. **Use useEffect to fetch on mount**:
   ```typescript
   useEffect(() => {
     dispatch(fetchKYCCases() as any);
   }, [dispatch]);
   ```

5. **Handle loading states in UI**:
   ```typescript
   if (loading) return <Spinner />;
   if (error) return <Error message={error} />;
   ```

---

## Environment Configuration

Set your API base URL in `.env`:

```env
# Development
VITE_API_BASE_URL=http://localhost:3000/api

# Production
VITE_API_BASE_URL=https://api.yourdomain.com/api
```

The client will automatically use this for all requests.

---

## Troubleshooting

### Endpoints not working?
- Check `.env` file has correct `VITE_API_BASE_URL`
- Verify backend is running
- Check network tab in browser DevTools
- Look for CORS errors

### Token not being sent?
- Ensure token is in localStorage:
  ```typescript
  localStorage.setItem('authToken', token);
  ```
- Check Authorization header in network requests

### Type errors?
- Cast async thunks as `any`:
  ```typescript
  dispatch(fetchKYCCases() as any);
  ```

---

## Additional Resources

- Redux Toolkit: https://redux-toolkit.js.org/
- React-Redux Hooks: https://react-redux.js.org/api/hooks
- Axios: https://axios-http.com/
- TypeScript: https://www.typescriptlang.org/
