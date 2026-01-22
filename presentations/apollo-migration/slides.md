---
theme: apple-basic
background: https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=1920
title: Apollo Client 4 Migration
info: |
  Migration guide for upgrading from Apollo Client 3 to Apollo Client 4
  with apollo-link-rest support.
class: text-center
transition: slide-left
mdc: true
duration: 10min
---

# Apollo Client 4 Migration

From v3.10.4 to v4.0 with apollo-link-rest

<div class="abs-bl m-6 text-sm opacity-70">
  Docs: apollographql.com/docs/react/migrating/apollo-client-4-migration
</div>

---

## layout: section

# Current Situation

Understanding our REST-to-GraphQL architecture

---

## Technology Stack

<div class="grid grid-cols-2 gap-8">

<div>

### Current Versions

| Package          | Version |
| ---------------- | ------- |
| @apollo/client   | 3.10.4  |
| apollo-link-rest | 0.9.0   |
| graphql          | 16.8.1  |
| React            | 18.x    |

</div>

<div>

### Applications

- **apps/winkel** - Main storefront
- **apps/mijn.zorgenzekerheid.nl** - Customer portal

Both use the same REST-to-GraphQL pattern

</div>

</div>

<div class="abs-bl m-6 text-sm opacity-70">
  Package versions from apps/winkel/package.json
</div>

---

layout: full
class: overflow-y-auto

---

## Complete Data Flow

<div class="text-xs leading-tight pb-16">

```
┌─────────────────────────────────────────────────────────────────────┐
│                    BACKEND TEAM                                     │
│              (Provides OpenAPI Specification)                       │
└────────────────────────────┬────────────────────────────────────────┘
                             │
                             ▼
              ┌──────────────────────────────┐
              │   oas.json (OpenAPI Spec)    │
              │   tools/codegen/apps/        │
              │   └── winkel/oas.json        │
              └──────────────┬───────────────┘
                             │ STEP 1: Schema Generation
                             ▼
         ┌────────────────────────────────────────────┐
         │  openapi-to-graphql                        │
         │  Converts: OpenAPI Spec → GraphQL Schema   │
         └────────────────┬───────────────────────────┘
                          │
                          ▼
              ┌───────────────────────────┐
              │   types.graphql           │
              │   (GraphQL Schema)        │
              └───────────┬───────────────┘
                          │
           ┌──────────────┴──────────────┐
           │                             │
           ▼                             ▼
┌──────────────────────┐    ┌───────────────────────────┐
│  GraphQL Documents   │───▶│  STEP 2: Code Generation  │
│  *.graphql files     │    │  @graphql-codegen/cli     │
│  apps/winkel/src/    │    │  • TypeScript types       │
│  └── documents/      │    │  • React Apollo hooks     │
└──────────────────────┘    └───────────┬───────────────┘
                                        │
                   ┌────────────────────┴────────────────────┐
                   ▼                                         ▼
    ┌─────────────────────────────────┐     ┌──────────────────────────┐
    │ __generated__/graphql.ts        │     │ Shared Types Package     │
    │ • useRegiopostcodesQuery()      │     │ • TypeScript types only  │
    │ • useSaveAdviesmoduleMutation   │     │   (shared across pkgs)   │
    └─────────────────────────────────┘     └──────────────────────────┘
```

</div>

<div class="abs-bl m-6 text-sm opacity-70">
  tools/codegen/codegen-from-schema.js
</div>

---

layout: full
class: overflow-y-auto

---

## Runtime Data Flow

<div class="text-xs leading-tight pb-16">

