# Error Logging System

A comprehensive global error reporting and logging system for the Grant Sentinel application.

## Features

- **Automatic Error Capture**: Catches unhandled errors and promise rejections
- **Error Boundaries**: React Error Boundaries for component-level error handling
- **Error Display UI**: Visual error notifications with severity indicators
- **Error Logging Service**: Centralized logging with severity levels
- **External Reporting**: Optional integration with external error reporting services
- **Error Statistics**: Track error counts and patterns

## Usage

### Basic Error Logging

```typescript
import { errorLogger } from "../lib/errors/errorLogger";

// Log an error
errorLogger.log(new Error("Something went wrong"), "high", {
  component: "MyComponent",
  action: "user-action"
});
```

### Using the React Hook

```typescript
import { useErrorLogger } from "../lib/errors/useErrorLogger";

function MyComponent() {
  const { logError, logWarning, logInfo, logCritical } = useErrorLogger("MyComponent");

  const handleAction = async () => {
    try {
      // ... your code
    } catch (error) {
      logError(error, "high", { action: "handleAction" });
    }
  };

  return <div>...</div>;
}
```

### Error Boundaries

Error boundaries are automatically set up in the root layout. You can also add custom error boundaries:

```typescript
import { ErrorBoundary } from "../components/ErrorBoundary";

<ErrorBoundary 
  severity="high"
  fallback={<div>Custom error UI</div>}
>
  <YourComponent />
</ErrorBoundary>
```

### Error Display

The `ErrorDisplay` component is automatically included in the root layout. It shows:
- Error count badge
- Expandable error list
- Error details with severity
- Clear and stats buttons

### Error Severity Levels

- **low**: Informational messages
- **medium**: Warnings and non-critical errors
- **high**: Significant errors that need attention
- **critical**: Critical errors that require immediate action

### External Error Reporting

Set the `NEXT_PUBLIC_ERROR_REPORTING_API_URL` environment variable to send high/critical errors to an external service:

```bash
NEXT_PUBLIC_ERROR_REPORTING_API_URL=https://your-error-service.com/api/errors
```

### Error Statistics

```typescript
import { errorLogger } from "../lib/errors/errorLogger";

const stats = errorLogger.getStats();
console.log(stats);
// {
//   total: 10,
//   bySeverity: { low: 2, medium: 5, high: 2, critical: 1 },
//   recent: [...]
// }
```

## Files

- `lib/errors/errorLogger.ts` - Core error logging service
- `lib/errors/useErrorLogger.ts` - React hook for error logging
- `components/ErrorBoundary.tsx` - React Error Boundary component
- `components/ErrorDisplay.tsx` - Error notification UI
- `app/error.tsx` - Next.js error page
- `app/global-error.tsx` - Global error handler

