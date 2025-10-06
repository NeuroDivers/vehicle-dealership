# 🚗 Vehicle Dealership Platform

A production-ready, AI-powered vehicle dealership management system built with Next.js and deployed on Cloudflare Pages.

## 🌐 Production Deployment

This application is deployed on **Cloudflare Pages** with automatic deployments from the `main` branch.

### Deployment Process
1. Push changes to GitHub `main` branch
2. Cloudflare Pages automatically builds and deploys
3. Changes are live within 2-3 minutes

### Tech Stack
- **Frontend**: Next.js 14 (Static Site Generation)
- **Backend**: Cloudflare Workers
- **Database**: Cloudflare D1 (SQLite)
- **Images**: Cloudflare Images CDN
- **Analytics**: Cloudflare D1
- **AI**: OpenAI GPT-4

### Production Architecture
```
┌─────────────────────────────────────────────────────────┐
│                 Cloudflare Pages                        │
│              (Next.js Frontend)                         │
│          https://autopret123.ca                         │
└────────────────┬────────────────────────────────────────┘
                 │
                 ├──> Cloudflare Workers API
                 │    ├─> vehicle-dealership-api (Main API)
                 │    ├─> naniauto-scraper (Vendor sync)
                 │    ├─> sltautos-scraper (Vendor sync)
                 │    ├─> lambert-scraper (Vendor sync)
                 │    └─> image-processor (Cloudflare Images)
                 │
                 ├──> Cloudflare D1 Database
                 │    └─> vehicle-dealership-analytics
                 │
                 └──> Cloudflare Images CDN
                      └─> Optimized vehicle photos
```

### Workers Deployed
1. **vehicle-dealership-api** - Main REST API for vehicle data
2. **naniauto-scraper** - NaniAuto.com inventory sync
3. **sltautos-scraper** - SLTAutos.com inventory sync  
4. **lambert-scraper** - LambertAuto inventory sync
5. **image-processor** - Cloudflare Images upload handler
6. **vendor-sync-worker** - Vendor lifecycle management

## 🚀 Advanced Features

### 🤖 AI-Powered Features
- **AI Vehicle Descriptions**: Automatically generate compelling vehicle descriptions using OpenAI GPT-4
- **AI Translation**: Translate content to multiple languages (French, Spanish, German, Italian, Portuguese)
- **AI Social Media Captions**: Generate platform-optimized social media posts
- **AI Image Analysis**: Analyze vehicle images and generate detailed descriptions
- **AI Lead Follow-up**: Generate personalized follow-up emails for leads
- **AI Lead Quality Analysis**: Analyze lead quality and provide actionable insights

### 📱 Social Media Automation
- **Auto Social Posting**: Automatically post new vehicles to social media platforms
- **Multi-Platform Support**: Twitter, Facebook, Instagram, LinkedIn
- **Scheduled Posting**: Optimal posting times for maximum engagement
- **AI-Generated Content**: Smart captions tailored to each platform
- **Image Integration**: Include vehicle photos in social media posts

### 🔧 Technical Features
- **Cloudflare Images**: Optimized image storage and delivery
- **Analytics Dashboard**: Real-time insights and conversion tracking
- **SEO Optimization**: Meta tags, sitemap generation, Google Analytics
- **Performance Optimization**: Lazy loading, CDN, query optimization
- **Mobile-First Design**: Responsive across all devices
- **Accessibility**: WCAG compliance and screen reader support

## 🛠️ Setup Instructions