```
    ┌─────────────────────────────────┐
    │   React Component               │
    │   const { data, loading } =     │
    │     useRegiopostcodesQuery({    │
    │       variables: { ... }        │
    │     });                         │
    └─────────────┬───────────────────┘
                  │ RUNTIME: GraphQL Operation
                  ▼
    ┌─────────────────────────────────┐
    │   Apollo Client                 │
    │   Link Chain:                   │
    │   1. ErrorLink (error handling) │
    │   2. RestLink (REST adapter)    │
    └─────────────┬───────────────────┘
                  │ GraphQL with @rest directive
                  ▼
    ┌─────────────────────────────────┐
    │   apollo-link-rest              │
    │   Translates:                   │
    │   GraphQL → REST HTTP Request   │
    │                                 │
    │   query Postcodes($code: Str) { │
    │     data @rest(path: "/api/..") │
    │   }                             │
    └─────────────┬───────────────────┘
                  │
                  ▼
    ┌─────────────────────────────────┐
    │   HTTP GET/POST/PUT/DELETE      │
    │   /api/1234AB                   │
    └─────────────┬───────────────────┘
                  │
                  ▼
    ┌─────────────────────────────────┐
    │   REST API Backend              │
    │   (No GraphQL server!)          │
    └─────────────────────────────────┘
```

</div>

<div class="abs-bl m-6 text-sm opacity-70">
  apps/winkel/src/ApolloProvider.tsx
</div>

---

layout: full
class: overflow-y-auto

---

## Codegen Execution Flow

<div class="text-xs leading-tight pb-16">

```
                    $ rush codegen
                          │
                          ▼
    ┌─────────────────────────────────────────────────┐
    │  pnpm --filter @zz-tools/codegen start          │
    │  (defined in rush.json commands)                │
    └──────────────────┬──────────────────────────────┘
                       │
                       ▼
    ┌─────────────────────────────────────────────────┐
    │  node tools/codegen/codegen-from-schema.js      │
    │  (Loops through app configs)                    │
    └──────────────────┬──────────────────────────────┘
                       │
         ┌─────────────┴─────────────┐
         ▼                           ▼
    ┌─────────┐               ┌──────────┐
    │  winkel │               │  mijn.zz │
    └────┬────┘               └─────┬────┘
         └─────────┬────────────────┘
                   ▼
    FOR EACH APP:

    1. ┌─────────────────────────────────────┐
       │ Clear __generated__ directories     │
       └─────────────┬───────────────────────┘
    2.               ▼
       ┌─────────────────────────────────────┐
       │ openapi-to-graphql(oas.json)        │
       │ OUTPUT: types.graphql               │
       └─────────────┬───────────────────────┘
    3.               ▼
       ┌─────────────────────────────────────┐
       │ @graphql-codegen/cli                │
       │ OUTPUT: __generated__/graphql.ts    │
       └─────────────┬───────────────────────┘
                     ▼
                  ✓ Done
```

</div>

<div class="abs-bl m-6 text-sm opacity-70">
  tools/codegen/apps/winkel/config.js
</div>

---

## layout: section

# Migration Options

Four paths forward

---

## Option A: Full Migration

Direct upgrade to Apollo Client 4

```
┌─────────────────────────────────────────────────────────────────┐
│  Current:                          Target:                       │
│    @apollo/client: 3.10.4    ──>   @apollo/client: ^4.0.0       │
│    apollo-link-rest: 0.9.0   ──>   apollo-link-rest: 0.10.0-rc  │
│                                    rxjs: ^7.8.0 (new)           │
└─────────────────────────────────────────────────────────────────┘
```

| Pros                 | Cons                   |
| -------------------- | ---------------------- |
| ✅ Future-proof      | ❌ RC version risk     |
| ✅ Performance gains | ❌ All changes at once |
| ✅ Better TypeScript | ❌ Harder rollback     |

**Timeline:** 4-6 weeks

<div class="abs-bl m-6 text-sm opacity-70">
  apollographql.com/docs/react/migrating/apollo-client-4-migration
</div>

---

## Option B: Incremental Migration (Recommended)

Phased approach with validation checkpoints

