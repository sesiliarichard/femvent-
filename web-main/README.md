# FemVents Web Application

A modern event discovery and management platform built with Next.js 16.

## Deployment to Render

### Prerequisites
1. Create a [Render](https://render.com) account
2. Connect your GitHub repository to Render
3. Have your project pushed to GitHub

### Steps to Deploy

1. **Create a new Web Service on Render**
   - Go to your Render dashboard
   - Click "New+" and select "Web Service"
   - Connect your GitHub repository

2. **Configure the service**
   - **Name**: femvents-web
   - **Environment**: Node
   - **Build Command**: `npm install; npm run build`
   - **Start Command**: `npm run start`
   - **Root Directory**: `web` (since your app is in the web folder)

3. **Environment Variables**
   Add these environment variables in the Render dashboard:
   ```
   NODE_ENV=production
   NEXT_PUBLIC_BASE_PATH=
   ```

4. **Auto-Deploy**
   - Enable auto-deploy from your main branch
   - Click "Create Web Service"

### Alternative: Using render.yaml

If you prefer using the configuration file:

1. Push your code with the `render.yaml` file to GitHub
2. In Render, select "Build and deploy from a Git repository"
3. Render will automatically detect and use your `render.yaml` configuration

### Custom Domain (Optional)

1. In your Render service settings, go to "Custom Domains"
2. Add your domain name
3. Update DNS records as instructed by Render

### Monitoring

- View logs in the Render dashboard
- Set up health checks
- Configure alerts for downtime

## Local Development

```bash
npm install
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000)

## Features

- Event discovery across African cities
- Modern UI with Tailwind CSS
- Responsive design
- SEO optimized

## Tech Stack

- Next.js 16
- React 19
- TypeScript
- Tailwind CSS
- Render (Deployment)
