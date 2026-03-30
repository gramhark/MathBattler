/* Main Game Class */
class Game {
    constructor() {
        this.storage = new StorageManager();
        this.ui = new UIManager();
        this.battle = new BattleManager(Constants);
        this.sound = new SoundManager();
        this.shop = new ShopManager(this.storage, this.sound, this.ui);
        this.state = GameState.TOP;

        // Settings
        this.playerName = '';
        this.currentFloor = 1;
        this.difficulty = this.storage.loadSelectedDifficulty();
        this._settings = this.storage.loadSettings();
        this.sound.applySettings(this._settings.bgmEnabled, this._settings.seEnabled, this._settings.bgmVolume, this._settings.seVolume);

        // Runtime
        this.playerHp = 10;
        this.monsters = [];
        this.currentMonsterIdx = 0;
        this.problem = null;
        this.timerStart = 0;
        this.timerIntervalId = null;
        this.defeatTimes = [];
        this.monsterBattleStart = 0;
        this.inputBuffer = "";
        this.isPlayerTurn = true; // Turn-based state

        this.swordLevel = -1; // -1 = 素手（装備なし）
        this.shieldLevel = 0;
        this.swordBonus = 0; // こうげきだまによる一時攻撃補正（現在のモンスター戦のみ有効）
        this.swordMultiplied = false;  // ミスターといし効果: 装備剣ボーナス×1.5（1バトル有効）
        this.shieldMultiplied = false; // ミスターてっぱん効果: 装備盾ボーナス×1.5（1バトル有効）
        this.goldMultiplied = false;   // ミスターきんか効果: 獲得マール×2（ダンジョン中有効）
        this.expMultiplied = false;    // ミスターねんりん効果: 獲得経験値×1.2（ダンジョン中有効）

        this.prevBossDefeated = false; // 直前ダンジョンのボス撃破フラグ（げきレア出現条件）

        this.dodgeStreak = 0;          // 連続回避カウント (0–4)
        this.specialMoveReady = false; // 必殺技ゲージMAXフラグ（4回回避で成立）
        this.specialStandby = false;   // 必殺技待機フラグ（剣タップで能動的に発動）
        this.timers = [];
        this.specialMonstersAppeared = []; // スペシャルモンスター出現済みリスト
        this.healAppeared = false;         // Healモンスター出現済みフラグ
        this.superRareAppeared = false;    // げきレア出現済みフラグ
        this.dungeonRareAppeared = false;  // ダンジョンレア出現済みフラグ

        // レベル・経験値
        this.playerLevel = this.storage.loadPlayerLevel();
        this.playerExp = this.storage.loadPlayerExp();
        this.playerMaxHp = this._calcMaxHp(this.playerLevel);

        // Gold & Bag
        this.malle = this.storage.loadMalle();
        this.backpack = this.storage.loadBackpack();
        this.defenseBonus = 0; // ぼうぎょだまによる防御補正（現在のモンスター戦のみ有効）
        this._equipDropCallback = null; // 武具ドロップ後のコールバック
        this._equipDropItem = null;     // ドロップ中の武具データ
        this._selectedSellItem = null;  // ショップ売却選択中アイテム
        this._selectedShopEquip = null; // ショップ装備購入選択中アイテム
        // バトル中アイテム使用回数（モンスター1体ごと）
        this._monsterItemUsage = { spikeOrb: 0, poisonOrb: false, paralyzeOrb: false, stoneOrb: false, attackOrb: 0, defenseOrb: 0 };
        this._battleSelectedItem = null;
        this._isTransitioning = false;

        // Managers (instantiate after properties are set)
        this.screens = new ScreenManager(this);
        this.notes = new NoteManager(this);
        this.equipment = new EquipmentManager(this);
        this.backpackHub = new BackpackHubManager(this);
        this.settings = new SettingsManager(this);
        this.spawner = new MonsterSpawner(this);
        this.results = new ResultsManager(this);
        this.itemHandler = new BattleItemHandler(this);
        this.levelSystem = new LevelSystem(this);
        this.input = new InputHandler(this);
        this.events = new EventBinder(this);

        // Auto Scaling
        window.addEventListener('resize', () => this.ui.adjustScale());
        this.ui.adjustScale();

        this.events.bind(); // replaces this._bindEvents()
        this.ui.updateTimerBar(1); // Reset
    }

