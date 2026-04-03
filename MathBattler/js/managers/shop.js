/* ShopManager: ショップ・リュック機能専門クラス */
class ShopManager {

    constructor(storage, sound, ui) {
        this._storage = storage;
        this._sound = sound;
        this._ui = ui;
        this._selectedItemIdx = null;
        this._shopMsgTimeout = null;
    }

    // --- ショップ画面 ---

    _getItemBuyPrice(item) {
        return item.shopBuyPrice != null ? item.shopBuyPrice : item.sellPrice * 2;
    }

    renderShopItems(backpack, malle) {
        const container = document.getElementById('shop-items');
        if (!container) return;
        container.innerHTML = '';
        window.ITEM_LIST.forEach((item, idx) => {
            // requiresUnlock チェック
            if (item.requiresUnlock === 'monster_house' && !this._storage.isMonsterHouseUnlocked()) return;
            const buyPrice = this._getItemBuyPrice(item);
            const btn = document.createElement('button');
            btn.className = 'shop-item-btn';
            btn.innerHTML = `
                <img src="assets/image/item/${item.img}" alt="${item.name}" class="shop-item-img">
                <div class="shop-item-name">${item.name}</div>
                <div class="shop-item-price">${buyPrice}マール</div>
            `;
            btn.addEventListener('click', () => this.openShopItemDetail(idx));
            container.appendChild(btn);
        });
    }

    openShopItemDetail(idx) {
        this._selectedItemIdx = idx;
        const item = window.ITEM_LIST[idx];
        const buyPrice = this._getItemBuyPrice(item);
        document.getElementById('shop-item-detail-img').src = `assets/image/item/${item.img}`;
        document.getElementById('shop-item-detail-name').textContent = item.name;
        document.getElementById('shop-item-detail-desc').textContent = item.desc;
        document.getElementById('shop-item-detail-price').textContent = `${buyPrice}マール`;
        document.getElementById('shop-item-overlay').classList.add('active');
    }

    cancelItemDetail() {
        document.getElementById('shop-item-overlay').classList.remove('active');
        this._selectedItemIdx = null;
    }

    purchaseItem(malle, backpack, onSuccess) {
        const idx = this._selectedItemIdx;
        if (idx === null || idx === undefined) return;
        const item = window.ITEM_LIST[idx];
        const buyPrice = this._getItemBuyPrice(item);

        const currentCount = backpack[item.id] || 0;
        if (currentCount >= Constants.MAX_ITEM) {
            this.showShopMsg('もう もてないぞ！');
            return;
        }
        if (malle < buyPrice) {
            this.showShopMsg('マールが\nたりないよ！');
            return;
        }

        // 購入成功
        const newMalle = malle - buyPrice;
        const newBackpack = { ...backpack };
        newBackpack[item.id] = currentCount + 1;

        // saveBackpackはonSuccess内でgame.jsが行う
        this._storage.saveMalle(newMalle);
        this._storage.saveItemCollected(item.name);
        this._sound.playSe('buy');
        this.updateShopMalleDisplay(newMalle);
        this.renderShopItems(newBackpack, newMalle);
        document.getElementById('shop-item-overlay').classList.remove('active');
        this._selectedItemIdx = null;
        this.showShopMsg(`${item.name}を\nかった！`);
        onSuccess({ newMalle, newBackpack });
    }

    showShopMsg(msg) {
        const ov = document.getElementById('shop-msg-overlay');
        document.getElementById('shop-msg-text').textContent = msg;
        ov.classList.add('active');
        if (this._shopMsgTimeout) clearTimeout(this._shopMsgTimeout);
        this._shopMsgTimeout = setTimeout(() => {
            ov.classList.remove('active');
        }, 1000);
    }

    updateShopMalleDisplay(malle) {
        const el = document.getElementById('shop-malle-text');
        if (el) el.textContent = `${malle}マール`;
    }

    updateShopClerkSay(mode) {
        const el = document.getElementById('shop-clerk-quote');
        if (!el) return;
        el.style.display = 'block';
        if (mode === 'enter') {
            el.innerHTML = 'いらっしゃい';
        } else if (mode === 'waiting') {
            const quotes = [
                'バトルちゅうに<br>リュックアイコンを さわれば<br>どうぐが つかえるぞ',
                'けんと たては<br>メニューの リュックから<br>そうびするんじゃぞ'
            ];
            const rand = Math.floor(Math.random() * quotes.length);
            el.innerHTML = quotes[rand];
        } else if (mode === 'leave') {
            el.innerHTML = 'またおいで';
        }
    }

    // --- リュック（メインメニュー画面から） ---

