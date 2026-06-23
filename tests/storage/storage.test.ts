import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  buildUploadKey,
  createR2Adapter,
  InMemoryStorageAdapter,
  StorageNotConfiguredError,
  type S3LikeClient,
} from '@/lib/storage';

describe('buildUploadKey', () => {
  it('builds a deterministic scope/owner/id.ext key', () => {
    expect(
      buildUploadKey({
        scope: 'screenshot',
        ownerId: 'user-1',
        uploadId: 'abc',
        ext: 'png',
      }),
    ).toBe('screenshot/user-1/abc.png');
  });

  it('strips a leading dot from the extension and lowercases it', () => {
    expect(
      buildUploadKey({
        scope: 'pdf',
        ownerId: 'u',
        uploadId: 'r',
        ext: '.PDF',
      }),
    ).toBe('pdf/u/r.pdf');
  });

  it('sanitizes unsafe segments and falls back for empties', () => {
    expect(
      buildUploadKey({
        scope: 'share_card',
        ownerId: '../../etc',
        uploadId: '',
        ext: '',
      }),
    ).toBe('share_card/....etc/upload');
    expect(
      buildUploadKey({
        scope: 'screenshot',
        ownerId: '!!!',
        uploadId: 'x',
        ext: 'png',
      }),
    ).toBe('screenshot/anon/x.png');
  });
});

describe('InMemoryStorageAdapter', () => {
  it('round-trips put / get / exists / delete', async () => {
    const s = new InMemoryStorageAdapter();
    const data = new Uint8Array([1, 2, 3]);
    const ref = await s.put('k', data, { contentType: 'image/png' });
    expect(ref).toEqual({ key: 'k', contentType: 'image/png', byteSize: 3 });
    expect(await s.exists('k')).toBe(true);
    expect(await s.get('k')).toEqual(data);
    expect(s.size()).toBe(1);
    await s.delete('k');
    expect(await s.exists('k')).toBe(false);
    expect(await s.get('missing')).toBeNull();
  });
});

describe('R2 adapter (env-gated)', () => {
  const R2 = [
    'R2_ACCOUNT_ID',
    'R2_ACCESS_KEY_ID',
    'R2_SECRET_ACCESS_KEY',
    'R2_BUCKET',
  ];
  const saved: Record<string, string | undefined> = {};

  beforeEach(() => {
    for (const k of R2) {
      saved[k] = process.env[k];
      delete process.env[k];
    }
  });
  afterEach(() => {
    for (const k of R2) {
      if (saved[k] === undefined) delete process.env[k];
      else process.env[k] = saved[k];
    }
  });

  it('refuses to build until R2 credentials are present', () => {
    const client = {} as S3LikeClient;
    expect(() => createR2Adapter(client)).toThrow(StorageNotConfiguredError);
  });

  it('delegates to the injected S3-like client once configured', async () => {
    process.env.R2_ACCOUNT_ID = 'acc';
    process.env.R2_ACCESS_KEY_ID = 'id';
    process.env.R2_SECRET_ACCESS_KEY = 'secret';
    process.env.R2_BUCKET = 'coachscore-media';

    const calls: string[] = [];
    const client: S3LikeClient = {
      async putObject(i) {
        calls.push(`put:${i.bucket}/${i.key}`);
        return { etag: 'e1' };
      },
      async getObject() {
        return new Uint8Array([9]);
      },
      async deleteObject(i) {
        calls.push(`del:${i.key}`);
      },
      async headObject() {
        return true;
      },
    };

    const adapter = createR2Adapter(client);
    const ref = await adapter.put('screenshot/u/a.png', new Uint8Array([9]), {
      contentType: 'image/png',
    });
    expect(ref.etag).toBe('e1');
    expect(ref.byteSize).toBe(1);
    expect(await adapter.get('screenshot/u/a.png')).toEqual(
      new Uint8Array([9]),
    );
    expect(await adapter.exists('screenshot/u/a.png')).toBe(true);
    await adapter.delete('screenshot/u/a.png');
    expect(calls).toEqual([
      'put:coachscore-media/screenshot/u/a.png',
      'del:screenshot/u/a.png',
    ]);
  });
});