    /* Game Flow */
    /**
     * ダンジョンの指定ダンジョンでバトルを開始する
     * @param {number} floor - 1〜100
     */
    startGame(floor) {
        this.sound.unlockAll();
        this.currentFloor = floor || 1;

        const nameInput = document.getElementById('player-name');
        this.playerName = (nameInput ? nameInput.value.trim() : '') || 'ゆうしゃ';
        this.storage.savePlayerName(this.playerName);

        // Init Player
        this.playerMaxHp = this._calcMaxHp(this.playerLevel);
        this.playerHp = this.playerMaxHp;
        const nameDisplayEl = document.getElementById('player-name-display');
        if (nameDisplayEl) {
            nameDisplayEl.textContent = this.playerName;
            const nameScale = this.playerName.length > 4 ? 4 / this.playerName.length : 1;
            nameDisplayEl.style.setProperty('--name-scale', nameScale);
        }

        this.ui.updatePlayerHp(this.playerHp, this.playerMaxHp);
        this._updateLevelUI();

        // Init Monsters
        this.monsters = [];
        this.defeatTimes = [];
        this.specialMonstersAppeared = [];
        this.healAppeared = false;
        this.superRareAppeared = false;
        this.dungeonRareAppeared = false;
        const usedNormalImages = new Set();
        const normalImageCount = new Map();
        for (let i = 1; i <= Constants.MONSTERS_PER_FLOOR; i++) {
            const m = new Monster(i, this.currentFloor, false, false, false, false, usedNormalImages);
            if (m.imageSrc) {
                const filename = m.imageSrc.split('/').pop();
                const count = (normalImageCount.get(filename) || 0) + 1;
                normalImageCount.set(filename, count);
                if (count >= 3) {
                    usedNormalImages.add(filename);
                }
            }
            this.monsters.push(m);
        }

        this.currentMonsterIdx = 0;
        this._determineMonster(0);
        this.swordBonus = 0;
        this.swordMultiplied = false;
        this.shieldMultiplied = false;
        this.goldMultiplied = false;
        this.expMultiplied = false;
        // swordLevel / shieldLevel はそうびスクリーンで設定した値を維持
        this.defenseBonus = 0;
        this.dodgeStreak = 0;
        this.specialMoveReady = false;
        this.specialStandby = false;
        this._monsterItemUsage = { spikeOrb: 0, poisonOrb: false, paralyzeOrb: false, stoneOrb: false, attackOrb: 0, defenseOrb: 0 };
        // 装備UI更新（新装備システム優先）
        const _equippedSword = Array.isArray(this.backpack.equipment)
            ? this.backpack.equipment.find(e => e.type === 'sword' && e.equipped) : null;
        const _equippedShield = Array.isArray(this.backpack.equipment)
            ? this.backpack.equipment.find(e => e.type === 'shield' && e.equipped) : null;
        if (_equippedSword) {
            this.ui.updateSwordEquipUI(_equippedSword);
        } else {
            this.ui.hideSword();
        }
        if (_equippedShield) {
            this.ui.updateShieldEquipUI(_equippedShield);
        } else {
            this.ui.hideShield();
        }
        this.ui.updateAuraUI(this.dodgeStreak, this.specialMoveReady);

        this._startWithPreload();
    }


    /**
     * 1体目のモンスター画像をプリロードし、完了したらモンスター出現画面を表示する。
     * その後、残りの画像をバックグラウンドで先読みする。
     */
    _startWithPreload() {
        const firstMonster = this.monsters[0];
        const firstSrc = firstMonster.imageSrc;

        const img = new Image();
        const onLoaded = async () => {
            // ホワイトアウト演出
            this.sound.playSe('battle_start');
            const whiteout = document.getElementById('whiteout-overlay');
            if (whiteout) {
                whiteout.classList.add('active');
                await new Promise(resolve => setTimeout(resolve, 750));
            }

            // 画面遷移
            document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
            document.getElementById('battle-screen').classList.add('active');
            document.getElementById('stage-progress').innerHTML = '';

            this.sound.playBgm({ floor: this.currentFloor });
            this.state = GameState.INTERVAL;

            setTimeout(() => this.ui.adjustScale(), 200);

            this.showInterval();

            if (whiteout) {
                await new Promise(resolve => setTimeout(resolve, 100));
                whiteout.classList.remove('active');
            }

            // 1体目の表示後、残りをバックグラウンドでプリロード
            this._preloadRemainingImages();
        };

        img.onload = onLoaded;
        img.onerror = onLoaded; // 失敗しても画面は進める
        img.src = firstSrc;
        // 攻撃エフェクトを初期ロード（素手用）
        const attackImg = new Image();
        attackImg.src = 'assets/image/effect/attack.webp';

        const criticalImg = new Image();
        criticalImg.src = 'assets/image/effect/critical.webp';
    }

    /**
     * 2体目以降とボス変身後の画像をバックグラウンドでプリロードする。
     */
    _preloadRemainingImages() {
        // ① 2体目以降のモンスター画像
        const monsterSrcs = this.monsters.slice(1).map(m => m.imageSrc);
        // ボスnext画像もプリロード
        const bossNextInfo = this._getBossNextImageSrc();
        if (bossNextInfo) monsterSrcs.push(bossNextInfo.src);

        // ② アイテム画像（剣＋盾）
        const itemSrcs = [
            'assets/image/item/sword01.webp',
            'assets/image/item/sword02.webp',
            'assets/image/item/sword03.webp',
            'assets/image/item/sword04.webp',
            'assets/image/item/sword05.webp',
            'assets/image/item/shield01.webp',
            'assets/image/item/shield02.webp',
            'assets/image/item/shield03.webp',
            'assets/image/item/shield04.webp',
            'assets/image/item/shield05.webp'
        ];

        const effectSrcs = [
            'assets/image/effect/attack_H.webp',
            'assets/image/effect/critical_H.webp',
            'assets/image/effect/attack_S.webp',
            'assets/image/effect/critical_S.webp',
            'assets/image/effect/attack_SP.webp'
        ];

        const allSrcs = [...monsterSrcs, ...itemSrcs, ...effectSrcs];

        // 少し遅らせてバックグラウンドで読み込み
        setTimeout(() => {
            allSrcs.forEach(src => {
                if (!src) return;
                const img = new Image();
                img.src = src;
            });
        }, 500);
    }

