# Database Migrations

## Running Migrations

### For Cloudflare D1 (Production)

```bash
# Add financial_data column to leads table
wrangler d1 execute vehicle-dealership-analytics --file=./migrations/add-financial-data-to-leads.sql
```

### Verify Migration

```bash
# Check the leads table schema
wrangler d1 execute vehicle-dealership-analytics --command="PRAGMA table_info(leads);"
```

## Pre-Approval Feature

The `financial_data` column stores JSON data for pre-approval applications including:
- Employment information
- Financial details (income, down payment, monthly budget)
- Credit rating
- Vehicle preferences
- Trade-in information

This data is displayed in the Admin → Leads section when viewing pre-approval applications.
