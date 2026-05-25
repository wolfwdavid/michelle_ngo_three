import { describe, expect, it } from 'vitest';
// Wave 0 used lazy `await import(...)` so this file would load before the modules
// existed. Plan 02-01 created ./schema.ts + ./categories.ts and removed `.skip`
// from each describe block; the dynamic imports now resolve normally and the
// suite is GREEN.

const validRecord = {
  source: 'vimeo',
  id: '264677021',
  title: 'Producer Reel',
  uploader: 'Michelle Ngo',
  published: '2018-04-13',
  thumbnail: 'https://example.com/t.jpg',
  embed: 'https://player.vimeo.com/video/264677021',
  category: 'Reel',
} as const;

describe('schema accepts valid records', () => {
  it('canonical schema accepts a valid record', async () => {
    const { VideoSchema } = await import('./schema');
    expect(VideoSchema.safeParse(validRecord).success).toBe(true);
  });

  it('optional fields (duration_seconds, description) parse when absent', async () => {
    const { VideoSchema } = await import('./schema');
    const result = VideoSchema.safeParse(validRecord);
    expect(result.success).toBe(true);
  });

  it('accepts all 8 canonical categories', async () => {
    const { VideoSchema } = await import('./schema');
    const { CATEGORIES } = await import('./categories');
    for (const cat of CATEGORIES) {
      const r = VideoSchema.safeParse({ ...validRecord, category: cat });
      expect(r.success, `category ${cat} should parse`).toBe(true);
    }
  });
});

describe('schema rejects bad data', () => {
  it('rejects a missing required field', async () => {
    const { VideoSchema } = await import('./schema');
    const bad: Record<string, unknown> = { ...validRecord };
    delete bad.title;
    expect(VideoSchema.safeParse(bad).success).toBe(false);
  });

  it('rejects a non-ISO date', async () => {
    const { VideoSchema } = await import('./schema');
    expect(VideoSchema.safeParse({ ...validRecord, published: '04/13/2018' }).success).toBe(false);
  });

  it('rejects an unknown category', async () => {
    const { VideoSchema } = await import('./schema');
    expect(
      VideoSchema.safeParse({ ...validRecord, category: 'PBS American Portraits' }).success
    ).toBe(false);
  });

  it('rejects an unknown extra field', async () => {
    const { VideoSchema } = await import('./schema');
    expect(VideoSchema.safeParse({ ...validRecord, evil_extra: true }).success).toBe(false);
  });

  it('rejects an empty title', async () => {
    const { VideoSchema } = await import('./schema');
    expect(VideoSchema.safeParse({ ...validRecord, title: '' }).success).toBe(false);
  });

  it('rejects an unknown source', async () => {
    const { VideoSchema } = await import('./schema');
    expect(VideoSchema.safeParse({ ...validRecord, source: 'tiktok' }).success).toBe(false);
  });
});

describe('VideoArraySchema validates the canonical file', () => {
  it('parses an array of valid records', async () => {
    const { VideoArraySchema } = await import('./schema');
    const result = VideoArraySchema.safeParse([validRecord, validRecord]);
    expect(result.success).toBe(true);
  });
});
