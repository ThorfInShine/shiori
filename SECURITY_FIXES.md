# Security Fixes Applied - 2026-10-25

## Summary
Fixed 5 security vulnerabilities (3 HIGH, 2 MEDIUM severity) identified in security audit.

## Vulnerabilities Fixed

### 1. Authentication Bypass via Cookie Forgery (HIGH)
**Files Modified:**
- `lib/auth.ts` - Implemented JWT-based authentication
- `app/api/admin/login/route.ts` - Generate signed tokens
- `.env` - Added JWT_SECRET

**Fix:**
- Replaced plain-text cookies with cryptographically signed JWT tokens
- Admin sessions now use `jwt.sign()` with HS256 algorithm
- Session validation verifies signature and expiry on every request
- Tokens expire after 24 hours

**Before:** `admin_session=admin` (plain text, forgeable)
**After:** `admin_session=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` (signed JWT)

---

### 2. Division Authentication Bypass (HIGH)
**Files Modified:**
- `lib/auth.ts` - Added `getDivisionSession()` with JWT verification
- `app/api/admin/login/route.ts` - Generate signed division tokens
- `app/api/user/cart/route.ts` - Use secure session validation
- `app/api/user/session/route.ts` - Use secure session validation
- `app/api/user/order/route.ts` - Use secure session validation

**Fix:**
- Division sessions now use signed JWT tokens instead of plain JSON
- All division endpoints validate JWT signature before trusting session data
- Prevents impersonation attacks via cookie manipulation

**Before:** `division_session={"id":1,"username":"victim",...}` (plain JSON)
**After:** `division_session=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` (signed JWT)

---

### 3. Price Manipulation in Order Creation (HIGH)
**Files Modified:**
- `app/api/user/order/route.ts`

**Fix:**
- Server now fetches prices from database, never trusts client-provided prices
- Validates that client's `hargaSatuan` matches either `book.hargaLks` or `book.hargaPg`
- Returns 400 error if price doesn't match database
- Calculates subtotal server-side using validated prices

**Before:**
```typescript
const subtotal = items.reduce((sum, i) => sum + i.jumlah * i.hargaSatuan, 0)
```

**After:**
```typescript
const book = await prisma.book.findUnique({ where: { id: item.bookId } })
const hargaSatuan = item.hargaSatuan === book.hargaLks ? book.hargaLks :
                    item.hargaSatuan === book.hargaPg ? book.hargaPg : null
if (!hargaSatuan || hargaSatuan <= 0) {
  return NextResponse.json({ error: 'Invalid price' }, { status: 400 })
}
```

---

### 4. Mass Assignment in Order Status Update (MEDIUM)
**Files Modified:**
- `app/api/orders/[id]/route.ts`

**Fix:**
- Added status whitelist: `['pending', 'confirmed', 'cancelled']`
- Validates status against whitelist before database update
- Returns 400 error for invalid status values

**Before:**
```typescript
data: { status: body.status }  // No validation
```

**After:**
```typescript
const VALID_STATUSES = ['pending', 'confirmed', 'cancelled'] as const
if (!body.status || !VALID_STATUSES.includes(body.status)) {
  return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
}
```

---

### 5. Integer Overflow via Cart Quantity (MEDIUM)
**Files Modified:**
- `app/api/user/cart/route.ts`
- `app/api/user/order/route.ts`

**Fix:**
- Added quantity validation: must be integer between 1 and 10,000
- Rejects negative quantities and extremely large values
- Applied to both cart save and order creation endpoints

**Validation:**
```typescript
if (!Number.isInteger(item.jumlah) || item.jumlah < 1 || item.jumlah > 10000) {
  return NextResponse.json({ error: 'Invalid quantity' }, { status: 400 })
}
```

---

## Testing Recommendations

### 1. Test Authentication
```bash
# Should fail - forged admin cookie
curl -H "Cookie: admin_session=admin" http://localhost:3000/api/orders

# Should succeed - valid JWT after login
curl -X POST http://localhost:3000/api/admin/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"password"}'
```

### 2. Test Price Validation
```bash
# Should fail - price manipulation attempt
curl -X POST http://localhost:3000/api/user/order \
  -H "Cookie: division_session=<valid_jwt>" \
  -H "Content-Type: application/json" \
  -d '{
    "buyerNama": "Test",
    "buyerArea": "Test",
    "items": [{"bookId": 1, "jumlah": 10, "hargaSatuan": 1}]
  }'
```

### 3. Test Quantity Validation
```bash
# Should fail - negative quantity
curl -X PUT http://localhost:3000/api/user/cart \
  -H "Cookie: division_session=<valid_jwt>" \
  -H "Content-Type: application/json" \
  -d '{"cart": [{"bookId": 1, "jenis": "lks", "jumlah": -100}]}'
```

---

## Dependencies Added
- `jsonwebtoken@^9.0.2` - JWT token generation and verification
- `@types/jsonwebtoken@^9.0.7` - TypeScript definitions

---

## Environment Variables Required
```env
JWT_SECRET=your-secret-key-here
```

⚠️ **IMPORTANT:** Change `JWT_SECRET` in production to a strong random value (minimum 32 characters).

---

## Migration Notes
- Existing sessions will be invalidated - all users must re-login
- No database schema changes required
- Build completed successfully with TypeScript checks passing
