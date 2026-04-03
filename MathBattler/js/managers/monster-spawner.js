/* MonsterSpawner: モンスター出現・インターバル画面の管理 */
class MonsterSpawner {
    constructor(game) {
        this.game = game;
        this.storage = game.storage;
        this.sound = game.sound;
        this.ui = game.ui;
    }

    showInterval() {
        this.game.state = GameState.INTERVAL;
        const m = this.game.monsters[this.game.currentMonsterIdx];

        // いかりクラスをリセット
        document.querySelector('.monster-container').classList.remove('angry');

        // BGM Check (Boss or Normal or Rare or Heal or Special)
        this.sound.playBgm({
            isBoss: m.battleNumber === Constants.BOSS_BATTLE_NUMBER,
            isSuperRare: m.isSuperRare,
            isDungeonRare: m.isDungeonRare,
            isHeal: m.isHeal,
            isSpecial: m.isSpecial,
            floor: this.game.currentFloor
        });

        // Fixed 3-line centered message format
        const msgEl = document.getElementById('interval-msg');
        let msgHtml = `${m.name}が<br>あらわれた！`;
        if (m.isHeal) {
            msgHtml += `<br>かいふくの チャンスだ！`;
        }
        msgEl.innerHTML = msgHtml;

        // セリフウィンドウの決定（interval-overlay 内）
        // 優先順: Special固有セリフ → ヤンシリーズ自己紹介 → 非表示
        // ※ボスのセリフはboss-cutin-quoteで処理するためここでは不要
        const quoteEl = document.getElementById('special-quote');
        const isYanMonster = typeof YAN_SERIES_ORDER !== 'undefined' && YAN_SERIES_ORDER.indexOf(m.name) !== -1;

        if (m.isSpecial && m.quote) {
            // Special固有セリフ
            quoteEl.textContent = `${m.quote}`;
            quoteEl.style.display = 'block';
        } else if (isYanMonster) {
            // ヤンシリーズは自分の名前を「！」付きで叫ぶ
            quoteEl.textContent = `${m.name}！`;
            quoteEl.style.display = 'block';
        } else if (m.isHeal) {
            quoteEl.textContent = `かいふくして\nあげようか？`;
            quoteEl.style.display = 'block';
        } else {
            quoteEl.textContent = '';
            quoteEl.style.display = 'none';
        }

        // 95階ボス：ヤンシリーズ未制覇の場合はボスが出現しない（画像セット前にチェック）
        if (m.battleNumber === Constants.BOSS_BATTLE_NUMBER && this.game.currentFloor === 95) {
            let collection = {};
            try {
                const stored = localStorage.getItem('math_battle_collection_v1');
                if (stored) collection = JSON.parse(stored);
            } catch (e) { }
            if (!isYanMonsterUnlocked('ヤンチヤントバーン', collection)) {
                this.game.state = GameState.TRANSITION;
                this.sound.stopBgm();
                this.ui.showMessage('ボスがいない・・', false, 2500);
                setTimeout(() => this.game._onGameClear(), 2500);
                return;
            }
        }

        // Preload Image & Reset Opacity
        const mImg = document.getElementById('monster-img');
        const iImg = document.getElementById('interval-monster-img');
        mImg.src = m.imageSrc;
        document.getElementById('battle-bg-img').src = this._getBattleBgSrc(m);
        [mImg, document.getElementById('monster-name'), document.getElementById('monster-hp-container')].forEach(el => {
            el.classList.remove('fade-slow', 'boss-defeat-anim', 'boss-defeat-anim-name');
            el.style.opacity = '1';
        });
        iImg.src = m.imageSrc;

        this.ui.updateMonsterHp(m.hpRatio);
        const monsterNameEl = document.getElementById('monster-name');
        monsterNameEl.textContent = m.name;
        // 文字数に応じてフォントスケールを調整（10文字を基準とした縮小）
        const nameScale = m.name.length > 10 ? 10 / m.name.length : 1;
        monsterNameEl.style.setProperty('--monster-name-scale', nameScale);
        this.ui.updateStageProgress(this.game.monsters, this.game.currentMonsterIdx, Constants.MONSTERS_PER_FLOOR);

        // ボスの場合はカットインを表示（interval-overlay は使わない）
        if (m.battleNumber === Constants.BOSS_BATTLE_NUMBER) {
            this._showBossCutIn(m);
        } else {
            const blackout = document.getElementById('interval-blackout');
            const content = document.querySelector('#interval-overlay .overlay-content');
            blackout.classList.remove('fade-out');
            // コンテンツのFIアニメーションを毎回リセット
            content.style.animation = 'none';
            content.offsetHeight; // reflow
            content.style.animation = '';
            document.getElementById('interval-overlay').classList.add('active');
            setTimeout(() => blackout.classList.add('fade-out'), 300);
        }
    }

