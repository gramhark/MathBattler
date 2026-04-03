/* BattleItemHandler: バトル中アイテム使用の管理 */
class BattleItemHandler {
    constructor(game) {
        this.game = game;
        this.storage = game.storage;
        this.sound = game.sound;
        this.ui = game.ui;
    }

    /** 戦闘中リュックウィンドウを開く */
    _openBattleBag() {
        if (this.game.state !== GameState.BATTLE || !this.game.isPlayerTurn) return;
        // タイマーを一時停止
        cancelAnimationFrame(this.game.timerIntervalId);
        this.game.timerIntervalId = null;
        this.game._pausedElapsed = Date.now() - this.game.timerStart;
        this.game.state = GameState.TRANSITION;

        this.game._battleSelectedItem = null;
        this.game.shop.openBattleBag(this.game.backpack.items, (itemName, card) => this._onBattleBagItemTap(itemName, card));
    }

    /** 戦闘中リュックウィンドウを閉じ、バトルを再開する */
    _closeBattleBag() {
        this.game.shop.closeBattleBag();
        this.game._battleSelectedItem = null;
        // タイマー再開
        this.game.timerStart = Date.now() - this.game._pausedElapsed;
        this.game.state = GameState.BATTLE;
        this.game._startTimerLoop();
    }

    /** 戦闘中リュックのアイテムグリッドを描画する */
    _renderBattleBagGrid() {
        this.game.shop.renderBattleBagGrid(this.game.backpack.items, (itemName, card) => this._onBattleBagItemTap(itemName, card));
    }

    /** 戦闘中リュックでアイテムをタップしたとき */
    _onBattleBagItemTap(itemName, card) {
        const monster = this.game.monsters[this.game.currentMonsterIdx];
        this.game.shop.onBattleBagItemTap(
            itemName, card, monster,
            (n) => this._canUseItem(n),
            (n) => { this.game._battleSelectedItem = n; }
        );
    }

    /** アイテムが使用可能かチェックする */
    _canUseItem(itemName) {
        const m = this.game.monsters[this.game.currentMonsterIdx];
        // ゆうじょうのみはBoss/Heal/Specialには使用不可
        if (itemName === 'friendshipBerry') {
            if (!m || m.isBoss || m.isHeal || m.isSpecial ||
                m.battleNumber === Constants.BOSS_BATTLE_NUMBER) return false;
        }
        return this.game.battle.canUseItem(
            itemName, this.game.backpack.items, this.game.playerHp, this.game.playerMaxHp,
            this.game._monsterItemUsage, m
        );
    }

    /** 戦闘中 つかう を実行する */
    _executeBattleItemUse() {
        const itemName = this.game._battleSelectedItem;
        if (!itemName) return;

        // 念のため再チェック
        if (!this._canUseItem(itemName)) {
            this.game.shop.showItemLimitMsg();
            document.getElementById('battle-item-confirm').style.display = 'none';
            this.game._battleSelectedItem = null;
            document.querySelectorAll('.battle-bag-card.selected').forEach(c => c.classList.remove('selected'));
            return;
        }

        // バッグから消費
        this.game.backpack.items[itemName]--;
        this.storage.saveBackpack(this.game.backpack);

        // 使用回数をカウント
        if (itemName === 'attackOrb') this.game._monsterItemUsage.attackOrb = (this.game._monsterItemUsage.attackOrb || 0) + 1;
        if (itemName === 'defenseOrb') this.game._monsterItemUsage.defenseOrb = (this.game._monsterItemUsage.defenseOrb || 0) + 1;
        if (itemName === 'spikeOrb') this.game._monsterItemUsage.spikeOrb = (this.game._monsterItemUsage.spikeOrb || 0) + 1;
        if (itemName === 'poisonOrb') this.game._monsterItemUsage.poisonOrb = true;
        if (itemName === 'paralyzeOrb') this.game._monsterItemUsage.paralyzeOrb = true;
        if (itemName === 'stoneOrb') this.game._monsterItemUsage.stoneOrb = true;
        if (itemName === 'rainbowOrb') this.game._monsterItemUsage.rainbowOrbUsed = true;
        if (itemName === 'friendshipBerry') {
            this.game._monsterItemUsage.friendshipBerry = (this.game._monsterItemUsage.friendshipBerry || 0) + 1;
            const _bm = this.game.monsters[this.game.currentMonsterIdx];
            const _ratio = _bm ? _bm.hp / (_bm.maxHp || _bm.hp || 1) : 1.0;
            this.game._monsterItemUsage.friendshipBerryHpRatio = Math.min(
                this.game._monsterItemUsage.friendshipBerryHpRatio ?? 1.0, _ratio
            );
        }

        // 確認パネルと選択状態をリセット
        document.getElementById('battle-item-confirm').style.display = 'none';
        document.querySelectorAll('.battle-bag-card.selected').forEach(c => c.classList.remove('selected'));
        this.game._battleSelectedItem = null;

        // リュックウィンドウを一時的に隠してアイテム使用演出
        document.getElementById('battle-bag-overlay').classList.remove('active');

        const item = window.ITEM_LIST.find(i => i.id === itemName);
        this._useItemEffect(item);
    }

