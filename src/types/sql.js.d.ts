declare module 'sql.js' {
  export interface Database {
    exec(sql: string): QueryExecResult[];
    run(sql: string, params?: unknown[]): void;
    prepare(sql: string): Statement;
    export(): Uint8Array;
    close(): void;
  }

  export interface QueryExecResult {
    columns: string[];
    values: unknown[][];
  }

  export interface Statement {
    step(): boolean;
    get(): unknown;
    getAsObject(): Record<string, unknown>;
    bind(params?: unknown[]): boolean;
    reset(): boolean;
    freemem(): void;
    free(): boolean;
  }

  export interface SqlJsConfig {
    locateFile?: (file: string) => string;
  }

  export default function initSqlJs(config?: SqlJsConfig): Promise<{
    Database: new (data?: ArrayLike<number>) => Database;
  }>;
}