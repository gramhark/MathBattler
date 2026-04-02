/* EquipmentManager: そうび画面・武具ドロップの管理 */
class EquipmentManager {
    constructor(game) {
        this.game = game;
        this.storage = game.storage;
        this.sound = game.sound;
        this.ui = game.ui;
    }

    showEquip() {
        this.game.state = GameState.EQUIP;
        this.game._equipTab = 'sword';
        this.game._equipSortKey = 'attack';
        this.game._equipSortDir = 'desc';
        document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
        document.getElementById('equip-screen').classList.add('active');
        this.ui.adjustScale();
        this._renderEquipList();
    }

    hideEquip() {
        this.game.state = GameState.BACKPACK_HUB;
        document.getElementById('equip-screen').classList.remove('active');
        document.getElementById('bag-hub-screen').classList.add('active');
        this.ui.adjustScale();
    }

    _renderEquipList() {
        const list = document.getElementById('equip-list');
        if (!list) return;
        list.innerHTML = '';

        // ステータス表示
        const atk = 1 + this._getEquippedSwordBonus() + this.game.swordBonus;
        const def = this._getEquippedShieldBonus();
        const atkEl = document.getElementById('equip-status-atk');
        const defEl = document.getElementById('equip-status-def');
        if (atkEl) atkEl.textContent = atk;
        if (defEl) defEl.textContent = def;

        const isMaxLv = this.game.playerLevel >= Constants.PLAYER_MAX_LEVEL;
        const expNeededLv = isMaxLv ? null : Constants.EXP_LEVEL_BASE + (this.game.playerLevel - 1) * Constants.EXP_LEVEL_STEP;
        const levelValEl = document.getElementById('equip-status-level');
        const expEl = document.getElementById('equip-status-exp');
        if (levelValEl) levelValEl.textContent = isMaxLv ? `${this.game.playerLevel}(MAX)` : this.game.playerLevel;
        if (expEl) expEl.textContent = isMaxLv ? 'MAX' : `${this.game.playerExp} / ${expNeededLv}`;

        // タブ同期
        const currentTab = this.game._equipTab || 'sword';
        document.querySelectorAll('.equip-tab').forEach(t => {
            t.classList.toggle('active', t.dataset.type === currentTab);
        });

        // ソートバー更新
        this._renderSortBar(currentTab);

        const equipment = Array.isArray(this.game.backpack.equipment) ? this.game.backpack.equipment : [];
        let tabItems = equipment.filter(e => e.type === currentTab);

        // ソート適用
        const sortKey = this.game._equipSortKey || (currentTab === 'sword' ? 'attack' : 'defense');
        const sortDir = this.game._equipSortDir || 'desc';
        tabItems = [...tabItems].sort((a, b) => {
            let va, vb;
            if (sortKey === 'name') {
                va = a.name || '';
                vb = b.name || '';
                return sortDir === 'asc' ? va.localeCompare(vb, 'ja') : vb.localeCompare(va, 'ja');
            } else {
                va = sortKey === 'attack' ? (a.attack || a.bonus || 0) : (a.defense || a.bonus || 0);
                vb = sortKey === 'attack' ? (b.attack || b.bonus || 0) : (b.defense || b.bonus || 0);
                return sortDir === 'asc' ? va - vb : vb - va;
            }
        });

        if (tabItems.length === 0) {
            const empty = document.createElement('p');
            empty.className = 'equip-empty-msg';
            empty.textContent = 'ぶきを もっていないよ';
            list.appendChild(empty);
            return;
        }

        tabItems.forEach(eq => {
            const card = document.createElement('div');
            card.className = 'equip-card' + (eq.equipped ? ' equipped' : '');
            const folder = eq.type === 'sword' ? 'sword' : 'shield';
            card.innerHTML = `
                <img src="assets/image/equipment/${folder}/${eq.img}" class="equip-card-img" alt="${eq.name}">
                <div class="equip-card-info">
                    <div class="equip-card-name">${eq.name}</div>
                    <div class="equip-card-stats">${eq.attack > 0 ? `<span class="equip-stat atk">こうげき +${eq.attack}</span>` : ''}${eq.defense > 0 ? `<span class="equip-stat def">ぼうぎょ +${eq.defense}</span>` : ''}</div>
                    ${eq.equipped ? `<span class="equip-card-badge">そうびちゅう</span>` : ''}
                </div>
                <button class="primary-btn equip-card-btn${eq.equipped ? ' equip-card-btn-remove' : ''}">${eq.equipped ? 'はずす' : 'そうびする'}</button>
            `;
            card.addEventListener('click', () => {
                if (eq.equipped) {
                    // 装備を外す
                    eq.equipped = false;
                    this.storage.saveBackpack(this.game.backpack);
                    this.sound.playSe('equip_remove');
                    if (eq.type === 'sword') {
                        this.game.swordLevel = -1;
                        this.ui.hideSword();
                    } else {
                        this.game.shieldLevel = 0;
                        this.ui.hideShield();
                    }
                } else {
                    // 同種の装備を全て外してこのアイテムを装備
                    this.game.backpack.equipment.forEach(e => { if (e.type === eq.type) e.equipped = false; });
                    eq.equipped = true;
                    this.storage.saveBackpack(this.game.backpack);
                    if (eq.type === 'sword') {
                        this.ui.updateSwordEquipUI(eq);
                    } else {
                        this.ui.updateShieldEquipUI(eq);
                    }
                    this.sound.playSe('equip_set');
                }
                this._renderEquipList();
            });
            list.appendChild(card);
        });
    }

