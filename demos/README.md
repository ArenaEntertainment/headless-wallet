# Wallet Mock Demos

This directory contains comprehensive demo applications showcasing the wallet-mock library's functionality across different frameworks and use cases.

## Available Demos

### 🚀 React Demo (`/react`)
- **Purpose**: Comprehensive React integration showcase
- **Features**: Full React hooks, providers, multi-chain operations, responsive UI
- **Tech Stack**: React 18, TypeScript, Vite, Tailwind CSS
- **Run**: `npm run dev:react`

### 🌟 Vue Demo (`/vue`)
- **Purpose**: Complete Vue.js implementation with composables
- **Features**: Vue 3 composition API, reactive state, component library
- **Tech Stack**: Vue 3, TypeScript, Vite, Tailwind CSS
- **Run**: `npm run dev:vue`

### 🎯 Vanilla JavaScript Demo (`/vanilla`)
- **Purpose**: Pure JavaScript implementation without frameworks
- **Features**: Vanilla JS, ES modules, modern web APIs, progressive enhancement
- **Tech Stack**: TypeScript, Vite, CSS3, Web Components
- **Run**: `npm run dev:vanilla`

### 🎭 Playwright Demo (`/playwright`)
- **Purpose**: End-to-end testing showcase and automation examples
- **Features**: E2E test scenarios, wallet automation, cross-browser testing
- **Tech Stack**: Playwright, TypeScript, Test fixtures
- **Run**: `npm run dev:playwright`

### 🔐 Security Demo (`/security`)
- **Purpose**: Security features and production safeguards demonstration
- **Features**: Security policies, environment detection, threat simulation
- **Tech Stack**: React, TypeScript, Security monitoring
- **Run**: `npm run dev:security`

## Quick Start

1. **Install all dependencies**:
   ```bash
   npm run install:all
   ```

2. **Run a specific demo**:
   ```bash
   # React demo
   npm run dev:react

   # Vue demo
   npm run dev:vue

   # Vanilla JS demo
   npm run dev:vanilla

   # Security demo
   npm run dev:security
   ```

3. **Build all demos**:
   ```bash
   npm run build:all
   ```

4. **Run E2E tests**:
   ```bash
   npm run test:playwright
   ```

## Demo Features

Each demo application includes:

### Core Wallet Operations
- ✅ Multi-chain support (EVM + Solana)
- ✅ Account creation and management
- ✅ Chain switching and network management
- ✅ Transaction signing and sending
- ✅ Balance querying and display
- ✅ Connection status management

### Advanced Features
- ✅ Multiple account support
- ✅ Custom RPC endpoints
- ✅ Transaction history
- ✅ Error handling and recovery
- ✅ Performance monitoring
- ✅ Security demonstrations
- ✅ Production safeguards

### UI/UX Features
- ✅ Responsive design (mobile-first)
- ✅ Accessibility compliance (WCAG)
- ✅ Dark/light theme support
- ✅ Real-time status indicators
- ✅ Loading states and transitions
- ✅ Error boundaries and fallbacks

### Developer Features
- ✅ TypeScript throughout
- ✅ Comprehensive error handling
- ✅ Performance optimisations
- ✅ Code splitting and lazy loading
- ✅ Hot reload development
- ✅ Production builds

## Architecture Overview

```
demos/
├── react/           # React 18 + hooks demo
├── vue/            # Vue 3 + composition API demo
├── vanilla/        # Pure JavaScript demo
├── playwright/     # E2E testing demo
├── security/       # Security features demo
├── shared/         # Shared utilities (if needed)
└── docs/           # Demo documentation
```

## Development Guidelines

### Code Quality
- **TypeScript**: All demos use TypeScript for type safety
- **ESLint**: Consistent code style across all demos
- **Prettier**: Automated code formatting
- **Testing**: Unit tests where applicable

### Performance
- **Bundle Size**: Optimised for minimal bundle size
- **Loading**: Lazy loading and code splitting
- **Caching**: Proper caching strategies
- **Metrics**: Performance monitoring integration

### Accessibility
- **WCAG 2.1**: AA compliance level
- **Screen Readers**: Full screen reader support
- **Keyboard**: Complete keyboard navigation
- **Focus Management**: Proper focus handling

### Security
- **Production Guards**: Environment detection
- **Input Validation**: All user inputs validated
- **Error Handling**: Secure error messages
- **CSP**: Content Security Policy headers

## Deployment

Each demo can be deployed independently:

```bash
# Build specific demo
npm run build:react  # or vue, vanilla, security

# Preview production build
npm run preview:react  # or vue, vanilla, security
```

The built demos are static sites that can be deployed to any hosting service (Vercel, Netlify, GitHub Pages, etc.).

## Contributing

1. **Adding New Demos**: Create new directory with consistent structure
2. **Updating Existing**: Maintain feature parity across demos
3. **Documentation**: Update this README for any changes
4. **Testing**: Ensure all demos work with current library version

## Troubleshooting

### Common Issues

1. **Dependencies**: Run `npm run install:all` if demos don't start
2. **Build Errors**: Check Node.js version (>=16 required)
3. **Port Conflicts**: Demos use different ports (3000, 3001, 3002, etc.)
4. **Library Version**: Ensure demos match current wallet-mock version

### Getting Help

- **Issues**: Create GitHub issue with demo name and error details
- **Discussions**: Use GitHub Discussions for questions
- **Documentation**: Check individual demo README files

## License

MIT License - see the [LICENSE](../LICENSE) file for details.