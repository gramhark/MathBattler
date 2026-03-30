/* ============================================================
   Special シリーズ 固有セリフ定義
   ============================================================ */
const SPECIAL_MONSTER_DATA = {
    'ミスターといし': {
        quote: 'ぶきをつよくして\nやろうか・・？'
    },
    'ミスターてっぱん': {
        quote: 'たてを\nつよくしてやろう'
    },
    'ミスターきんか': {
        quote: 'マールを\nふやしてやろうか？'
    },
    'ミスターねんりん': {
        quote: 'けいけんちを\nふやしてやろうか？'
    }
};

class Monster {
    /**
     * @param {number} battleNumber - 1〜10（何戦目か）
     * @param {number} floor - 1〜100（ダンジョン階数）
     * @param {boolean} isHeal
     * @param {boolean|string} isSpecial - false or special monster name string
     * @param {boolean} isSuperRare
     * @param {boolean} isDungeonRare
     * @param {Set|null} excludeImages - すでに使用済みの画像ファイル名（重複防止用）
     */
    constructor(battleNumber, floor, isHeal = false, isSpecial = false, isSuperRare = false, isDungeonRare = false, excludeImages = null) {
        this.battleNumber = battleNumber;
        this.floor = floor;

        this.isHeal = isHeal;
        this.isSuperRare = isSuperRare;
        this.isDungeonRare = isDungeonRare;
        this.isSpecial = !!isSpecial;
        this.specialName = (typeof isSpecial === 'string') ? isSpecial : null;
        if (this.specialName) this.isSpecial = true;

        // 後方互換: isRare プロパティ（旧コードから参照される箇所がある）
        this.isRare = isSuperRare || isDungeonRare;

        this._excludeImages = excludeImages;

        this.hasEatenMeat = false;
        this.hasLickedSap = false;
        this.hasTransformed = false;
        this.isAngry = false;

        // HP計算（新バランス式）
        if (isHeal || isSpecial || isSuperRare) {
            this.maxHp = 1;
        } else if (isDungeonRare) {
            // ダンジョンレア: 通常の1.5倍（ボスHP未満でキャップ）
            const n = (floor - 1) * 10 + battleNumber;
            const normalHp = Math.floor(n * 0.25) + 5;
            const nBoss = (floor - 1) * 10 + Constants.BOSS_BATTLE_NUMBER;
            const bossHp = Math.floor(nBoss) + 10;
            this.maxHp = Math.min(Math.round(normalHp * 1.5), bossHp - 1);
        } else {
            const n = (floor - 1) * 10 + battleNumber;
            if (battleNumber === Constants.BOSS_BATTLE_NUMBER) {
                // ボスモンスター: HP = floor(n × 1.0) + 10
                this.maxHp = Math.floor(n * 1.0) + 10;
            } else {
                // 通常モンスター: HP = floor(n × 0.25) + 5
                this.maxHp = Math.floor(n * 0.25) + 5;
            }
        }

        // 攻撃力計算（新バランス式）
        if (isSpecial) {
            this.attackPower = 1;
        } else if (isDungeonRare) {
            // ダンジョンレア: 通常の1.5倍（ボス攻撃力-1でキャップ）
            const n = (floor - 1) * 10 + battleNumber;
            const normalAttack = Math.floor(n / 10) + Math.floor(Math.sqrt(n)) + 1;
            const nBoss = (floor - 1) * 10 + Constants.BOSS_BATTLE_NUMBER;
            const bossAttack = Math.floor(nBoss / 5) + 2;
            this.attackPower = Math.min(Math.round(normalAttack * 1.5), bossAttack - 1);
        } else {
            const n = (floor - 1) * 10 + battleNumber;
            if (battleNumber === Constants.BOSS_BATTLE_NUMBER) {
                // ボスモンスター: 攻撃力 = floor(n / 5) + 2
                this.attackPower = Math.floor(n / 5) + 2;
            } else {
                // 通常モンスター: 攻撃力 = floor(n / 10) + floor(sqrt(n)) + 1
                this.attackPower = Math.floor(n / 10) + Math.floor(Math.sqrt(n)) + 1;
            }
        }
        // 最低攻撃力1
        if (this.attackPower < 1) this.attackPower = 1;

        this.hp = this.maxHp;
        this.name = this._getName();
        this.imageSrc = this._getImageSrc();
    }

