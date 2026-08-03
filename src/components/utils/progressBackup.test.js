import { describe, it, expect, beforeEach } from 'vitest';
import { importProgress } from './progressBackup';

// exportProgress() triggers a real browser file download (createElement +
// click), which isn't meaningful to unit test in jsdom - importProgress()
// is the part with actual logic (parsing, validating, restoring keys),
// so that's what's covered here.

function fakeFile(content) {
    return new File([content], 'backup.json', { type: 'application/json' });
}

describe('progressBackup - importProgress', () => {
    beforeEach(() => {
        localStorage.clear();
    });

    it('rejects when no file is given', async () => {
        await expect(importProgress(null)).rejects.toBeTruthy();
    });

    it('rejects invalid JSON', async () => {
        await expect(importProgress(fakeFile('not json'))).rejects.toMatch(/valid JSON/);
    });

    it('rejects a JSON file that is not a recognizable backup', async () => {
        await expect(importProgress(fakeFile(JSON.stringify({ foo: 'bar' })))).rejects.toMatch(/backup/);
    });

    it('restores known keys from a valid backup and reports how many', async () => {
        const backup = {
            version: 1,
            data: {
                td_meta: JSON.stringify({ cores: 500 }),
                td_playerName: 'Ada',
                td_some_unknown_future_key: 'ignored', // not in the known key list
            },
        };
        const restored = await importProgress(fakeFile(JSON.stringify(backup)));
        expect(restored).toBe(2);
        expect(localStorage.getItem('td_meta')).toBe(JSON.stringify({ cores: 500 }));
        expect(localStorage.getItem('td_playerName')).toBe('Ada');
        expect(localStorage.getItem('td_some_unknown_future_key')).toBeNull();
    });
});
