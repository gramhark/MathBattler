class SoundManager {
    constructor() {
        // BGM
        this.bgmTitle    = document.getElementById('bgm-title');
        this.bgmMenu     = document.getElementById('bgm-menu');
        this.bgmDungeon  = document.getElementById('bgm-dungeon');
        this.bgmBattle   = []; // [0]=1-10階 ... [9]=91-100階
        for (let i = 1; i <= 10; i++) {
            this.bgmBattle.push(document.getElementById(`bgm-battle-${String(i).padStart(2, '0')}`));
        }
        this.bgmBoss      = document.getElementById('bgm-boss');
        this.bgmBossAngry = document.getElementById('bgm-boss-angry');
        this.bgmSrare     = document.getElementById('bgm-srare');
        this.bgmRare      = document.getElementById('bgm-rare');
        this.bgmHeal      = document.getElementById('bgm-heal');
        this.bgmSpecial   = document.getElementById('bgm-special');
        this.bgmShop      = document.getElementById('bgm-shop');
        this.bgmClear     = document.getElementById('bgm-clear');
        this.bgmGameover  = document.getElementById('bgm-gameover');

        // SE — battle
        this.sePunch        = document.getElementById('se-punch');
        this.sePunchCrit    = document.getElementById('se-punch-crit');
        this.seSword        = document.getElementById('se-sword');
        this.seSwordCrit    = document.getElementById('se-sword-crit');
        this.seHitting      = document.getElementById('se-hitting');
        this.seHittingCrit  = document.getElementById('se-hitting-crit');
        this.seSlash        = document.getElementById('se-slash');
        this.seSlashCrit    = document.getElementById('se-slash-crit');
        this.seSpecial      = document.getElementById('se-special');
        this.sePlayerHit    = document.getElementById('se-player-hit');
        this.seShieldBlock  = document.getElementById('se-shield-block');
        this.sePlayerDodge  = document.getElementById('se-player-dodge');
        this.seMonsterMiss  = document.getElementById('se-monster-miss');
        this.seGaugeUp      = document.getElementById('se-gauge-up');
        this.seGaugeMax     = document.getElementById('se-gauge-max');
        this.seStandby      = document.getElementById('se-standby');

        // SE — status
        this.sePoison       = document.getElementById('se-poison');
        this.sePoisonTick   = document.getElementById('se-poison-tick');
        this.seParalyze     = document.getElementById('se-paralyze');
        this.seParalyzed    = document.getElementById('se-paralyzed');
        this.seStone        = document.getElementById('se-stone');
        this.seStoneProc    = document.getElementById('se-stone-proc');

        // SE — item
        this.seHeal         = document.getElementById('se-heal');
        this.seAtkUp        = document.getElementById('se-atk-up');
        this.seDefUp        = document.getElementById('se-def-up');
        this.seThrow        = document.getElementById('se-throw');
        this.seEquipGet     = document.getElementById('se-equip-get');
        this.seEquipSet     = document.getElementById('se-equip-set');
        this.seEquipRemove  = document.getElementById('se-equip-remove');
        this.seMalle        = document.getElementById('se-malle');

        // SE — event
        this.seDefeat         = document.getElementById('se-defeat');
        this.seBossDestroyed  = document.getElementById('se-boss-destroyed');
        this.seBossEnter      = document.getElementById('se-boss-enter');
        this.seTransform      = document.getElementById('se-transform');
        this.seBossResurrection = document.getElementById('se-boss-resurrection');
        this.seMonsterRecover = document.getElementById('se-monster-recover');
        this.seLevelUp        = document.getElementById('se-level-up');
        this.seClear          = document.getElementById('se-clear');
        this.seGameover       = document.getElementById('se-gameover');
        this.seNote           = document.getElementById('se-note');

        // SE — ui
        this.seNumpad      = document.getElementById('se-numpad');
        this.seSlideOpen   = document.getElementById('se-slide-open');
        this.seSlideClose  = document.getElementById('se-slide-close');
        this.seTitleTap    = document.getElementById('se-title-tap');
        this.seBuy         = document.getElementById('se-buy');
        this.seSell        = document.getElementById('se-sell');
        this.seTimerWarn   = document.getElementById('se-timer-warn');
        this.seTimerOut    = document.getElementById('se-timer-out');
        this.seDungeonPin01 = document.getElementById('se-dungeon-pin-01');
        this.seDungeonPin02 = document.getElementById('se-dungeon-pin-02');
        this.seDungeonPin03 = document.getElementById('se-dungeon-pin-03');
        this.seDungeonTab  = document.getElementById('se-dungeon-tab');
        this.seBattleStart = document.getElementById('se-battle-start');
        this.seBtn         = document.getElementById('se-btn');
        this.seNoteDetails = document.getElementById('se-note-details');
        this.seBack        = document.getElementById('se-back');
        this.seEquipSort   = document.getElementById('se-equip-sort');
        this.seShopTub     = document.getElementById('se-shop-tub');
        this.seEquipTub    = document.getElementById('se-equip-tub');
        this.seNoteGrid    = document.getElementById('se-note-grid');

        // BGM sources
        this.bgmTitle.src    = 'assets/audio/BGM/ui/title.mp3';
        this.bgmMenu.src     = 'assets/audio/BGM/ui/menu.mp3';
        this.bgmDungeon.src  = 'assets/audio/BGM/ui/dungeon.mp3';
        this.bgmBattle.forEach((el, i) => {
            el.src = `assets/audio/BGM/battle/battle_${String(i + 1).padStart(2, '0')}.mp3`;
        });
        this.bgmBoss.src      = 'assets/audio/BGM/boss/boss.mp3';
        this.bgmBossAngry.src = 'assets/audio/BGM/boss/boss_angry.mp3';
        this.bgmSrare.src     = 'assets/audio/BGM/encounter/srare.mp3';
        this.bgmRare.src      = 'assets/audio/BGM/encounter/rare.mp3';
        this.bgmHeal.src      = 'assets/audio/BGM/encounter/heal.mp3';
        this.bgmSpecial.src   = 'assets/audio/BGM/encounter/special.mp3';
        this.bgmShop.src      = 'assets/audio/BGM/ui/shop.mp3';
        this.bgmClear.src     = 'assets/audio/BGM/result/clear.mp3';
        this.bgmGameover.src  = 'assets/audio/BGM/result/gameover.mp3';

        // SE sources — battle
        this.sePunch.src        = 'assets/audio/SE/battle/punch.mp3';
        this.sePunchCrit.src    = 'assets/audio/SE/battle/punch_crit.mp3';
        this.seSword.src        = 'assets/audio/SE/battle/sword.mp3';
        this.seSwordCrit.src    = 'assets/audio/SE/battle/sword_crit.mp3';
        this.seHitting.src      = 'assets/audio/SE/battle/hitting.mp3';
        this.seHittingCrit.src  = 'assets/audio/SE/battle/hitting_crit.mp3';
        this.seSlash.src        = 'assets/audio/SE/battle/slash.mp3';
        this.seSlashCrit.src    = 'assets/audio/SE/battle/slash_crit.mp3';
        this.seSpecial.src      = 'assets/audio/SE/battle/special.mp3';
        this.sePlayerHit.src    = 'assets/audio/SE/battle/player_hit.mp3';
        this.seShieldBlock.src  = 'assets/audio/SE/battle/shield_block.mp3';
        this.sePlayerDodge.src  = 'assets/audio/SE/battle/player_dodge.mp3';
        this.seMonsterMiss.src  = 'assets/audio/SE/battle/monster_miss.mp3';
        this.seGaugeUp.src      = 'assets/audio/SE/battle/gauge_up.mp3';
        this.seGaugeMax.src     = 'assets/audio/SE/battle/gauge_max.mp3';
        this.seStandby.src      = 'assets/audio/SE/battle/gauge_standby.mp3';

        // SE sources — status
        this.sePoison.src       = 'assets/audio/SE/status/poison_set.mp3';
        this.sePoisonTick.src   = 'assets/audio/SE/status/poison_tick.mp3';
        this.seParalyze.src     = 'assets/audio/SE/status/paralyze_set.mp3';
        this.seParalyzed.src    = 'assets/audio/SE/status/paralyzed.mp3';
        this.seStone.src        = 'assets/audio/SE/status/stone_throw.mp3';
        this.seStoneProc.src    = 'assets/audio/SE/status/stone_proc.mp3';

        // SE sources — item
        this.seHeal.src         = 'assets/audio/SE/item/heal.mp3';
        this.seAtkUp.src        = 'assets/audio/SE/item/atk_up.mp3';
        this.seDefUp.src        = 'assets/audio/SE/item/def_up.mp3';
        this.seThrow.src        = 'assets/audio/SE/item/spike_throw.mp3';
        this.seEquipGet.src     = 'assets/audio/SE/item/equip_get.mp3';
        this.seEquipSet.src     = 'assets/audio/SE/item/equip_set.mp3';
        this.seEquipRemove.src  = 'assets/audio/SE/item/equip_remove.mp3';
        this.seMalle.src        = 'assets/audio/SE/item/malle_get.mp3';

        // SE sources — event
        this.seDefeat.src         = 'assets/audio/SE/event/defeat.mp3';
        this.seBossDestroyed.src  = 'assets/audio/SE/event/boss_destroyed.mp3';
        this.seBossEnter.src      = 'assets/audio/SE/event/boss_enter.mp3';
        this.seTransform.src      = 'assets/audio/SE/event/boss_transform.mp3';
        this.seBossResurrection.src = 'assets/audio/SE/event/boss_resurrection.mp3';
        this.seMonsterRecover.src = 'assets/audio/SE/event/monster_recover.mp3';
        this.seLevelUp.src        = 'assets/audio/SE/event/level_up.mp3';
        this.seClear.src          = 'assets/audio/SE/event/dungeon_clear.mp3';
        this.seGameover.src       = 'assets/audio/SE/event/gameover.mp3';
        this.seNote.src           = 'assets/audio/SE/event/note_reg.mp3';

        // SE sources — ui
        this.seNumpad.src      = 'assets/audio/SE/ui/numpad.mp3';
        this.seSlideOpen.src   = 'assets/audio/SE/ui/screen_slide_open.mp3';
        this.seSlideClose.src  = 'assets/audio/SE/ui/screen_slide_close.mp3';
        this.seTitleTap.src    = 'assets/audio/SE/ui/title_tap.mp3';
        this.seBuy.src         = 'assets/audio/SE/ui/buy.mp3';
        this.seSell.src        = 'assets/audio/SE/ui/sell.mp3';
        this.seTimerWarn.src   = 'assets/audio/SE/ui/timer_warn.mp3';
        this.seTimerOut.src    = 'assets/audio/SE/ui/timer_out.mp3';
        this.seDungeonPin01.src = 'assets/audio/SE/ui/dungeon_pin_01.mp3';
        this.seDungeonPin02.src = 'assets/audio/SE/ui/dungeon_pin_02.mp3';
        this.seDungeonPin03.src = 'assets/audio/SE/ui/dungeon_pin_03.mp3';
        this.seDungeonTab.src  = 'assets/audio/SE/ui/dungeon_tub.mp3';
        this.seBattleStart.src = 'assets/audio/SE/ui/battlestart.mp3';
        this.seBtn.src         = 'assets/audio/SE/ui/btn.mp3';
        this.seNoteDetails.src = 'assets/audio/SE/ui/note_details.mp3';
        this.seBack.src        = 'assets/audio/SE/ui/back.mp3';
        this.seEquipSort.src   = 'assets/audio/SE/item/equip_sort.mp3';
        this.seShopTub.src     = 'assets/audio/SE/ui/shop_tub.mp3';
        this.seEquipTub.src    = 'assets/audio/SE/item/equip_tub.mp3';
        this.seNoteGrid.src    = 'assets/audio/SE/ui/note_grid.mp3';

        this.currentBgm = null;
        this.isPausedByVisibility = false;
        this.bgmEnabled = true;
        this.seEnabled = true;
        this.bgmVolumeRate = 100;
        this.seVolumeRate = 100;
        this._bindVisibilityChange();
    }

    _getBgmVol() {
        return (this.bgmVolumeRate / 100) * 0.5;
    }

    _getSeVol() {
        return (this.seVolumeRate / 100) * 1.0;
    }

    applySettings(bgmEnabled, seEnabled, bgmVolumeRate, seVolumeRate) {
        this.bgmEnabled = bgmEnabled;
        this.seEnabled = seEnabled;
        this.bgmVolumeRate = bgmVolumeRate;
        this.seVolumeRate = seVolumeRate;
        if (this.currentBgm) {
            if (!bgmEnabled) {
                this.currentBgm.pause();
            } else {
                this.currentBgm.volume = this._getBgmVol();
                if (this.currentBgm.paused && !this.isPausedByVisibility) {
                    this.currentBgm.play().catch(() => { });
                }
            }
        }
    }

    _bindVisibilityChange() {
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                if (this.currentBgm && !this.currentBgm.paused) {
                    this.currentBgm.pause();
                    this.isPausedByVisibility = true;
                }
            } else {
                if (this.isPausedByVisibility && this.currentBgm) {
                    this.currentBgm.play().catch(error => {
                        console.warn('BGM resume failed (Autoplay Policy):', error);
                    });
                }
                this.isPausedByVisibility = false;
            }
        });
    }

    fadeInBgm(bgm, targetVolume = 0.5, durationMs = 500) {
        if (bgm._fadeInterval) clearInterval(bgm._fadeInterval);
        bgm.volume = 0;
        bgm.play().catch(e => console.log('Audio play failed', e));
        let currentVol = 0;
        const stepTime = 50;
        const steps = durationMs / stepTime;
        const volumeStep = targetVolume / steps;
        bgm._fadeInterval = setInterval(() => {
            currentVol += volumeStep;
            if (currentVol < targetVolume) {
                bgm.volume = currentVol;
            } else {
                bgm.volume = targetVolume;
                clearInterval(bgm._fadeInterval);
                bgm._fadeInterval = null;
            }
        }, stepTime);
    }

    fadeOutBgm(bgm, durationMs = 500) {
        if (!bgm || bgm.paused) return;
        if (bgm._fadeInterval) clearInterval(bgm._fadeInterval);

        const startVol = bgm.volume;
        const stepTime = 50;
        const steps = durationMs / stepTime;
        const volumeStep = startVol / (steps || 1);

        let currentVol = startVol;
        bgm._fadeInterval = setInterval(() => {
            currentVol -= volumeStep;
            if (currentVol > 0) {
                bgm.volume = currentVol;
            } else {
                bgm.volume = 0;
                bgm.pause();
                bgm.currentTime = 0;
                clearInterval(bgm._fadeInterval);
                bgm._fadeInterval = null;
            }
        }, stepTime);
    }

    // floor から通常バトルBGM要素を返す (1-10階→[0], 91-100階→[9])
    _getBattleBgmEl(floor) {
        const idx = Math.min(10, Math.ceil((floor || 1) / 10)) - 1;
        return this.bgmBattle[idx];
    }

    // 通常バトルBGM全要素をリストで返す（stopBgm用）
    _allBattleBgmEls() {
        return this.bgmBattle;
    }

    playBgm({ isBoss = false, isSuperRare = false, isDungeonRare = false, isHeal = false, isSpecial = false, floor = 1 } = {}) {
        if (!this.bgmEnabled) return;

        let target = this._getBattleBgmEl(floor);
        if (isBoss)        target = this.bgmBoss;
        else if (isSuperRare)  target = this.bgmSrare;
        else if (isDungeonRare) target = this.bgmRare;
        else if (isHeal)   target = this.bgmHeal;
        else if (isSpecial) target = this.bgmSpecial;

        if (this.currentBgm && this.currentBgm !== target) {
            if (this.currentBgm._fadeInterval) clearInterval(this.currentBgm._fadeInterval);
            this.currentBgm.pause();
            // 通常バトルBGM以外から切り替えるときは頭出し
            if (!this.bgmBattle.includes(this.currentBgm)) {
                this.currentBgm.currentTime = 0;
            }
        }
        if (this.currentBgm !== target || target.paused) {
            this.currentBgm = target;
            const useFadeIn = target === this.bgmSrare || target === this.bgmRare ||
                              target === this.bgmHeal  || target === this.bgmSpecial;
            if (useFadeIn) {
                this.fadeInBgm(target, this._getBgmVol(), 1000);
            } else {
                this.currentBgm.volume = this._getBgmVol();
                this.currentBgm.play().catch(e => console.log('Audio play failed (user interact needed)', e));
            }
        }
    }

    playTitleBgm() {
        if (!this.bgmEnabled) return;
        this._switchTo(this.bgmTitle, false);
    }

    playMenuBgm() {
        if (!this.bgmEnabled) return;
        this._switchTo(this.bgmMenu, false);
    }

    playDungeonBgm() {
        if (!this.bgmEnabled) return;
        this._switchTo(this.bgmDungeon, false);
    }

    playShopBgm() {
        if (!this.bgmEnabled) return;
        this._switchTo(this.bgmShop, true);
    }

    _switchTo(target, fadeIn = false) {
        if (this.currentBgm && this.currentBgm !== target) {
            if (this.currentBgm._fadeInterval) clearInterval(this.currentBgm._fadeInterval);
            this.currentBgm.pause();
            if (!this.bgmBattle.includes(this.currentBgm)) {
                this.currentBgm.currentTime = 0;
            }
        }
        if (this.currentBgm !== target || target.paused) {
            this.currentBgm = target;
            if (fadeIn) {
                this.fadeInBgm(target, this._getBgmVol(), 1000);
            } else {
                this.currentBgm.volume = this._getBgmVol();
                this.currentBgm.play().catch(e => console.log('Audio play failed', e));
            }
        }
    }

    stopBgm() {
        if (this.currentBgm) {
            if (this.currentBgm._fadeInterval) clearInterval(this.currentBgm._fadeInterval);
            this.currentBgm.pause();
            this.currentBgm = null;
        }
        const allBgms = [
            this.bgmTitle, this.bgmMenu, this.bgmDungeon,
            ...this.bgmBattle,
            this.bgmBoss, this.bgmBossAngry, this.bgmSrare, this.bgmRare,
            this.bgmHeal, this.bgmSpecial, this.bgmShop, this.bgmClear, this.bgmGameover
        ];
        allBgms.forEach(bgm => {
            if (!bgm) return;
            if (bgm._fadeInterval) clearInterval(bgm._fadeInterval);
            bgm.pause();
            bgm.currentTime = 0;
        });
        this.isPausedByVisibility = false;
    }

    playSe(type, difficulty = 1) {
        if (!this.seEnabled) return;
        if (document.hidden) return;
        const map = {
            // battle
            'punch':          this.sePunch,
            'punch_crit':     this.sePunchCrit,
            'sword':          this.seSword,
            'sword_crit':     this.seSwordCrit,
            'hitting':        this.seHitting,
            'hitting_crit':   this.seHittingCrit,
            'slash':          this.seSlash,
            'slash_crit':     this.seSlashCrit,
            'special':        this.seSpecial,
            'player_hit':     this.sePlayerHit,
            'shield_block':   this.seShieldBlock,
            'player_dodge':   this.sePlayerDodge,
            'monster_miss':   this.seMonsterMiss,
            'gauge_up':       this.seGaugeUp,
            'gauge_max':      this.seGaugeMax,
            'standby':        this.seStandby,
            // status
            'poison':         this.sePoison,
            'poison_tick':    this.sePoisonTick,
            'paralyze':       this.seParalyze,
            'paralyzed':      this.seParalyzed,
            'stone':          this.seStone,
            'stone_proc':     this.seStoneProc,
            // item
            'heal':           this.seHeal,
            'atk_up':         this.seAtkUp,
            'def_up':         this.seDefUp,
            'throw':          this.seThrow,
            'equip_get':      this.seEquipGet,
            'equip_set':      this.seEquipSet,
            'equip_remove':   this.seEquipRemove,
            'malle':          this.seMalle,
            // event
            'defeat':         this.seDefeat,
            'boss_destroyed': this.seBossDestroyed,
            'boss_enter':     this.seBossEnter,
            'transform':      this.seTransform,
            'boss_resurrection':this.seBossResurrection,
            'monster_recover':this.seMonsterRecover,
            'level_up':       this.seLevelUp,
            'clear':          this.seClear,
            'gameover':       this.seGameover,
            'note':           this.seNote,
            // ui
            'numpad':         this.seNumpad,
            'slide_open':     this.seSlideOpen,
            'slide_close':    this.seSlideClose,
            'title_tap':      this.seTitleTap,
            'buy':            this.seBuy,
            'sell':           this.seSell,
            'timer_warn':     this.seTimerWarn,
            'timer_out':      this.seTimerOut,
            'dungeon_pin':    difficulty === 3 ? this.seDungeonPin03 : (difficulty === 2 ? this.seDungeonPin02 : this.seDungeonPin01),
            'dungeon_tab':   this.seDungeonTab,
            'battle_start':  this.seBattleStart,
            'btn':           this.seBtn,
            'note_details':  this.seNoteDetails,
            'back':          this.seBack,
            'equip_sort':    this.seEquipSort,
            'shop_tub':      this.seShopTub,
            'equip_tub':     this.seEquipTub,
            'note_grid':     this.seNoteGrid,
        };
        const se = map[type];
        if (se) {
            se.currentTime = 0;
            se.volume = this._getSeVol();
            se.play().catch(() => { });
        }
    }

    playBossAngryBgm() {
        if (!this.bgmEnabled) return;
        if (this.currentBgm) {
            if (this.currentBgm._fadeInterval) clearInterval(this.currentBgm._fadeInterval);
            this.currentBgm.pause();
        }
        this.currentBgm = this.bgmBossAngry;
        this.bgmBossAngry.currentTime = 0;
        this.fadeInBgm(this.bgmBossAngry, this._getBgmVol(), 500);
    }

    unlockAll() {
        try {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            if (!AudioContext) return;
            const ctx = new AudioContext();
            const buffer = ctx.createBuffer(1, 1, 22050);
            const source = ctx.createBufferSource();
            source.buffer = buffer;
            source.connect(ctx.destination);
            source.start(0);
            source.onended = () => {
                ctx.close().catch(() => { });
            };
        } catch (e) {
            console.warn('unlockAll: AudioContext not available', e);
        }
    }
}
