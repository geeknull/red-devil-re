package com.nokia.mid.ui;

/**
 * Nokia DirectGraphics `manipulation` 码 → MIDP Sprite `transform` 码的换算。
 *
 * ⚠️ **本表独立取自第三方参考实现 FreeJ2ME**（`tools/emulator/freej2me-v1.52/freej2me.jar`
 * 经 CFR 反编译：`org.recompile.mobile.PlatformGraphics.manipulateImage` →
 * `PlatformImage.transformImage`），**不是**抄 TS port 的 `SpriteAtlas.manipulationToTransform`。
 *
 * 为什么必须独立取源：若 oracle 复用 port 的映射，差分就等于「用它自己验它自己」，
 * 对映射错误**永远盲**。独立取源后，port 的映射若有误，差分能直接抓到。
 *
 * FreeJ2ME 的 transformImage 语义已逐像素核对：
 *   case 5：src(x,y) → dst(h-1-y, x)  = 顺时针 90°  = TRANS_ROT90
 *   case 6：src(x,y) → dst(y, w-1-x)  = 270°        = TRANS_ROT270
 * 即 Nokia 的旋转方向与 Sprite 相反（Nokia 90° == Sprite ROT270）。
 */
public final class NokiaManip {
  private NokiaManip() {}

  /** @return MIDP Sprite TRANS_* 码；未知 manipulation 返回 -1（差分中会显式暴露）。 */
  public static int toTransform(int m) {
    if (m == 0 || m == 24756) return 0;                 // TRANS_NONE
    switch (m) {
      case 1: case 8192:  case 16564: return 2;         // TRANS_MIRROR           (FLIP_HORIZONTAL)
      case 2: case 8372:  case 16384: return 1;         // TRANS_MIRROR_ROT180    (FLIP_VERTICAL)
      case 4: case 90:    case 24846: return 6;         // TRANS_ROT270  ← Nokia 90° == Sprite ROT270
      case 3: case 180:   case 24576: return 3;         // TRANS_ROT180
      case 5: case 270:   case 24666: return 5;         // TRANS_ROT90   ← Nokia 270° == Sprite ROT90
      case 7: case 8282:  case 16654: return 7;         // TRANS_MIRROR_ROT90
      case 6: case 8462:  case 16474: return 4;         // TRANS_MIRROR_ROT270
      default: return -1;
    }
  }
}
