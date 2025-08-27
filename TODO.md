# Hub.Skillout.pro - TODO

## Completed ✅
- [x] Setup design tokens and global theme
- [x] Header navigation with menu toggle
- [x] Home hero module with countdown
- [x] Home overview section
- [x] How it works grid section
- [x] Footer links and social
- [x] Routes setup (register, profiles, profile/[id], invite, login)
- [x] API client layer with axios
- [x] Creator registration wizard
- [x] Public profiles listing
- [x] Profile details page with portfolio
- [x] Video portfolio upload (Kinescope placeholder)
- [x] Invites system (issuing, quota, redemption)
- [x] Ratings and recommendations with badges
- [x] Admin moderation panel
- [x] Subscription tiers and gated contacts
- [x] Basic analytics events
- [x] UI polish and hover effects
- [x] Special animated WOW card
- [x] **Redis Database Setup**
  - [x] Install Redis client dependencies
  - [x] Configure environment variables
  - [x] Setup Redis connection utilities
  - [x] Define data models and schema
- [x] **Authentication System**
  - [x] Implement email magic link auth
  - [x] Redis session management
  - [x] User state persistence
  - [x] Protected routes middleware
- [x] **API Routes with Redis**
  - [x] User registration/login endpoints
  - [x] Session management endpoints
  - [x] Authentication middleware
- [x] **Data Models Integration**
  - [x] Connect existing modules to Redis
  - [x] Update profile CRUD operations
  - [x] Implement invite management with Redis
  - [x] Add subscription handling

## In Progress 🔄
- [ ] **Testing & Debugging**
  - [ ] Test authentication flow
  - [ ] Test profile creation and management
  - [ ] Test invite system
  - [ ] Test subscription gating

## Pending 📋
- [ ] **Vercel Deployment**
  - [ ] Configure Redis addon
  - [ ] Environment variables setup
  - [ ] Production deployment

- [ ] **Performance & A11y**
  - [ ] Lazy loading for images
  - [ ] Semantic HTML improvements
  - [ ] Accessibility audit

## Testing Instructions

### Local Development Setup
1. **Install Redis locally or use Docker:**
   ```bash
   docker run -d -p 6379:6379 redis:alpine
   ```

2. **Copy environment variables:**
   ```bash
   cp env.example .env.local
   ```

3. **Update `.env.local` with your configuration:**
   ```env
   REDIS_HOST=localhost
   REDIS_PORT=6379
   MAGIC_LINK_SECRET=your-super-secret-key-here
   PASSWORD_SALT=your-password-salt-here
   NEXT_PUBLIC_BASE_URL=http://localhost:3000
   ```

4. **Start development server:**
   ```bash
   yarn dev
   ```

### Testing Flow

#### 1. Authentication Testing
1. Go to `/register` and create a new user
2. Check console for magic link (development mode)
3. Click the magic link to verify authentication
4. Test logout functionality

#### 2. Profile Management
1. After login, create a profile via API or UI
2. Test profile listing at `/profiles`
3. Test profile details at `/profile/[id]`
4. Test profile editing

#### 3. Invite System
1. Login as a producer/admin
2. Go to `/invite` and create invites
3. Test invite redemption during registration
4. Verify quota management

#### 4. Subscription Testing
1. Test subscription tier changes
2. Verify contact gating on profiles
3. Test different subscription levels

#### 5. API Testing
Test all endpoints:
- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me`
- `POST /api/auth/logout`
- `GET /api/profiles`
- `POST /api/profiles`
- `GET /api/profiles/[id]`
- `PUT /api/profiles/[id]`
- `GET /api/invites`
- `POST /api/invites`
- `GET /api/subscriptions`
- `PUT /api/subscriptions`

## Deployment Instructions

### Vercel Deployment
1. Install Vercel CLI:
   ```bash
   npm i -g vercel
   ```

2. Add Redis addon to your Vercel project:
   ```bash
   vercel add redis
   ```

3. Configure environment variables in Vercel dashboard:
   - `MAGIC_LINK_SECRET`: Generate a secure random string
   - `PASSWORD_SALT`: Generate a secure random string
   - `NEXT_PUBLIC_BASE_URL`: Your production URL
   - Redis variables will be auto-configured by the addon

4. Deploy:
   ```bash
   vercel --prod
   ```

### Email Setup (Production)
For production magic links, configure email service:
- Gmail SMTP
- SendGrid
- Resend
- Or any SMTP provider

Update environment variables with your email credentials.