    _getName() {
        if (this.isDungeonRare) return 'ダンジョンレア';
        if (this.isSuperRare) return 'げきレアモンスター';
        if (this.isHeal) return 'かいふくモンスター';
        if (this.isSpecial) return 'スペシャルモンスター';
        return `モンスター #${this.battleNumber}`;
    }

    _getImageSrc() {
        return findMonsterImage(this, this._excludeImages);
    }

    takeDamage(amount) {
        this.hp = Math.max(0, this.hp - amount);
    }

    get hpRatio() {
        return this.maxHp > 0 ? this.hp / this.maxHp : 0;
    }
}

/* ============================================================
   Monster Asset Helper
   ============================================================ */
function getMonsterAssets() {
    const assets = window.MONSTER_ASSETS || {};
    // 旧構造（配列型）か新構造（オブジェクト型）か判定
    if (Array.isArray(assets)) return { _legacy: assets };
    return assets;
}

/* ============================================================
   ヤン系モンスター 段階的出現制限
   ============================================================ */
const YAN_SERIES_ORDER = [
    'ヤンダ',
    'ヤンピ',
    'ヤンチ',
    'ヤント',
    'ヤンダバーン',
    'ヤンピバーン',
    'ヤンチバーン',
    'ヤントバーン',
    'ヤンチヤントバーン',
];

function isYanMonsterUnlocked(monsterName, collection) {
    const idx = YAN_SERIES_ORDER.indexOf(monsterName);
    if (idx === -1) return true;
    for (let i = 0; i < idx; i++) {
        const rec = collection[YAN_SERIES_ORDER[i]];
        if (!rec || !rec.defeated) return false;
    }
    return true;
}

/* ============================================================
   findMonsterImage: 新構造対応
   ============================================================ */
