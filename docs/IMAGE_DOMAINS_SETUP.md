# Image Domains Setup Guide

## 🖼️ **Current Configured Domains**

Your Next.js app is currently configured to optimize images from these domains:

### **✅ Already Configured:**
- `sukull.com` (your domain)
- `localhost:3000` (development)
- `lh3.googleusercontent.com` (Google avatars)
- `avatars.githubusercontent.com` (GitHub avatars) 
- `img.youtube.com` & `i.ytimg.com` (YouTube thumbnails)
- `cdn.jsdelivr.net` (CDN)
- `avataaars.io` (Avatar service)
- `cdn.discordapp.com` & `media.discordapp.net` (Discord CDN) ✨ **NEW**
- `imgur.com` & `i.imgur.com` (Imgur hosting) ✨ **NEW**
- `res.cloudinary.com` (Cloudinary) ✨ **NEW**

## 🚀 **Adding Your Supabase Storage Domain**

If you're using Supabase Storage for image uploads, add your project's domain:

### **1. Find Your Supabase Project URL**
```bash
# In your .env.local or Supabase dashboard
# Look for: NEXT_PUBLIC_SUPABASE_URL=https://yourproject.supabase.co
```

### **2. Add to next.config.js**
```javascript
// In the remotePatterns array, add:
{
  protocol: 'https',
  hostname: 'yourproject.supabase.co', // Replace with your actual project ID
  port: '',
  pathname: '/**',
},
```

### **3. Restart Development Server**
```bash
npm run dev
```

## 🛠️ **Adding Other Image Hosting Services**

### **AWS S3:**
```javascript
{
  protocol: 'https',
  hostname: 'your-bucket.s3.amazonaws.com',
  port: '',
  pathname: '/**',
},
```

### **Google Cloud Storage:**
```javascript
{
  protocol: 'https',
  hostname: 'storage.googleapis.com',
  port: '',
  pathname: '/**',
},
```

### **Custom CDN:**
```javascript
{
  protocol: 'https',
  hostname: 'your-cdn-domain.com',
  port: '',
  pathname: '/**',
},
```

## 🔧 **SafeImage Component**

The app includes a `SafeImage` component that:
- ✅ **Graceful Fallbacks**: Falls back to default image if external URL fails
- ✅ **Error Handling**: Logs errors and shows placeholder icons
- ✅ **Automatic Retry**: Tries fallback image before showing placeholder
- ✅ **Responsive**: Works with all Next.js Image props

### **Usage:**
```tsx
import { SafeImage } from "@/components/ui/safe-image";

<SafeImage
  src="https://external-domain.com/image.jpg"
  alt="Description"
  fill
  className="object-cover"
  onError={() => console.log("Image failed to load")}
/>
```

## 🚨 **Troubleshooting**

### **Still getting 400 errors?**

1. **Check the exact domain** in browser dev tools
2. **Restart dev server** after config changes
3. **Add specific subdomain** instead of wildcards
4. **Use SafeImage component** for external URLs

### **Common Issues:**

- **Wildcard domains** (`*.domain.com`) may not work in all Next.js versions
- **Must restart server** after changing `next.config.js`
- **Case sensitive** domain names
- **Protocol must match** (https vs http)

### **Production Deployment:**

Remember to redeploy your app after changing `next.config.js` for changes to take effect in production! 