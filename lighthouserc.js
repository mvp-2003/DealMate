module.exports = {
  ci: {
    collect: {
      url: [
        'http://localhost:3000',
        'http://localhost:3000/deals',
        'http://localhost:3000/deals/all',
        'http://localhost:3000/profile',
      ],
      startServerCommand: 'npm start',
      startServerReadyPattern: 'ready on',
      startServerReadyTimeout: 30000,
      numberOfRuns: 3,
      settings: {
        chromeFlags: '--no-sandbox --disable-gpu --headless',
      },
    },
    assert: {
      assertions: {
        'categories:performance': ['warn', { minScore: 0.85 }],
        'categories:accessibility': ['error', { minScore: 0.95 }],
        'categories:best-practices': ['warn', { minScore: 0.9 }],
        'categories:seo': ['warn', { minScore: 0.9 }],
        'categories:pwa': ['warn', { minScore: 0.8 }],
        
        // Core Web Vitals
        'first-contentful-paint': ['warn', { maxNumericValue: 1200 }],
        'largest-contentful-paint': ['warn', { maxNumericValue: 1500 }],
        'first-input-delay': ['warn', { maxNumericValue: 50 }],
        'cumulative-layout-shift': ['warn', { maxNumericValue: 0.05 }],
        'speed-index': ['warn', { maxNumericValue: 2000 }],
        'total-blocking-time': ['warn', { maxNumericValue: 150 }],
        
        // Additional performance metrics
        'interactive': ['warn', { maxNumericValue: 2500 }],
        'max-potential-fid': ['warn', { maxNumericValue: 100 }],
        'server-response-time': ['warn', { maxNumericValue: 200 }],
        
        // Best practices
        'uses-https': 'error',
        'uses-http2': 'warn',
        'uses-responsive-images': 'warn',
        'efficient-animated-content': 'warn',
        'modern-image-formats': 'warn',
      },
    },
    upload: {
      target: 'temporary-public-storage',
    },
  },
};