```
┌────────────────────────────────────────────────────────────────────┐
│  Phase 1 (Week 1-2)     Phase 2 (Week 3-4)     Phase 3 (Week 5-6) │
│  ─────────────────      ─────────────────      ────────────────── │
│  Test RC version        Remove callbacks       Upgrade to v4      │
│  @apollo/client: 3.x    @apollo/client: 3.x   @apollo/client: 4.x│
│  apollo-link-rest: RC   apollo-link-rest: RC  apollo-link-rest:RC│
│                                                                    │
│  ✓ Validate REST ops    ✓ useEffect pattern   ✓ Run codemod      │
│  ✓ Identify issues      ✓ async/await         ✓ Update errors    │
└────────────────────────────────────────────────────────────────────┘
```

| Pros                   | Cons                    |
| ---------------------- | ----------------------- |
| ✅ Lower risk          | ❌ Longer timeline      |
| ✅ Easy rollback       | ❌ Multiple test cycles |
| ✅ Continuous delivery |                         |

**Timeline:** 5-8 weeks

<div class="abs-bl m-6 text-sm opacity-70">
  Recommended approach for production systems
</div>

---

## Option C: Wait for Stable

Stay on Apollo Client 3 until RC becomes stable

```
┌─────────────────────────────────────────────────────────────────┐
│  NOW                              LATER (when stable)            │
│  ───                              ───────────────────            │
│  @apollo/client: 3.10.4           Migrate using Option A or B   │
│  apollo-link-rest: 0.9.0                                        │
│                                                                  │
│  ✓ No changes                     Monitor:                       │
│  ✓ Proven stability               • GitHub releases             │
│  ✓ Focus on features              • Community feedback          │
└─────────────────────────────────────────────────────────────────┘
```

| Pros                 | Cons                    |
| -------------------- | ----------------------- |
| ✅ Zero risk now     | ❌ Unknown timeline     |
| ✅ Stable foundation | ❌ Technical debt grows |

**Timeline:** Unknown (3-12 months wait)

<div class="abs-bl m-6 text-sm opacity-70">
  github.com/apollographql/apollo-link-rest/releases
</div>

---

## Option D: Alternative Architecture

Move away from apollo-link-rest entirely

```
┌─────────────────────────────────────────────────────────────────┐
│  D1: urql (~30KB)              D2: TanStack Query (~15KB)        │
│  ───────────────               ──────────────────────            │
│  Custom REST exchange          Direct REST calls                 │
│  Keep @rest directive          Remove GraphQL layer              │
│  Similar hook API              queryKey pattern                  │
│                                                                   │
│  D3: Custom HTTP Link          D4: GraphQL Server                │
│  ────────────────────          ──────────────────                │
│  Build own RestLink            Backend builds gateway            │
│  Full control                  Proper GraphQL arch               │
└─────────────────────────────────────────────────────────────────┘
```

| urql            | TanStack Query   |
| --------------- | ---------------- |
| 4-8 weeks       | 3-6 months       |
| Keep GraphQL DX | Complete rewrite |

<div class="abs-bl m-6 text-sm opacity-70">
  formidable.com/open-source/urql/docs
</div>

---

## layout: section

# URQL Deep Dive

If we choose Option D1

---

## What is URQL?

A highly customisable and versatile GraphQL client

<div class="grid grid-cols-2 gap-8 mt-8">

<div>

### Features

- 📦 **One package** for React, Preact, Vue, Solid, Svelte
- ⚙️ **Fully customisable** via "exchanges"
- 🗂 **Simple defaults** with document caching
- 🌱 **Normalized caching** via `@urql/exchange-graphcache`
- 🔬 **Easy debugging** with browser devtools

</div>

<div>

### Why URQL?

|           | Apollo     | URQL      |
| --------- | ---------- | --------- |
| Bundle    | ~130KB     | ~30KB     |
| API       | Complex    | Simple    |
| Caching   | Normalized | Optional  |
| Exchanges | Links      | Exchanges |
| Learning  | Steep      | Gentle    |

</div>

</div>

<v-click>

**Philosophy:** Start simple, add complexity only when needed

</v-click>

