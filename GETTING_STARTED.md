# 🚀 Getting Started with Redux - Next Steps

This file explains exactly what to do next to start using Redux in your application.

## Step 1: Install Dependencies ⬇️

Run this command in your terminal:

```bash
npm install @reduxjs/toolkit react-redux axios
```

**What this installs:**
- `@reduxjs/toolkit` - Redux with simplified API
- `react-redux` - React bindings for Redux
- `axios` - HTTP client for API calls

**Time required:** ~2-3 minutes

---

## Step 2: Create Environment File 🔧

Create a `.env` file in the root of your project (next to `package.json`):

```env
VITE_API_BASE_URL=http://localhost:3000/api
```

**Replace with your actual backend URL if different.**

For production, you might have:
```env
VITE_API_BASE_URL=https://api.yourdomain.com/api
```

**Time required:** 1 minute

---

## Step 3: Start Your Backend 🖥️

Make sure your backend is running:

```bash
# Your backend startup command (adjust as needed)
npm run dev   # or yarn dev, or python manage.py runserver, etc.
```

Verify it's running at the URL specified in your `.env` file.

**Time required:** Depends on your setup

---

## Step 4: Run Your React App 🎨

In a new terminal, start your React application:

```bash
npm run dev
```

The app should now work with Redux! ✅

**Time required:** 1-2 minutes

---

## Step 5: Test the Integration 🧪

### Option A: Test CaseList Component

The CaseList component has already been updated to use Redux. It should:
1. Show a loading spinner
2. Fetch data from your backend
3. Display cases in a table

Navigate to the CaseList view and verify it works.

### Option B: Create Your Own Test Component

Create a test file `src/components/TestRedux.tsx`:

```typescript
import React, { useEffect } from 'react';
import { useAppDispatch, useKYCCases, useKYCLoading, useKYCError } from '@/redux/hooks';
import { fetchKYCCases } from '@/redux/api/kycApi';

export function TestRedux() {
  const dispatch = useAppDispatch();
  const cases = useKYCCases();
  const loading = useKYCLoading();
  const error = useKYCError();

  useEffect(() => {
    dispatch(fetchKYCCases() as any);
  }, [dispatch]);

  return (
    <div style={{ padding: '20px' }}>
      <h1>Redux Test Component</h1>
      
      {loading && <p>Loading cases...</p>}
      {error && <p style={{ color: 'red' }}>Error: {error}</p>}
      
      {cases.length > 0 ? (
        <div>
          <p>Successfully loaded {cases.length} cases!</p>
          <pre>{JSON.stringify(cases[0], null, 2)}</pre>
        </div>
      ) : (
        !loading && <p>No cases found</p>
      )}
    </div>
  );
}
```

Then import and use it in your app to verify Redux is working.

---

## Step 6: Check Browser DevTools 🛠️

### Install Redux DevTools Browser Extension