    /** アイテム使用演出（リュックウィンドウを閉じた後に実行） */
    _useItemEffect(item) {
        const useImg = document.getElementById('item-use-img');
        useImg.src = 'assets/image/item/' + item.img;
        useImg.classList.remove('item-use-anim');
        void useImg.offsetWidth;
        useImg.classList.add('item-use-anim');
        useImg.style.display = '';

        const m = this.game.monsters[this.game.currentMonsterIdx];
        let message = '';
        let thornKill = false;

        switch (item.id) {
            case 'healOrb':
                this.game.playerHp = Math.min(this.game.playerMaxHp, this.game.playerHp + Math.max(1, Math.floor(this.game.playerMaxHp * 0.2)));
                this.ui.updatePlayerHp(this.game.playerHp, this.game.playerMaxHp);
                this.sound.playSe('heal');
                message = 'たいりょくが\nかいふくした！';
                break;
            case 'attackOrb':
                this.game.swordBonus += Math.max(1, Math.round((1 + this.game._getEquippedSwordBonus()) * 0.05));
                this.sound.playSe('atk_up');
                this.ui.showAtkUpEffect();
                message = 'こうげきりょくアップ！';
                break;
            case 'defenseOrb':
                this.game.defenseBonus += Math.max(1, Math.round(this.game._getEquippedShieldBonus() * 0.05));
                this.sound.playSe('def_up');
                this.ui.showDefUpEffect();
                message = 'ぼうぎょりょくアップ！';
                break;
            case 'spikeOrb': {
                const thornDamage = this.game.battle.calcThornDamage();
                m.hp = Math.max(0, m.hp - thornDamage);
                this.ui.updateMonsterHp(m.hpRatio);
                this.ui.flashScreen('normal');
                this.sound.playSe('throw');
                message = `モンスターに\n${thornDamage}ダメージ！`;
                thornKill = m.hp <= 0;
                break;
            }
            case 'poisonOrb':
                m.isPoisoned = true;
                this.ui.applyMonsterStatusMask('poison');
                this.sound.playSe('poison');
                message = `${m.name}は\nどくになった！`;
                break;
            case 'paralyzeOrb':
                m.isParalyzed = true;
                this.ui.applyMonsterStatusMask('paralyzed');
                this.sound.playSe('paralyze');
                message = `${m.name}は\nまひした！`;
                break;
            case 'stoneOrb':
                m.isStoned = true;
                this.sound.playSe('stone');
                message = `せきかだまを\nなげた！`;
                break;
            case 'rainbowOrb':
                this.sound.playSe('atk_up');
                message = 'レアモンスターが\nでやすくなった！';
                break;
            case 'friendshipBerry':
                this.sound.playSe('friendship_berry');
                message = `${m.name}に\nゆうじょうのみをあげた！`;
                break;
        }

        this.ui.showMessage(message, false, 2000, 'text-neutral');

        setTimeout(() => {
            useImg.style.display = 'none';
            useImg.classList.remove('item-use-anim');
            if (thornKill) {
                // とげだまでモンスターを倒した
                this.game._onMonsterDefeated(m);
            } else {
                // リュックウィンドウを再表示
                this.game.shop.openBattleBag(this.game.backpack.items, (itemName, card) => this._onBattleBagItemTap(itemName, card));
            }
        }, 2000);
    }

    /**
     * モンスターターン終了後の状態異常効果を処理する。
     * せきかだま（石化20%）→ どくだま（毒1ダメージ）の順で処理し、
     * 終了後に nextAction() を呼ぶ。
     */
    _afterMonsterTurnEffects(nextAction) {
        const m = this.game.monsters[this.game.currentMonsterIdx];
        if (!m || m.hp <= 0) {
            nextAction();
            return;
        }

        // せきかだま: 確率で即死
        if (m.isStoned) {
            if (Math.random() < this.game.battle.calcStoneProcChance()) {
                m.hp = 0;
                this.ui.updateMonsterHp(m.hpRatio);
                this.ui.applyMonsterStatusMask('stone');
                this.sound.playSe('stone_proc');
                this.ui.showMessage(`${m.name}は\nいしになった！`, false, 2000, 'text-neutral');
                setTimeout(() => {
                    if (this.game.timerIntervalId) cancelAnimationFrame(this.game.timerIntervalId);
                    this.game._onMonsterDefeated(m);
                }, 2000);
                return;
            }
        }

        // どくだま: モンスターにどくダメージ
        if (m.isPoisoned) {
            const poisonDamage = this.game.battle.calcPoisonDamage(m);
            m.hp = Math.max(0, m.hp - poisonDamage);
            this.ui.updateMonsterHp(m.hpRatio);
            this.ui.showAttackEffect('attack');
            this.ui.flashScreen('normal');
            this.ui.showMessage('どくのダメージを\nうけた！', false, 1500, 'text-neutral');
            this.sound.playSe('poison_tick');
            if (m.hp <= 0) {
                setTimeout(() => {
                    if (this.game.timerIntervalId) cancelAnimationFrame(this.game.timerIntervalId);
                    this.game._onMonsterDefeated(m);
                }, 1500);
                return;
            }
            setTimeout(() => nextAction(), 1500);
            return;
        }

        nextAction();
    }
}
