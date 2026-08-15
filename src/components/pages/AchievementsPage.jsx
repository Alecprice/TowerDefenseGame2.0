import React, { useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import Button from 'react-bootstrap/Button';
import { ACHIEVEMENTS, getUnlockedIds } from '../utils/achievements';
import { isAdminTestMode } from '../utils/adminTestMode';
import { exportProgress, importProgress } from '../utils/progressBackup';
import { playUiClick } from '../utils/sfx';
import './AchievementsPage.css';

const PAGE_SIZE = 60;

const AchievementsPage = () => {
    const adminQA = isAdminTestMode();
    const unlockedIds = adminQA ? ACHIEVEMENTS.map(a => a.id) : getUnlockedIds();
    const unlockedSet = useMemo(() => new Set(unlockedIds), [unlockedIds]);
    const fileInputRef = useRef(null);
    const [backupMessage, setBackupMessage] = useState('');
    const [search, setSearch] = useState('');
    const [category, setCategory] = useState('all');
    const [status, setStatus] = useState('all');
    const [page, setPage] = useState(1);

    const filtered = useMemo(() => {
        const query = search.trim().toLowerCase();
        return ACHIEVEMENTS.filter(a => {
            if (category !== 'all' && a.category !== category) return false;
            const unlocked = unlockedSet.has(a.id);
            if (status === 'unlocked' && !unlocked) return false;
            if (status === 'locked' && unlocked) return false;
            if (query && !`${a.name} ${a.desc}`.toLowerCase().includes(query)) return false;
            return true;
        });
    }, [search, category, status, unlockedSet]);

    const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
    const safePage = Math.min(page, pageCount);
    const visible = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);
    const updateFilter = setter => value => { setter(value); setPage(1); };

    const handleExport = () => { exportProgress(); playUiClick(); };
    const handleImportFile = async e => {
        const file = e.target.files?.[0];
        e.target.value = '';
        if (!file) return;
        try {
            const restored = await importProgress(file);
            setBackupMessage(`Restored ${restored} item${restored === 1 ? '' : 's'} - reload the page to see it everywhere.`);
            playUiClick();
        } catch (err) {
            setBackupMessage(typeof err === 'string' ? err : 'Could not import that file.');
        }
    };

    return (
        <div>
            <h1>Achievements</h1>
            <p className="scores-note">{unlockedIds.length} / {ACHIEVEMENTS.length} unlocked{adminQA ? ' · QA preview (not saved)' : ''}</p>

            <div className="achievement-browser-controls">
                <input value={search} onChange={e => updateFilter(setSearch)(e.target.value)} placeholder="Search 550 achievements..." aria-label="Search achievements" />
                <select value={category} onChange={e => updateFilter(setCategory)(e.target.value)} aria-label="Achievement category">
                    <option value="all">All categories</option><option value="global">Global</option><option value="map">Map-specific</option>
                </select>
                <select value={status} onChange={e => updateFilter(setStatus)(e.target.value)} aria-label="Achievement status">
                    <option value="all">Locked + unlocked</option><option value="unlocked">Unlocked only</option><option value="locked">Locked only</option>
                </select>
            </div>

            <div className="achievement-page-meta">Showing {visible.length ? (safePage - 1) * PAGE_SIZE + 1 : 0}-{Math.min(safePage * PAGE_SIZE, filtered.length)} of {filtered.length}</div>

            <div className="achievements-grid">
                {visible.map(a => {
                    const unlocked = unlockedSet.has(a.id);
                    return (
                        <div className={`achievement-card${unlocked ? ' unlocked' : ''}`} key={a.id}>
                            <span className="achievement-icon">{unlocked ? '🏆' : '🔒'}</span>
                            <div>
                                <div className="achievement-name">{a.name}</div>
                                <div className="achievement-desc">{a.desc}</div>
                                {a.category === 'map' && <div className="achievement-map-tag">Map {a.mapIndex + 1} · Tier {a.tier}</div>}
                            </div>
                        </div>
                    );
                })}
            </div>

            <div className="achievement-pagination">
                <button disabled={safePage <= 1} onClick={() => setPage(1)}>First</button>
                <button disabled={safePage <= 1} onClick={() => setPage(p => Math.max(1, p - 1))}>Previous</button>
                <span>Page {safePage} / {pageCount}</span>
                <button disabled={safePage >= pageCount} onClick={() => setPage(p => Math.min(pageCount, p + 1))}>Next</button>
                <button disabled={safePage >= pageCount} onClick={() => setPage(pageCount)}>Last</button>
            </div>

            <h2 className="upgrades-subheading">Backup & Restore</h2>
            <p className="scores-note">Achievements, Cores, tower/map unlocks, stars and local scores are saved on this device. Export a backup to keep them safe or move them to another device.</p>
            <div className="container backup-buttons">
                <Button className='sbtn' variant="outline-light" onClick={handleExport}>Export Progress</Button>
                <Button className='sbtn' variant="outline-light" onClick={() => fileInputRef.current?.click()}>Import Progress</Button>
                <input ref={fileInputRef} type="file" accept="application/json" style={{ display: 'none' }} onChange={handleImportFile} />
            </div>
            {backupMessage && <p className="scores-note">{backupMessage}</p>}
            <div className="container"><Link to='/' onClick={playUiClick}><Button variant="outline-light">Home</Button></Link></div>
        </div>
    );
};

export default AchievementsPage;