### AI Features Setup
1. Get OpenAI API key from [OpenAI Platform](https://platform.openai.com/api-keys)
2. Add to your environment variables:
```env
OPENAI_API_KEY=your_openai_api_key_here
```

### Social Media Setup
Configure API credentials for each platform you want to use:

#### Twitter
```env
TWITTER_API_KEY=your_api_key
TWITTER_API_SECRET=your_api_secret
TWITTER_ACCESS_TOKEN=your_access_token
TWITTER_ACCESS_TOKEN_SECRET=your_access_token_secret
```

#### Facebook
```env
FACEBOOK_PAGE_ID=your_page_id
FACEBOOK_ACCESS_TOKEN=your_access_token
```

#### Instagram
```env
INSTAGRAM_ACCESS_TOKEN=your_access_token
INSTAGRAM_USER_ID=your_user_id
```

#### LinkedIn
```env
LINKEDIN_ACCESS_TOKEN=your_access_token
LINKEDIN_ORGANIZATION_ID=your_org_id
```

### Environment Variables
Environment variables are configured in:
- **Cloudflare Pages**: Project settings > Environment variables
- **Cloudflare Workers**: wrangler.toml files in `/workers` directory

## ⚙️ Admin Settings & Permissions

The admin dashboard now includes a comprehensive **Settings** section (`/admin/settings`) with:

### Permission Hierarchy
- **👑 Developer (Dev)**: Full access to all features and settings
- **👤 Admin**: Can manage features if enabled by dev, limited API key access
- **🔒 User**: Read-only access

### Feature Management
- **AI Features**: Toggle individual AI capabilities (descriptions, translation, analysis, etc.)
- **Social Media**: Enable/disable platforms and auto-posting
- **API Keys**: Secure credential management with visibility controls
- **Connection Testing**: Test API connections before enabling features

### Security Features
- **API Key Protection**: Keys are masked for non-dev users
- **Feature Restrictions**: Dev can globally disable features for all admins
- **Audit Trail**: Settings changes are logged
- **Access Control**: Granular permissions for different user levels

### Architecture
- **Backend**: API routes in `/api/admin/` for settings, permissions, and testing
- **Frontend**: React component with tabbed interface for easy management
- **Validation**: Server-side validation and permission checks
- **Persistence**: Settings stored securely with proper access controls

## 🤖 AI Chat Assistant

Your dealership now features an intelligent conversational AI that can:

- **Search Inventory**: Find vehicles matching customer preferences
- **Smart Recommendations**: Suggest alternatives when no matches found
- **Partner Integration**: Offer to search through partners or auctions
- **Natural Conversation**: Maintain context and provide helpful responses

### Features

- **Intelligent Search**: Uses OpenAI function calling to search your D1 database
- **Fallback Options**: Offers partner search or auction access when inventory is unavailable
- **Context Awareness**: Remembers conversation history for natural dialogue
- **Vehicle Details**: Provides specific vehicle information with pricing and specs

### Implementation

```tsx
import AIChatWidget from '@/components/AIChatWidget';

// Add to your main layout or homepage
<AIChatWidget />
```

### API Endpoint

**POST** `/api/chat`

Request body:
```json
{
  "message": "I'm looking for a Toyota Camry under $25,000",
  "conversationHistory": [...]
}
```

Response:
```json
{
  "response": "I'd be happy to help you find a Toyota Camry...",
  "vehicles": [...],
  "suggestedAction": "search_partners",
  "conversationHistory": [...]
}
```

### Configuration

The AI uses these OpenAI models:
- **GPT-4**: For intelligent conversation and complex reasoning
- **Function Calling**: To search your inventory database
- **Temperature 0.7**: For natural, varied responses

### Example Conversations

**Customer**: "I'm looking for a reliable sedan under $20,000"
**AI**: Searches inventory → Finds matching Honda Civic → Provides details

**Customer**: "Do you have any electric SUVs?"
**AI**: Searches inventory → No matches → Offers partner search option
- **Settings & API Keys**: Comprehensive configuration with permission controls
- **Analytics Dashboard**: View conversion rates, lead sources, popular vehicles
- **Enhanced Vehicle Management**: AI-powered descriptions and image analysis
- **Lead Management**: AI follow-up emails and quality scoring

## 🔄 API Endpoints

### AI Features
```
POST /api/ai
- Actions: generate-description, translate, generate-caption, analyze-image, generate-followup, analyze-lead
```

### Social Media
```
POST /api/social-post
- Post to social media platforms with AI-generated content

GET /api/social-post
- Get social media posting history
```

## 🎯 Next Steps & Roadmap

### High Priority
- [ ] Analytics dashboard with conversion tracking
- [ ] Performance optimization (lazy loading, CDN)
- [ ] SEO improvements (meta tags, sitemap)
- [ ] UI/UX polish and accessibility

### Medium Priority
- [ ] Advanced financing calculator with API integration
- [ ] Mobile app companion (React Native)
- [ ] CRM integration capabilities
- [ ] Automated lead nurturing system

### Future Enhancements
- [ ] AI-powered price optimization
- [ ] Voice search and commands
- [ ] AR vehicle visualization
- [ ] Integration with auto auction platforms
- [ ] Advanced inventory forecasting

---

## 💡 Usage Examples

### Generate AI Description
```javascript
const description = await generateVehicleDescription({
  make: 'Toyota',
  model: 'Camry',
  year: 2024,
  price: 25000,
  odometer: 5000,
  bodyType: 'Sedan',
  color: 'Blue'
});
```

### Post to Social Media
```javascript
const result = await postToSocialMedia('twitter',
  '🚗 New Toyota Camry available! #CarDeals',
  'https://example.com/image.jpg',
  credentials
);
```

### Translate Content
```javascript
const frenchText = await translateText('Welcome to our dealership!', 'fr');
// Output: "Bienvenue dans notre concession!"
```

This comprehensive system transforms your dealership from a basic website into an AI-powered, socially-connected, data-driven sales platform! 🚗✨