    /* ============================================================
       遭遇選択・撃破フロー
       ============================================================ */

    /**
     * Heal/Special 選択ポップアップを表示し、はい/いいえコールバックを登録する。
     */
    _showEncounterChoice(msg, onYes, onNo) {
        const overlay = document.getElementById('encounter-choice-overlay');
        document.getElementById('encounter-choice-msg').textContent = msg;
        const yesBtn = document.getElementById('encounter-yes-btn');
        const noBtn = document.getElementById('encounter-no-btn');

        const cleanup = () => {
            overlay.classList.remove('active');
            yesBtn.onclick = null;
            noBtn.onclick = null;
        };

        yesBtn.onclick = () => { this.sound.playSe('btn'); cleanup(); onYes(); };
        noBtn.onclick = () => { this.sound.playSe('btn'); cleanup(); onNo(); };

        overlay.classList.add('active');
    }

    /**
     * かいふくモンスター専用フロー。
     * 最初のメッセージ後に「かいふくしてもらう？」ポップアップを表示。
     * はい → HP全回復 → 退場。いいえ → 即退場。
     */
    _onHealMonsterLeave(m) {
        this.state = GameState.TRANSITION;
        if (this.timerIntervalId) {
            clearInterval(this.timerIntervalId);
            this.timerIntervalId = null;
        }
        this.inputBuffer = "";
        document.getElementById('answer-input').value = "";

        const totalTime = (Date.now() - this.monsterBattleStart) / 1000;
        this.defeatTimes.push({ time: totalTime.toFixed(1), name: m.name, imageSrc: m.imageSrc });

        // 図鑑記録
        const isNewRecord = this._saveMonsterRecord(m, totalTime);

        const doLeave = () => {
            const elements = [
                document.getElementById('monster-img'),
                document.getElementById('monster-name'),
                document.getElementById('monster-hp-container')
            ];
            elements.forEach(el => {
                el.classList.add('fade-slow');
                el.style.opacity = '0';
            });
            this.ui.showMessage(`${m.name}は\nさっていった`, false, 1500, 'text-neutral');
            setTimeout(() => {
                if (isNewRecord) {
                    this._showNoteRegistration(m.name, () => this._nextMonster());
                } else {
                    this._nextMonster();
                }
            }, 2000);
        };

        // ① 紹介メッセージ（1.5秒）
        this.ui.showMessage(`${m.name}が\nへんじを まっている`, false, 1500, 'text-neutral');

        setTimeout(() => {
            // ② 選択ポップアップ
            this._showEncounterChoice('かいふくして もらう？',
                () => {
                    // はい: 回復フロー
                    this.playerHp = this.playerMaxHp;
                    this.ui.updatePlayerHp(this.playerHp, this.playerMaxHp);
                    this.ui.showHealEffect();
                    setTimeout(() => this.sound.playSe('heal'), 500);
                    this.ui.showMessage(`${m.name}は\n かいふくしてくれた！`, false, 2000, 'text-neutral');
                    setTimeout(() => {
                        this.ui.showMessage(`たいりょくが\nぜんかいふくした！`, false, 1500, 'text-neutral');
                        setTimeout(doLeave, 1500);
                    }, 2000);
                },
                doLeave // いいえ: そのまま去る
            );
        }, 1500);
    }

