/**
 * input.js - Unified Input Handler for PC Keyboard/Mouse & Mobile/Tablet Touch Controls
 */
class InputManager {
  constructor() {
    this.keys = {};
    this.mouse = { x: 0, y: 0, isDown: false };
    this.vector = { dx: 0, dy: 0 };

    // Action triggers (single-frame pulses)
    this.actions = {
      attack: false,
      skill1: false,
      skill2: false,
      skill3: false,
      useHp: false,
      useMp: false
    };

    // Mobile Virtual Joystick State
    this.joystick = {
      active: false,
      touchId: null,
      startX: 0,
      startY: 0,
      currX: 0,
      currY: 0,
      maxRadius: 50
    };

    this.initKeyboard();
    this.initMouse();
    this.initTouch();
  }

  initKeyboard() {
    window.addEventListener('keydown', (e) => {
      // First key interaction resumes audio context
      if (window.soundSystem) window.soundSystem.resume();

      this.keys[e.code] = true;

      // Prevent scroll on gaming keys
      if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) {
        e.preventDefault();
      }

      // Actions on key down
      if (e.code === 'Space') this.actions.attack = true;
      if (e.code === 'Digit1' || e.code === 'KeyJ') this.actions.skill1 = true;
      if (e.code === 'Digit2' || e.code === 'KeyK') this.actions.skill2 = true;
      if (e.code === 'Digit3' || e.code === 'KeyL') this.actions.skill3 = true;
      if (e.code === 'KeyQ') this.actions.useHp = true;
      if (e.code === 'KeyE') this.actions.useMp = true;
      if (e.code === 'KeyC') {
        if (window.characterStatsController) {
          window.characterStatsController.toggleModal();
        }
      }
      if (e.code === 'KeyM' || e.key === 'm' || e.key === 'M') {
        if (window.game && typeof window.game.toggleWorldMap === 'function') {
          window.game.toggleWorldMap();
        }
      }
      if (e.code === 'Escape' || e.key === 'Escape') {
        if (window.game && window.game.isWorldMapOpen) {
          window.game.toggleWorldMap(false);
        }
      }
    });

