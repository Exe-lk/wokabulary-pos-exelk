# Portion Validation Features

## Overview
The portion management system now includes comprehensive validation to prevent duplicate portion names and ensure data integrity.

## Backend Validation

### API Endpoint
- **POST** `https://wokabulary.netlify.app/api/admin/portions`

### Validation Rules

1. **Required Field Validation**
   - Portion name is required
   - Empty or whitespace-only names are rejected

2. **Length Validation**
   - Minimum length: 2 characters
   - Maximum length: 50 characters

3. **Duplicate Name Validation**
   - Case-insensitive duplicate detection
   - Prevents creation of portions with the same name (e.g., "Small" vs "small" vs "SMALL")
   - Provides clear error messages indicating the duplicate name

4. **Data Sanitization**
   - Automatically trims whitespace from names and descriptions
   - Stores clean, normalized data

### Error Responses

```json
{
  "error": "Portion name is required"
}
```

```json
{
  "error": "Portion name must be at least 2 characters long"
}
```

```json
{
  "error": "Portion name must be less than 50 characters"
}
```

```json
{
  "error": "Portion with name \"Small\" already exists. Please choose a different name."
}
```

## Frontend Validation

### Client-Side Validation
- Real-time validation before API calls
- Character count display (current/maximum)
- Immediate feedback for validation errors
- Prevents unnecessary API requests

### User Interface Features
- Character counter: `{current}/50`
- Minimum length indicator
- Maximum length enforcement via `maxLength` attribute
- Clear error messages displayed in the modal

## Database Constraints

### Unique Index
- Database-level unique constraint on the `name` field
- Ensures data integrity even if API validation is bypassed
- Migration: `CREATE UNIQUE INDEX "portions_name_key" ON "public"."portions"("name");`

## Testing

### Manual Testing
1. Try to create a portion with an existing name
2. Try to create a portion with case variations (e.g., "Small" vs "small")
3. Try to create a portion with empty name
4. Try to create a portion with single character
5. Try to create a portion with more than 50 characters

### Automated Testing
Run the test script to verify validation:
```bash
node test-portion-validation.js
```

## Implementation Details

### Backend (API Route)
- Uses Prisma's `findFirst` with case-insensitive search
- Implements comprehensive input validation
- Returns appropriate HTTP status codes (400 for validation errors)

### Frontend (Modal Component)
- Client-side validation for immediate feedback
- Character count display
- Proper error handling and display
- Form reset on successful creation

## Benefits

1. **Data Integrity**: Prevents duplicate portion names at multiple levels
2. **User Experience**: Clear error messages and immediate feedback
3. **Performance**: Client-side validation reduces unnecessary API calls
4. **Security**: Server-side validation ensures data consistency
5. **Maintainability**: Clean, well-documented validation logic
