import { PrismaClient } from '@prisma/client';

/**
 * Fills in pool settings the connection string leaves out, so a bare Supabase
 * URL doesn't run into P2024 ("Timed out fetching a new connection from the
 * connection pool").
 *
 * - Supabase's transaction pooler (port 6543) is PgBouncer-compatible and needs
 *   `pgbouncer=true`, which turns off prepared statements so they don't collide
 *   across pooled sessions.
 * - `connection_limit` defaults to a small pool instead of Prisma's
 *   cpus * 2 + 1. On a dev machine that default overruns the pooler's per-client
 *   cap, and `connection_limit=1` queues every Promise.all and transaction
 *   behind one connection.
 * - `pool_timeout` gets more headroom than the 10s default, because each round
 *   trip to ap-southeast-1 is slow from a dev machine.
 *
 * Values already in the URL win. PRISMA_CONNECTION_LIMIT and
 * PRISMA_POOL_TIMEOUT override the defaults without editing the URL.
 */
export const withPoolDefaults = (raw: string | undefined) => {
    if (!raw) return raw;

    let url: URL;
    try {
        url = new URL(raw);
    } catch {
        return raw;
    }

    const params = url.searchParams;
    const isTransactionPooler = url.port === '6543';

    if (isTransactionPooler && !params.has('pgbouncer')) params.set('pgbouncer', 'true');
    if (!params.has('connection_limit')) {
        params.set('connection_limit', process.env.PRISMA_CONNECTION_LIMIT || '5');
    }
    if (!params.has('pool_timeout')) {
        params.set('pool_timeout', process.env.PRISMA_POOL_TIMEOUT || '20');
    }

    return url.toString();
};

const prismaClientSingleton = () => {
    const url = withPoolDefaults(process.env.DATABASE_URL);
    return new PrismaClient(url ? { datasources: { db: { url } } } : undefined);
};

declare global {
    var prisma: undefined | ReturnType<typeof prismaClientSingleton>;
}

const prisma = globalThis.prisma ?? prismaClientSingleton();

export default prisma;

// Reuse one client across hot reloads in dev and across warm invocations on
// Vercel, so neither path opens a fresh pool on every module load.
globalThis.prisma = prisma;
