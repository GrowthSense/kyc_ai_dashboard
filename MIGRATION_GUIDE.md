# Migration Guide: Updating Existing Components to Use Redux

This guide helps you migrate your existing components from using context/props to Redux Toolkit.

## Before and After Examples

### Example 1: CaseList Component

#### Before (Props-based)
```typescript
import React from 'react';

interface CaseListProps {
  cases: KYCCase[];
  onViewCase: (caseId: string) => void;
}

const CaseList: React.FC<CaseListProps> = ({ cases, onViewCase }) => {
  // Component logic
};
```

#### After (Redux)
```typescript
import React, { useEffect } from 'react';
import { useAppDispatch, useKYCCases, useKYCLoading } from '@/redux/hooks';
import { fetchKYCCases } from '@/redux/api/kycApi';

interface CaseListProps {
  onViewCase: (caseId: string) => void;
}

const CaseList: React.FC<CaseListProps> = ({ onViewCase }) => {
  const dispatch = useAppDispatch();
  const cases = useKYCCases();
  const loading = useKYCLoading();

  useEffect(() => {
    dispatch(fetchKYCCases() as any);
  }, [dispatch]);

  // Component logic
};
```

---

### Example 2: CaseDetail Component

#### Before (Context-based)
```typescript
import { useAppContext } from '@/contexts/AppContext';

function CaseDetail({ caseId }) {
  const { cases, setCases } = useAppContext();
  const kyc = cases.find(c => c.id === caseId);

  const handleStatusUpdate = (newStatus) => {
    setCases(cases.map(c => 
      c.id === caseId ? { ...c, status: newStatus } : c
    ));
  };

  return (
    // JSX
  );
}
```

#### After (Redux)
```typescript
import { useAppDispatch, useCurrentKYCCase, useKYCLoading } from '@/redux/hooks';
import { fetchKYCCaseById, updateCaseStatus } from '@/redux/api/kycApi';

function CaseDetail({ caseId }) {
  const dispatch = useAppDispatch();
  const kyc = useCurrentKYCCase();
  const loading = useKYCLoading();

  useEffect(() => {
    dispatch(fetchKYCCaseById(caseId) as any);
  }, [dispatch, caseId]);

  const handleStatusUpdate = (newStatus) => {
    dispatch(updateCaseStatus({ caseId, status: newStatus }) as any);
  };

  return (
    // JSX
  );
}
```

---

### Example 3: DashboardOverview Component

#### Before (Manual state)
```typescript
function DashboardOverview() {
  const [cases, setCases] = useState<KYCCase[]>([]);
  const [screens, setScreens] = useState<AMLScreen[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCases();
    fetchScreens();
  }, []);

  const fetchCases = async () => {
    try {
      const response = await fetch('/api/kyc/cases');
      const data = await response.json();
      setCases(data);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  // More fetch functions...
}
```

#### After (Redux)
```typescript
import { useAppDispatch, useKYCCases, useAMLScreens, useKYCLoading } from '@/redux/hooks';
import { fetchKYCCases } from '@/redux/api/kycApi';
import { fetchAMLScreens } from '@/redux/api/amlApi';

function DashboardOverview() {
  const dispatch = useAppDispatch();
  const cases = useKYCCases();
  const screens = useAMLScreens();
  const loading = useKYCLoading();

  useEffect(() => {
    dispatch(fetchKYCCases() as any);
    dispatch(fetchAMLScreens({}) as any);
  }, [dispatch]);

  // Component logic is simpler now
}
```

---

## Step-by-Step Migration Checklist

### Step 1: Remove Props Drilling
- ✅ Identify components that receive data via props
- ✅ Remove data from props
- ✅ Import Redux hooks instead
- ✅ Use `useAppSelector` to access state

### Step 2: Replace useEffect Fetch Logic
- ✅ Remove manual fetch calls
- ✅ Use `useAppDispatch` to dispatch async thunks
- ✅ Replace loading states with `useKYCLoading()`, etc.

### Step 3: Replace State Updates
- ✅ Replace `setState` with `dispatch(action)`
- ✅ Use Redux reducers for state updates
- ✅ Remove context dependencies

### Step 4: Error Handling
- ✅ Replace try-catch with Redux error state
- ✅ Use `useKYCError()`, `useAMLError()`, etc.
- ✅ Display errors from Redux state

### Step 5: Testing
- ✅ Test component with Redux state
- ✅ Verify API calls work correctly
- ✅ Check error handling
- ✅ Verify loading states

---

## Common Migration Patterns

### Pattern 1: Fetching Data on Mount

**Before:**
```typescript
useEffect(() => {
  const loadData = async () => {
    try {
      const response = await fetch('/api/kyc/cases');
      const data = await response.json();
      setCases(data);
    } catch (error) {
      setError(error.message);
    }
  };
  loadData();
}, []);
```

**After:**
```typescript
useEffect(() => {
  dispatch(fetchKYCCases() as any);
}, [dispatch]);
```

---

### Pattern 2: Handling Form Submission