1. **Chrome**: [Redux DevTools Extension](https://chrome.google.com/webstore/detail/redux-devtools/lmjaboapkkhfabhhgehaajndoiakcghl)
2. **Firefox**: [Redux DevTools Extension](https://addons.mozilla.org/en-US/firefox/addon/reduxdevtools/)

### View Redux State

1. Open your app in the browser
2. Open DevTools (F12 or Cmd+Option+I)
3. Go to "Redux" tab
4. You should see:
   - All dispatched actions
   - State changes
   - Full Redux state tree

**Troubleshooting:** If Redux tab doesn't appear, the extension wasn't installed correctly.

---

## Step 7: Start Using Redux in Components 💻

### Example 1: Display Cases

```typescript
import { useKYCCases, useKYCLoading, useKYCError } from '@/redux/hooks';
import { fetchKYCCases } from '@/redux/api/kycApi';
import { useAppDispatch } from '@/redux/hooks';

function MyCaseList() {
  const dispatch = useAppDispatch();
  const cases = useKYCCases();
  const loading = useKYCLoading();
  const error = useKYCError();

  useEffect(() => {
    dispatch(fetchKYCCases() as any);
  }, [dispatch]);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      {cases.map(c => (
        <div key={c.id}>{c.id}</div>
      ))}
    </div>
  );
}
```

### Example 2: Create a Case

```typescript
import { useAppDispatch, useKYCSuccess, useKYCError } from '@/redux/hooks';
import { createKYCCase } from '@/redux/api/kycApi';

function CreateCaseForm() {
  const dispatch = useAppDispatch();
  const success = useKYCSuccess();
  const error = useKYCError();

  const handleSubmit = async (formData) => {
    await dispatch(createKYCCase(formData) as any);
  };

  useEffect(() => {
    if (success) {
      alert('Case created successfully!');
    }
  }, [success]);

  return (
    <form onSubmit={(e) => {
      e.preventDefault();
      handleSubmit(/* form data */);
    }}>
      {/* Form fields */}
      {error && <div style={{ color: 'red' }}>{error}</div>}
      <button type="submit">Create Case</button>
    </form>
  );
}
```

### Example 3: Update Case Status

```typescript
import { useAppDispatch } from '@/redux/hooks';
import { updateCaseStatus } from '@/redux/api/kycApi';

function CaseActions({ caseId }) {
  const dispatch = useAppDispatch();

  const handleApprove = () => {
    dispatch(updateCaseStatus({
      caseId,
      status: 'approved'
    }) as any);
  };

  return <button onClick={handleApprove}>Approve</button>;
}
```

---

## Step 8: Complete Component Examples 📖

For complete working examples, see:
- `src/redux/examples.ts` - 10 reusable hook examples
- `src/redux/dashboard-patterns.ts` - 6 component patterns
- `src/components/dashboard/CaseList.tsx` - Already updated

---

## Step 9: Reference Documentation 📚

When you need help:

1. **For setup questions** → `REDUX_SETUP.md`
2. **For API endpoints** → `ENDPOINTS_REFERENCE.md`
3. **For migration** → `MIGRATION_GUIDE.md`
4. **For architecture** → `ARCHITECTURE_COMPARISON.md`
5. **For quick reference** → `REDUX_COMPLETE_SETUP.md`
6. **For what was created** → `REDUX_IMPLEMENTATION.md`

---

## Troubleshooting Guide 🔧

### Problem: "Cannot find module '@/redux/hooks'"

**Solution:** Check your path aliases in `tsconfig.json`. Should have:
```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"]
    }
  }
}
```

### Problem: "API calls are failing"

**Solution:** Check:
1. Is `.env` file created with correct `VITE_API_BASE_URL`?
2. Is your backend running?
3. Check browser DevTools Network tab for actual error
4. Look at Redux DevTools to see action payload

### Problem: "Types errors with async thunks"

**Solution:** Always cast as `any`:
```typescript
dispatch(fetchKYCCases() as any);  // ✅ Correct
dispatch(fetchKYCCases());         // ❌ Error
```

### Problem: "Redux state not updating"

**Solution:** Make sure you're using the correct hook:
```typescript
const cases = useKYCCases();  // ✅ Correct
const cases = useAppSelector(state => state.kyc.cases);  // ❌ Avoid this
```

### Problem: "Components not re-rendering after update"

**Solution:** Check:
1. Are you using the hook? (e.g., `useKYCCases()`)
2. Is Redux DevTools showing the state change?
3. Check if selector is returning the same object reference

---

## Common Commands 🎯

```bash
# Install dependencies
npm install @reduxjs/toolkit react-redux axios

# Start development
npm run dev

# Build for production
npm run build

# Lint code
npm run lint

# Run tests (if configured)
npm test
```

---

## File Locations Quick Reference 🗂️

- Redux Store: `src/redux/store.ts`
- KYC Hooks: `src/redux/hooks.ts` (search "KYC")
- AML Hooks: `src/redux/hooks.ts` (search "AML")
- KYC API: `src/redux/api/kycApi.ts`
- AML API: `src/redux/api/amlApi.ts`
- HTTP Client: `src/redux/api/client.ts`
- Examples: `src/redux/examples.ts`
- Patterns: `src/redux/dashboard-patterns.ts`

---

## Checklist: Getting Started ✅

- [ ] Install dependencies: `npm install @reduxjs/toolkit react-redux axios`
- [ ] Create `.env` file with API URL
- [ ] Start backend server
- [ ] Run `npm run dev`
- [ ] Test a Redux component (CaseList)
- [ ] Install Redux DevTools extension
- [ ] View Redux state in DevTools
- [ ] Create a test component
- [ ] Read through example files
- [ ] Start updating your components

---

## What's Next? 🚀

### Phase 1: Verify (Today)
1. ✅ Install dependencies
2. ✅ Create .env file
3. ✅ Test CaseList component
4. ✅ Verify Redux DevTools works

### Phase 2: Explore (Tomorrow)
1. Read documentation files
2. Review example code
3. Understand Redux patterns
4. Create a test component

### Phase 3: Integrate (This Week)
1. Update DashboardOverview
2. Update CaseDetail
3. Update UserLookup
4. Remove prop drilling

### Phase 4: Polish (Next Week)
1. Add Redux DevTools logger
2. Optimize performance
3. Add request logging
4. Error boundary integration

---

## Tips for Success 💡

1. **Use Redux DevTools** - It's incredibly helpful for debugging
2. **Follow patterns** - See `src/redux/examples.ts` for patterns
3. **Keep it simple** - Don't over-engineer Redux
4. **Test early** - Create test components as you learn
5. **Read docs** - Especially before migrating components
6. **Ask questions** - Refer to documentation files

---

## Support Resources 📞

| Question | Resource |
|----------|----------|
| "How do I set up Redux?" | `REDUX_SETUP.md` |
| "How do I use an endpoint?" | `ENDPOINTS_REFERENCE.md` |
| "How do I update a component?" | `MIGRATION_GUIDE.md` |
| "What was created?" | `REDUX_IMPLEMENTATION.md` |
| "Why Redux instead of context?" | `ARCHITECTURE_COMPARISON.md` |
| "How do I use this hook?" | `src/redux/hooks.ts` |
| "Show me examples" | `src/redux/examples.ts` |
| "How do I structure components?" | `src/redux/dashboard-patterns.ts` |

---

## 🎉 You're All Set!

Everything is installed and configured. Your app is ready to use Redux!

**Next action:** Follow the checklist above and start testing. 🚀

---

## Quick Links

- 📖 Full Setup: [REDUX_SETUP.md](./REDUX_SETUP.md)
- 📚 API Reference: [ENDPOINTS_REFERENCE.md](./ENDPOINTS_REFERENCE.md)
- 🔄 Migration: [MIGRATION_GUIDE.md](./MIGRATION_GUIDE.md)
- 🏗️ Architecture: [ARCHITECTURE_COMPARISON.md](./ARCHITECTURE_COMPARISON.md)
- ✅ Summary: [REDUX_IMPLEMENTATION.md](./REDUX_IMPLEMENTATION.md)

---

Good luck! Happy coding! 🚀