    window.addEventListener('keyup', (e) => {
      this.keys[e.code] = false;
    });
  }

  initMouse() {
    const canvas = document.getElementById('gameCanvas');
    if (!canvas) return;

    canvas.addEventListener('mousedown', (e) => {
      if (e.button === 0) { // Left click
        if (window.soundSystem) window.soundSystem.resume();
        const rect = canvas.getBoundingClientRect();
        const scaleX = rect.width > 0 ? canvas.width / rect.width : 1;
        const scaleY = rect.height > 0 ? canvas.height / rect.height : 1;
        this.mouse.x = (e.clientX - rect.left) * scaleX;
        this.mouse.y = (e.clientY - rect.top) * scaleY;
        this.mouse.isDown = true;
        this.mouse.clickEvent = { x: this.mouse.x, y: this.mouse.y };
      }
    });

    canvas.addEventListener('mouseup', (e) => {
      if (e.button === 0) this.mouse.isDown = false;
    });

    window.addEventListener('mouseup', (e) => {
      if (e.button === 0) this.mouse.isDown = false;
    });

    canvas.addEventListener('mousemove', (e) => {
      const rect = canvas.getBoundingClientRect();
      const scaleX = rect.width > 0 ? canvas.width / rect.width : 1;
      const scaleY = rect.height > 0 ? canvas.height / rect.height : 1;
      this.mouse.x = (e.clientX - rect.left) * scaleX;
      this.mouse.y = (e.clientY - rect.top) * scaleY;
    });
  }

  initTouch() {
    const joyZone = document.getElementById('joystickZone');
    const joyKnob = document.getElementById('joystickKnob');
    const joyBase = document.getElementById('joystickBase');

    if (!joyZone) return;

    joyZone.addEventListener('touchstart', (e) => {
      e.preventDefault();
      if (window.soundSystem) window.soundSystem.resume();

      if (this.joystick.active) return;
      const touch = e.changedTouches[0];
      const rect = joyZone.getBoundingClientRect();

      this.joystick.active = true;
      this.joystick.touchId = touch.identifier;
      this.joystick.startX = touch.clientX - rect.left;
      this.joystick.startY = touch.clientY - rect.top;
      this.joystick.currX = this.joystick.startX;
      this.joystick.currY = this.joystick.startY;

      if (joyBase) {
        joyBase.style.left = `${this.joystick.startX}px`;
        joyBase.style.top = `${this.joystick.startY}px`;
        joyBase.style.display = 'block';
      }
      if (joyKnob) {
        joyKnob.style.transform = `translate(0px, 0px)`;
      }
    }, { passive: false });

    joyZone.addEventListener('touchmove', (e) => {
      e.preventDefault();
      if (!this.joystick.active) return;

      for (let i = 0; i < e.changedTouches.length; i++) {
        const touch = e.changedTouches[i];
        if (touch.identifier === this.joystick.touchId) {
          const rect = joyZone.getBoundingClientRect();
          const curX = touch.clientX - rect.left;
          const curY = touch.clientY - rect.top;

          let dx = curX - this.joystick.startX;
          let dy = curY - this.joystick.startY;
          const dist = Math.hypot(dx, dy);

          if (dist > this.joystick.maxRadius) {
            dx = (dx / dist) * this.joystick.maxRadius;
            dy = (dy / dist) * this.joystick.maxRadius;
          }

          this.joystick.currX = this.joystick.startX + dx;
          this.joystick.currY = this.joystick.startY + dy;

          if (joyKnob) {
            joyKnob.style.transform = `translate(${dx}px, ${dy}px)`;
          }
          break;
        }
      }
    }, { passive: false });

    const endJoy = (e) => {
      for (let i = 0; i < e.changedTouches.length; i++) {
        if (e.changedTouches[i].identifier === this.joystick.touchId) {
          this.joystick.active = false;
          this.joystick.touchId = null;
          if (joyBase) joyBase.style.display = 'none';
          if (joyKnob) joyKnob.style.transform = `translate(0px, 0px)`;
          break;
        }
      }
    };

    joyZone.addEventListener('touchend', endJoy, { passive: false });
    joyZone.addEventListener('touchcancel', endJoy, { passive: false });

    // Touch Action Buttons on Mobile UI
    const bindBtn = (id, actionName) => {
      const el = document.getElementById(id);
      if (!el) return;
      el.addEventListener('touchstart', (e) => {
        e.preventDefault();
        if (window.soundSystem) window.soundSystem.resume();
        this.actions[actionName] = true;
      }, { passive: false });
    };

    bindBtn('btnAttack', 'attack');
    bindBtn('btnSkill1', 'skill1');
    bindBtn('btnSkill2', 'skill2');
    bindBtn('btnSkill3', 'skill3');
    bindBtn('btnHpPotion', 'useHp');
    bindBtn('btnMpPotion', 'useMp');
  }

  // Get Movement Vector (dx, dy) normalized
  getMovementVector() {
    let dx = 0;
    let dy = 0;

    // Keyboard Input
    if (this.keys['KeyW'] || this.keys['ArrowUp']) dy -= 1;
    if (this.keys['KeyS'] || this.keys['ArrowDown']) dy += 1;
    if (this.keys['KeyA'] || this.keys['ArrowLeft']) dx -= 1;
    if (this.keys['KeyD'] || this.keys['ArrowRight']) dx += 1;

    // Mobile Virtual Joystick Input
    if (this.joystick.active) {
      const jdx = this.joystick.currX - this.joystick.startX;
      const jdy = this.joystick.currY - this.joystick.startY;
      const dist = Math.hypot(jdx, jdy);
      if (dist > 8) { // Deadzone
        dx = jdx / this.joystick.maxRadius;
        dy = jdy / this.joystick.maxRadius;
      }
    }

    return { dx, dy };
  }

  // Poll action pulse and clear
  consumeAction(actionName) {
    if (this.actions[actionName]) {
      this.actions[actionName] = false;
      return true;
    }
    return false;
  }
}

window.InputManager = InputManager;
