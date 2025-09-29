This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:
- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

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

### Environment Variables Template
Copy `.env.example` to `.env.local` and fill in your credentials.

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

## 📊 Admin Dashboard Features

The admin dashboard now includes:

- **AI Features Manager**: Generate descriptions, translate content, create social captions
- **Social Media Manager**: Configure auto-posting and manual social media publishing
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