    _renderSortBar(tab) {
        const bar = document.getElementById('equip-sort-bar');
        if (!bar) return;
        bar.innerHTML = '';

        const sortKey = this.game._equipSortKey || (tab === 'sword' ? 'attack' : 'defense');
        const sortDir = this.game._equipSortDir || 'desc';

        const statKey = tab === 'sword' ? 'attack' : 'defense';
        const statLabel = tab === 'sword' ? 'こうげきじゅん' : 'ぼうぎょじゅん';

        const buttons = [
            { key: statKey, label: statLabel },
            { key: 'name', label: 'なまえじゅん' },
        ];

        buttons.forEach(({ key, label }) => {
            const btn = document.createElement('button');
            btn.className = 'equip-sort-btn' + (sortKey === key ? ' active' : '');
            const arrow = sortKey === key ? (sortDir === 'asc' ? ' ▲' : ' ▼') : '';
            btn.textContent = label + arrow;
            btn.addEventListener('click', () => {
                this.game.sound.playSe('equip_sort');
                if (this.game._equipSortKey === key) {
                    this.game._equipSortDir = this.game._equipSortDir === 'asc' ? 'desc' : 'asc';
                } else {
                    this.game._equipSortKey = key;
                    this.game._equipSortDir = key === 'name' ? 'asc' : 'desc';
                }
                this._renderEquipList();
            });
            bar.appendChild(btn);
        });
    }

    _getEquippedSwordBonus() {
        if (DEBUG_MODE) return 100;
        const equip = Array.isArray(this.game.backpack.equipment) ? this.game.backpack.equipment : [];
        const sword = equip.find(e => e.type === 'sword' && e.equipped);
        const shield = equip.find(e => e.type === 'shield' && e.equipped);
        const base = (sword ? (sword.attack || sword.bonus || 0) : 0)
                   + (shield ? (shield.attack || 0) : 0);
        const multiplied = this.game.swordMultiplied ? Math.floor(base * 1.5) : base;
        return multiplied + (this.game.companionSwordBonus || 0);
    }

    _getEquippedSwordSpecialEffectId() {
        const equipped = Array.isArray(this.game.backpack.equipment)
            ? this.game.backpack.equipment.find(e => e.type === 'sword' && e.equipped)
            : null;
        return equipped ? (equipped.specialEffectId || null) : null;
    }

    _getEquippedShieldBonus() {
        if (DEBUG_MODE) return 100;
        const equip = Array.isArray(this.game.backpack.equipment) ? this.game.backpack.equipment : [];
        const sword = equip.find(e => e.type === 'sword' && e.equipped);
        const shield = equip.find(e => e.type === 'shield' && e.equipped);
        const base = (shield ? (shield.defense || shield.bonus || 0) : 0)
                   + (sword ? (sword.defense || 0) : 0);
        const multiplied = this.game.shieldMultiplied ? Math.floor(base * 1.5) : base;
        return multiplied + (this.game.companionDefenseBonus || 0);
    }

