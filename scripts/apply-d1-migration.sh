#!/bin/bash

# Apply database migration to Cloudflare D1
# This script runs the vendor tracking migration

echo "🚀 Applying Vendor Tracking Migration to Cloudflare D1"
echo "======================================================"

# Check if wrangler is installed
if ! command -v wrangler &> /dev/null; then
    echo "❌ Error: wrangler CLI is not installed"
    echo "Please install it with: npm install -g wrangler"
    exit 1
fi

# Apply the migration
echo "📋 Applying migration: 002_add_vendor_tracking.sql"
npx wrangler d1 execute vehicle-dealership --file=migrations/002_add_vendor_tracking.sql

if [ $? -eq 0 ]; then
    echo "✅ Migration applied successfully!"
    echo ""
    echo "📊 Vendor tracking fields have been added to the database:"
    echo "  - vendor_id, vendor_name fields added to vehicles table"
    echo "  - vendors table created"
    echo "  - vendor_sync_logs table created"
    echo "  - Default vendors (Lambert, Internal) inserted"
    echo ""
    echo "🎉 Your database is now ready for multi-vendor inventory management!"
else
    echo "❌ Migration failed. Please check the error messages above."
    exit 1
fi