    /**
     * スペシャルモンスター専用フロー。
     * 最初のメッセージ後に「〇〇をもらう？」ポップアップを表示。
     * はい → バフ付与 → 退場。いいえ → 即退場。
     */
    _onSpecialMonsterLeave(m) {
        this.state = GameState.TRANSITION;
        if (this.timerIntervalId) {
            clearInterval(this.timerIntervalId);
            this.timerIntervalId = null;
        }
        this.inputBuffer = "";
        document.getElementById('answer-input').value = "";

        const totalTime = (Date.now() - this.monsterBattleStart) / 1000;
        this.defeatTimes.push({ time: totalTime.toFixed(1), name: m.name, imageSrc: m.imageSrc });

        // 図鑑記録
        const isNewRecord = this._saveMonsterRecord(m, totalTime);

        const doLeave = () => {
            const elements = [
                document.getElementById('monster-img'),
                document.getElementById('monster-name'),
                document.getElementById('monster-hp-container')
            ];
            elements.forEach(el => {
                el.classList.add('fade-slow');
                el.style.opacity = '0';
            });
            this.ui.showMessage(`${m.name}は\nさっていった`, false, 1500, 'text-neutral');
            setTimeout(() => {
                if (isNewRecord) {
                    this._showNoteRegistration(m.name, () => this._nextMonster());
                } else {
                    this._nextMonster();
                }
            }, 2000);
        };

        let choiceText;
        if (m.name === 'ミスターといし') {
            choiceText = 'こうげきを\nあげてもらう？';
        } else if (m.name === 'ミスターてっぱん') {
            choiceText = 'ぼうぎょを\nあげてもらう？';
        } else {
            choiceText = m.quote;
        }

        // ① 紹介メッセージ（1.5秒）
        this.ui.showMessage(`${m.name}が\nへんじを まっている`, false, 1500, 'text-neutral');

        setTimeout(() => {
            // ② 選択ポップアップ
            this._showEncounterChoice(choiceText,
                () => {
                    // はい: バフフロー
                    if (m.name === 'ミスターといし') {
                        this.swordMultiplied = true;
                        setTimeout(() => this.sound.playSe('atk_up'), 500);
                        this.ui.showAtkUpEffect();
                        this.ui.showMessage(`${m.name}は\nけんを きたえてくれた！`, false, 2000, 'text-neutral');
                    } else if (m.name === 'ミスターてっぱん') {
                        this.shieldMultiplied = true;
                        setTimeout(() => this.sound.playSe('atk_up'), 500);
                        this.ui.showDefUpEffect();
                        this.ui.showMessage(`${m.name}は\nたてを きたえてくれた！`, false, 2000, 'text-neutral');
                    } else if (m.name === 'ミスターきんか') {
                        this.goldMultiplied = true;
                        setTimeout(() => this.sound.playSe('atk_up'), 500);
                        this.ui.showGoldUpEffect();
                        this.ui.showMessage('ミスターきんかは\nもらえるマールを ふやしてくれた！', false, 2000, 'text-neutral');
                    } else if (m.name === 'ミスターねんりん') {
                        this.expMultiplied = true;
                        setTimeout(() => this.sound.playSe('atk_up'), 500);
                        this.ui.showExpUpEffect();
                        this.ui.showMessage('ミスターねんりんは\nもらえるけいけんちを ふやしてくれた！', false, 2000, 'text-neutral');
                    }
                    setTimeout(() => {
                        let msg;
                        if (m.name === 'ミスターといし') msg = 'けんのつよさが\nあがった！';
                        else if (m.name === 'ミスターてっぱん') msg = 'たてのつよさが\nあがった！';
                        else if (m.name === 'ミスターきんか') msg = 'もらえるマールが\nふえた！';
                        else msg = 'もらえるけいけんちが\nふえた！';
                        this.ui.showMessage(msg, false, 2000, 'text-neutral');
                        setTimeout(doLeave, 2000);
                    }, 2000);
                },
                doLeave // いいえ: そのまま去る
            );
        }, 1500);
    }

