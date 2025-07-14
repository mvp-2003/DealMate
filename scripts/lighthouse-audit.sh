#!/bin/bash

echo "🔍 Running Lighthouse Performance Audit..."

# Check if Lighthouse CLI is installed
if ! command -v lighthouse &> /dev/null; then
    echo "Installing Lighthouse CLI..."
    npm install -g @lhci/cli lighthouse
fi

# Check if application is running
if ! curl -f http://localhost:3000 > /dev/null 2>&1; then
    echo "❌ Application is not running. Please start it first:"
    echo "   docker-compose up -d"
    echo "   or"
    echo "   ./start.sh"
    exit 1
fi

# Create reports directory
mkdir -p reports/lighthouse

# Run Lighthouse audit
echo "📊 Running comprehensive Lighthouse audit..."
lighthouse http://localhost:3000 \
  --output=html,json \
  --output-path=reports/lighthouse/report \
  --chrome-flags="--headless --no-sandbox --disable-gpu" \
  --only-categories=performance,accessibility,best-practices,seo,pwa \
  --budget-path=lighthouse-budget.json

# Run Lighthouse CI for multiple pages
echo "🚀 Running Lighthouse CI for multiple pages..."
lhci autorun

# Generate performance summary
echo "📈 Performance Summary:"
echo "======================"

# Extract key metrics from JSON report
if [ -f "reports/lighthouse/report.report.json" ]; then
    node -e "
    const report = require('./reports/lighthouse/report.report.json');
    const audits = report.audits;
    
    console.log('🎯 Core Web Vitals:');
    console.log('  LCP:', audits['largest-contentful-paint'].displayValue);
    console.log('  FID:', audits['max-potential-fid'].displayValue);
    console.log('  CLS:', audits['cumulative-layout-shift'].displayValue);
    console.log('');
    console.log('📊 Lighthouse Scores:');
    console.log('  Performance:', Math.round(report.categories.performance.score * 100));
    console.log('  Accessibility:', Math.round(report.categories.accessibility.score * 100));
    console.log('  Best Practices:', Math.round(report.categories['best-practices'].score * 100));
    console.log('  SEO:', Math.round(report.categories.seo.score * 100));
    console.log('  PWA:', Math.round(report.categories.pwa.score * 100));
    "
fi

echo ""
echo "✅ Lighthouse audit completed!"
echo "📁 Reports saved to: reports/lighthouse/"
echo "🌐 Open reports/lighthouse/report.report.html to view detailed results"