<div class="abs-bl m-6 text-sm opacity-70">
  github.com/urql-graphql/urql
</div>

---

layout: full
class: overflow-y-auto

---

## URQL Migration: Setup & Client

<div class="grid grid-cols-2 gap-4 text-xs">

<div>

### Phase 1: Dependencies (1-2 days)

```bash
npm install urql graphql-ws
npm install -D @urql/exchange-graphcache
npm install -D @graphql-codegen/typescript-urql
```

Update codegen config:

```js
plugins: [
  'typescript',
  'typescript-operations',
  'typescript-urql'  // replaces typescript-react-apollo
],
urqlImportFrom: 'urql',
```

</div>

<div>

### Phase 2: Create URQL Client (1 day)

```typescript
import { Client, cacheExchange, fetchExchange } from "urql";
import { authExchange } from "@urql/exchange-auth";
import { retryExchange } from "@urql/exchange-retry";

export const createUrqlClient = () => {
  return new Client({
    url: process.env.NEXT_PUBLIC_GRAPHQL_ENDPOINT,
    exchanges: [
      cacheExchange,
      retryExchange({
        initialDelayMs: 1000,
        maxNumberAttempts: 2,
      }),
      authExchange({
        /* auth config */
      }),
      fetchExchange,
    ],
    fetchOptions: { credentials: "include" },
  });
};
```

</div>

</div>

<div class="abs-bl m-6 text-sm opacity-70">
  urql.dev/docs/basics/core
</div>

---

layout: full
class: overflow-y-auto

---

## URQL Migration: Hook Patterns

<div class="grid grid-cols-2 gap-4 text-xs">

<div>

### Apollo Pattern (Before)

```typescript
// Lazy query with callbacks
const [fetchData, { loading, data }] = useSomeLazyQuery({
  onCompleted: (data) => setResult(data),
  onError: (error) => setError(error),
});

// Execute
fetchData({ variables: { id } });
```

```typescript
// Mutation
const [mutate, { loading }] = useMutation(DOC, {
  onCompleted: () => router.push("/success"),
});
```

</div>

<div>

### URQL Pattern (After)

```typescript
// Query with pause (like lazy)
const [{ fetching, data }, refetch] = useQuery({
  query: SomeDocument,
  variables: { id },
  pause: !shouldFetch, // Controls execution
});

useEffect(() => {
  if (data) setResult(data);
}, [data]);
```

```typescript
// Mutation
const [result, executeMutation] = useMutation(DOC);

const handleSubmit = async () => {
  const { data } = await executeMutation({ id });
  if (data) router.push("/success");
};
```

</div>

</div>

<v-click>

**Key differences:** `loading` → `fetching`, lazy queries use `pause`, mutations return promises

</v-click>

<div class="abs-bl m-6 text-sm opacity-70">
  urql.dev/docs/basics/react-preact
</div>

---

layout: full
class: overflow-y-auto

---

## URQL Migration: Timeline & REST Handling

<div class="text-xs">

```
┌────────────────────────────────────────────────────────────────────────────┐
│  Days 1-2          Days 3-5           Days 6-8          Days 9-10          │
│  ─────────         ─────────          ─────────         ──────────         │
│  Setup URQL        Migrate            Handle REST       Testing &          │
│  Update codegen    providers          Update components Cleanup            │
│                                                                             │
│  • Install deps    • CareUsage        • Create REST     • Update mocks     │
│  • Create client   • Claims           • Replace hooks   • Test all flows   │
│  • Create provider • Finance          • Update imports  • Remove Apollo    │
│  • Update index    • Auth             • Regenerate      • Feature flags    │
└────────────────────────────────────────────────────────────────────────────┘
```

### REST API Handling (no apollo-link-rest)

```typescript
// Create REST utility for non-GraphQL endpoints
export const restClient = async (endpoint: string, options = {}) => {
  const response = await fetch(endpoint, {
    method: options.method || "GET",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: options.body ? JSON.stringify(options.body) : undefined,
  });
  return response.json();
};
```