    _showBossCutIn(m) {
        const overlay = document.getElementById('boss-cutin-overlay');
        const imgEl = document.getElementById('boss-cutin-img');
        const labelEl = overlay.querySelector('.boss-cutin-label');
        const nameEl = document.getElementById('boss-cutin-name');
        const btnsEl = document.getElementById('boss-cutin-btns');
        const quoteEl = document.getElementById('boss-cutin-quote');

        // リセット
        imgEl.src = m.imageSrc;
        // ボス名は非表示のため設定不要（CSSでdisplay:none）
        imgEl.classList.remove('zoom-up');
        labelEl.classList.remove('fade-out-el');
        nameEl.classList.remove('fade-out-el');
        btnsEl.classList.remove('visible');
        overlay.classList.remove('fade-out');

        // ボスのセリフ（名前を「！」付きで叫ぶ）
        // ヤン系ボスのみ叫ぶ（名前に「ヤン」を含む場合）
        // ※「ぼろぼろのヤンダ」は変身イベントのメッセージで叫んでいるので除外
        if (quoteEl) {
            const isYanBoss = m.name.includes('ヤン') && m.name !== 'ぼろぼろのヤンダ';
            if (isYanBoss) {
                quoteEl.textContent = `${m.name}！`;
                quoteEl.style.display = 'block';
            } else {
                quoteEl.style.display = 'none';
            }
        }

        overlay.classList.add('active');
        this.sound.playSe('boss_enter');

        // 2秒後: ラベル・セリフをフェードアウト + 画像ズームアップ（名前は非表示のため除外）
        setTimeout(() => {
            labelEl.classList.add('fade-out-el');
            // 名前は非表示のためフェードアウト不要
            if (quoteEl) quoteEl.style.display = 'none';
            imgEl.classList.add('zoom-up');

            // 0.5秒後: ボタン表示
            setTimeout(() => {
                btnsEl.classList.add('visible');
            }, 500);
        }, 2000);
    }

    _onBossCutinBattleStart() {
        const overlay = document.getElementById('boss-cutin-overlay');
        const imgEl = document.getElementById('boss-cutin-img');
        const labelEl = overlay.querySelector('.boss-cutin-label');
        const nameEl = document.getElementById('boss-cutin-name');
        const btnsEl = document.getElementById('boss-cutin-btns');
        const quoteEl = document.getElementById('boss-cutin-quote');

        // カットインオーバーレイを非表示にしてバトル開始
        overlay.classList.remove('active');
        imgEl.classList.remove('zoom-up');
        labelEl.classList.remove('fade-out-el');
        nameEl.classList.remove('fade-out-el');
        btnsEl.classList.remove('visible');
        if (quoteEl) quoteEl.style.display = 'none';

        this.game.startBattle();
    }

    _showInfoOverlay() {
        const m = this.game.monsters[this.game.currentMonsterIdx];
        const playerAtk = 1 + this.game._getEquippedSwordBonus() + this.game.swordBonus;
        const playerDef = this.game._getEquippedShieldBonus() + this.game.defenseBonus;
        const isMaxLevel = this.game.playerLevel >= Constants.PLAYER_MAX_LEVEL;
        const expNeeded = isMaxLevel ? null : Constants.EXP_LEVEL_BASE + (this.game.playerLevel - 1) * Constants.EXP_LEVEL_STEP;
        this.ui.showInfoOverlay(m, {
            hp: this.game.playerHp,
            maxHp: this.game.playerMaxHp,
            atk: playerAtk,
            def: playerDef,
            hasShield: this.game._getEquippedShieldBonus() > 0,
            dodgeStreak: this.game.dodgeStreak,
            specialMoveReady: this.game.specialMoveReady,
            level: this.game.playerLevel,
            exp: this.game.playerExp,
            expNeeded,
            isMaxLevel
        });
    }