**Before:**
```typescript
const handleSubmit = async (formData) => {
  setLoading(true);
  try {
    const response = await fetch('/api/kyc/cases', {
      method: 'POST',
      body: JSON.stringify(formData)
    });
    const newCase = await response.json();
    setCases([...cases, newCase]);
    setSuccess(true);
  } catch (error) {
    setError(error.message);
  } finally {
    setLoading(false);
  }
};
```

**After:**
```typescript
const handleSubmit = async (formData) => {
  const result = await dispatch(createKYCCase(formData) as any);
  if (result.payload) {
    // Success - case was created
  } else {
    // Error is already in Redux state
  }
};
```

---

### Pattern 3: Conditional Rendering Based on State

**Before:**
```typescript
if (loading) return <LoadingSpinner />;
if (error) return <ErrorAlert message={error} />;
if (cases.length === 0) return <EmptyState />;
```

**After:**
```typescript
const loading = useKYCLoading();
const error = useKYCError();
const cases = useKYCCases();

if (loading) return <LoadingSpinner />;
if (error) return <ErrorAlert message={error} />;
if (cases.length === 0) return <EmptyState />;
```

---

### Pattern 4: Updating Data

**Before:**
```typescript
const handleUpdate = async (caseId, newStatus) => {
  try {
    const response = await fetch(`/api/kyc/cases/${caseId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status: newStatus })
    });
    const updatedCase = await response.json();
    setCases(cases.map(c => c.id === caseId ? updatedCase : c));
  } catch (error) {
    setError(error.message);
  }
};
```

**After:**
```typescript
const handleUpdate = (caseId, newStatus) => {
  dispatch(updateCaseStatus({ caseId, status: newStatus }) as any);
};
```

---

## Components to Migrate

### High Priority
- [ ] `DashboardOverview.tsx` - Main dashboard
- [ ] `CaseList.tsx` - Case listing (partially done)
- [ ] `CaseDetail.tsx` - Case details view
- [ ] `AMLScreening.tsx` - AML screening

### Medium Priority
- [ ] `UserLookup.tsx` - User search
- [ ] `Header.tsx` - Header with user info
- [ ] `ActionModal.tsx` - Modal actions

### Lower Priority
- [ ] `Settings.tsx` - Settings page
- [ ] `DocumentViewer.tsx` - Document viewing
- [ ] `StatusBadge.tsx` - Status components

---

## Testing Redux Integration

### Test 1: Verify Actions Dispatch
```typescript
import { render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { store } from '@/redux/store';
import CaseList from '@/components/dashboard/CaseList';

test('CaseList fetches cases on mount', async () => {
  render(
    <Provider store={store}>
      <CaseList onViewCase={() => {}} />
    </Provider>
  );

  // Check if loading state shows
  expect(screen.getByText(/loading/i)).toBeInTheDocument();

  // Wait for data to load
  await screen.findByText(/case id/i);
});
```

### Test 2: Verify State Updates
```typescript
test('Case status updates in Redux', async () => {
  const { store } = renderWithRedux(<CaseDetail caseId="123" />);

  const state = store.getState();
  expect(state.kyc.loading).toBe(false);
  expect(state.kyc.currentCase).toBeDefined();
});
```

---

## Troubleshooting

### Issue: Actions not dispatching
**Solution:** Make sure to cast thunks as `any`:
```typescript
dispatch(fetchKYCCases() as any);
```

### Issue: State not updating
**Solution:** Check that you're using the correct hooks:
```typescript
const cases = useKYCCases(); // Not useAppSelector
```

### Issue: API calls failing
**Solution:** Verify environment variables:
```env
VITE_API_BASE_URL=http://localhost:3000/api
```

### Issue: Token not being sent
**Solution:** Token should be in localStorage:
```typescript
localStorage.setItem('authToken', token);
```

---

## Performance Optimization

### Memoize Components
```typescript
const CaseList = React.memo(({ onViewCase }) => {
  // Component logic
});
```

### Use useCallback for Event Handlers
```typescript
const handleViewCase = useCallback((caseId: string) => {
  // Handle view case
}, []);
```

### Selectors with Reselect (Optional)
```typescript
import { createSelector } from '@reduxjs/toolkit';

export const selectApprovedCases = createSelector(
  [state => state.kyc.cases],
  cases => cases.filter(c => c.status === 'approved')
);
```

---

## Rollback Plan

If you need to rollback to props/context:

1. Keep the old component versions in a `backup/` folder
2. Maintain both Redux and context versions initially
3. Switch back by importing the old component

---

## Resources

- [Redux Toolkit Documentation](https://redux-toolkit.js.org/)
- [React-Redux Hooks](https://react-redux.js.org/api/hooks)
- [RTK Query for Data Fetching](https://redux-toolkit.js.org/rtk-query/overview)

---

## Questions?

Refer to:
- `REDUX_SETUP.md` - Full setup guide
- `src/redux/examples.ts` - Code examples
- `src/redux/dashboard-patterns.ts` - Component patterns
