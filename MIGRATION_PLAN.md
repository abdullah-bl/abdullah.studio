# Astro to Next.js Migration Plan

## Overview
This document outlines the migration plan from Astro to Next.js 15 (latest) for abdullah.studio.

## Current Project Analysis
- **Framework**: Astro 5.10.1 with React integration
- **Styling**: Tailwind CSS 4.0.17
- **Key Features**: Chat interface, STT, TTS, Blog with MDX
- **Deployment**: Static output with Cloudflare integration

## Migration Strategy

### Phase 1: Project Setup & Configuration
1. **Initialize Next.js 15 project**
   - Use `create-next-app` with TypeScript
   - Configure App Router (latest Next.js pattern)
   - Set up Tailwind CSS 4.0.17

2. **Update package.json dependencies**
   - Remove Astro-specific packages
   - Add Next.js dependencies
   - Keep React 19, Radix UI, and other UI libraries
   - Maintain AI/ML libraries (@mlc-ai/web-llm, kokoro-js, etc.)

### Phase 2: Folder Structure Reorganization

#### Current Structure → New Structure
```
src/
├── pages/           → app/ (Next.js App Router)
│   ├── index.astro  → app/page.tsx
│   ├── chat.astro   → app/chat/page.tsx
│   ├── stt.astro    → app/stt/page.tsx
│   ├── tts.astro    → app/tts/page.tsx
│   └── blog/        → app/blog/
│       ├── index.astro → app/blog/page.tsx
│       └── [slug].astro → app/blog/[slug]/page.tsx
├── layouts/         → app/layout.tsx (root layout)
├── components/      → components/ (move to root)
├── content/         → content/ (move to root)
├── lib/            → lib/ (move to root)
├── stores/         → stores/ (move to root)
├── styles/         → app/globals.css
└── scripts/        → lib/workers/ (reorganize)
```

#### New Folder Structure
```
abdullah.studio/
├── app/
│   ├── layout.tsx              # Root layout
│   ├── page.tsx                # Home page
│   ├── globals.css             # Global styles
│   ├── chat/
│   │   └── page.tsx
│   ├── stt/
│   │   └── page.tsx
│   ├── tts/
│   │   └── page.tsx
│   └── blog/
│       ├── page.tsx
│       └── [slug]/
│           └── page.tsx
├── components/
│   ├── chat/
│   ├── stt/
│   ├── tts/
│   ├── ui/
│   └── glow.tsx
├── content/
│   └── blog/
├── lib/
│   ├── icons.ts
│   ├── tools.ts
│   ├── utils.ts
│   └── workers/
│       ├── kokoro.ts
│       └── mlc.ts
├── stores/
│   └── chat.ts
├── public/
└── [config files]
```

### Phase 3: Component Migration

#### 3.1 Layout Migration
- **Current**: `src/layouts/layout.astro` + `src/layouts/header.astro`
- **New**: `app/layout.tsx` with integrated header
- **Changes**: Convert Astro syntax to React/JSX

#### 3.2 Page Migration
- **Home Page**: `src/pages/index.astro` → `app/page.tsx`
- **Chat Page**: `src/pages/chat.astro` → `app/chat/page.tsx`
- **Blog Pages**: Convert MDX handling to Next.js MDX
- **STT/TTS Pages**: Direct component migration

#### 3.3 Component Updates
- **React Components**: Most components can be migrated directly
- **Astro-specific**: Convert to React components
- **Client-side**: Update hydration patterns

### Phase 4: Configuration Updates

#### 4.1 Next.js Configuration
```typescript
// next.config.js
const nextConfig = {
  experimental: {
    mdxRs: true, // For MDX support
  },
  webpack: (config) => {
    // Handle WebGPU types
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
    };
    return config;
  },
};
```

#### 4.2 Tailwind Configuration
- Update content paths for new structure
- Maintain current design system
- Keep custom color variables

#### 4.3 TypeScript Configuration
- Update paths for new structure
- Add Next.js types
- Maintain strict type checking

### Phase 5: Content & MDX Migration

#### 5.1 Blog Content
- **Current**: Astro MDX integration
- **New**: Next.js MDX with `@next/mdx`
- **Metadata**: Convert frontmatter handling

#### 5.2 Content Configuration
- Update content config for Next.js
- Maintain current blog structure
- Preserve metadata and SEO

### Phase 6: Advanced Features

#### 6.1 Web Workers
- **Current**: `src/scripts/workerKokoro.ts`, `src/scripts/workerMLC.ts`
- **New**: `lib/workers/` directory
- **Integration**: Update worker imports and usage

#### 6.2 AI/ML Libraries
- **@mlc-ai/web-llm**: Update for Next.js compatibility
- **kokoro-js**: Maintain functionality
- **@browserai/browserai**: Update integration

#### 6.3 State Management
- **Zustand**: Direct migration (no changes needed)
- **Chat Store**: Update imports for new structure

### Phase 7: Performance & Optimization

#### 7.1 Next.js Optimizations
- Implement proper loading states
- Add error boundaries
- Optimize images with Next.js Image component
- Implement proper metadata for SEO

#### 7.2 Bundle Optimization
- Analyze bundle size
- Implement code splitting
- Optimize third-party libraries

### Phase 8: Testing & Deployment

#### 8.1 Testing
- Test all pages and components
- Verify AI/ML functionality
- Test responsive design
- Validate SEO and metadata

#### 8.2 Deployment
- **Current**: Cloudflare static deployment
- **New**: Vercel (recommended) or Cloudflare Pages
- Update deployment configuration

## Migration Checklist

### Setup
- [ ] Create Next.js 15 project
- [ ] Install and configure dependencies
- [ ] Set up Tailwind CSS
- [ ] Configure TypeScript

### Structure
- [ ] Create new folder structure
- [ ] Migrate components
- [ ] Update import paths
- [ ] Reorganize workers

### Pages
- [ ] Migrate home page
- [ ] Migrate chat page
- [ ] Migrate STT/TTS pages
- [ ] Migrate blog pages
- [ ] Set up MDX integration

### Configuration
- [ ] Update Next.js config
- [ ] Update Tailwind config
- [ ] Update TypeScript config
- [ ] Configure build process

### Testing
- [ ] Test all functionality
- [ ] Verify responsive design
- [ ] Test AI/ML features
- [ ] Validate SEO

### Deployment
- [ ] Set up deployment pipeline
- [ ] Configure environment variables
- [ ] Deploy to staging
- [ ] Deploy to production

## Benefits of Migration

1. **Performance**: Next.js App Router with improved performance
2. **Developer Experience**: Better TypeScript support and tooling
3. **Ecosystem**: Access to Next.js ecosystem and plugins
4. **Future-proof**: Latest React patterns and features
5. **Deployment**: Better deployment options and optimization

## Risks & Considerations

1. **Breaking Changes**: Some Astro-specific features need reimplementation
2. **Learning Curve**: Team needs to adapt to Next.js patterns
3. **Migration Time**: Estimated 2-3 days for complete migration
4. **Testing**: Comprehensive testing required for AI/ML features

## Timeline

- **Day 1**: Setup and basic structure
- **Day 2**: Component and page migration
- **Day 3**: Testing and deployment

## Rollback Plan

- Keep Astro branch as backup
- Can revert to Astro version if needed
- Maintain feature parity during migration 