    /**
     * モンスターの抽選をおこなう
     * 判定優先順位： 1. DungeonRare 2. SuperRare 3. Special 4. Heal 5. Normal or Boss
     */
    _determineMonster(idx) {
        const m = this.game.monsters[idx];

        // ボス（最後のモンスター）は抽選対象外
        if (m.battleNumber === Constants.BOSS_BATTLE_NUMBER) {
            return;
        }

        // デバッグモード：全種を100%出現させる（出現優先順を順番に消費）
        if (typeof DEBUG_MODE !== 'undefined' && DEBUG_MODE) {
            const debugTypes = ['dungeonRare', 'superRare', 'special', 'heal'];
            const usedKey = '_debugTypeIdx';
            if (!this.game[usedKey]) this.game[usedKey] = 0;
            const type = debugTypes[this.game[usedKey] % debugTypes.length];
            this.game[usedKey]++;
            const floorStrDbg = String(this.game.currentFloor).padStart(3, '0');
            const rareListDbg = (window.MONSTER_ASSETS && window.MONSTER_ASSETS.Rare) || [];
            const hasRareImageDbg = rareListDbg.some(f => f.toLowerCase().startsWith(`d${floorStrDbg}_`));
            if (type === 'dungeonRare' && !this.game.dungeonRareAppeared && hasRareImageDbg) {
                this.game.dungeonRareAppeared = true;
                this.game.monsters[idx] = new Monster(m.battleNumber, this.game.currentFloor, false, false, false, true);
            } else if (type === 'superRare' && !this.game.superRareAppeared) {
                this.game.superRareAppeared = true;
                this.game.monsters[idx] = new Monster(m.battleNumber, this.game.currentFloor, false, false, true, false);
            } else if (type === 'special') {
                const availableSpecials = ['ミスターといし', 'ミスターてっぱん', 'ミスターきんか', 'ミスターねんりん'].filter(name => !this.game.specialMonstersAppeared.includes(name));
                if (availableSpecials.length > 0) {
                    const chosenSpecial = availableSpecials[0];
                    this.game.specialMonstersAppeared.push(chosenSpecial);
                    this.game.monsters[idx] = new Monster(m.battleNumber, this.game.currentFloor, false, chosenSpecial, false, false);
                    return;
                }
                // Specialが尽きたら通常
            } else if (type === 'heal' && !this.game.healAppeared) {
                this.game.healAppeared = true;
                this.game.monsters[idx] = new Monster(m.battleNumber, this.game.currentFloor, true, false, false, false);
            }
            return;
        }

        // 安全装置判定（HPが6割を下回っているか）
        const isLowHp = this.game.playerHp < (this.game.playerMaxHp * 0.6);

        // 第1優先：ダンジョンレア判定（3%・1ダンジョン1体まで・フロア対応画像がある場合のみ）
        const floorStr = String(this.game.currentFloor).padStart(3, '0');
        const rareList = (window.MONSTER_ASSETS && window.MONSTER_ASSETS.Rare) || [];
        const hasRareImage = rareList.some(f => f.toLowerCase().startsWith(`d${floorStr}_`));
        const dungeonRareRate = 0.03 + (this.game._monsterItemUsage.rainbowOrbUsed ? 0.05 : 0);
        if (!isLowHp && !this.game.dungeonRareAppeared && hasRareImage && Math.random() < dungeonRareRate) {
            this.game.dungeonRareAppeared = true;
            this.game.monsters[idx] = new Monster(m.battleNumber, this.game.currentFloor, false, false, false, true);
            return;
        }

        // 第2優先：げきレア判定（1%・1ダンジョン1体まで）※直前ダンジョンのボスを撃破している場合のみ抽選
        if (!isLowHp && !this.game.superRareAppeared && this.game.prevBossDefeated && Math.random() < 0.01) {
            this.game.superRareAppeared = true;
            this.game.monsters[idx] = new Monster(m.battleNumber, this.game.currentFloor, false, false, true, false);
            return;
        }

        // 第3優先：Special判定（一度出たらもう出ない）
        if (!isLowHp && !this.game.specialAppeared) {
            const availableSpecials = ['ミスターといし', 'ミスターてっぱん', 'ミスターきんか', 'ミスターねんりん'].filter(name => !this.game.specialMonstersAppeared.includes(name));
            if (availableSpecials.length > 0 && Math.random() < 0.04) {
                const chosenSpecial = availableSpecials[Math.floor(Math.random() * availableSpecials.length)];
                this.game.specialMonstersAppeared.push(chosenSpecial);
                this.game.specialAppeared = true;
                this.game.monsters[idx] = new Monster(m.battleNumber, this.game.currentFloor, false, chosenSpecial, false, false);
                return;
            }
        }

        // 第4優先：回復キャラ判定（HP割合ベース・1ダンジョン1体まで）
        const hpRatio = this.game.playerHp / this.game.playerMaxHp;
        let healRate = 0;
        if (!this.game.healAppeared) {
            if (hpRatio <= 0.10) healRate = 0.40;
            else if (hpRatio <= 0.20) healRate = 0.30;
            else if (hpRatio <= 0.30) healRate = 0.20;
            else if (hpRatio <= 0.40) healRate = 0.15;
            else if (hpRatio <= 0.50) healRate = 0.10;
            else if (hpRatio <= 0.60) healRate = 0.05;
            else if (hpRatio <= 0.80) healRate = 0.03;
        }
        if (Math.random() < healRate) {
            this.game.healAppeared = true;
            this.game.monsters[idx] = new Monster(m.battleNumber, this.game.currentFloor, true, false, false, false);
            return;
        }

        // 第5優先：通常（すでに通常なので何もしない）
    }

