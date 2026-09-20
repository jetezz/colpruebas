export type RuntimeEnvironment = 'development' | 'test' | 'production';

export interface AppStatus {
  app: string;
  environment: RuntimeEnvironment;
  timestamp: string;
  message?: string;
  status?: string;
  version?: string;
}