    /**
     * 武具ドロップポップアップを表示する
     * @param {object} equipItem - EQUIPMENT_LIST のエントリ
     * @param {function} onComplete - 選択後に呼ぶコールバック
     * @param {number} initialDelay
     */
    _doEquipDrop(equipItem, onComplete, initialDelay = 500) {
        setTimeout(() => {
            const folder = equipItem.type === 'sword' ? 'sword' : 'shield';
            const imgSrc = `assets/image/equipment/${folder}/${equipItem.img}`;

            // ① ズームインアニメーション + SE（拡大開始時に鳴らす）
            const flyOverlay = document.getElementById('equip-drop-fly-overlay');
            const flyImg = document.getElementById('equip-drop-fly-img');
            flyImg.src = imgSrc;

            // モンスター画像の中心位置からズームインするよう transform-origin を計算
            const monsterImgEl = document.getElementById('monster-img');
            const appEl = document.getElementById('app');
            const monsterRect = monsterImgEl.getBoundingClientRect();
            const appRect = appEl.getBoundingClientRect();
            const appScale = appRect.width / 800;
            const flyImgSize = appEl.classList.contains('portrait-mode') ? 450 : 330;
            const monsterCX = (monsterRect.left + monsterRect.width / 2 - appRect.left) / appScale;
            const monsterCY = (monsterRect.top + monsterRect.height / 2 - appRect.top) / appScale;
            flyImg.style.transformOrigin = `${flyImgSize / 2 + (monsterCX - 400)}px ${flyImgSize / 2 + (monsterCY - 800)}px`;

            flyImg.style.animation = 'none';
            void flyImg.offsetWidth; // reflow でアニメーションリセット
            flyImg.style.animation = '';
            flyOverlay.classList.add('active');
            this.sound.playSe('equip_get');

            // ② アニメーション完了(600ms) + 2秒待機 → ポップアップ表示
            setTimeout(() => {
                flyOverlay.classList.remove('active');
                this.game._equipDropItem = equipItem;
                this.game._equipDropCallback = onComplete;
                document.getElementById('equip-drop-img').src = imgSrc;
                document.getElementById('equip-drop-name').textContent = equipItem.name;
                document.getElementById('equip-drop-desc').textContent = equipItem.desc || '';
                document.getElementById('equip-drop-overlay').classList.add('active');
            }, 2600);
        }, initialDelay);
    }

    /**
     * 武具ドロップ選択（そうびする / もちかえる / すてる）
     */
    _onEquipDropChoice(choice) {
        document.getElementById('equip-drop-overlay').classList.remove('active');
        const equipItem = this.game._equipDropItem;
        this.game._equipDropItem = null;
        const onComplete = this.game._equipDropCallback;
        this.game._equipDropCallback = null;

        if (!equipItem) {
            if (onComplete) onComplete();
            return;
        }

        if (choice === 'discard') {
            // すてる: 何もしない（ノート登録なし）
            if (onComplete) onComplete();
            return;
        }

        // もちかえる or そうびする: リュックに追加 + ノート登録
        if (!Array.isArray(this.game.backpack.equipment)) this.game.backpack.equipment = [];
        // 同一IDは重複追加しない
        if (!this.game.backpack.equipment.find(e => e.id === equipItem.id)) {
            this.game.backpack.equipment.push({ ...equipItem });
        }
        this.storage.saveBackpack(this.game.backpack);
        this.game._updateItemCollection(equipItem.name);

        if (choice === 'equip') {
            // そうびする: 同種の装備を全て外し、このアイテムをequipped:trueにする
            this.game.backpack.equipment.forEach(e => { if (e.type === equipItem.type) e.equipped = false; });
            const thisItem = this.game.backpack.equipment.find(e => e.id === equipItem.id);
            if (thisItem) thisItem.equipped = true;
            this.storage.saveBackpack(this.game.backpack);
            if (equipItem.type === 'sword') {
                this.ui.updateSwordEquipUI(thisItem || equipItem);
            } else {
                this.ui.updateShieldEquipUI(thisItem || equipItem);
            }
            this.sound.playSe('equip_set');
            this.ui.showMessage(`${equipItem.name}を\nそうびした！`, false, 2000, 'text-neutral');
            setTimeout(() => { if (onComplete) onComplete(); }, 2000);
        } else {
            // もちかえる
            this.ui.showMessage(`${equipItem.name}を\nもちかえった！`, false, 1500, 'text-neutral');
            setTimeout(() => { if (onComplete) onComplete(); }, 1500);
        }
    }

