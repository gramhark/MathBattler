/* ScreenManager: 画面遷移の管理 */
class ScreenManager {
    constructor(game) {
        this.game = game;
        this.storage = game.storage;
        this.sound = game.sound;
        this.ui = game.ui;
    }

    showTop() {
        this.game.state = GameState.TOP;
        document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
        document.getElementById('top-screen').classList.add('active');
        this.ui.adjustScale();
        this.game.sound.playTitleBgm();
    }

    showMain(bgmDelay = 0) {
        // RESULT以外からの離脱（ボス未撃破での中断）はフラグをリセット
        if (this.game.state !== GameState.RESULT) {
            this.game.prevBossDefeated = false;
        }
        this.game.state = GameState.TOP;
        document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
        document.getElementById('main-screen').classList.add('active');
        this.ui.adjustScale();
        if (bgmDelay > 0) {
            setTimeout(() => this.game.sound.playMenuBgm(), bgmDelay);
        } else {
            this.game.sound.playMenuBgm();
        }
    }

    async _withSlide(callback, direction = 'forward') {
        const DURATION = 250;
        const oldScreen = document.querySelector('#app .screen.active');
        if (!oldScreen) { callback(); return; }
        this.sound.playSe(direction === 'back' ? 'slide_close' : 'slide_open');

        // 旧画面: active が外れても display:flex を維持するためインラインで固定
        oldScreen.style.display = 'flex';
        oldScreen.style.position = 'absolute';
        oldScreen.style.top = '0';
        oldScreen.style.left = '0';
        oldScreen.style.width = '100%';
        oldScreen.style.height = '100%';
        oldScreen.style.zIndex = '2';

        // 画面切替え
        callback();

        const newScreen = document.querySelector('#app .screen.active');
        if (!newScreen || newScreen === oldScreen) {
            oldScreen.style.cssText = '';
            return;
        }

        // 絶対配置の共通設定（不透明度100%を明示）
        for (const s of [oldScreen, newScreen]) {
            s.style.opacity = '1';
            s.style.backgroundColor = 'var(--bg-color)';
        }
        newScreen.style.position = 'absolute';
        newScreen.style.top = '0';
        newScreen.style.left = '0';
        newScreen.style.width = '100%';
        newScreen.style.height = '100%';

        const ease = `${DURATION}ms cubic-bezier(0.4, 0, 0.2, 1)`;

        if (direction === 'forward') {
            // 進む: 旧画面が左にスライドアウト、新画面は静止
            oldScreen.style.zIndex = '2';
            newScreen.style.zIndex = '1';
            void oldScreen.offsetWidth; // 初期位置を確定してからtransitionを有効化
            oldScreen.style.transition = `transform ${ease}`;
            oldScreen.style.transform = 'translateX(-100%)';
        } else {
            // 戻る: 新画面（メインメニュー画面）が左からスライドイン、旧画面は静止
            oldScreen.style.zIndex = '1';
            newScreen.style.zIndex = '2';
            newScreen.style.transform = 'translateX(-100%)';
            void newScreen.offsetWidth; // 初期位置を確定してからtransitionを有効化
            newScreen.style.transition = `transform ${ease}`;
            newScreen.style.transform = 'translateX(0)';
        }

        await new Promise(resolve => setTimeout(resolve, DURATION));

        // クリーンアップ
        for (const s of [oldScreen, newScreen]) {
            s.style.display = '';
            s.style.position = '';
            s.style.top = '';
            s.style.left = '';
            s.style.width = '';
            s.style.height = '';
            s.style.zIndex = '';
            s.style.transform = '';
            s.style.transition = '';
            s.style.opacity = '';
            s.style.backgroundColor = '';
        }
    }

    async _showMainWithTransition(type = 'white') {
        if (this.game._isTransitioning) return;
        this.game._isTransitioning = true;

        const overlayId = type === 'black' ? 'fadeout-overlay' : 'whiteout-overlay';
        const overlay = document.getElementById(overlayId);

        if (overlay) {
            overlay.classList.add('active');
            await new Promise(resolve => setTimeout(resolve, 750));
            this.showMain(type === 'black' ? 500 : 0);
            // 画面が切り替わるのをわずかに待ってからフェードアウト開始
            await new Promise(resolve => setTimeout(resolve, 100));
            overlay.classList.remove('active');
            // フェードアウト完了まで待機
            await new Promise(resolve => setTimeout(resolve, 750));
        } else {
            this.showMain();
        }

        this.game._isTransitioning = false;
    }

    showDungeonSelect() {
        this.sound.unlockAll();
        this.game.state = GameState.DUNGEON_SELECT;
        document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
        document.getElementById('dungeon-select-screen').classList.add('active');
        this.ui.adjustScale();
        this.sound.playDungeonBgm();
        // 保存済み難易度に合わせてタブのアクティブ状態を同期
        document.querySelectorAll('.difficulty-tab').forEach(tab => {
            tab.classList.toggle('active', parseInt(tab.dataset.difficulty) === this.game.difficulty);
        });
        this._updateDungeonBg(this.game.difficulty);
        this._renderDungeonGrid();
    }

    _updateDungeonBg(difficulty) {
        document.querySelectorAll('.dungeon-bg').forEach(img => {
            img.style.display = parseInt(img.dataset.difficulty) === difficulty ? '' : 'none';
        });
    }

    _renderDungeonGrid() {
        const grid = document.getElementById('dungeon-grid');
        if (!grid) return;
        grid.innerHTML = '';
        const cleared = this.storage.loadClearedFloors(this.game.difficulty);
        const bgSrc = `assets/image/UI/BTN_dungeon_0${this.game.difficulty}.webp`;
        for (let i = 1; i <= Constants.TOTAL_FLOORS; i++) {
            const btn = document.createElement('button');
            btn.className = 'dungeon-cell';

            const img = document.createElement('img');
            img.src = bgSrc;
            img.alt = '';
            img.className = 'dungeon-cell-bg';

            const numContainer = document.createElement('div');
            numContainer.className = 'dungeon-cell-num';
            String(i).split('').forEach(d => {
                const digitImg = document.createElement('img');
                digitImg.src = `assets/image/UI/Icon/icon_${d}.webp`;
                digitImg.alt = d;
                digitImg.className = 'dungeon-cell-num-icon';
                numContainer.appendChild(digitImg);
            });

            btn.appendChild(img);
            btn.appendChild(numContainer);

            const isCleared = !!cleared[i];
            const isUnlocked = DEBUG_MODE || Constants.DEBUG_ALL_FLOORS_OPEN || i === 1 || !!cleared[i - 1];
            if (isCleared) {
                btn.classList.add('cleared');
                const clearIcon = document.createElement('img');
                clearIcon.src = `assets/image/UI/Icon/icon_dungeonClear0${this.game.difficulty}.webp`;
                clearIcon.className = 'dungeon-clear-icon';
                clearIcon.alt = '';
                btn.appendChild(clearIcon);
            }
            if (!isUnlocked) {
                btn.classList.add('locked');
                btn.disabled = true;
            } else {
                btn.addEventListener('click', () => {
                    this.sound.playSe('dungeon_pin', this.game.difficulty);
                    this.game._pendingFloor = i;
                    document.getElementById('dungeon-start-confirm-msg').innerHTML = `${i}かいダンジョン`;
                    document.getElementById('dungeon-start-confirm-overlay').classList.add('active');
                });
            }
            grid.appendChild(btn);
        }
    }
}