    _onMonsterDefeated(m) {
        clearInterval(this.timerIntervalId);
        this.state = GameState.TRANSITION; // Block input

        // Clear problem and input
        this.inputBuffer = "";
        document.getElementById('answer-input').value = "";

        const totalTime = (Date.now() - this.monsterBattleStart) / 1000;
        this.defeatTimes.push({
            time: totalTime.toFixed(1),
            name: m.name,
            imageSrc: m.imageSrc // Store image for result screen
        });

        // EXP取得・レベルアップ判定
        const isBossForExp = m.battleNumber === Constants.BOSS_BATTLE_NUMBER;
        const lvResult = this._addExp(this.currentFloor, isBossForExp, m.isSuperRare);
        this._updateLevelUI();

        // ボス撃破でげきレア出現フラグをON
        if (isBossForExp) this.prevBossDefeated = true;

        // Save to Monster Note
        const isNewRecord = this._saveMonsterRecord(m, totalTime);

        let delayBeforeBonus = 1500;

        if (isBossForExp) {
            this.sound.playSe('boss_destroyed');
            delayBeforeBonus = 4000;
            this.ui.showMessage(`${m.name}をたおした！\n${lvResult.expGained}けいけんちをてにいれた！`, false, delayBeforeBonus, 'text-neutral');

            // Fade out for boss
            document.getElementById('monster-img').classList.add('boss-defeat-anim');
            document.getElementById('monster-name').classList.add('boss-defeat-anim-name');
            document.getElementById('monster-hp-container').classList.add('boss-defeat-anim-name');
        } else {
            this.sound.playSe('defeat');
            this.ui.showMessage(`${m.name}をたおした！\n${lvResult.expGained}けいけんちをてにいれた！`, false, delayBeforeBonus, 'text-neutral');

            // Fade out
            document.getElementById('monster-img').style.opacity = '0';
            document.getElementById('monster-name').style.opacity = '0';
            document.getElementById('monster-hp-container').style.opacity = '0';
        }

        // Wait for defeat message, then show bonus
        setTimeout(() => {
            // レベルアップ演出（1レベルずつチェーン）
            const proceedToBonuses = () => {
                let hasBonus = false;

                // Bonuses
                if (m.isSpecial) {
                    if (m.name === 'ミスターといし') {
                        // ドロップなし → 装備剣ボーナス×1.5（バトル終了でリセット）→ ノート登録
                        this.swordMultiplied = true;
                        this.sound.playSe('atk_up');
                        this.ui.showAtkUpEffect();
                        hasBonus = true;
                        this.ui.showMessage('けんのつよさが\nあがった！', false, 2000, 'text-neutral');
                    } else if (m.name === 'ミスターてっぱん') {
                        // 装備盾ボーナス×1.5（バトル終了でリセット）
                        this.shieldMultiplied = true;
                        this.sound.playSe('atk_up');
                        this.ui.showDefUpEffect();
                        hasBonus = true;
                        this.ui.showMessage('たてのつよさが\nあがった！', false, 2000, 'text-neutral');
                    } else if (m.name === 'ミスターきんか') {
                        this.goldMultiplied = true;
                        this.sound.playSe('atk_up');
                        this.ui.showGoldUpEffect();
                        hasBonus = true;
                        this.ui.showMessage('ミスターきんかは\nもらえるマールを ふやしてくれた！', false, 2000, 'text-neutral');
                    } else if (m.name === 'ミスターねんりん') {
                        this.expMultiplied = true;
                        this.sound.playSe('atk_up');
                        this.ui.showExpUpEffect();
                        hasBonus = true;
                        this.ui.showMessage('ミスターねんりんは\nもらえるけいけんちを ふやしてくれた！', false, 2000, 'text-neutral');
                    }

                    setTimeout(() => {
                        if (isNewRecord) {
                            this._showNoteRegistration(m.name, () => this._nextMonster());
                        } else {
                            this._nextMonster();
                        }
                    }, 2000);
                    return; // Specialは独自フロー
                } else if (m.isSuperRare || m.isDungeonRare) {
                    // レアモンスターは攻撃バフなし（装備ドロップのみ）
                    // hasBonus は false のまま → ドロップ演出まで待機なし
                } else if (m.isHeal) {
                    this.playerHp = this.playerMaxHp;
                    this.ui.updatePlayerHp(this.playerHp, this.playerMaxHp);
                    this.sound.playSe('heal');
                    hasBonus = true;
                    this.ui.showMessage("たいりょくが ぜんかいふくした！", false, 2000, 'text-neutral');
                }

                const delayAfterBonus = hasBonus ? 2000 : 0;

                setTimeout(() => {
                    const isBoss = m.battleNumber === Constants.BOSS_BATTLE_NUMBER;
                    const isSuperRare = m.isSuperRare;

                    // ドロップ後にノート登録メッセージを挟むラッパー
                    const afterMalle = () => {
                        if (isNewRecord) {
                            this._showNoteRegistration(m.name, () => this._nextMonster());
                        } else {
                            this._nextMonster();
                        }
                    };
                    const afterDrop = () => {
                        if (isBoss) {
                            this._doMalleDrop(afterMalle);
                        } else if (isSuperRare) {
                            this._doMalleDrop(afterMalle, 1000);
                        } else {
                            afterMalle();
                        }
                    };

                    // 新 EQUIPMENT_LIST ベースのドロップ抽選
                    const equipList = (window.EQUIPMENT_LIST && window.EQUIPMENT_LIST.length > 0) ? window.EQUIPMENT_LIST : null;
                    if (equipList) {
                        const itemCollection = this.storage.loadItemCollection();
                        // 5の倍数ダンジョンの装備：ボスが必ずドロップ（そのダンジョンのボス以外ではドロップしない）
                        const guaranteedEquip = equipList.filter(e =>
                            e.minFloor % 5 === 0 &&
                            e.minFloor === this.currentFloor &&
                            !itemCollection[e.name]
                        );
                        // 5の倍数でない装備：ダンジョンレアのみが100%ドロップ（ランダム1個）
                        const normalEquip = equipList.filter(e =>
                            e.minFloor % 5 !== 0 &&
                            e.minFloor === this.currentFloor &&
                            !itemCollection[e.name]
                        );

                        let dropItems = [];
                        if (isBoss && guaranteedEquip.length > 0) {
                            // 5の倍数ダンジョンのボス：未入手装備を全てドロップ
                            dropItems = guaranteedEquip;
                        } else if (m.isDungeonRare && normalEquip.length > 0) {
                            // ダンジョンレア：そのダンジョンの5の倍数でない装備を全てドロップ
                            dropItems = normalEquip;
                        }

                        if (dropItems.length > 0) {
                            const chainDrop = (remaining) => {
                                if (remaining.length === 0) { afterDrop(); return; }
                                const [first, ...rest] = remaining;
                                this._doEquipDrop(first, () => chainDrop(rest), 500);
                            };
                            chainDrop(dropItems);
                        } else {
                            setTimeout(() => afterDrop(), 1500);
                        }
                    }
                }, delayAfterBonus);
            };

            const showNextLevelUp = (i) => {
                if (i >= lvResult.levelUps.length) { proceedToBonuses(); return; }
                const lu = lvResult.levelUps[i];
                this.sound.playSe('level_up');
                this.ui.updatePlayerHp(this.playerHp, this.playerMaxHp);
                this._updateLevelUI();
                this.ui.showMessage(
                    `レベルアップ！Lv${lu.level}！\nたいりょくが +${lu.hpGained}あがった！`,
                    false, 2500, 'text-neutral'
                );
                setTimeout(() => showNextLevelUp(i + 1), 2500);
            };

            showNextLevelUp(0);
        }, 1500);
    }

