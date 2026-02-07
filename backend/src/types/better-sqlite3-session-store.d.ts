declare module 'better-sqlite3-session-store' {
  import session from 'express-session';
  import { Database } from 'better-sqlite3';

  function BetterSqlite3Store(
    session: typeof import('express-session')
  ): {
    new (options: {
      client: Database;
      expired?: { clear?: boolean; intervalMs?: number };
    }): session.Store;
  };

  export = BetterSqlite3Store;
}
