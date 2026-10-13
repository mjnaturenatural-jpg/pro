import mongoose from "mongoose";
import dns, { promises as dnsPromises } from "node:dns";

// Node's default c-ares channel can end up pointing at a dead loopback
// resolver (127.0.0.1) on some Windows networks. That breaks the SRV/TXT
// lookups a mongodb+srv:// connection needs - failing with
// "querySrv ECONNREFUSED" - even though dns.getServers() reports the correct
// servers. A freshly created Resolver wired to explicit servers works
// reliably, so route the default dns.resolve* functions (which the MongoDB
// driver calls internally) through one.
const DEFAULT_DNS = "1.1.1.1,8.8.8.8";

declare global {
  // eslint-disable-next-line no-var
  var __mjDnsResolver: dnsPromises.Resolver | undefined;
}

function applyDnsWorkaround(): void {
  if (globalThis.__mjDnsResolver) return;
  try {
    const servers = (process.env.MONGODB_DNS_SERVERS ?? DEFAULT_DNS)
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    try {
      dns.setServers(servers);
    } catch {
      // ignore - the Resolver below is the important part
    }
    const resolver = new dnsPromises.Resolver();
    resolver.setServers(servers);
    globalThis.__mjDnsResolver = resolver;

    const retry = async <T>(fn: () => Promise<T>): Promise<T> => {
      let lastErr: unknown;
      for (let i = 0; i < 3; i++) {
        try {
          return await fn();
        } catch (err) {
          lastErr = err;
          await new Promise((r) => setTimeout(r, 100 * (i + 1)));
        }
      }
      throw lastErr;
    };

    dnsPromises.resolveSrv = ((name: string) =>
      retry(() => resolver.resolveSrv(name))) as typeof dnsPromises.resolveSrv;
    dnsPromises.resolveTxt = ((name: string) =>
      retry(() => resolver.resolveTxt(name))) as typeof dnsPromises.resolveTxt;
    dns.resolveSrv = ((name: string, cb: (...a: unknown[]) => void) => {
      retry(() => resolver.resolveSrv(name)).then(
        (records) => cb(null, records),
        (err) => cb(err),
      );
    }) as unknown as typeof dns.resolveSrv;
    dns.resolveTxt = ((name: string, cb: (...a: unknown[]) => void) => {
      retry(() => resolver.resolveTxt(name)).then(
        (records) => cb(null, records),
        (err) => cb(err),
      );
    }) as unknown as typeof dns.resolveTxt;
  } catch {
    // fall back to whatever the platform provides
  }
}

applyDnsWorkaround();

const MONGODB_URI = process.env.MONGODB_URI;

interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

declare global {
  // eslint-disable-next-line no-var
  var __mongoose: MongooseCache | undefined;
}

const cached: MongooseCache = globalThis.__mongoose ?? { conn: null, promise: null };
globalThis.__mongoose = cached;

export async function connectDB() {
  applyDnsWorkaround();
  if (!MONGODB_URI) {
    throw new Error("MONGODB_URI is not defined in environment variables");
  }
  if (cached.conn) return cached.conn;
  if (!cached.promise) {
    cached.promise = mongoose.connect(MONGODB_URI, {
      bufferCommands: false,
      maxPoolSize: 10,
    });
  }
  try {
    cached.conn = await cached.promise;
  } catch (err) {
    cached.promise = null;
    throw err;
  }
  return cached.conn;
}
