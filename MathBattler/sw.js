/**
 * Service Worker — マスバトール
 *
 * ★ モンスター画像を追加したとき（update_monsters.bat 実行後）は
 *    CACHE_VERSION を更新してください。古いキャッシュが自動削除されます。
 */

const CACHE_VERSION = 'v2';
const CACHE_NAME = `masubatour-${CACHE_VERSION}`;

// インストール時にプリキャッシュするファイル（ゲームのシェル）
const PRECACHE_URLS = [
    './',
    'index.html',
    'assets/monster_list.js',
    'assets/equipment_list.js',
    'assets/item_list.js',
    'js/core/constants.js',
    'js/core/sound.js',
    'js/core/math_problem.js',
    'js/core/monster.js',
    'js/core/storage.js',
    'js/core/battle.js',
    'js/core/level-system.js',
    'js/ui/message-system.js',
    'js/ui/animation-renderer.js',
    'js/ui/ui.js',
    'js/ui/shop.js',
    'js/ui/input-handler.js',
    'js/ui/event-binder.js',
    'js/ui/particle-effect.js',
    'js/managers/screen-manager.js',
    'js/managers/note-manager.js',
    'js/managers/backpack-hub-manager.js',
    'js/managers/equipment-manager.js',
    'js/managers/monster-spawner.js',
    'js/managers/results-manager.js',
    'js/managers/battle-item-handler.js',
    'js/managers/settings-manager.js',
    'js/game.js',
    'js/main.js',
    'css/base.css',
    'css/components/buttons.css',
    'css/components/hp-timer.css',
    'css/components/message.css',
    'css/components/monster-effects.css',
    'css/components/animations.css',
    'css/overlays/_base.css',
    'css/overlays/interval.css',
    'css/overlays/boss-cutin.css',
    'css/overlays/confirm-dialogs.css',
    'css/overlays/info-overlay.css',
    'css/overlays/shop-overlays.css',
    'css/overlays/bag-detail.css',
    'css/overlays/battle-bag.css',
    'css/overlays/equip-drop.css',
    'css/overlays/image-modal.css',
    'css/overlays/drop-animations.css',
    'css/overlays/item-limit.css',
    'css/overlays/navigation-btn.css',
    'css/overlays/request.css',
    'css/overlays/whiteout.css',
    'css/screens/loading.css',
    'css/screens/top.css',
    'css/screens/dungeon.css',
    'css/screens/battle.css',
    'css/screens/result.css',
    'css/screens/shop.css',
    'css/screens/bag.css',
    'css/screens/equip.css',
    'css/screens/setting.css',
    'css/screens/note.css',
];

// インストール: シェルをプリキャッシュ
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => cache.addAll(PRECACHE_URLS))
            .then(() => self.skipWaiting())
    );
});

// アクティベート: 古いキャッシュを削除
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys()
            .then(cacheNames => Promise.all(
                cacheNames
                    .filter(name => name !== CACHE_NAME)
                    .map(name => caches.delete(name))
            ))
            .then(() => self.clients.claim())
    );
});

// フェッチ: Stale-while-revalidate
// キャッシュがあれば即座に返し、バックグラウンドでキャッシュを更新する。
// キャッシュがなければネットワークから取得してキャッシュに保存する。
self.addEventListener('fetch', (event) => {
    if (event.request.method !== 'GET') return;

    const url = new URL(event.request.url);
    // Google Fonts など外部リクエストはスルー
    if (url.origin !== location.origin) return;

    event.respondWith(staleWhileRevalidate(event.request));
});

async function staleWhileRevalidate(request) {
    const cache = await caches.open(CACHE_NAME);
    const cached = await cache.match(request);

    // バックグラウンドでキャッシュを更新
    const fetchPromise = fetch(request)
        .then(response => {
            if (response && response.status === 200) {
                cache.put(request, response.clone());
            }
            return response;
        })
        .catch(() => null);

    // キャッシュヒット: 即座に返す（バックグラウンドで更新継続）
    // キャッシュミス: ネットワーク取得を待つ
    return cached ?? await fetchPromise;
}