    /* ============================================================
       レベルシステム（LevelSystem委譲）
       ============================================================ */
    _addExp(floor, isBoss, isSuperRare) { return this.levelSystem.addExp(floor, isBoss, isSuperRare); }
    _calcExpGain(floor, isBoss, isSuperRare) { return this.levelSystem.calcExpGain(floor, isBoss, isSuperRare); }
    _calcMaxHp(lv) {
        if (lv <= 1) return Constants.PLAYER_LEVEL_HP_BASE;
        return Math.round(
            Constants.PLAYER_LEVEL_HP_BASE +
            Constants.PLAYER_LEVEL_HP_K *
            Math.pow(lv - 1, 1 + Constants.PLAYER_LEVEL_HP_ALPHA / 1000)
        );
    }
    _updateLevelUI() { return this.levelSystem.updateLevelUI(); }

    /* ============================================================
       ショップ「うる」タブ
       ============================================================ */
    _switchShopTab(tab) {
        ['item', 'sword', 'shield', 'sell'].forEach(t => {
            const btn = document.getElementById(`shop-tab-${t}`);
            if (btn) btn.classList.toggle('active', t === tab);
        });
        document.getElementById('shop-items').style.display = tab === 'item' ? '' : 'none';
        document.getElementById('shop-sword-items').style.display = tab === 'sword' ? '' : 'none';
        document.getElementById('shop-shield-items').style.display = tab === 'shield' ? '' : 'none';
        document.getElementById('shop-sell-items').style.display = tab === 'sell' ? '' : 'none';
        if (tab === 'sword') this._renderShopEquipTab('sword');
        else if (tab === 'shield') this._renderShopEquipTab('shield');
        else if (tab === 'sell') this._renderSellItems();
        this.sound.playSe('shop_tub');
        // 商品一覧エリアを表示し、背景をゆっくり暗くする
        const area = document.getElementById('shop-items-area');
        if (area) area.style.display = '';
        const bg = document.getElementById('shop-bg-img');
        if (bg) { bg.style.transition = 'opacity 0.3s'; bg.style.opacity = '0.5'; }
    }

    _renderSellItems() {
        const container = document.getElementById('shop-sell-items');
        if (!container) return;
        container.innerHTML = '';

        // アイテム
        window.ITEM_LIST.forEach(item => {
            const count = this.backpack.items[item.id] || 0;
            if (count <= 0) return;
            const sellPrice = item.sellPrice || 0;
            const btn = document.createElement('button');
            btn.className = 'shop-item-btn';
            btn.innerHTML = `
                <img src="assets/image/item/${item.img}" alt="${item.name}" class="shop-item-img">
                <div class="shop-item-name">${item.name} ×${count}</div>
                <div class="shop-item-price">${sellPrice}マール</div>
            `;
            btn.addEventListener('click', () => this._openSellDetail({ ...item, category: 'item', sellPrice }));
            container.appendChild(btn);
        });

        // 武具（bag.equipment）
        const equipment = Array.isArray(this.backpack.equipment) ? this.backpack.equipment : [];
        equipment.forEach(eq => {
            const sellPrice = eq.sellPrice || 0;
            const folder = eq.type === 'sword' ? 'sword' : 'shield';
            const btn = document.createElement('button');
            btn.className = 'shop-item-btn';
            btn.innerHTML = `
                <img src="assets/image/equipment/${folder}/${eq.img}" alt="${eq.name}" class="shop-item-img">
                <div class="shop-item-name">${eq.name}</div>
                <div class="shop-item-price">${sellPrice}マール</div>
            `;
            btn.addEventListener('click', () => this._openSellDetail({ ...eq, category: 'equipment', sellPrice }));
            container.appendChild(btn);
        });

        if (container.children.length === 0) {
            const msg = document.createElement('p');
            msg.className = 'shop-empty-msg';
            msg.textContent = 'うれるものがないよ';
            container.appendChild(msg);
        }
    }

