/**
 * ============================================================================
 * REDUX INTEGRATION - QUICK START GUIDE
 * ============================================================================
 *
 * ✅ SETUP COMPLETE
 *
 * Redux is now fully integrated following your preferred pattern.
 * The app fetches real KYC data from your backend at http://localhost:8002
 *
 * ============================================================================
 * HOW IT WORKS
 * ============================================================================
 *
 * 1. App starts -> Redux Provider wraps application
 * 2. User authenticates -> AppLayout component mounts
 * 3. AppLayout dispatches GetKYCCasesAction()
 * 4. Action calls fetchKYCCases() from kycService
 * 5. Service transforms backend data to frontend types
 * 6. Action dispatches fetchSuccess() to Redux slice
 * 7. Redux updates state.kyc.cases
 * 8. AppLayout reads cases via useKYCCases() hook
 * 9. Cases passed to CaseList component as props
 * 10. CaseList renders real data from your backend ✨
 *
 * ============================================================================
 * FILE ORGANIZATION
 * ============================================================================
 *
 * Redux Structure:
 * src/redux/
 * ├── store.ts                    # Store config + makeStore()
 * ├── hooks.ts                    # Typed hooks (useAppDispatch, etc)
 * ├── slices/
 * │   ├── kycSlice.ts             # KYC state (cases, loading, error)
 * │   ├── amlSlice.ts             # AML state (screenings, loading)
 * │   └── authSlice.ts            # Auth state (isAuthenticated, user)
 * └── actions/
 *     ├── GetKYCCasesAction.ts     # Fetch all cases
 *     └── GetAMLScreeningsAction.ts# Fetch screenings (mock)
 *
 * Service Layer:
 * src/services/
 * └── kycService.ts               # Backend API calls + data transformation
 *
 * ============================================================================
 * USING REDUX IN COMPONENTS
 * ============================================================================
 *
 * Example: Fetch and display KYC cases
 *
 * import { useDispatch } from 'react-redux';
 * import { useKYCCases, useKYCLoading, useKYCError } from '@/redux/hooks';
 * import GetKYCCasesAction from '@/redux/actions/GetKYCCasesAction';
 *
 * export const MyCaseComponent = () => {
 *   const dispatch = useDispatch();
 *   const cases = useKYCCases();
 *   const isLoading = useKYCLoading();
 *   const error = useKYCError();
 *
 *   useEffect(() => {
 *     if (!cases.length) {
 *       (dispatch as any)(GetKYCCasesAction());
 *     }
 *   }, [dispatch, cases.length]);
 *
 *   if (isLoading) return <p>Loading...</p>;
 *   if (error) return <p>Error: {error}</p>;
 *   if (!cases.length) return <p>No cases found</p>;
 *
 *   return (
 *     <ul>
 *       {cases.map(kyc => (
 *         <li key={kyc.id}>
 *           {kyc.userName} - {kyc.status}
 *         </li>
 *       ))}
 *     </ul>
 *   );
 * };
 *
 * ============================================================================
 * AVAILABLE HOOKS
 * ============================================================================
 *
 * DISPATCH:
 * - useAppDispatch()               # Typed dispatch hook
 *
 * KYC:
 * - useKYCCases()                  # Get all KYC cases
 * - useKYCLoading()                # Get KYC loading state
 * - useKYCError()                  # Get KYC error state
 * - useSelectedCase()              # Get selected case
 * - useKYCState()                  # Get all KYC state at once
 *
 * AML:
 * - useAMLLoading()                # Get AML loading state
 * - useAMLError()                  # Get AML error state
 *
 * AUTH:
 * - useIsAuthenticated()           # Get auth status
 * - useAuthUser()                  # Get authenticated user
 * - useAuthLoading()               # Get auth loading state
 *
 * ============================================================================
 * AVAILABLE ACTIONS
 * ============================================================================
 *
 * KYC:
 * - GetKYCCasesAction()            # Fetch all cases from backend
 *
 * AML:
 * - GetAMLScreeningsAction()       # Fetch screenings (mock for now)
 *
 * Usage:
 * (dispatch as any)(GetKYCCasesAction())
 *
 * ============================================================================
 * SLICES REFERENCE
 * ============================================================================
 *
 * KYC SLICE:
 * State: {
 *   cases: KYCCase[],              # Array of KYC cases
 *   isLoading: boolean,            # Loading state
 *   error: string | null,          # Error message
 *   selectedCase: KYCCase | null   # Currently selected case
 * }
 *
 * Reducers:
 * - fetchPending()                 # Set isLoading = true
 * - fetchSuccess(cases)            # Set cases, isLoading = false
 * - fetchError(error)              # Set error, isLoading = false
 * - selectCase(case)               # Set selectedCase
 * - clearSelectedCase()            # Clear selectedCase
 * - updateCaseSuccess(caseId, updates) # Update single case
 * - clearKYCState()                # Reset to initial state
 *
 * AML SLICE:
 * State: {
 *   screenings: AMLScreeningResult[],
 *   isLoading: boolean,
 *   error: string | null
 * }
 *
 * Reducers:
 * - fetchPending()                 # Set isLoading = true
 * - fetchSuccess(screenings)       # Set screenings, isLoading = false
 * - fetchError(error)              # Set error, isLoading = false
 * - addScreening(screening)        # Add single screening
 * - clearAMLState()                # Reset to initial state
 *
 * AUTH SLICE:
 * State: {
 *   isAuthenticated: boolean,
 *   user: any | null,
 *   isLoading: boolean,
 *   error: string | null
 * }
 *
 * Reducers:
 * - loginPending()                 # Set isLoading = true
 * - loginSuccess(user)             # Set user, isAuthenticated = true
 * - loginFail(error)               # Set error, isAuthenticated = false
 * - logout()                       # Clear auth state
 * - clearError()                   # Clear error state
 *
 * ============================================================================
 * DATA FLOW DIAGRAM
 * ============================================================================
 *
 *   Component
 *      ↓
 *   dispatch(GetKYCCasesAction())
 *      ↓
 *   Action dispatches fetchPending()
 *      ↓
 *   Service calls axios.get(http://localhost:8002/kyc/cases)
 *      ↓
 *   Service transforms response to KYCCase[]
 *      ↓
 *   Action dispatches fetchSuccess(transformedData)
 *      ↓
 *   Slice updates state.kyc.cases
 *      ↓
 *   Component reads via useKYCCases()
 *      ↓
 *   Component re-renders with new data ✨
 *
 * ============================================================================
 * BACKEND API ENDPOINTS
 * ============================================================================
 *
 * Base URL: http://localhost:8002
 *
 * GET /kyc/cases
 * - Returns all KYC cases
 * - Response format: { status: "success", data: KYCCase[] }
 *
 * GET /kyc/cases/:caseId
 * - Returns single KYC case
 * - Response format: { status: "success", data: KYCCase }
 *
 * ============================================================================
 * ADDING NEW FEATURES
 * ============================================================================
 *
 * To add a new Redux feature (e.g., fee management):
 *
 * 1. Create slice (src/redux/slices/feesSlice.ts)
 * 2. Create action (src/redux/actions/GetFeesAction.ts)
 * 3. Add reducer to store (src/redux/store.ts)
 * 4. Add hooks to hooks.ts (useFeesState, useFeesLoading, etc)
 * 5. Create service in src/services/feesService.ts
 * 6. Use in component:
 *    - dispatch(GetFeesAction())
 *    - const fees = useFeesData()
 *
 * ============================================================================
 * NOTES
 * ============================================================================
 *
 * ✅ Redux Provider is wrapped in main.tsx
 * ✅ Store is created with makeStore() function
 * ✅ All hooks are type-safe using TypedUseSelectorHook
 * ✅ Async actions follow thunk pattern (dispatch & return)
 * ✅ Service layer abstracts API calls
 * ✅ Components receive data via props (recommended approach)
 * ✅ Real backend data is fetched at http://localhost:8002
 * ✅ Fallback to mock data if API fails
 * ✅ Error handling in place at service and action level
 * ✅ Loading states managed at Redux level
 * ✅ Serialization check disabled for flexibility
 *
 * ============================================================================
 */

export {};
