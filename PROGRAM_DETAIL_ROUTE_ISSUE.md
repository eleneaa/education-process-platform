# Program Detail Route Issue - Session Summary

## Objective
Implement program detail page routing and redirect after program creation. When creating a new program, the app should redirect to `/programs/{programId}` to show the detail page instead of staying on the list.

## Work Done

### 1. File Structure & Route Definition
- **File**: `frontend/src/routes/_layout/programs.[programId].tsx` (originally `programs.$programId.tsx`)
- **Route Definition**: `createFileRoute("/_layout/programs/{programId}")`
- **Component**: `ProgramDetailPage` - fully functional with modules/groups/teachers tabs
- **Navigation**: Updated `programs.tsx` to navigate to `/programs/$programId` with params

### 2. Changes Made

#### A. Navigation in programs.tsx (line 141 & 306)
```typescript
// Link on program card
<Link to="/programs/$programId" params={{ programId: program.id }}>

// Mutation success callback
router.navigate({ to: "/programs/$programId", params: { programId } })
```

#### B. Route Definition Attempts
Tried multiple syntaxes:
1. `programs_.$programId.tsx` → `createFileRoute("/_layout/programs_/$programId")` ❌
2. `programs.$programId.tsx` → `createFileRoute("/_layout/programs/$programId")` ❌
3. `programs.[programId].tsx` → `createFileRoute("/_layout/programs/{programId}")` ❌

### 3. Testing Results

**Direct URL Access**:
- URL: `http://localhost:5173/programs/bddf844f-ca44-461a-b6cf-1fda348701c8`
- Result: Shows programs list instead of program detail
- Status: ❌ Route not recognized

**Program Creation Redirect**:
- Create button opens dialog
- Submit creates program via API (200 OK)
- navigate() is called
- Result: Shows programs list, no redirect to detail
- Status: ❌ Navigation fails

## Root Cause Analysis

The route file exists and is compiled (appears in dist as `programs._programId_-...js`), but TanStack Router v1.163 is not recognizing it as a valid route. 

### Possible Issues:
1. **File-based route registration**: The route plugin might not be picking up the file correctly
2. **Path syntax mismatch**: TanStack Router might expect different path syntax than what we're using
3. **Route tree generation**: The vite plugin might not be generating the routeTree correctly for this file

### Evidence:
- nginx correctly serves index.html for `/programs/{id}` (SPA config is correct)
- Browser receives the SPA app (JavaScript loads correctly)
- TanStack Router loads but doesn't recognize the `/programs/{id}` path
- Falls back to showing programs list (parent route `/programs` catches the request)

## Next Steps to Try

1. **Alternative file structure**: Create `programs/` directory with `[programId].tsx` inside
2. **Check vite plugin config**: Verify tanstackRouter plugin settings in `vite.config.ts`
3. **Manual route registration**: Instead of file-based, manually register the route in router config
4. **Inspect route tree**: Check what routes are actually registered at runtime
5. **Compare with working routes**: Look at other dynamic routes in the project (if any exist)

## Key Files
- `/frontend/src/routes/_layout/programs.[programId].tsx` - Detail page component (working)
- `/frontend/src/routes/_layout/programs.tsx` - List page with navigation (needs fix)
- `/frontend/vite.config.ts` - Contains tanstackRouter plugin config
- `/frontend/src/main.tsx` - Uses `routeTree.gen` from vite plugin

## Database & Backend
✅ All working correctly:
- Program creation API: `/api/v1/programs/` (200 OK)
- Returns program with full ID
- Program fetching works
- Teacher-program associations working

## Docker Status
✅ Latest build with fresh seed (May 14, 2026, 17:22)
- Frontend: Running
- Backend: Running  
- Database: Seeded with test data
- All tests passing (149 tests)
