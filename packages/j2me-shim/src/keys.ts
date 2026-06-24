/**
 * J2ME 按键常量与游戏动作（MIDP-1.0 javax.microedition.lcdui.Canvas）。
 * 含浏览器键 → J2ME keyCode 的默认映射，运行壳可覆盖。
 */

// 数字键 = ASCII '0'..'9'
export const KEY_NUM0 = 48;
export const KEY_NUM1 = 49;
export const KEY_NUM2 = 50;
export const KEY_NUM3 = 51;
export const KEY_NUM4 = 52;
export const KEY_NUM5 = 53;
export const KEY_NUM6 = 54;
export const KEY_NUM7 = 55;
export const KEY_NUM8 = 56;
export const KEY_NUM9 = 57;
export const KEY_STAR = 42; // '*'
export const KEY_POUND = 35; // '#'

// 游戏动作常量（Canvas.getGameAction 返回值）
export const UP = 1;
export const LEFT = 2;
export const RIGHT = 5;
export const DOWN = 6;
export const FIRE = 8;
export const GAME_A = 9;
export const GAME_B = 10;
export const GAME_C = 11;
export const GAME_D = 12;

/** keyCode → 游戏动作。数字小键盘按手机布局：2=上 8=下 4=左 6=右 5=开火。 */
export function getGameAction(keyCode: number): number {
  switch (keyCode) {
    case KEY_NUM2:
      return UP;
    case KEY_NUM8:
      return DOWN;
    case KEY_NUM4:
      return LEFT;
    case KEY_NUM6:
      return RIGHT;
    case KEY_NUM5:
      return FIRE;
    case KEY_NUM1:
      return GAME_A;
    case KEY_NUM3:
      return GAME_B;
    case KEY_NUM7:
      return GAME_C;
    case KEY_NUM9:
      return GAME_D;
    default:
      return 0;
  }
}

/**
 * 浏览器 KeyboardEvent.code → J2ME keyCode 默认映射。
 * 方向键映射到手机数字键，回车/空格映射到 5（开火/确定），其余数字键直通。
 */
export const DEFAULT_KEYMAP: Record<string, number> = {
  ArrowUp: KEY_NUM2,
  ArrowDown: KEY_NUM8,
  ArrowLeft: KEY_NUM4,
  ArrowRight: KEY_NUM6,
  Enter: KEY_NUM5,
  Space: KEY_NUM5,
  Numpad0: KEY_NUM0,
  Numpad1: KEY_NUM1,
  Numpad2: KEY_NUM2,
  Numpad3: KEY_NUM3,
  Numpad4: KEY_NUM4,
  Numpad5: KEY_NUM5,
  Numpad6: KEY_NUM6,
  Numpad7: KEY_NUM7,
  Numpad8: KEY_NUM8,
  Numpad9: KEY_NUM9,
  Digit0: KEY_NUM0,
  Digit1: KEY_NUM1,
  Digit2: KEY_NUM2,
  Digit3: KEY_NUM3,
  Digit4: KEY_NUM4,
  Digit5: KEY_NUM5,
  Digit6: KEY_NUM6,
  Digit7: KEY_NUM7,
  Digit8: KEY_NUM8,
  Digit9: KEY_NUM9,
  NumpadMultiply: KEY_STAR,
  NumpadAdd: KEY_POUND,
};
