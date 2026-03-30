/* ============================================================
 *  !!!  デバッグフラグ  !!!
 *  リリース前に必ず false に戻すこと！
 **************デバッグモード*****************
 *  true にすると以下がすべて有効になる:
 *    - 全ダンジョン解放
 *    - プレイヤー攻撃力 100
 *    - プレイヤー防御力 100
 *    - 武具ドロップ率 100%
 * ============================================================ */
const DEBUG_MODE = false; // ← リリース時は false !!!
/* ============================================================ */

/* Game Constants */
const Constants = {
    PLAYER_MAX_HP: 10,
    TOTAL_FLOORS: 100,
    MONSTERS_PER_FLOOR: 10,
    BOSS_BATTLE_NUMBER: 10,
    NORMAL_DAMAGE: 1,
    CRITICAL_DAMAGE: 2,
    FONT_PIXEL: 'DotGothic16, sans-serif',
    MAX_MALLE: 9999999,
    MAX_ITEM: 10,
    DEBUG_ALL_FLOORS_OPEN: false, // true にすると全ダンジョン解放（DEBUG_MODE と同効果）
    // レベルシステム
    PLAYER_MAX_LEVEL: 100,
    PLAYER_LEVEL_HP_BASE: 10,
    PLAYER_LEVEL_HP_ALPHA: 40,
    PLAYER_LEVEL_HP_K: 6.014,
    EXP_BASE: 12,
    EXP_FLOOR_SCALE: 30,   // /1000
    EXP_BOSS_MULT: 8,
    EXP_LEVEL_BASE: 100,
    EXP_LEVEL_STEP: 50,
};

/* 難易度 */
const Difficulty = { EASY: 1, NORMAL: 2, HARD: 3 };

/**
 * 難易度別タイマー設定（インデックス 1=★, 2=★★, 3=★★★）
 * ATTACK:     プレイヤー攻撃の制限時間（秒）
 * DODGE:      モンスターターンの回避制限時間（秒）
 * CRITICAL:   クリティカル判定しきい値（秒以内）
 * MAHI_DODGE: まひだま使用時の回避制限時間（秒）
 */
const DIFFICULTY_TIMER = {
    ATTACK: [null, 15, 12, 10],
    DODGE: [null, 30, 25, 20],
    CRITICAL: [null, 5.0, 4.0, 3.0],
    MAHI_DODGE: [null, 45, 37, 30],
};

/* State Management */
const GameState = {
    TOP: 'top',
    DUNGEON_SELECT: 'dungeon_select',
    BATTLE: 'battle',
    INTERVAL: 'interval',
    TRANSITION: 'transition',
    GAME_OVER: 'game_over',
    RESULT: 'result',
    NOTE: 'note',
    MONSTER_NOTE: 'monster_note',
    ITEM_NOTE: 'item_note',
    SHOP: 'shop',
    BACKPACK_HUB: 'backpack_hub',
    BACKPACK: 'backpack',
    EQUIP: 'equip',
    SETTING: 'setting'
};

/* Shop Item Data */

