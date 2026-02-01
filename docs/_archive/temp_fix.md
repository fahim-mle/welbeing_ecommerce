# Issues

## Issue 1

Status: ✅ Resolved

coderabbitai 1 day ago
⚠️ Potential issue | 🟡 Minor

Verify error response field extraction.

**File location**: `@src/frontend/src/api/orders.ts`

The error extraction uses error?.message, but per coding guidelines, the backend returns structured JSON like { success: false, error: { message: "...", code: "..." } }. Consider adjusting to match:

   if (!response.ok) {
     const error = await response.json().catch(() => null);

- throw new Error(error?.message || 'Failed to cancel order');

- throw new Error(error?.error?.message || error?.message || 'Failed to cancel order');
   }

**FOR AI AGENT**: In `@src/frontend/src/api/orders.ts` around lines 144 - 147, The current error
handling reads response.json() and uses error?.message, but the backend wraps
errors as { success: false, error: { message, code } }; update the extraction
after response.json() (the code around response, response.json(), and the throw
new Error call) to first look for json.error?.message, then fallback to
json.message, then a default string (e.g., 'Failed to cancel order'); ensure the
thrown Error uses that resolved message so nested error.message (and optionally
error.code) are correctly surfaced.

## Issue 2 & 3

Status: ✅ Resolved

coderabbitai 1 day ago
⚠️ Potential issue | 🟠 Major

**File Location**: `@src/frontend/src/pages/Profile.tsx`

🏁 Script executed:

rg -n -A 10 'updateUser' src/frontend/src/context/AuthContext.tsx
Repository: fahim-mle/welbeing_ecommerce

Length of output: 453

🏁 Script executed:

cat -n src/frontend/src/context/AuthContext.tsx | head -90
Repository: fahim-mle/welbeing_ecommerce

Length of output: 3112

🏁 Script executed:

## Verify Profile.tsx uses updateUser in effect dependency array

rg -n -A 5 'useEffect' src/frontend/src/pages/Profile.tsx | head -30
Repository: fahim-mle/welbeing_ecommerce

Length of output: 1010

🏁 Script executed:

## Get the complete first useEffect with its dependency array

sed -n '33,58p' src/frontend/src/pages/Profile.tsx
Repository: fahim-mle/welbeing_ecommerce

Length of output: 804

Wrap updateUser in useCallback in AuthContext to prevent infinite re-render loop.

The updateUser function is recreated on every render of AuthProvider since it's not memoized. Including it in the useEffect dependency array of Profile.tsx (line 57) causes the effect to re-run whenever AuthProvider re-renders, creating a loop: effect runs → calls updateUser → updates user state → AuthProvider re-renders → new updateUser reference → effect re-runs.

Fix in src/frontend/src/context/AuthContext.tsx:

const updateUser = useCallback((nextUser: User) => {
  setUser(nextUser);
  localStorage.setItem('user', JSON.stringify(nextUser));
}, []);

**Agent Prompt**: In `@src/frontend/src/pages/Profile.tsx` around lines 33 - 58, The issue is that
updateUser is recreated on every render of AuthProvider causing the useEffect in
Profile.tsx to repeatedly retrigger; fix by memoizing updateUser inside
AuthProvider using React's useCallback so its reference is stable (wrap the
function that calls setUser and persists to localStorage in useCallback with an
empty dependency array), ensuring updateUser remains the same between renders
and stops the infinite re-render loop.

coderabbitai1 day ago
⚠️ Potential issue | 🟠 Major

Password change flow lacks current password verification.

The password change form only asks for a new password and confirmation, but does not require the current password. This is a security concern — users should verify their identity before changing credentials.

Add a currentPassword field to the form:

- const [passwordForm, setPasswordForm] = useState({ password: '', confirm: '' });

- const [passwordForm, setPasswordForm] = useState({ currentPassword: '', password: '', confirm: '' });
Update the handler and API call to include current password verification:

```tsx
  const handleChangePassword = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setPasswordMessage(null);
    setPasswordError(null);

    if (!token) return;
- if (!passwordForm.currentPassword) {
-     setPasswordError('Current password is required.');
-     return;
- }
    if (passwordForm.password.length < 6) {
      setPasswordError('Password must be at least 6 characters.');
      return;
    }
    // ...
    try {

-     await authApi.changePassword(token, passwordForm.password);

+     await authApi.changePassword(token, passwordForm.currentPassword, passwordForm.password);

```