    _renderShopEquipTab(type) {
        const containerId = type === 'sword' ? 'shop-sword-items' : 'shop-shield-items';
        const container = document.getElementById(containerId);
        if (!container) return;
        container.innerHTML = '';

        const equipList = window.EQUIPMENT_LIST || [];
        const ownedIds = new Set((this.game.backpack.equipment || []).map(e => e.id));
        const collection = this.storage.loadItemCollection();
        // アイテムノートに登録済み かつ リュックに持っていない装備のみ
        const available = equipList.filter(e => e.type === type && collection[e.name] && !ownedIds.has(e.id));

        // 救済措置: D001_きのけんが未登録かつリュックになければ先頭に0マールで追加
        if (type === 'sword') {
            const rescue = equipList.find(e => e.id === 'D001_きのけん');
            if (rescue && !collection[rescue.name] && !ownedIds.has(rescue.id)) {
                available.unshift({ ...rescue, shopPrice: 0 });
            }
        }

        if (available.length === 0) {
            const msg = document.createElement('p');
            msg.className = 'shop-empty-msg';
            msg.textContent = 'なにもないよ';
            container.appendChild(msg);
            return;
        }

        const folder = type === 'sword' ? 'sword' : 'shield';
        available.forEach(eq => {
            const btn = document.createElement('button');
            btn.className = 'shop-item-btn';
            btn.innerHTML = `
                <img src="assets/image/equipment/${folder}/${eq.img}" alt="${eq.name}" class="shop-item-img">
                <div class="shop-item-name">${eq.name}</div>
                <div class="shop-item-price">${eq.sellPrice * 2}マール</div>
            `;
            btn.addEventListener('click', () => this._openShopEquipDetail(eq));
            container.appendChild(btn);
        });
    }

    _openShopEquipDetail(equipItem) {
        this.game._selectedShopEquip = equipItem;
        const folder = equipItem.type === 'sword' ? 'sword' : 'shield';
        document.getElementById('shop-item-detail-img').src = `assets/image/equipment/${folder}/${equipItem.img}`;
        document.getElementById('shop-item-detail-name').textContent = equipItem.name;
        const statLabel = equipItem.type === 'sword' ? 'こうげきりょく' : 'ぼうぎょりょく';
        const statVal = equipItem.type === 'sword' ? equipItem.attack : equipItem.defense;
        document.getElementById('shop-item-detail-desc').textContent = `${statLabel} ＋${statVal}`;
        document.getElementById('shop-item-detail-price').textContent = `${equipItem.sellPrice * 2}マール`;
        document.getElementById('shop-item-overlay').classList.add('active');
    }

    _purchaseEquip() {
        const equipItem = this.game._selectedShopEquip;
        this.game._selectedShopEquip = null;
        document.getElementById('shop-item-overlay').classList.remove('active');
        if (!equipItem) return;

        const price = equipItem.sellPrice * 2;
        if (this.game.malle < price) {
            this.game.shop.showShopMsg('マールが\nたりないよ！');
            return;
        }

        this.game.malle -= price;
        if (!Array.isArray(this.game.backpack.equipment)) this.game.backpack.equipment = [];
        this.game.backpack.equipment.push({ ...equipItem });
        this.game._updateItemCollection(equipItem.name);
        this.storage.saveBackpack(this.game.backpack);
        this.storage.saveMalle(this.game.malle);
        this.game.shop.updateShopMalleDisplay(this.game.malle);
        this.sound.playSe('buy');
        this.game.shop.showShopMsg(`${equipItem.name}を\nかった！`);
        // リュックに入ったのでショップから消す
        this._renderShopEquipTab(equipItem.type);
    }
}
