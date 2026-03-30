// Service Worker 登録
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./sw.js')
        .catch(err => console.warn('SW registration failed:', err));
}

// Init
window.addEventListener('DOMContentLoaded', () => {
    // Load saved name into dungeon select screen
    const savedName = localStorage.getItem('math_battle_player_name');
    if (savedName) {
        const nameInputEl = document.getElementById('player-name');
        if (nameInputEl) nameInputEl.value = savedName;
    }

    const game = new Game();

    // Modal Close Event
    const modal = document.getElementById('image-modal');
    if (modal) {
        modal.addEventListener('click', () => {
            modal.classList.remove('active');
        });
    }

    _runLoadingScreen(game);
});

function _getNoteImagePaths() {
    const paths = [];
    const assets = window.MONSTER_ASSETS;
    if (assets) {
        if (assets._legacy) {
            assets._legacy.forEach(f => paths.push(`assets/image/monster/${f}`));
        } else {
            (assets.Normal || []).forEach(f => {
                const m = f.match(/^(\d+)_/);
                if (m) paths.push(`assets/image/monster/Normal/${m[1]}/${f}`);
            });
            ['Boss', 'Heal', 'Rare', 'SuperRare', 'Special'].forEach(cat => {
                (assets[cat] || []).forEach(f => paths.push(`assets/image/monster/${cat}/${f}`));
            });
        }
    }
    (window.EQUIPMENT_LIST || []).forEach(e => {
        const dir = e.type === 'sword' ? 'equipment/sword' : 'equipment/shield';
        paths.push(`assets/image/${dir}/${e.img}`);
    });
    (window.ITEM_LIST || []).forEach(d => paths.push(`assets/image/item/${d.img}`));
    return paths;
}

function _runLoadingScreen(game) {
    const PRELOAD_IMAGES = [
        'assets/image/UI/title.webp',
        'assets/image/UI/BG_main.webp',
        'assets/image/UI/BTN_main_battle.webp',
        'assets/image/UI/BTN_main_backpack.webp',
        'assets/image/UI/BTN_main_shop.webp',
        'assets/image/UI/BTN_main_note.webp',
        'assets/image/UI/BTN_main_setting.webp',
        // --- 新規タイトル画像 (Preload) ---
        'assets/image/UI/main_battle.webp',
        'assets/image/UI/main_note.webp',
        'assets/image/UI/main_backpack.webp',
        'assets/image/UI/main_equipment.webp',
        'assets/image/UI/main_setting.webp',
        'assets/image/UI/main_item.webp',
        'assets/image/UI/main_itemnote.webp',
        'assets/image/UI/main_shop.webp',
        'assets/image/UI/main_monsternote.webp',
    ];
    const PRELOAD_AUDIO_IDS = ['bgm-title', 'bgm-menu'];

    // ノート画像をバックグラウンドでプリロード（プログレスバーには含めない）
    _getNoteImagePaths().forEach(src => { const img = new Image(); img.src = src; });

    const msgEl   = document.getElementById('loading-msg');
    const barEl   = document.getElementById('loading-bar');
    const wrapEl  = document.getElementById('loading-progress-wrap');

    let loaded = 0;
    const total = PRELOAD_IMAGES.length + PRELOAD_AUDIO_IDS.length;
    let targetPct = 0;   // 実際のロード進捗 (0-100)
    let visualPct = 0;   // バーの表示進捗 (0-100)
    let allLoaded = false;

    function onProgress() {
        loaded++;
        targetPct = (loaded / total) * 100;
    }

    // ランダムなステップでバーを targetPct に向けて少しずつ進める
    function tickBar() {
        const gap = targetPct - visualPct;
        if (gap > 0.05) {
            const step = 2 + Math.random() * Math.min(gap * 0.3, 7);
            visualPct = Math.min(visualPct + step, targetPct);
            if (barEl) barEl.style.width = `${visualPct.toFixed(1)}%`;
        }
        if (visualPct >= 99.9 && allLoaded) {
            if (barEl) barEl.style.width = '100%';
            showReady();
        } else {
            setTimeout(tickBar, 50 + Math.random() * 130);
        }
    }
    tickBar();

    const imagePromises = PRELOAD_IMAGES.map(src => new Promise(resolve => {
        const img = new Image();
        img.onload = img.onerror = () => { onProgress(); resolve(); };
        img.src = src;
    }));

    const audioPromises = PRELOAD_AUDIO_IDS.map(id => new Promise(resolve => {
        const el = document.getElementById(id);
        if (!el || !el.src) { onProgress(); resolve(); return; }
        if (el.readyState >= 4) { onProgress(); resolve(); return; }
        const done = () => { onProgress(); resolve(); };
        el.addEventListener('canplaythrough', done, { once: true });
        el.addEventListener('error', done, { once: true });
        el.load();
    }));

    const minWait = new Promise(resolve => setTimeout(resolve, 1000));

    Promise.all([...imagePromises, ...audioPromises, minWait]).then(() => {
        targetPct = 100;
        allLoaded = true;
        // バーがすでに100%に達していればすぐ表示
        if (visualPct >= 99.9) showReady();
    });

    let isReady = false;

    function showReady() {
        if (isReady) return;
        isReady = true;

        // バーが伸び切るアニメーション（CSSの transition 0.2s）が終わるのを待ってからFO開始
        setTimeout(() => {
            if (wrapEl) wrapEl.style.opacity = '0';
            if (msgEl) {
                msgEl.innerHTML = 'じゅんびOK<br>タップしてね';
                msgEl.style.animationDuration = '1.2s'; // ここで元の速さに戻す
            }

            const loadingScreen = document.getElementById('loading-screen');

            const onTap = (e) => {
                e.preventDefault();
                loadingScreen.removeEventListener('click', onTap);
                loadingScreen.removeEventListener('touchstart', onTap);

                game.sound.unlockAll();

                const fadeout = document.getElementById('fadeout-overlay');
                fadeout.classList.add('active');

                setTimeout(() => {
                    loadingScreen.classList.remove('active');
                    document.getElementById('top-screen').classList.add('active');
                    game.state = GameState.TOP;
                    game.ui.adjustScale();
                    game.sound.playTitleBgm();

                    setTimeout(() => {
                        fadeout.classList.remove('active');
                    }, 100);
                }, 750);
            };

            loadingScreen.addEventListener('click', onTap);
            loadingScreen.addEventListener('touchstart', onTap, { passive: false });
        }, 300);
    }
}
