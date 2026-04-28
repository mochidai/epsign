export class DCache {
  private static instance: DCache;
  private cache: Map<string, { value: any; expiry: number }>;

  private constructor() {
    this.cache = new Map();
  }

  public static getInstance(): DCache {
    if (!DCache.instance) {
      DCache.instance = new DCache();
    }
    return DCache.instance;
  }

  public set<T>(key: string, value: T, ttl: number): void {
    const expiry = Date.now() + ttl;
    this.cache.set(key, { value, expiry });
  }

  public get<T>(key: string): T | null {
    const cachedItem = this.cache.get(key);
    if (!cachedItem) {
      return null;
    }

    if (Date.now() > cachedItem.expiry) {
      this.cache.delete(key);
      return null;
    }

    return cachedItem.value;
  }

  public delete(key: string): void {
    this.cache.delete(key);
  }

  public clear(): void {
    this.cache.clear();
  }
}

export default DCache;