    _openSellDetail(item) {
        this._selectedSellItem = item;
        const folder = item.type === 'sword' ? 'sword' : item.type === 'shield' ? 'shield' : null;
        const imgSrc = folder
            ? `assets/image/equipment/${folder}/${item.img}`
            : `assets/image/item/${item.img}`;
        document.getElementById('shop-sell-detail-img').src = imgSrc;
        document.getElementById('shop-sell-detail-name').textContent = item.name;
        document.getElementById('shop-sell-detail-desc').textContent = item.desc || '';
        document.getElementById('shop-sell-detail-price').textContent = `${item.sellPrice || 0}マール`;
        document.getElementById('shop-sell-overlay').classList.add('active');
    }

    _executeSellItem() {
        document.getElementById('shop-sell-overlay').classList.remove('active');
        const item = this._selectedSellItem;
        this._selectedSellItem = null;
        if (!item) return;

        if (item.category === 'item') {
            if ((this.backpack.items[item.id] || 0) <= 0) return;
            this.backpack.items[item.id]--;
            this.malle = Math.min(this.malle + (item.sellPrice || 0), Constants.MAX_MALLE);
        } else if (item.category === 'equipment') {
            const idx = this.backpack.equipment.findIndex(e => e.id === item.id);
            if (idx < 0) return;
            const soldEquip = this.backpack.equipment[idx];
            const wasEquipped = soldEquip.equipped;
            const equipType = soldEquip.type;
            this.backpack.equipment.splice(idx, 1);
            this.malle = Math.min(this.malle + (item.sellPrice || 0), Constants.MAX_MALLE);
            // 装備中だった場合はUIをリセット
            if (wasEquipped) {
                if (equipType === 'sword') {
                    this.swordLevel = -1;
                    this.ui.hideSword();
                } else {
                    this.shieldLevel = 0;
                    this.ui.hideShield();
                }
            }
        }

        this.storage.saveBackpack(this.backpack);
        this.storage.saveMalle(this.malle);
        this.sound.playSe('sell');
        this.shop.updateShopMalleDisplay(this.malle);
        this.shop.showShopMsg(`${item.name}を\nうった！`);
        this._renderSellItems();
    }

    _purchaseItem() {
        this.shop.purchaseItem(this.malle, this.backpack.items, ({ newMalle, newBackpack }) => {
            this.malle = newMalle;
            this.backpack.items = newBackpack;
            this.storage.saveBackpack(this.backpack);
        });
    }

    showShop() {
        this.sound.unlockAll();
        this.state = GameState.SHOP;
        document.getElementById('main-screen').classList.remove('active');
        document.getElementById('shop-screen').classList.add('active');
        this.shop.updateShopMalleDisplay(this.malle);
        this.shop.renderShopItems(this.backpack.items, this.malle);
        // 開店時はどのタブも選択なし、商品一覧は非表示
        ['item', 'sword', 'shield', 'sell'].forEach(t => {
            const btn = document.getElementById(`shop-tab-${t}`);
            if (btn) btn.classList.remove('active');
        });
        document.getElementById('shop-items').style.display = 'none';
        document.getElementById('shop-sword-items').style.display = 'none';
        document.getElementById('shop-shield-items').style.display = 'none';
        document.getElementById('shop-sell-items').style.display = 'none';
        document.getElementById('shop-items-area').style.display = 'none';
        const bg = document.getElementById('shop-bg-img');
        if (bg) { bg.style.transition = 'none'; bg.style.opacity = '1'; }
        this.shop.updateShopClerkSay('enter');
        this._shopWaitingTimeout = setTimeout(() => {
            if (this.state === GameState.SHOP) this.shop.updateShopClerkSay('waiting');
        }, 2000);
        this.sound.playShopBgm();
        this.ui.adjustScale();
    }

    async hideShop() {
        // waitingセリフのタイムアウトをキャンセル（遷移前に押された場合）
        if (this._shopWaitingTimeout) {
            clearTimeout(this._shopWaitingTimeout);
            this._shopWaitingTimeout = null;
        }
        // 商品一覧を即座に非表示、背景を100%に戻す
        const area = document.getElementById('shop-items-area');
        if (area) area.style.display = 'none';
        const bg = document.getElementById('shop-bg-img');
        if (bg) { bg.style.transition = 'none'; bg.style.opacity = '1'; }
        this.shop.updateShopClerkSay('leave');
        document.getElementById('shop-item-overlay').classList.remove('active');
        document.getElementById('shop-sell-overlay').classList.remove('active');
        await new Promise(resolve => setTimeout(resolve, 800));
        this._withSlide(() => {
            this.state = GameState.TOP;
            document.getElementById('shop-screen').classList.remove('active');
            document.getElementById('main-screen').classList.add('active');
            this.sound.playMenuBgm();
            this.ui.adjustScale();
        }, 'back');
    }

    showBag() {
        this.state = GameState.BACKPACK;
        document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
        document.getElementById('bag-screen').classList.add('active');
        this.ui.adjustScale();
        this.shop.renderBagGrid(this.backpack.items);
    }