    _nextMonster() {
        this.game.currentMonsterIdx++;
        if (this.game.currentMonsterIdx >= Constants.MONSTERS_PER_FLOOR) {
            this.game._onGameClear();
            return;
        }

        this._determineMonster(this.game.currentMonsterIdx);

        ['monster-img', 'monster-name', 'monster-hp-container'].forEach(id => {
            const el = document.getElementById(id);
            if (el) {
                el.style.opacity = '1';
                el.classList.remove('boss-defeat-anim', 'boss-defeat-anim-name');
            }
        }); // Reset fade and animations

        this.showInterval();
    }

    _getBossNextImageSrc() {
        const floor = this.game.currentFloor;
        const assets = getMonsterAssets();
        const floorStr = String(floor).padStart(3, '0');
        const list = assets._legacy ? assets._legacy : (assets.Boss || []);
        const folder = assets._legacy ? 'assets/image/monster/' : 'assets/image/monster/Boss/';
        const candidates = list.filter(f => f.toLowerCase().startsWith(`boss${floorStr}next_`.toLowerCase()));
        if (candidates.length > 0) {
            const choice = candidates[Math.floor(Math.random() * candidates.length)];
            let name = choice.replace(/\.(webp|png|jpg|jpeg)$/i, '').replace(/^boss\d+next_/i, '');
            return { src: `${folder}${choice}`, name };
        }
        return null;
    }

