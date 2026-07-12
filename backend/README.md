# Loyalty Backend API

Backend service with Supabase service role for managing user accounts.

## Setup

1. Install dependencies:
```bash
cd backend
npm install
```

2. Create `.env` file:
```bash
cp .env.example .env
```

3. Add your Supabase credentials to `.env`:
   - `SUPABASE_URL`: Your Supabase project URL
   - `SUPABASE_SERVICE_ROLE_KEY`: Service role key (from Supabase dashboard)
   - `API_SECRET_KEY`: Generate a random string for API security
   - `FRONTEND_URL`: Your frontend URL

4. Run development server:
```bash
npm run dev
```

5. Build for production:
```bash
npm run build
npm start
```

## Deploy to Render

1. Push code to GitHub
2. Create new Web Service on Render
3. Connect your repository
4. Set build command: `npm install && npm run build`
5. Set start command: `npm start`
6. Add environment variables in Render dashboard
7. Deploy!

## API Endpoints

All endpoints require `x-api-key` header with your API_SECRET_KEY.

### POST `/api/auth/create-business-owner`
Create business owner account
```json
{
  "email": "owner@coffee-shop.com",
  "password": "SecurePass123",
  "full_name": "John Doe",
  "business_id": "uuid-here",
  "requester_role": "super_admin"
}
```

### POST `/api/auth/create-staff`
Create staff account
```json
{
  "email": "staff@coffee-shop.com",
  "password": "SecurePass123",
  "full_name": "Jane Smith",
  "phone_number": "+968 9123 4567",
  "business_id": "uuid-here",
  "requester_role": "business_admin"
}
```

### POST `/api/auth/reset-password`
Reset user password
```json
{
  "user_id": "uuid-here",
  "new_password": "NewSecurePass123",
  "requester_role": "business_admin"
}
```

### POST `/api/auth/update-email`
Update user email
```json
{
  "user_id": "uuid-here",
  "new_email": "newemail@example.com",
  "requester_role": "business_admin"
}
```

### POST `/api/auth/delete-user`
Delete user (super admin only)
```json
{
  "user_id": "uuid-here",
  "requester_role": "super_admin"
}
```

## Security

- All endpoints require API key header
- Service role key is never exposed to frontend
- Rate limiting: 100 requests per 15 minutes
- CORS configured for your frontend only
- Helmet.js for security headers