**Agent Prompt**In `@src/frontend/src/pages/Profile.tsx` around lines 119 - 142, The password
change flow (handleChangePassword) currently only uses passwordForm.password and
confirm; add a passwordForm.currentPassword field and update the form UI to
collect it, validate that currentPassword is provided before proceeding, adjust
the checks to use passwordForm.currentPassword (e.g., non-empty) along with
existing length and confirm checks, and change the authApi call
(authApi.changePassword) to accept and forward the currentPassword alongside the
new password so the backend can verify the current credential; also reset
currentPassword in setPasswordForm after success and surface any server
validation errors via setPasswordError.

## Issue 4

Status: ✅ Resolved

coderabbitai1 day ago
⚠️ Potential issue | 🟠 Major

**File Location**: `@src/frontend/src/context/CartContext.tsx`

Logic bug: removeItem incorrectly removes variant items when variantId is undefined.

The filter condition item.variant?.id !== variantId evaluates to undefined !== undefined which is false, causing items with a variant to be retained when they should be removed (if the product ID matches but no variantId is specified). The current logic fails to remove a base product (no variant) when variant items of the same product exist.

However, more critically: if you call removeItem(productId) without a variantId intending to remove a non-variant item, and you have variant items for the same product, the logic is ambiguous.

Be explicit about matching items with or without variants:

```tsx
  const removeItem = (productId: number, variantId?: number) => {
    setItems((prev) =>
      prev.filter(

-       (item) => item.product.id !== productId || item.variant?.id !== variantId,

+       (item) => {
-         if (item.product.id !== productId) return true;
-         // When variantId is specified, only remove items with that variant
-         // When variantId is undefined, only remove items without a variant
-         return variantId !== undefined
-           ? item.variant?.id !== variantId
-           : item.variant !== undefined;
-       },
      ),
    );
  };

```

**Agent Prompt**:In `@src/frontend/src/context/CartContext.tsx` around lines 41 - 47, removeItem's
filter currently compares item.variant?.id to variantId causing unintended
matches when variantId is undefined; instead, make the predicate explicit: if
variantId is provided, remove items where item.product.id === productId &&
item.variant?.id === variantId; if variantId is undefined, remove items where
item.product.id === productId && item.variant is undefined (no variant). Update
the removeItem implementation (references: removeItem, setItems, item.variant,
item.product.id) to branch on whether variantId is defined so varianted items
aren't accidentally kept or removed.

## Issue 5

Status: ✅ Resolved

coderabbitai1 day ago
⚠️ Potential issue | 🟡 Minor

Input allows negative values despite min={1} attribute.

The min attribute only restricts spinner controls, not direct text input. The onChange handler uses Number(event.target.value) || 1, which allows negative numbers to pass through (e.g., -5 would be valid).

```tsx
                       onChange={(event) =>
                         updateQuantity(
                           item.product.id,

-                          Number(event.target.value) || 1,

+                          Math.max(1, Number(event.target.value) || 1),
                           item.variant?.id,
                         )
                       }
```

‼️ IMPORTANT
Carefully review the code before committing. Ensure that it accurately replaces the highlighted code, contains no missing lines, and has no issues with indentation. Thoroughly test & benchmark the code to ensure it meets the requirements.

Suggested change:

```tsx

                      <input
                        type="number"
                        min={1}
                        value={item.quantity}
                        onChange={(event) =>
                          updateQuantity(
                            item.product.id,
                            Math.max(1, Number(event.target.value) || 1),
                            item.variant?.id,
                          )
                        }
                        className="w-16 text-center border border-gray-200 rounded-lg py-2 text-sm"
                      />
```

In `@src/frontend/src/pages/Cart.tsx` around lines 72 - 84, The quantity input
allows negative numbers because Number(event.target.value) || 1 doesn't prevent
negatives; update the onChange handler for the input so it parses the input as a
number, defaults to 1 on NaN, and clamps the value to a minimum of 1 (e.g., let
qty = parseInt(event.target.value, 10); if (isNaN(qty)) qty = 1; qty =
Math.max(1, qty); then call updateQuantity(item.product.id, qty,
item.variant?.id)); this ensures negative values cannot be passed to
updateQuantity.
