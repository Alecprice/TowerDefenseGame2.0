import React, { useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import GamePageV31 from './GamePageV31';
import { isAdminTestMode } from '../utils/adminTestMode';
import { getMetaBonuses } from '../utils/metaProgression';
import { getDailyChallenge } from '../utils/dailyChallengeV31';
import { loadRunV31 } from '../utils/runSaveV31';
import { buildDraftRosterForEconomy, getOpeningEconomy } from '../utils/openingEconomyV32';
import { setScopedOpeningMoneyMultiplier, clearScopedOpeningMoneyMultiplier } from '../utils/difficulty';

const GamePageV32 = () => {
    const [searchParams] = useSearchParams();
    const resumeRequested = searchParams.get('resume') === '1';
    const savedRun = resumeRequested ? loadRunV31() : null;
    const dailyRequested = searchParams.get('daily') === '1';
    const daily = dailyRequested ? getDailyChallenge() : null;

    const difficultyKey = savedRun?.difficultyKey || daily?.difficultyKey || searchParams.get('difficulty') || 'basic';
    const modeKey = savedRun?.modeKey || daily?.modeKey || searchParams.get('rules') || 'classic';
    const seed = savedRun?.seed || daily?.seed || searchParams.get('seed') || 'standard';
    const ranked = Boolean(savedRun?.ranked || dailyRequested || searchParams.get('ranked') === '1');
    const competitive = ranked || dailyRequested;
    const metaStartGoldBonus = competitive ? 0 : getMetaBonuses().startGoldBonus;

    const opening = useMemo(() => {
        const draftRoster = modeKey === 'draft' ? buildDraftRosterForEconomy(seed) : null;
        return getOpeningEconomy({ difficultyKey, modeKey, metaStartGoldBonus, draftRoster });
    }, [difficultyKey, modeKey, seed, metaStartGoldBonus]);

    // GamePageV31 still owns the battle simulation. It computes its opening as
    // (20 + metaGold) * difficulty.startMoneyMult, so install a scoped
    // multiplier that makes that legacy formula land exactly on the 3.2
    // balanced wallet. Set it synchronously for the child's first render and
    // again in the effect so React StrictMode's setup/cleanup probe cannot
    // leave the override cleared between later renders.
    const legacyOpeningBase = Math.max(1, 20 + metaStartGoldBonus);
    const scopedMultiplier = opening.totalMoney / legacyOpeningBase;
    setScopedOpeningMoneyMultiplier(difficultyKey, scopedMultiplier);

    useEffect(() => {
        setScopedOpeningMoneyMultiplier(difficultyKey, scopedMultiplier);
        return () => clearScopedOpeningMoneyMultiplier();
    }, [difficultyKey, scopedMultiplier]);

    return (
        <>
            <div style={{ maxWidth: 1500, margin: '6px auto 0', textAlign: 'center', fontFamily: 'pixel', color: '#9facbc', fontSize: 12 }}>
                Tower Defense 3.2 · 100 unique maps · 21 game modes · 550 achievements · Opening ${opening.totalMoney}
                {isAdminTestMode() && <span style={{ color: '#ffd60a', marginLeft: 10 }}>QA / ADMIN — progression and competitive writes disabled</span>}
            </div>
            <GamePageV31 />
        </>
    );
};

export default GamePageV32;