    renderBagGrid(backpack) {
        const grid = document.getElementById('bag-grid');
        if (!grid) return;
        grid.innerHTML = '';
        window.ITEM_LIST.forEach(item => {
            const count = backpack[item.id] || 0;
            if (count === 0) return;
            const card = document.createElement('div');
            card.className = 'bag-card';

            const imgEl = document.createElement('img');
            imgEl.src = 'assets/image/item/' + item.img;
            imgEl.className = 'bag-item-img';

            const countEl = document.createElement('div');
            countEl.className = 'bag-item-count';
            countEl.textContent = `×${count}`;

            const nameEl = document.createElement('div');
            nameEl.className = 'bag-item-name';
            nameEl.textContent = item.name;

            card.appendChild(imgEl);
            card.appendChild(countEl);
            card.appendChild(nameEl);

            card.addEventListener('click', () => this.showBagItemDetail(item, count));
            grid.appendChild(card);
        });
    }

    showBagItemDetail(item, count) {
        document.getElementById('bag-detail-img').src = 'assets/image/item/' + item.img;
        document.getElementById('bag-detail-name').textContent = item.name;
        document.getElementById('bag-detail-desc').textContent = item.desc;
        document.getElementById('bag-detail-limit').textContent = this.getItemLimitText(item.id);
        document.getElementById('bag-detail-count').textContent = `${count} / ${Constants.MAX_ITEM}`;
        document.getElementById('bag-detail-overlay').classList.add('active');
    }

    getItemLimitText(itemId) {
        switch (itemId) {
            case 'healOrb': return 'つかえるかず: なんこでも';
            case 'attackOrb': return 'つかえるかず: 1ぴきのモンスターに 3こ';
            case 'defenseOrb': return 'つかえるかず: 1ぴきのモンスターに 3こ';
            case 'spikeOrb': return 'つかえるかず: 1たいに 3こ';
            case 'poisonOrb': return 'つかえるかず: 1たいに 1こ';
            case 'paralyzeOrb': return 'つかえるかず: 1たいに 1こ';
            case 'stoneOrb': return 'つかえるかず: 1たいに 1こ\nボスには つかえない';
            default: return '';
        }
    }

    // --- リュック（バトル中） ---

    /** 戦闘中リュックのUI部分を開く（タイマー一時停止はgame.jsに残す） */
    openBattleBag(backpack, onTap) {
        this.renderBattleBagGrid(backpack, onTap);
        document.getElementById('battle-item-confirm').style.display = 'none';
        document.getElementById('battle-bag-overlay').classList.add('active');
    }

    /** 戦闘中リュックのUI部分を閉じる（タイマー再開はgame.jsに残す） */
    closeBattleBag() {
        document.getElementById('battle-bag-overlay').classList.remove('active');
        document.getElementById('battle-item-confirm').style.display = 'none';
    }

    renderBattleBagGrid(backpack, onTap) {
        const grid = document.getElementById('battle-bag-grid');
        if (!grid) return;
        grid.innerHTML = '';
        window.ITEM_LIST.forEach(item => {
            const count = backpack[item.id] || 0;
            const card = document.createElement('div');
            card.className = 'battle-bag-card' + (count === 0 ? ' battle-bag-card--empty' : '');

            const imgEl = document.createElement('img');
            imgEl.src = 'assets/image/item/' + item.img;
            imgEl.className = 'battle-bag-item-img';
            if (count === 0) imgEl.classList.add('bag-img--empty');

            const countEl = document.createElement('div');
            countEl.className = 'battle-bag-item-count';
            countEl.textContent = `×${count}`;

            const nameEl = document.createElement('div');
            nameEl.className = 'battle-bag-item-name';
            nameEl.textContent = item.name;

            card.appendChild(imgEl);
            card.appendChild(countEl);
            card.appendChild(nameEl);

            if (count > 0 && onTap) {
                card.addEventListener('click', () => onTap(item.id, card));
            }

            grid.appendChild(card);
        });
    }

    onBattleBagItemTap(itemId, card, monster, canUseItemFn, onSelectFn) {
        // stoneOrbはボスには使えない
        if (itemId === 'stoneOrb' && monster.battleNumber === Constants.BOSS_BATTLE_NUMBER) {
            this.showBossBlockMsg();
            return;
        }
        if (!canUseItemFn(itemId)) {
            this.showItemLimitMsg();
            return;
        }
        // 選択中のカードをハイライト
        document.querySelectorAll('.battle-bag-card.selected').forEach(c => c.classList.remove('selected'));
        card.classList.add('selected');
        document.getElementById('battle-item-confirm').style.display = 'flex';
        onSelectFn(itemId);
    }

    // --- アイテム制限メッセージ ---

    showItemLimitMsg() {
        const overlay = document.getElementById('item-limit-overlay');
        overlay.classList.add('active');
        setTimeout(() => {
            overlay.classList.remove('active');
        }, 1500);
    }

    showBossBlockMsg() {
        const overlay = document.getElementById('item-limit-overlay');
        const textEl = document.querySelector('.item-limit-text');
        const origText = textEl ? textEl.textContent : '';
        if (textEl) textEl.textContent = 'ボスには きかない！';
        overlay.classList.add('active');
        setTimeout(() => {
            overlay.classList.remove('active');
            if (textEl) textEl.textContent = origText;
        }, 1500);
    }
}
