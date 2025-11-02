# Vendor Lifecycle Management Scheduling

## Overview

This document outlines the updated scheduling approach for vendor lifecycle management in the dealership platform. Each vendor now runs on a separate schedule to improve system efficiency and monitoring.

## Scheduled Execution

The vendor-sync-worker now runs on the following schedule:

```
"0 1 * * *"  # Lambert Auto lifecycle at 1 AM UTC
"0 2 * * *"  # NaniAuto lifecycle at 2 AM UTC
"0 3 * * *"  # SLT Autos lifecycle at 3 AM UTC
```

This ensures that:

1. Each vendor is processed separately
2. System load is distributed throughout the night
3. Issues with one vendor don't affect others
4. Logs are cleaner and easier to monitor

## Implementation Details

The vendor-sync-worker uses the `scheduled` event handler to determine which vendor to process based on the current hour:

```javascript
async scheduled(event, env, ctx) {
  console.log(`Scheduled execution triggered at ${new Date().toISOString()}`);
  
  // Determine which vendor to process based on the hour
  const currentHour = new Date().getUTCHours();
  
  try {
    let result;
    if (currentHour === 1) {
      // 1 AM UTC - Lambert Auto
      console.log('Running scheduled Lambert Auto lifecycle management');
      result = await this.syncLambert(env, {}, null, false, true);
    } else if (currentHour === 2) {
      // 2 AM UTC - NaniAuto
      console.log('Running scheduled NaniAuto lifecycle management');
      result = await this.syncNaniAuto(env, {}, null, false, true);
    } else if (currentHour === 3) {
      // 3 AM UTC - SLT Autos
      console.log('Running scheduled SLT Autos lifecycle management');
      result = await this.syncSLTAutos(env, {}, null, false, true);
    } else {
      console.log(`Unhandled scheduled execution at hour ${currentHour}`);
      return;
    }
    
    console.log('Scheduled lifecycle management completed:', 
      JSON.stringify(result?.status || 'unknown'));
  } catch (error) {
    console.error('Error in scheduled execution:', error);
  }
}
```

## Lifecycle Management Process

For each vendor, the lifecycle management process:

1. Marks vehicles as "unlisted" immediately when they disappear from vendor feed
2. Deletes vehicles that have been unlisted for 14+ days (unless sold)

## Benefits

1. **Better Resource Utilization** - Processing one vendor at a time reduces system load
2. **Improved Monitoring** - Easier to identify which vendor is causing issues
3. **Faster Processing** - Each vendor's lifecycle management completes more quickly
4. **Cleaner Logs** - Logs are separated by vendor and time
5. **Reduced Risk** - Issues with one vendor don't affect others

## Implementation Date

This updated scheduling approach was implemented on November 2, 2025.
