# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**マスバトール** (MathBattler) is a browser-based arithmetic battle RPG for kids. Players solve math problems to fight monsters across 10 stages. There is no build system — the game runs directly by opening `index.html` in a browser.

## Running the Game

Open `index.html` directly in a browser. No server, npm, or build step is needed.

## Adding or Updating Monster Images

After adding/removing images in `assets/image/monster/`, regenerate the monster list:

```
update_monsters.bat
```

This runs `tools/update_monsters.ps1`, which scans `assets/image/monster/` and writes `assets/monster_list.js` (the `window.MONSTER_ASSETS` array). **The game cannot find new monster images without this step.**

### Monster filename naming conventions

`window.MONSTER_ASSETS` is an **object** (not array) with category keys: `Boss`, `Normal`, `Heal`, `Rare`, `SuperRare`, `Special`. Each key maps to an array of filenames. The sort order within each category matters for note categorization.

Filename prefix determines which monster matches:
- **Normal/** `{NN}_` — normal monsters, where `NN` = `ceil(floor/10)` zero-padded (e.g., floors 1-10 → `01_`, floors 11-20 → `02_`)
- **Boss/** `Boss{DDD}_` — boss for that floor number, 3-digit zero-padded. `Boss000_` is the fallback when no floor-specific boss exists
- **Boss/** `Boss{DDD}next_` — boss "true form" (activates below HP threshold, not just floor 100)
- **Heal/** `Heal_` — healing monsters
- **Rare/** `D{DDD}_` — dungeon-rare monsters matched by floor, `D000_` as fallback
- **SuperRare/** `SRare_` — super-rare monsters (global pool)
- **Special/** `Special_{name}` — special monsters matched by `specialName` field (e.g., `Special_ミスターといし.webp`)

## Companion Documents

- **`開発仕様書.md`** — detailed internal spec: all game constants, formulas, timer values, monster spawn logic, damage math, status effects, full battle flow.
- **`各データテーブル.md`** — complete lookup tables for floors 1–100: HP growth, EXP, gold rewards, monster stats, and recommended equipment bonus values.
- **`モンスターハウス.md`** — full spec for the Monster House end-content feature: capture system, medals, companion system, storage keys, and unlock conditions.

## Canonical Screen Names

The project uses these fixed screen names (see `開発仕様書.md §1`):

| 名称 | 説明 |
|---|---|
| タイトル画面 | Startup title/logo |
| メインメニュー画面 | Hub screen for all navigation |
| ダンジョン選択画面 | Floor + difficulty selection |
| そうび画面 | Equip sword/shield |
| どうぐ画面 | View held items (旧: リュック画面) |
| モンスターノート画面 | Monster encyclopedia (図鑑) |
| アイテムノート画面 | Item/equipment encyclopedia |
| ショップ画面 | Buy/sell with マール |
| バトル画面 | In-battle arithmetic screen |
| モンスター出現画面 | Encounter choice (たたかう / じょうほう) |
| リザルト画面 | Clear results and time |
| 設定画面 | Player name, BGM/SE/volume settings |
| ノートハブ画面 | Hub → モンスターノート / アイテムノート |
| リュックハブ画面 | Hub → そうび / どうぐ |
| モンスターハウス画面 | End-content: captured companions + medal management (unlocked after floor 100 clear) |

## Architecture

Game logic is split across `js/` by feature. Load order in `index.html` matters (dependencies resolved via `<script>` tag order):

- **`assets/monster_list.js`** — auto-generated object `window.MONSTER_ASSETS`. Must be loaded first.
- **`assets/equipment_list.js`** — `window.EQUIPMENT_LIST` array of sword/shield definitions.
- **`assets/item_list.js`** — `window.ITEM_LIST` array of consumable item definitions.
- **`assets/medal_list.js`** — `window.MEDAL_LIST` array of medal definitions (attack/defense/extra_damage/malle types, four rarity tiers: bronze/silver/gold/diamond).
- **`js/core/constants.js`** — `Constants`, `Difficulty`, `DIFFICULTY_TIMER`, `GameState`, `ITEM_DATA`, `FORM_CONFIG`, drop rate arrays.
- **`js/core/sound.js`** — `SoundManager` class.
- **`js/core/math_problem.js`** — `MathProblem` class.
- **`js/core/monster.js`** — `Monster` class + helpers (`getMonsterAssets`, `findMonsterImage`, `calculateTotalMonsters`).
- **`js/core/storage.js`** — `StorageManager` class. All `localStorage` read/write is centralized here.
- **`js/core/battle.js`** — `BattleManager` class. Pure battle logic with no DOM side effects.
- **`js/ui/ui.js`** — `UIManager` class. DOM manipulation, scale adjustment, status effects display.
- **`js/ui/shop.js`** — `ShopManager` class. Shop and どうぐ UI/logic.
- **`js/ui/input-handler.js`** — `InputHandler` class. Numpad/keyboard input processing.
- **`js/ui/event-binder.js`** — `EventBinder` class. All `addEventListener` calls in one place.
- **`js/managers/screen-manager.js`** — `ScreenManager`. Top/main/dungeon screen transitions and dungeon grid rendering.
- **`js/managers/note-manager.js`** — `NoteManager`. Note hub, monster note, item note screens.
- **`js/managers/backpack-hub-manager.js`** — `BackpackHubManager`. Backpack hub screen transitions.
- **`js/managers/equipment-manager.js`** — `EquipmentManager`. そうび screen, equipment drop popup, shop equip tab.
- **`js/managers/settings-manager.js`** — `SettingsManager`. Settings screen.
- **`js/managers/monster-spawner.js`** — `MonsterSpawner`. Monster selection logic per floor.
- **`js/managers/results-manager.js`** — `ResultsManager`. Result screen display and share image generation.
- **`js/managers/battle-item-handler.js`** — `BattleItemHandler`. In-battle item use logic.
- **`js/managers/monster-house-manager.js`** — `MonsterHouseManager`. Monster House screen: companion list, medal inventory, medal equipping, companion selection, farewell (release) flow.
- **`js/game.js`** — `Game` class (main controller). Owns the game state machine, turn loop, and delegates to all managers via shim methods. Instantiates all managers in constructor.
- **`js/main.js`** — `DOMContentLoaded` bootstrap.

### CSS Structure

Styles are split across `css/` by feature. Load order in `index.html` matters:

| File | Contents |
|---|---|
| `css/base.css` | CSS variables (`:root`), global reset, `body`, `#app`, `.screen`, portrait-mode canvas |
| `css/components/buttons.css` | Button styles (`.primary-btn`, `.green-btn`, `.orange-btn`, etc.) |
| `css/components/hp-timer.css` | HP bar, timer bar |
| `css/components/monster-effects.css` | Monster image, attack effects |
| `css/components/animations.css` | Keyframe animations |
| `css/components/message.css` | Message overlay |
| `css/overlays.css` | All overlay/modal styles (interval, boss cutin, equip drop, image zoom, battle bag, etc.) |
| `css/screens/*.css` | One file per screen: `top`, `dungeon`, `battle`, `result`, `shop`, `bag`, `equip`, `setting`, `note`, `monster-house` |

### JS Classes

| File | Class | Responsibility |
|---|---|---|
| `js/core/constants.js` | constants & data | Game constants, state enum, equipment data tables |
| `js/core/sound.js` | `SoundManager` | Wraps all `<audio>` elements. BGM fade-in/out, SE playback, iOS AudioContext unlock. |
| `js/core/math_problem.js` | `MathProblem` | Generates arithmetic problems by floor+difficulty using `FLOOR_TABLES`. 60% current-tier / 40% random lower-tier mixing (except `noLower: true` rows). |
| `js/core/monster.js` | `Monster` + helpers | Monster stats (HP, attack, type flags). `SPECIAL_MONSTER_DATA` maps special names to in-battle quotes. `YAN_SERIES_ORDER` + `isYanMonsterUnlocked()` gate Yan-series progression. |
| `js/core/storage.js` | `StorageManager` | All `localStorage` access. Keys: `math_battle_player_name`, `math_battle_gold`, `math_battle_bag`, `math_battle_collection_v1`, `math_battle_difficulty`, `math_battle_cleared_floors_{1/2/3}`. |
| `js/core/battle.js` | `BattleManager` | Damage formulas, shield block, special move calculation. Returns results; never touches the DOM. |
| `js/ui/ui.js` | `UIManager` | DOM updates, `adjustScale()`, status effect visuals. No game logic. |
| `js/ui/shop.js` | `ShopManager` | Shop UI (item/sword/shield/sell tabs), どうぐ UI. Receives `StorageManager`, `SoundManager`, `UIManager` via constructor. |
| `js/ui/input-handler.js` | `InputHandler` | Owns the full in-battle turn loop: `startBattle`, `startPlayerTurn`, `startMonsterTurn`, `nextProblem`, `_timerLoop`. Also handles answer input buffer, submit/delete, correct/wrong resolution, timer expiry damage, and quit/resume overlay. |
| `js/ui/event-binder.js` | `EventBinder` | Registers all DOM event listeners on construction. |
| `js/managers/screen-manager.js` | `ScreenManager` | Top/main/dungeon screen show/hide, `_withSlide`, `_showMainWithTransition`, dungeon grid rendering. |
| `js/managers/note-manager.js` | `NoteManager` | Note hub, monster note (図鑑) grid/cards, item note grid. Also saves monster records. |
| `js/managers/backpack-hub-manager.js` | `BackpackHubManager` | Backpack hub screen show/hide. |
| `js/managers/equipment-manager.js` | `EquipmentManager` | Equip screen, equipment drop popup, shop equip tab rendering. |
| `js/managers/settings-manager.js` | `SettingsManager` | Settings screen show/hide, sound/name settings. |
| `js/managers/monster-spawner.js` | `MonsterSpawner` | Per-floor monster type selection and image assignment. |
| `js/managers/results-manager.js` | `ResultsManager` | Result screen rendering, share image canvas generation. |
| `js/managers/battle-item-handler.js` | `BattleItemHandler` | In-battle item use validation and effect application. |
| `js/managers/monster-house-manager.js` | `MonsterHouseManager` | Monster House screen: captured companion grid, medal inventory, equip/unequip medals, companion selection for battle, farewell (release) flow. |
| `js/game.js` | `Game` | Main controller. Owns game state, player stats, and all manager instances. Turn loop is delegated to `InputHandler`. Manager methods are exposed as shims (e.g., `showEquip()` → `this.equipment.showEquip()`). |
| `js/main.js` | init | DOMContentLoaded bootstrap: restores player name, runs `calculateTotalMonsters()`, instantiates `Game`. |

### Battle Flow

Each dungeon run is **10 battles per floor**. Battle 10 is always the boss; battles 1–9 follow the spawn priority below. Monster spawn priority (MonsterSpawner, skips 1–3 when HP < 60% max):

| Priority | Type | Condition | Rate |
|---|---|---|---|
| 1 | DungeonRare | safety check clear | 3% |
| 2 | SuperRare | safety check clear + prev boss cleared | 1% |
| 3 | Special | safety check clear + not yet spawned this run | 4% |
| 4 | Heal | variable by HP% (40% at ≤10% HP → 0% at >80%) | variable |
| 5 | Normal | all above miss | remainder |

### Key Formulas

```
Player damage = floor((1 + swordBonus) × critMult(1.5)) + specialBonus) × specialMoveMult(2.0)
Player maxHP  = round(10 + 6.014 × (lv-1)^1.04)     (Lv1 = 10)
EXP per monster = round(12 × (1 + (floor-1) × 0.03))
EXP per boss    = normal EXP × 8
Level-up EXP    = 100 + (lv-1) × 50
Monster HP (normal, battle n) = floor(n × 0.25) + 5   where n = (floor-1)×10 + battleNum
Monster HP (boss)              = floor(n × 1.0) + 10
```

Critical hit triggers when the player answers within `DIFFICULTY_TIMER.CRITICAL` seconds (★=5s, ★★=4s, ★★★=3s). Timer expiry on monster turns deals normal attack damage; attack turns have no timeout penalty.

**Special move state:** `dodgeStreak` counts consecutive dodges. At 4 dodges, `specialMoveReady` becomes true. The player then activates `specialStandby` (numpad overlay turns red) before the next attack. Answering while `specialStandby` is true fires the special move (2× multiplier) and resets both flags. Getting hit while `specialMoveReady` can reset the gauge (handled by `BattleManager.updateDodgeStreak`).

**Monster anger:** At HP < 30%, normal/boss monsters have a 5%/10% chance to become angry (`isAngry = true`), gaining +1/+2 attack. Triggered once per monster in `InputHandler._onCorrect`. Rare/heal/special monsters are exempt.

### Game State Machine (`GameState`)

Full state enum: `TOP`, `DUNGEON_SELECT`, `BATTLE`, `INTERVAL`, `TRANSITION`, `GAME_OVER`, `RESULT`, `NOTE`, `MONSTER_NOTE`, `ITEM_NOTE`, `SHOP`, `BACKPACK_HUB`, `BACKPACK`, `EQUIP`, `SETTING`, `MONSTER_HOUSE`.

```
TOP ──(メインメニュー)──► DUNGEON_SELECT ──(startGame)──► INTERVAL ──► BATTLE
 ▲         ▲                    ▲                                         │
 │         └────────────────────┴──────── RESULT ◄── (全モンスター撃破) ──┤
 │                                                                        │
 │         NOTE(hub) ──► MONSTER_NOTE / ITEM_NOTE                        │
 │         BACKPACK_HUB(hub) ──► EQUIP / BACKPACK      GAME_OVER ◄───────┘
 │         SHOP / SETTING                               (HP=0)
 └──────── (メインメニューからのサブ画面群)
```

`TRANSITION` は入力ブロック用の一時状態。ハブ経由のサブ画面: `NOTE`→`MONSTER_NOTE`/`ITEM_NOTE`、`BACKPACK_HUB`→`EQUIP`/`BACKPACK`。

### Responsive Layout

`UIManager.adjustScale()` scales the `#app` div to fit any screen size using CSS `transform: scale()`. Virtual base resolution is **800×1600 (portrait)**. Always uses portrait layout regardless of device orientation. A small inline script at the top of `<body>` pre-assigns the `portrait-mode` class before JS loads.

### Monster Types

The `Monster` constructor accepts four boolean type flags: `isHeal`, `isSpecial` (or a string name), `isSuperRare`, `isDungeonRare`. The legacy `isRare` property equals `isSuperRare || isDungeonRare`. Special monster names (`specialName`) map to entries in `SPECIAL_MONSTER_DATA` for quotes and equipment-buff effects. The `excludeImages` set prevents duplicate images within the same dungeon run.

### Boss Image Selection

Boss images are selected by floor number. The filename prefix is `Boss{DDD}_` where `{DDD}` is the floor number zero-padded to 3 digits (e.g., floor 10 → `Boss010_`, floor 100 → `Boss100_`). `Boss{DDD}next_` activates when the boss HP drops below a threshold (applies to any floor with a "next" image, not just floor 100). `Boss000_` is the catch-all fallback.

### Difficulty System

Three difficulty tiers (`Difficulty.EASY=1`, `NORMAL=2`, `HARD=3`) control:
- **Timer values**: defined in `DIFFICULTY_TIMER` in `js/core/constants.js` (indexed 1–3, index 0 is `null`)
- **Math problem content**: defined in `FLOOR_TABLES[difficulty]` in `js/core/math_problem.js`; each table maps floor ranges to problem types
- **Save data isolation**: cleared floors stored per-difficulty as `math_battle_cleared_floors_1/2/3`
- **Fastest time per-difficulty**: `fastestTime` in monster collection is `{1: seconds|null, 2: ..., 3: ...}`

`FLOOR_TABLES` rows may include `noLower: true` (no lower-tier mixing, used for ★★★ floors 91–100) and `bossType` (overrides floor-100 problem type).

### Data Persistence

All `localStorage` access goes through `StorageManager` in `js/core/storage.js`.

- Player name: `math_battle_player_name`
- Gold: `math_battle_gold`
- Bag (consumable items): `math_battle_bag` (JSON)
- Equipment (sword/shield): `math_battle_equipment` (JSON)
- Selected difficulty: `math_battle_difficulty` (int 1/2/3)
- Cleared floors (per-difficulty): `math_battle_cleared_floors_1`, `_2`, `_3` (JSON object, floor→true)
- Monster collection (図鑑): `math_battle_collection_v1` (JSON keyed by monster name; `fastestTime` is `{1,2,3}` object)
- Sound/name settings: `math_battle_settings` (JSON: `{bgm, se, volume, playerName}`)
- Backup save/load: JSON file download/upload with a simple checksum (`_checksum` field, sum of char codes in hex)
- Old `math_battle_cleared_floors` key (no suffix) is cleaned up on backup restore
- Monster House unlock flag: `math_battle_monster_house_unlocked` (`'true'`)
- Monster House first-seen notification flag: `math_battle_monster_house_notified` (`'true'`)
- Captured companions: `math_battle_companions` (JSON, keyed by monster name)
- Active companion (in-battle): `math_battle_active_companion` (monster name string or absent)
- Last selected companion (UI memory): `math_battle_last_selected_companion`
- Owned medals: `math_battle_medals` (JSON)
- Medals equipped per companion: `math_battle_companion_medals` (JSON map)

### Equipment System

Equipment definitions live in `assets/equipment_list.js` as `window.EQUIPMENT_LIST` (array of `{name, type, img, bonus/reduction, ...}`). `SWORD_DATA` and `SHIELD_DATA` in `constants.js` are **legacy empty stubs kept only for fallback** — do not add data there. Drop rates are in `SWORD_DROP_RATE` / `SHIELD_DROP_RATE` arrays in `js/core/constants.js`, indexed by current equipment level.

### Monster House System

Unlocked after clearing floor 100 on any difficulty. Managed by `MonsterHouseManager`.

- **Capture**: Normal, DungeonRare, SuperRare monsters only (1 per species). Requires `ゆうじょうのみ` item (shop-only after unlock). Capture chance varies by monster HP% at battle end.
- **Medals**: Drop from all-boss clears after unlock. Defined in `window.MEDAL_LIST` (`assets/medal_list.js`). Types: `attack`, `defense`, `extra_damage`, `malle`, `exp`, `poison`, `paralyze`, `stone`. Rarities: `bronze` → `silver` → `gold` → `diamond`. Up to 3 medals per companion slot. Drop rates per rarity by difficulty are in `window.MEDAL_DROP_TABLE` (also in `medal_list.js`).
- **Active companion**: One companion can be set active per dungeon run, contributing its medal bonuses (attack, defense, extra_damage, malle %) to the player's combat stats.
- **Capacity**: Max 50 companions. Exceeding 50 triggers an overflow (farewell) flow on Monster House entry.
- **Farewell**: Releasing a companion returns it to the wild (removes from `companions`, clears its equipped medals back to inventory).

### Audio

All audio is `.mp3` format. BGM tracks are under `assets/audio/BGM/` with subfolders: `battle/` (battle_01〜battle_20, 5階ごとに1曲), `boss/` (boss, boss_angry), `encounter/` (heal, rare, srare, special), `result/` (clear, gameover), `ui/` (title, menu, shop). SE is under `assets/audio/SE/`. BGM tracks continue playing across monsters (battle BGM resumes from where it paused when returning from boss/rare/heal tracks). iOS autoplay is unlocked via a silent AudioContext buffer on the first user interaction.

### Screen Transition System

There are two separate transition mechanisms:

1. **ホワイトアウト** (`_showMainWithTransition`) — タイトル画面→メインメニュー画面のみ。`#whiteout-overlay`を使った白フェード（1秒）。
2. **スライドトランジション** (`_withSlide(callback, direction)`) — メインメニュー画面↔サブ画面間のすべての遷移。
   - `direction='forward'`（メインメニュー画面→サブ画面）: 旧画面が左にスライドアウト、新画面は静止
   - `direction='back'`（サブ画面→メインメニュー画面）: 新画面（メインメニュー画面）が左からスライドイン、旧画面は静止

`_withSlide` はアニメーション中に両画面を `position:absolute` に切り替え、`.screen`の`display:none`/`display:flex` CSS切替と競合しないよう `display:flex` をインラインスタイルで保持する。アニメーション完了後にインラインスタイルをすべてクリーンアップする。ショップ(`hideShop`)のみ店員退場アニメーション(800ms)の後にスライドを実行する。

### Idea Submission Form

`FORM_CONFIG` at the top of `js/core/constants.js` holds the Google Forms action URL and entry ID. Submissions use a `fetch` with `no-cors` mode.