</div>

**Total timeline:** 8-12 days | **Risk mitigation:** Feature branch, test each provider, keep Apollo as fallback

<div class="abs-bl m-6 text-sm opacity-70">
  Migration requires custom REST handling since URQL has no @rest directive
</div>

---

## Options Comparison

| Criteria      | A (Full)  | B (Phased) | C (Wait) | D (urql)  |
| ------------- | --------- | ---------- | -------- | --------- |
| Timeline      | 4-6 wks   | 5-8 wks    | Unknown  | 4-8 wks   |
| Risk          | Medium    | Low        | Very Low | Medium    |
| Code Changes  | ~50 files | ~50 files  | 0        | ~80 files |
| RC Dependency | Yes       | Yes        | No       | No        |
| Rollback      | Medium    | Easy       | N/A      | Medium    |

<div class="abs-bl m-6 text-sm opacity-70">
  Decision matrix based on team capacity and risk tolerance
</div>

---

## layout: section

# Breaking Changes

What needs to change in our code

---

## Callback Refactoring Pattern

### Before (v3 - deprecated)

```typescript
const [execute, { data, loading }] = useLazyQuery(QUERY, {
  onCompleted: (data) => setResult(data),
  onError: (error) => setError(error.message),
});
```

### After (v4 compatible)

```typescript
const [execute, { data, loading, error }] = useLazyQuery(QUERY);

useEffect(() => {
  if (data) setResult(data);
}, [data]);

useEffect(() => {
  if (error) setError(error.message);
}, [error]);
```

<div class="abs-bl m-6 text-sm opacity-70">
  React useEffect pattern for side effects
</div>

---

## Mutation Refactoring Pattern

### Before (v3 - deprecated)

```typescript
const [save, { loading }] = useMutation(MUTATION, {
  onCompleted: () => router.push("/success"),
  onError: (error) => toast.error(error.message),
});

const handleSave = () => save({ variables: { data } });
```

### After (v4 compatible)

```typescript
const [save, { loading }] = useMutation(MUTATION);

const handleSave = async () => {
  try {
    await save({ variables: { data } });
    router.push("/success");
  } catch (error) {
    toast.error(error.message);
  }
};
```

<div class="abs-bl m-6 text-sm opacity-70">
  Async/await pattern for mutations
</div>

---

## Error Link Migration

### Before (v3)

```typescript
import { onError } from "@apollo/client/link/error";

const errorLink = onError(({ graphQLErrors, networkError }) => {
  if (networkError) {
    const serverError = networkError as ServerError;
    if (serverError.statusCode === 401) {
      window.location.href = "/login";
    }
  }
});
```

### After (v4)

```typescript
import { ErrorLink, ServerError } from "@apollo/client";

const errorLink = new ErrorLink(({ error }) => {
  if (ServerError.is(error)) {
    if (error.status === 401) {
      // status is properly typed
      window.location.href = "/login";
    }
  }
});
```

<div class="abs-bl m-6 text-sm opacity-70">
  apps/winkel/src/links/getErrorLink.tsx
</div>

---

## layout: section

# Implementation Plan

Phase-by-phase execution

---

## Phase 1: Validate RC (Week 1-2)

```
┌──────────────────────────────────────────────────────────────────┐
│  Step 1.1: Create test branch                                    │
│    git checkout -b test/apollo-link-rest-rc                      │
│                                                                   │
│  Step 1.2: Upgrade apollo-link-rest only                         │
│    "apollo-link-rest": "0.10.0-rc.2"                             │
│    @apollo/client stays at 3.10.4                                │
│                                                                   │
│  Step 1.3: Test all REST operations                              │
│    □ Postcode check queries                                       │
│    □ Adviesmodule mutations                                       │
│    □ Profile data operations                                      │
│                                                                   │
│  Decision point: If critical issues → Option C (wait)            │
└──────────────────────────────────────────────────────────────────┘
```