    hideBag() {
        document.getElementById('bag-detail-overlay').classList.remove('active');
        this.state = GameState.BACKPACK_HUB;
        document.getElementById('bag-screen').classList.remove('active');
        document.getElementById('bag-hub-screen').classList.add('active');
        this.ui.adjustScale();
    }

    // --- レベルシステム ヘルパー (already defined above) ---

    // -------------------------------------------------------
    // Delegation shims — all old call sites still work
    // -------------------------------------------------------
    showTop() { return this.screens.showTop(); }
    showMain() { return this.screens.showMain(); }
    showDungeonSelect() { return this.screens.showDungeonSelect(); }
    _withSlide(cb, dir) { return this.screens._withSlide(cb, dir); }
    _showMainWithTransition(type) { return this.screens._showMainWithTransition(type); }
    _renderDungeonGrid() { return this.screens._renderDungeonGrid(); }
    _updateDungeonBg(d) { return this.screens._updateDungeonBg(d); }

    showNoteHub() { return this.notes.showNoteHub(); }
    hideNoteHub() { return this.notes.hideNoteHub(); }
    showNote() { return this.notes.showNote(); }
    hideNote() { return this.notes.hideNote(); }
    showItemNote() { return this.notes.showItemNote(); }
    hideItemNote() { return this.notes.hideItemNote(); }
    _updateItemCollection(n) { return this.notes._updateItemCollection(n); }
    _saveMonsterRecord(m, t) { return this.notes._saveMonsterRecord(m, t); }
    _showNoteRegistration(n, cb) { return this.notes._showNoteRegistration(n, cb); }
    _renderNoteGrid() { return this.notes._renderNoteGrid(); }

    showBackpackHub() { return this.backpackHub.showBackpackHub(); }
    hideBackpackHub() { return this.backpackHub.hideBackpackHub(); }

    showEquip() { return this.equipment.showEquip(); }
    hideEquip() { return this.equipment.hideEquip(); }
    _renderEquipList() { return this.equipment._renderEquipList(); }
    _getEquippedSwordBonus() { return this.equipment._getEquippedSwordBonus(); }
    _getEquippedShieldBonus() { return this.equipment._getEquippedShieldBonus(); }
    _getEquippedSwordSpecialEffectId() { return this.equipment._getEquippedSwordSpecialEffectId(); }
    _doEquipDrop(item, cb, delay) { return this.equipment._doEquipDrop(item, cb, delay); }
    _onEquipDropChoice(choice) { return this.equipment._onEquipDropChoice(choice); }
    _renderShopEquipTab(type) { return this.equipment._renderShopEquipTab(type); }
    _purchaseEquip() { return this.equipment._purchaseEquip(); }

    showSetting() { return this.settings.showSetting(); }
    hideSetting() { return this.settings.hideSetting(); }
    _syncSettingUI() { return this.settings._syncSettingUI(); }
    _setSoundEnabled(t, e) { return this.settings._setSoundEnabled(t, e); }
    _onVolumeChange(t) { return this.settings._onVolumeChange(t); }

    showInterval() { return this.spawner.showInterval(); }
    _showBossCutIn(m) { return this.spawner._showBossCutIn(m); }
    _onBossCutinBattleStart() { return this.spawner._onBossCutinBattleStart(); }
    _showInfoOverlay() { return this.spawner._showInfoOverlay(); }
    _determineMonster(idx) { return this.spawner._determineMonster(idx); }
    _nextMonster() { return this.spawner._nextMonster(); }
    _checkBossEvents(m) { return this.spawner._checkBossEvents(m); }
    _getBossNextImageSrc() { return this.spawner._getBossNextImageSrc(); }

    _onGameOver() { return this.results._onGameOver(); }
    _onGameClear() { return this.results._onGameClear(); }
    _doMalleDrop(cb, amt) { return this.results._doMalleDrop(cb, amt); }
    _downloadShareImage() { return this.results._downloadShareImage(); }

    _openBattleBag() { return this.itemHandler._openBattleBag(); }
    _closeBattleBag() { return this.itemHandler._closeBattleBag(); }
    _executeBattleItemUse() { return this.itemHandler._executeBattleItemUse(); }
    _afterMonsterTurnEffects(cb) { return this.itemHandler._afterMonsterTurnEffects(cb); }
    _useItemEffect(item) { return this.itemHandler._useItemEffect(item); }

    startBattle() { return this.input.startBattle(); }
    startPlayerTurn() { return this.input.startPlayerTurn(); }
    startMonsterTurn() { return this.input.startMonsterTurn(); }
    nextProblem() { return this.input.nextProblem(); }
    _handleInput(key) { return this.input._handleInput(key); }
    _submitAnswer() { return this.input._submitAnswer(); }
    _clearProblemDisplay() { return this.input._clearProblemDisplay(); }
    _timerLoop() { return this.input._timerLoop(); }
    _onQuitBattleBtnClick() { return this.input._onQuitBattleBtnClick(); }
    _resumeFromQuitConfirm() { return this.input._resumeFromQuitConfirm(); }

} // end class Game
