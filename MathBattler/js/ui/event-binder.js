/* EventBinder: イベントリスナーの登録 */
class EventBinder {
    constructor(game) {
        this.game = game;
    }

    bind() {
        const game = this.game;

        // Interval Button
        document.getElementById('battle-start-btn').addEventListener('click', () => game.startBattle());
        document.getElementById('info-btn').addEventListener('click', () => game._showInfoOverlay());
        document.getElementById('info-close-btn').addEventListener('click', () => game.ui.hideInfoOverlay());

        // Boss cutin buttons (ボスカットイン画面内のボタン)
        document.getElementById('boss-battle-start-btn').addEventListener('click', () => game._onBossCutinBattleStart());
        document.getElementById('boss-info-btn').addEventListener('click', () => game._showInfoOverlay());

        // Restart
        document.getElementById('restart-btn').addEventListener('click', () => { 
            game.sound.playSe('back'); 
            game.sound.fadeOutBgm(game.sound.currentBgm, 200); 
            game._showMainWithTransition('black'); 
        });
        document.getElementById('share-btn').addEventListener('click', () => game._downloadShareImage());

        // Dungeon start confirm
        document.getElementById('dungeon-start-yes-btn').addEventListener('click', () => {
            game.sound.playSe('btn');
            document.getElementById('dungeon-start-confirm-overlay').classList.remove('active');
            if (game._pendingFloor != null) {
                const floor = game._pendingFloor;
                game._pendingFloor = null;
                game.startGame(floor);
            }
        });
        document.getElementById('dungeon-start-no-btn').addEventListener('click', () => {
            game.sound.playSe('btn');
            document.getElementById('dungeon-start-confirm-overlay').classList.remove('active');
            game._pendingFloor = null;
        });

        // Quit battle button
        document.getElementById('quit-battle-btn').addEventListener('click', () => { game.sound.playSe('back'); game._onQuitBattleBtnClick(); });
        document.getElementById('quit-yes-btn').addEventListener('click', () => {
            game.sound.playSe('btn');
            document.getElementById('quit-confirm-overlay').classList.remove('active');
            document.getElementById('interval-overlay').classList.remove('active');
            document.getElementById('interval-blackout').classList.remove('fade-out');
            document.getElementById('boss-cutin-overlay').classList.remove('active');
            game.showMain();
        });
        document.getElementById('quit-no-btn').addEventListener('click', () => { game.sound.playSe('btn'); game._resumeFromQuitConfirm(); });

        // Numpad
        const _spawnNumpadFlare = (btn) => {
            const wrapper = document.querySelector('.numpad-image-wrapper');
            if (!wrapper) return;
            const wRect = wrapper.getBoundingClientRect();
            const bRect = btn.getBoundingClientRect();
            const scale = wRect.width / wrapper.offsetWidth;
            const x = (bRect.left + bRect.width / 2 - wRect.left) / scale;
            const y = (bRect.top + bRect.height / 2 - wRect.top) / scale;
            const flare = document.createElement('div');
            flare.className = 'numpad-flare';
            flare.style.left = x + 'px';
            flare.style.top = y + 'px';
            wrapper.appendChild(flare);
            flare.addEventListener('animationend', () => flare.remove());
        };
        document.querySelectorAll('.num-btn').forEach(btn => {
            btn.addEventListener('touchstart', (e) => { e.preventDefault(); const k = btn.dataset.key; if (k !== 'DEL' && k !== 'ENTER') game.sound.playSe('numpad'); game._handleInput(k); _spawnNumpadFlare(btn); });
            btn.addEventListener('click', (e) => { const k = btn.dataset.key; if (k !== 'DEL' && k !== 'ENTER') game.sound.playSe('numpad'); game._handleInput(k); _spawnNumpadFlare(btn); });
        });

        // Keyboard
        document.addEventListener('keydown', (e) => {
            // Interval Screen (Fight Start)
            if (game.state === GameState.INTERVAL && e.key === 'Enter') {
                // ボスカットインオーバーレイが表示中の場合は「たたかう」ボタンを使う
                const bossCutin = document.getElementById('boss-cutin-overlay');
                const btnsVisible = document.getElementById('boss-cutin-btns').classList.contains('visible');
                if (bossCutin && bossCutin.classList.contains('active')) {
                    if (btnsVisible) game._onBossCutinBattleStart();
                    return;
                }
                game.startBattle();
                return;
            }

            if (game.state !== GameState.BATTLE) return;
            if (e.key >= '0' && e.key <= '9') game._handleInput(e.key);
            if (e.key === 'Backspace') game._handleInput('DEL');
            if (e.key === 'Enter') game._handleInput('ENTER');
        });


        // Title Screen - whole screen click to proceed
        document.getElementById('top-screen').addEventListener('click', () => { game.sound.playSe('title_tap'); game._showMainWithTransition(); });
        document.getElementById('top-screen').addEventListener('touchstart', (e) => { e.preventDefault(); game.sound.playSe('title_tap'); game._showMainWithTransition(); });

        // Main Screen buttons
        document.getElementById('battle-prep-btn').addEventListener('click', () => game._withSlide(() => game.showDungeonSelect()));
        document.getElementById('top-note-btn').addEventListener('click', () => game._withSlide(() => game.showNoteHub()));
        document.getElementById('top-shop-btn').addEventListener('click', () => game._withSlide(() => game.showShop()));
        document.getElementById('top-bag-btn').addEventListener('click', () => game._withSlide(() => game.showBackpackHub()));
        document.getElementById('top-setting-btn').addEventListener('click', () => game._withSlide(() => game.showSetting()));

        // Monster House button (conditionally shown)
        const mhBtn = document.getElementById('top-monster-house-btn');
        if (mhBtn) {
            mhBtn.addEventListener('click', () => { game.sound.playSe('btn'); game._withSlide(() => game.showMonsterHouse()); });
        }

        // Monster House Screen tabs
        const mhTabMonster = document.getElementById('mh-tab-monster');
        if (mhTabMonster) mhTabMonster.addEventListener('click', () => { game.sound.playSe('shop_tub'); if (game.monsterHouse) game.monsterHouse.switchTab('monster'); });
        const mhTabMedal = document.getElementById('mh-tab-medal');
        if (mhTabMedal) mhTabMedal.addEventListener('click', () => { game.sound.playSe('shop_tub'); if (game.monsterHouse) game.monsterHouse.switchTab('medal'); });
        const mhTabFarewell = document.getElementById('mh-tab-farewell');
        if (mhTabFarewell) mhTabFarewell.addEventListener('click', () => { game.sound.playSe('shop_tub'); if (game.monsterHouse) game.monsterHouse.switchTab('farewell'); });

        // Monster House back button
        const mhBackBtn = document.getElementById('mh-back-btn');
        if (mhBackBtn) {
            mhBackBtn.addEventListener('click', () => { game.sound.playSe('back'); game.hideMonsterHouse(); });
        }

        // Setting Screen
        document.getElementById('close-setting-btn').addEventListener('click', () => { game.sound.playSe('back'); game._withSlide(() => game.hideSetting(), 'back'); });
        document.getElementById('setting-bgm-on').addEventListener('click', () => game._setSoundEnabled('bgm', true));
        document.getElementById('setting-bgm-off').addEventListener('click', () => game._setSoundEnabled('bgm', false));
        document.getElementById('setting-se-on').addEventListener('click', () => game._setSoundEnabled('se', true));
        document.getElementById('setting-se-off').addEventListener('click', () => game._setSoundEnabled('se', false));
        document.getElementById('setting-bgm-volume').addEventListener('input', () => game._onVolumeChange('bgm'));
        document.getElementById('setting-se-volume').addEventListener('input', () => game._onVolumeChange('se'));
        document.getElementById('setting-export-btn').addEventListener('click', () => game._exportSave());
        document.getElementById('setting-import-btn').addEventListener('click', () => document.getElementById('setting-import-file').click());
        document.getElementById('setting-import-file').addEventListener('change', (e) => { game._importSave(e.target.files[0]); e.target.value = ''; });

        // Equip Screen
        document.getElementById('close-equip-btn').addEventListener('click', () => { game.sound.playSe('back'); game._withSlide(() => game.hideEquip(), 'back'); });
        document.querySelectorAll('.equip-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                game.sound.playSe('equip_tub');
                game._equipTab = tab.dataset.type;
                game._equipSortKey = tab.dataset.type === 'sword' ? 'attack' : 'defense';
                game._equipSortDir = 'desc';
                game._renderEquipList();
            });
        });

        // Equipment Drop Popup
        document.getElementById('equip-drop-equip-btn').addEventListener('click', () => { game.sound.playSe('btn'); game._onEquipDropChoice('equip'); });
        document.getElementById('equip-drop-carry-btn').addEventListener('click', () => { game.sound.playSe('btn'); game._onEquipDropChoice('carry'); });
        document.getElementById('equip-drop-discard-btn').addEventListener('click', () => { game.sound.playSe('btn'); game._onEquipDropChoice('discard'); });

        // Shop Tabs
        document.getElementById('shop-tab-item').addEventListener('click', () => game._switchShopTab('item'));
        document.getElementById('shop-tab-sword').addEventListener('click', () => game._switchShopTab('sword'));
        document.getElementById('shop-tab-shield').addEventListener('click', () => game._switchShopTab('shield'));
        document.getElementById('shop-tab-sell').addEventListener('click', () => game._switchShopTab('sell'));
        document.getElementById('shop-sell-yes-btn').addEventListener('click', () => { game.sound.playSe('btn'); game._executeSellItem(); });
        document.getElementById('shop-sell-no-btn').addEventListener('click', () => {
            game.sound.playSe('btn');
            document.getElementById('shop-sell-overlay').classList.remove('active');
            game._selectedSellItem = null;
        });

        // Dungeon Select back button
        document.getElementById('back-to-top-btn').addEventListener('click', () => { game.sound.playSe('back'); game._withSlide(() => game.showMain(), 'back'); });

        // 難易度タブ
        document.querySelectorAll('.difficulty-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                const d = parseInt(tab.dataset.difficulty);
                game.difficulty = d;
                game.storage.saveSelectedDifficulty(d);
                document.querySelectorAll('.difficulty-tab').forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                game._updateDungeonBg(d);
                game._renderDungeonGrid();
                game.sound.playSe('dungeon_tab');
            });
        });

        // Backpack Hub
        document.getElementById('close-bag-hub-btn').addEventListener('click', () => { game.sound.playSe('back'); game._withSlide(() => game.hideBackpackHub(), 'back'); });
        document.getElementById('bag-hub-equip-btn').addEventListener('click', () => game._withSlide(() => game.showEquip()));
        document.getElementById('bag-hub-item-btn').addEventListener('click', () => game._withSlide(() => game.showBag()));

        // Note Hub
        document.getElementById('close-note-hub-btn').addEventListener('click', () => { game.sound.playSe('back'); game._withSlide(() => game.hideNoteHub(), 'back'); });
        document.getElementById('note-hub-monster-btn').addEventListener('click', () => game._withSlide(() => game.showNote()));
        document.getElementById('note-hub-item-btn').addEventListener('click', () => game._withSlide(() => game.showItemNote()));

        // Phase 1: Monster Note
        document.getElementById('close-note-btn').addEventListener('click', () => {
            game.sound.playSe('back');
            game._withSlide(() => game.hideNote(), 'back');
        });
        document.getElementById('note-back-btn').addEventListener('click', () => {
            game.sound.playSe('back');
            document.getElementById('note-card-view').style.display = 'none';
            document.getElementById('note-genre-select').style.display = '';
            game.notes._updateNoteProgress();
        });

        // Bag Screen
        document.getElementById('close-bag-btn').addEventListener('click', () => { game.sound.playSe('back'); game._withSlide(() => game.hideBag(), 'back'); });
        document.getElementById('bag-detail-close-btn').addEventListener('click', () => {
            document.getElementById('bag-detail-overlay').classList.remove('active');
        });

        // Item Note
        document.getElementById('close-item-note-btn').addEventListener('click', () => { game.sound.playSe('back'); game._withSlide(() => game.hideItemNote(), 'back'); });

        // Shop
        document.getElementById('shop-back-btn').addEventListener('click', () => { game.sound.playSe('back'); game.hideShop(); });
        document.getElementById('shop-buy-yes-btn').addEventListener('click', () => {
            game.sound.playSe('btn');
            if (game._selectedShopEquip) game._purchaseEquip();
            else game._purchaseItem();
        });
        document.getElementById('shop-buy-no-btn').addEventListener('click', () => {
            game.sound.playSe('btn');
            game._selectedShopEquip = null;
            game.shop.cancelItemDetail();
        });
        // [REMOVED shop-msg-close-btn listener because of auto-close]

        // Sword (battle) — 必殺技ゲージMAX時に剣タップで必殺技待機状態をトグル
        const swordWrapper = document.getElementById('sword-aura-wrapper');
        if (swordWrapper) {
            const toggleSpecialStandby = () => {
                if (!game.specialMoveReady) return; // ゲージ未MAX時は無効
                game.specialStandby = !game.specialStandby;
                game.ui.setSpecialStandby(game.specialStandby);
                if (game.specialStandby) game.sound.playSe('standby');
            };
            swordWrapper.addEventListener('click', toggleSpecialStandby);
            swordWrapper.addEventListener('touchstart', (e) => { e.preventDefault(); toggleSpecialStandby(); }, { passive: false });
        }

        // Kaban Slot (battle) — リュックアイコンをタップでリュックウィンドウを開く
        const backpackSlotImg = document.getElementById('backpack-slot-img');
        if (backpackSlotImg) {
            backpackSlotImg.addEventListener('click', () => game._openBattleBag());
            backpackSlotImg.addEventListener('touchstart', (e) => { e.preventDefault(); game._openBattleBag(); }, { passive: false });
        }

        // Battle Bag Overlay
        document.getElementById('battle-bag-close-btn').addEventListener('click', () => { game.sound.playSe('back'); game._closeBattleBag(); });
        document.getElementById('battle-item-use-btn').addEventListener('click', () => { game.sound.playSe('btn'); game._executeBattleItemUse(); });
        document.getElementById('battle-item-cancel-btn').addEventListener('click', () => {
            game.sound.playSe('btn');
            document.getElementById('battle-item-confirm').style.display = 'none';
            document.querySelectorAll('.battle-bag-card.selected').forEach(c => c.classList.remove('selected'));
            game._battleSelectedItem = null;
        });
    }
}
