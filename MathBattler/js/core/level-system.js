/* LevelSystem - EXP calculation, level-up logic, and HP formula */
class LevelSystem {
    constructor(game) {
        this.game = game;
    }

    calcMaxHp(lv) {
        if (lv <= 1) return Constants.PLAYER_LEVEL_HP_BASE;
        return Math.round(
            Constants.PLAYER_LEVEL_HP_BASE +
            Constants.PLAYER_LEVEL_HP_K *
            Math.pow(lv - 1, 1 + Constants.PLAYER_LEVEL_HP_ALPHA / 1000)
        );
    }

    calcExpGain(floor, isBoss, isSuperRare = false) {
        const base = Math.round(
            Constants.EXP_BASE * (1 + (floor - 1) * Constants.EXP_FLOOR_SCALE / 1000)
        );
        let gain;
        if (isSuperRare) gain = base * 100;
        else gain = isBoss ? base * Constants.EXP_BOSS_MULT : base;
        if (this.game.expMultiplied) gain = Math.round(gain * 1.2);
        return gain;
    }

    addExp(floor, isBoss, isSuperRare = false) {
        const game = this.game;
        const gain = this.calcExpGain(floor, isBoss, isSuperRare);
        game.playerExp += gain;

        const levelUps = [];

        while (game.playerLevel < Constants.PLAYER_MAX_LEVEL) {
            const needed = Constants.EXP_LEVEL_BASE +
                (game.playerLevel - 1) * Constants.EXP_LEVEL_STEP;
            if (game.playerExp < needed) break;

            game.playerExp -= needed;
            game.playerLevel++;

            const newMaxHp = this.calcMaxHp(game.playerLevel);
            const hpDiff = newMaxHp - game.playerMaxHp;
            game.playerMaxHp = newMaxHp;
            game.playerHp = Math.min(game.playerHp + hpDiff, game.playerMaxHp);
            levelUps.push({ level: game.playerLevel, hpGained: hpDiff });
        }

        game.storage.savePlayerLevel(game.playerLevel);
        game.storage.savePlayerExp(game.playerExp);

        return { expGained: gain, levelUps };
    }

    updateLevelUI() {
        const game = this.game;
        const isMax = game.playerLevel >= Constants.PLAYER_MAX_LEVEL;
        const expNeeded = isMax ? 1 : Constants.EXP_LEVEL_BASE + (game.playerLevel - 1) * Constants.EXP_LEVEL_STEP;
        game.ui.updatePlayerLevel(game.playerLevel, game.playerExp, expNeeded, isMax);
    }
}
