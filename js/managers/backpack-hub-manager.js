/* BackpackHubManager: リュックハブ画面の管理 */
class BackpackHubManager {
    constructor(game) {
        this.game = game;
        this.ui = game.ui;
    }

    showBackpackHub() {
        this.game.state = GameState.BACKPACK_HUB;
        document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
        document.getElementById('bag-hub-screen').classList.add('active');
        this.ui.adjustScale();
    }

    hideBackpackHub() {
        this.game.state = GameState.TOP;
        document.getElementById('bag-hub-screen').classList.remove('active');
        document.getElementById('main-screen').classList.add('active');
        this.ui.adjustScale();
    }
}