function findMonsterImage(monster, excludeImages = null) {
    const assets = getMonsterAssets();

    const getList = (category) => {
        if (assets._legacy) {
            // 旧構造フォールバック（配列）
            const arr = assets._legacy;
            const prefixMap = {
                Boss: f => /^boss/i.test(f),
                Heal: f => /^heal_/i.test(f),
                Normal: f => /^\d+_/.test(f),
                Rare: f => /^d\d+_/i.test(f),
                Special: f => /^special_/i.test(f),
                SuperRare: f => /^srare_/i.test(f),
            };
            return arr.filter(prefixMap[category] || (() => false));
        }
        return assets[category] || [];
    };

    let candidates = [];
    let folder = '';

    if (monster.isDungeonRare) {
        // Rareフォルダ: D{floor}_ プレフィックス
        folder = 'Rare';
        const floorStr = String(monster.floor).padStart(3, '0');
        const list = getList('Rare');
        candidates = list.filter(f => f.toLowerCase().startsWith(`d${floorStr}_`.toLowerCase()));

    } else if (monster.isSuperRare) {
        folder = 'SuperRare';
        candidates = getList('SuperRare');

    } else if (monster.isHeal) {
        folder = 'Heal';
        candidates = getList('Heal');

    } else if (monster.isSpecial) {
        folder = 'Special';
        const list = getList('Special');
        if (monster.specialName) {
            candidates = list.filter(f => f.toLowerCase().startsWith(`special_${monster.specialName.toLowerCase()}.`));
        }
        if (candidates.length === 0) candidates = list;

    } else if (monster.battleNumber === Constants.BOSS_BATTLE_NUMBER) {
        // ボス: Boss{floor}_ プレフィックス
        folder = 'Boss';
        const list = getList('Boss');
        const floorStr = String(monster.floor).padStart(3, '0');
        candidates = list.filter(f => f.toLowerCase().startsWith(`boss${floorStr}_`.toLowerCase()));
        if (candidates.length === 0) {
            candidates = list.filter(f => f.toLowerCase().startsWith('boss000_'));
        }
        if (candidates.length === 0) candidates = list;

    } else {
        // 通常: Normal フォルダ、10フロアごとに1:1対応
        //   01_: 1-10,  02_: 11-20, ..., 10_: 91-100
        folder = 'Normal';
        const list = getList('Normal');
        const f = monster.floor;
        const n = String(Math.min(10, Math.ceil(f / 10))).padStart(2, '0');
        const prefix = n + '_';
        candidates = list.filter(fn => fn.startsWith(prefix));
        if (candidates.length === 0) candidates = list;
    }

    // 重複除外フィルタ（同ダンジョン内で同じ画像が出ないように）
    if (excludeImages && excludeImages.size > 0) {
        const filtered = candidates.filter(f => !excludeImages.has(f));
        if (filtered.length > 0) candidates = filtered;
    }

    if (candidates.length === 0) return '';

    // コレクション読み込み（ヤン系制限・重み付き抽選で共用）
    let collection = {};
    try {
        const stored = localStorage.getItem('math_battle_collection_v1');
        if (stored) collection = JSON.parse(stored);
    } catch (e) { }

    // ヤン系出現制限チェック（通常モンスターのみ）
    if (!monster.isHeal && !monster.isSpecial && !monster.isSuperRare && !monster.isDungeonRare && monster.battleNumber !== Constants.BOSS_BATTLE_NUMBER) {
        const filteredByYan = candidates.filter(f => {
            let n = f.replace(/\.(webp|png|jpg|jpeg)$/i, '');
            n = n.replace(/^(?:rare_|heal_|special_|srare_|boss\d+next_|boss\d+_|\d+_|d\d+_)/i, '');
            return isYanMonsterUnlocked(n, collection);
        });
        if (filteredByYan.length > 0) candidates = filteredByYan;
    }

    const weights = candidates.map(f => {
        let n = f.replace(/\.(webp|png|jpg|jpeg)$/i, '');
        n = n.replace(/^(?:rare_|heal_|special_|srare_|boss\d+next_|boss\d+_|\d+_|d\d+_)/i, '');
        const isYan = YAN_SERIES_ORDER.indexOf(n) !== -1;
        const inCollection = collection[n] && collection[n].defeated;
        return (isYan && !inCollection) ? 10.0 : 1.0;
    });
    const totalWeight = weights.reduce((s, w) => s + w, 0);
    let rand = Math.random() * totalWeight;
    let choice = candidates[candidates.length - 1];
    for (let i = 0; i < candidates.length; i++) {
        rand -= weights[i];
        if (rand <= 0) { choice = candidates[i]; break; }
    }

    // 名前をファイル名から抽出
    let name = choice.replace(/\.(webp|png|jpg|jpeg)$/i, '');
    name = name.replace(/^(?:rare_|heal_|special_|srare_|boss\d+next_|boss\d+_|\d+_|d\d+_)/i, '');
    monster.name = name;
    if (monster.isSpecial) {
        const specialData = SPECIAL_MONSTER_DATA[name];
        monster.quote = specialData ? specialData.quote : '';
    }

    // パス構築
    // Normal はサブフォルダ構成: "NN_name.webp" → "assets/image/monster/Normal/NN/NN_name.webp"
    const folderPath = folder
        ? `assets/image/monster/${folder}/`
        : 'assets/image/monster/';
    if (folder === 'Normal') {
        const subMatch = choice.match(/^(\d+)_/);
        if (subMatch) return `${folderPath}${subMatch[1]}/${choice}`;
    }
    return `${folderPath}${choice}`;
}