<div class="abs-bl m-6 text-sm opacity-70">
  tools/codegen/apps/winkel/oas.json
</div>

---

## Phase 2: Remove Callbacks (Week 3-4)

```
┌──────────────────────────────────────────────────────────────────┐
│  Files to update (~30 locations):                                │
│                                                                   │
│  apps/winkel/src/                                                │
│    ├── pages/postcodechecker/index.tsx                           │
│    ├── pages/adviesmodule/index.tsx                              │
│    └── components/AdviesmoduleContainer/useSaveAdviesmodule.ts   │
│                                                                   │
│  apps/mijn.zorgenzekerheid.nl/src/                               │
│    └── [similar component files]                                 │
│                                                                   │
│  Pattern: onCompleted/onError ──> useEffect or async/await       │
└──────────────────────────────────────────────────────────────────┘
```

**Still on Apollo Client 3.10.4** - no breaking changes yet

<div class="abs-bl m-6 text-sm opacity-70">
  grep -r "onCompleted" apps/
</div>

---

## Phase 3: Upgrade to v4 (Week 5-6)

```
┌──────────────────────────────────────────────────────────────────┐
│  Step 3.1: Run codemod                                           │
│    npx @apollo/client-codemod-migrate-3-to-4 apps/winkel/src     │
│                                                                   │
│  Step 3.2: Update dependencies                                   │
│    "@apollo/client": "^4.0.0"                                    │
│    "rxjs": "^7.8.0"                                              │
│                                                                   │
│  Step 3.3: Update error handling                                 │
│    onError() ──> new ErrorLink()                                 │
│    ServerError type checking                                     │
│                                                                   │
│  Step 3.4: Regenerate types                                      │
│    rush codegen                                                   │
└──────────────────────────────────────────────────────────────────┘
```

<div class="abs-bl m-6 text-sm opacity-70">
  github.com/apollographql/apollo-client-codemods
</div>

---

layout: two-cols
layoutClass: gap-8

---

## Success Criteria

### Phase 1 Complete ✓

- All REST operations work
- No critical bugs in RC
- Performance equal or better

### Phase 2 Complete ✓

- All callbacks removed
- No deprecated patterns
- Tests passing

::right::

### Phase 3 Complete ✓

- Apollo Client 4 installed
- All imports updated
- Error handling refactored
- Comprehensive tests passed
- Production deployment successful

<div class="abs-bl m-6 text-sm opacity-70">
  Track progress in project management tool
</div>

---

## layout: section

# Resources

Documentation and links

---

## Key Resources

<div class="grid grid-cols-2 gap-8">

<div>

### Official Docs

- [Apollo Client 4 Migration Guide](https://apollographql.com/docs/react/migrating/apollo-client-4-migration)
- [Apollo Client 4 Changelog](https://github.com/apollographql/apollo-client/blob/main/CHANGELOG.md)
- [apollo-link-rest NPM](https://npmjs.com/package/apollo-link-rest)
- [Apollo Codemods](https://github.com/apollographql/apollo-client-codemods)

</div>

<div>

### Project Files

- [apps/winkel/src/ApolloProvider.tsx](apps/winkel/src/ApolloProvider.tsx)
- [apps/winkel/src/links/getErrorLink.tsx](apps/winkel/src/links/getErrorLink.tsx)
- [apps/winkel/src/links/getRestLink.ts](apps/winkel/src/links/getRestLink.ts)
- [tools/codegen/codegen-from-schema.js](tools/codegen/codegen-from-schema.js)

</div>

</div>

<div class="abs-bl m-6 text-sm opacity-70">
  Full migration guide: plan.md
</div>

---

layout: center
class: text-center

---

# Questions?

<div class="mt-8">

**Recommendation:** Start with Option B (Incremental Migration)

Phase 1 validates the RC before committing to full upgrade

</div>

<div class="abs-bl m-6 text-sm opacity-70">
  Apollo Client 4 Migration | 2025
</div>
