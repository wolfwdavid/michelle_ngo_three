import { describe, expect, it } from 'vitest';
// NOTE: imports for ./schema and ./videos.json are lazy (`await import(...)`) inside each
// `it()` body so this file loads cleanly in Wave 0. Plan 02-01 creates ./schema.ts;
// Plan 02-02 authors ./videos.json. Plan 02-02 removes `.skip` to turn the suite GREEN.

describe('canonical videos.json', () => {
  it('canonical videos.json validates', async () => {
    const { VideoArraySchema } = await import('./schema');
    const videosJson = (await import('./videos.json')).default;
    const result = VideoArraySchema.safeParse(videosJson);
    if (!result.success) {
      console.error(result.error);
    }
    expect(result.success).toBe(true);
  });

  it('exactly 56 videos', async () => {
    const videosJson = (await import('./videos.json')).default;
    expect(Array.isArray(videosJson)).toBe(true);
    expect((videosJson as unknown[]).length).toBe(56);
  });

  it('unique IDs per source', async () => {
    const { VideoArraySchema } = await import('./schema');
    const videosJson = (await import('./videos.json')).default;
    const parsed = VideoArraySchema.parse(videosJson);
    const keys = parsed.map((v: { source: string; id: string }) => `${v.source}:${v.id}`);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it('contains the producer reel (vimeo:264677021)', async () => {
    const { VideoArraySchema } = await import('./schema');
    const videosJson = (await import('./videos.json')).default;
    const parsed = VideoArraySchema.parse(videosJson);
    const reel = parsed.find(
      (v: { source: string; id: string }) => v.source === 'vimeo' && v.id === '264677021'
    );
    expect(reel).toBeDefined();
  });

  it('category counts match D-04 (PBS:18, Promos:12, Branded:8, Doc:5, Reel:4, Personal:3, Edu:3, Other:3)', async () => {
    const { VideoArraySchema } = await import('./schema');
    const videosJson = (await import('./videos.json')).default;
    const parsed = VideoArraySchema.parse(videosJson);
    const counts: Record<string, number> = {};
    for (const v of parsed as Array<{ category: string }>) {
      counts[v.category] = (counts[v.category] ?? 0) + 1;
    }
    expect(counts['PBS American Portrait']).toBe(18);
    expect(counts['Promos & Trailers']).toBe(12);
    expect(counts['Branded Content']).toBe(8);
    expect(counts['Documentary / Short Film']).toBe(5);
    expect(counts['Reel']).toBe(4);
    expect(counts['Personal / Tribute']).toBe(3);
    expect(counts['Educational / Nonprofit']).toBe(3);
    expect(counts['Other']).toBe(3);
  });
});
