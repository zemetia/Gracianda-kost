---
name: debug-backend
description: Debugs backend issues by running build checks and analyzing errors. Decides between simple fixes and deep research. Use when user wants to debug backend build errors or mentions "debug-backend".
---

# Debug Backend

## Quick Start
1. Run `npm run build` in the backend directory.
2. Analyze the output.
3. Fix simple errors directly; use `be-research` for complex ones.

## Workflow

### 1. Execute Build
Run the build command to generate the current set of errors.
```bash
cd boostup-be
npm run build
```

### 2. Analyze Errors
Read the output/logs carefully. Identify the file, line number, and error message.

### 3. Determine Complexity
Classify the error into one of two categories:

**Type A: Simple / Basic**
*   **Examples**:
    *   Syntax errors (missing semicolon, bracket).
    *   "Cannot find name 'X'" (missing import).
    *   "Property 'X' does not exist on type 'Y'" (misspelled property).
    *   Type mismatches that are obvious (string vs number).
*   **Action**: **Fix the code directly.** Do NOT call `be-research`.

**Type B: Complex / Architectural**
*   **Examples**:
    *   "Module X has no exported member Y" (potential library breaking change).
    *   Deeply nested type instantiation errors.
    *   Database schema mismatches requiring migration strategy.
    *   Performance bottlenecks.
    *   Deprecation warnings with no clear immediate alternative.
    *   User explicitly asks for "best practice".
*   **Action**: **Call `be-research` skill.** Provide the error content and context to find the best practice solution.

### 4. Execute Fix
- **If Simple**: Apply the fix using `replace_file_content` or `multi_replace_file_content`.
- **If Complex**: Follow the instructions provided by the `be-research` skill output.

### 5. Verify
After applying the fix, run `npm run build` again to ensure the error is resolved and no new errors were introduced.

## Examples

**Input**: User says "Debug the build error."
**Action**: Run `npm run build`. 
**Result**: `src/services/user.service.ts:10:5 - error TS2322: Type 'string' is not assignable to type 'number'.`
**Decision**: Simple.
**Fix**: User changed type definition or passed wrong variable. Fix code directly.

**Input**: User says "Investigate why this library import is failing after upgrade."
**Action**: Run `npm run build`.
**Result**: `Module '"package-x"' has no exported member 'OldFunction'.`
**Decision**: Complex (might need new implementation details).
**Fix**: Call `be-research` to look up "package-x migration guide 'OldFunction'".
