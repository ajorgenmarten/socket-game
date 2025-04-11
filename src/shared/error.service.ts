import { Injectable, Logger } from '@nestjs/common';

export interface ErrorDetails {
  message: string;
  source?: string;
  data?: unknown;
  timestamp?: Date;
}

@Injectable()
export class ErrorService {
  private readonly logger = new Logger(ErrorService.name);

  handleError(error: Error | ErrorDetails): ErrorDetails {
    const errorDetails: ErrorDetails = {
      message: error instanceof Error ? error.message : error.message,
      source:
        error instanceof Error
          ? error.stack?.split('\n')[1]?.trim()
          : error.source,
      data: error instanceof Error ? undefined : error.data,
      timestamp: new Date(),
    };

    this.logger.error(
      `Error: ${errorDetails.message}`,
      `Source: ${errorDetails.source || 'Unknown'}`,
      errorDetails.data,
    );

    return {
      message: errorDetails.message,
      source: errorDetails.source,
      data: errorDetails.data,
    };
  }

  logInfo(message: string, context?: string): void {
    this.logger.log(message, context);
  }

  logWarning(message: string, context?: string): void {
    this.logger.warn(message, context);
  }

  logVerbose(message: string, context?: string): void {
    this.logger.verbose(message, context);
  }
}