    async _checkBossEvents(m) {
        // ボス回復イベント（HP<=0で全回復・1回のみ）⑤ → nextイベント①の順で必ず両方発動させるため先に評価
        const BOSS_RECOVER_EVENTS = {
            'がんす':               'くずれたほねが かってにくっついた！',
            'ブロンズライオン':     'モンスターは しっぽを さがしている！',
            'もりをまもるえいし':   'もりのちからが えいしにやどる！',
            'メガトンてつじん':     'てつじんは たおれない！',
            'サバンナぞくちょう':   'ぞくちょうは ふっかつのダンス！',
            'きしがりのオーガン':   'オーガンは そうびを てばなさない！',
            'うみのしはいしゃモサ': 'モサは さらに あばれだした！',
            'ほろびのこくおう':     'こくおうは えいえんに ふめつ！',
            'こうてつカブトサムライ': 'サムライに はいぼくは ない！',
        };
        const recoverMsg = BOSS_RECOVER_EVENTS[m.name];
        if (recoverMsg && m.hp <= 0 && !m.hasEatenMeat) {
            m.hasEatenMeat = true;
            
            // 1. ダメージメッセージを表示するための間（1.5秒待機）
            await new Promise(resolve => setTimeout(resolve, 1500));

            // 2. フェイク撃破演出（ノーマルモンスターと同じ「たおした！」メッセージと消滅）
            this.sound.playSe('defeat');
            this.ui.showMessage(`${m.name}をたおした！`, false, 2000, 'text-neutral');
            document.getElementById('monster-img').style.opacity = '0';
            document.getElementById('monster-name').style.opacity = '0';
            document.getElementById('monster-hp-container').style.opacity = '0';
            
            // 3. たおした余韻（2秒待機）
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            // 4. ゆっくり下からフェードインさせるクラスを付与
            const imgEl = document.getElementById('monster-img');
            const nameEl = document.getElementById('monster-name');
            const hpEl = document.getElementById('monster-hp-container');

            // アニメーションはインラインstyle.opacityを上書きするため、
            // クラス追加前にopacityを消去しない（消去すると一瞬opacity:1になって点滅する）
            imgEl.classList.add('boss-recover-anim');
            nameEl.classList.add('boss-recover-anim-name');
            hpEl.classList.add('boss-recover-anim-name');

            this.ui.showMessage(recoverMsg, false, 3000, 'text-neutral');
            this.sound.playSe('boss_resurrection');

            // 3秒間のFIアニメーションを見せる
            await new Promise(resolve => setTimeout(resolve, 3000));

            m.hp = m.maxHp;
            this.ui.updateMonsterHp(m.hpRatio);
            this.ui.showMessage("たいりょくが ぜんかいふくした！", false, 1500, 'text-neutral');
            this.sound.playSe('monster_recover');
            await new Promise(resolve => setTimeout(resolve, 1500));

            // クラス削除前にインラインopacityをリセット（animationがforwardsでopacity:1を
            // 保持している間に消しておくことで、クラス削除時に点滅しない）
            imgEl.style.opacity = '';
            nameEl.style.opacity = '';
            hpEl.style.opacity = '';
            imgEl.classList.remove('boss-recover-anim');
            nameEl.classList.remove('boss-recover-anim-name');
            hpEl.classList.remove('boss-recover-anim-name');

            return true;
        }
        // ボスnext変身イベント（HPが0以下、未変身）
        // ヤンチヤントバーンは独自の2段階イベントで処理するためここでは除外
        const nextInfo = this._getBossNextImageSrc();
        if (nextInfo && m.battleNumber === Constants.BOSS_BATTLE_NUMBER && m.hp <= 0 && !m.hasTransformed && m.name !== 'ヤンチヤントバーン') {
            m.hasTransformed = true;
            await new Promise(resolve => setTimeout(resolve, 1500));

            m.maxHp = Math.ceil(m.maxHp * 1.5);
            m.hp = m.maxHp;
            m.attackPower = Math.ceil(m.attackPower * 1.5);
            m.imageSrc = nextInfo.src;
            document.getElementById('monster-img').src = m.imageSrc;
            m.name = nextInfo.name;
            document.getElementById('monster-name').textContent = m.name;
            this.ui.updateMonsterHp(m.hpRatio);
            this.ui.showMessage("モンスターが しんのすがたを かいほうした！", false, 3000, 'text-neutral');
            this.sound.playSe('transform');
            await new Promise(resolve => setTimeout(resolve, 3000));
            return true;
        }
        // ヤンチヤントバーン 第一段階：気合の全回復（HP≤5で初回）
        if (m.name === 'ヤンチヤントバーン' && m.hp <= 0 && !m.hasEatenMeat) {
            m.hasEatenMeat = true;
            
            // 1. ダメージメッセージを表示するための間（1.5秒待機）
            await new Promise(resolve => setTimeout(resolve, 1500));

            // 2. フェイク撃破演出（ノーマルモンスターと同じ「たおした！」メッセージと消滅）
            this.sound.playSe('defeat');
            this.ui.showMessage(`${m.name}をたおした！`, false, 2000, 'text-neutral');
            document.getElementById('monster-img').style.opacity = '0';
            document.getElementById('monster-name').style.opacity = '0';
            document.getElementById('monster-hp-container').style.opacity = '0';
            
            // 3. たおした余韻（2秒待機）
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            // 4. ゆっくり下からフェードインさせるクラスを付与
            const imgEl = document.getElementById('monster-img');
            const nameEl = document.getElementById('monster-name');
            const hpEl = document.getElementById('monster-hp-container');

            imgEl.classList.add('boss-recover-anim');
            nameEl.classList.add('boss-recover-anim-name');
            hpEl.classList.add('boss-recover-anim-name');

            this.ui.showMessage("ヤンチヤントバーン！", false, 3000, 'text-neutral');
            this.sound.playSe('boss_resurrection');

            // 3秒間のFIアニメーションを見せる
            await new Promise(resolve => setTimeout(resolve, 3000));

            m.hp = m.maxHp;
            this.ui.updateMonsterHp(m.hpRatio);
            this.ui.showMessage("たいりょくが ぜんかいふくした！", false, 1500, 'text-neutral');
            this.sound.playSe('monster_recover');
            await new Promise(resolve => setTimeout(resolve, 1500));

            imgEl.style.opacity = '';
            nameEl.style.opacity = '';
            hpEl.style.opacity = '';
            imgEl.classList.remove('boss-recover-anim');
            nameEl.classList.remove('boss-recover-anim-name');
            hpEl.classList.remove('boss-recover-anim-name');

            return true;
        }
        // ヤンチヤントバーン 第二段階：弱体化と姿の変化（全回復後、再びHP≤5）
        if (m.name === 'ヤンチヤントバーン' && m.hp <= 0 && m.hasEatenMeat && !m.hasTransformed) {
            m.hasTransformed = true;
            await new Promise(resolve => setTimeout(resolve, 1500));

            this.ui.showMessage("ヤンダ！", false, 3000, 'text-neutral');
            this.sound.playSe('transform');
            await new Promise(resolve => setTimeout(resolve, 3000));

            const yanNextInfo = this._getBossNextImageSrc();
            if (yanNextInfo) {
                m.imageSrc = yanNextInfo.src;
                m.name = yanNextInfo.name;
            } else {
                m.name = 'ぼろぼろのヤンダ';
            }
            document.getElementById('monster-img').src = m.imageSrc;
            document.getElementById('monster-name').textContent = m.name;

            m.hp = m.maxHp;
            m.attackPower = 1;
            this.ui.updateMonsterHp(m.hpRatio);
            this.ui.showMessage("たいりょくが ぜんかいふくした！", false, 1500, 'text-neutral');
            this.sound.playSe('monster_recover');
            await new Promise(resolve => setTimeout(resolve, 1500));
            return true;
        }
        return false;
    }

    _getBattleBgSrc(m) {
        const base = 'assets/image/ui/battle/battlebg/';
        if (m.battleNumber === Constants.BOSS_BATTLE_NUMBER) return `${base}BattleBG_BossX.webp`;
        if (m.isSuperRare) return `${base}BattleBG_SRare.webp`;
        if (m.isDungeonRare) return `${base}BattleBG_Rare.webp`;
        if (m.isHeal) return `${base}BattleBG_Heal.webp`;
        if (m.isSpecial) return `${base}BattleBG_Special.webp`;
        const idx = String(Math.min(10, Math.ceil(this.game.currentFloor / 10))).padStart(2, '0');
        return `${base}BattleBG_${idx}.webp`;
    }
}
