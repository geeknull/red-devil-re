/**
 * javax.microedition.lcdui.Font 的复刻。
 *
 * J2ME 字体本质上是**设备相关**的（原版在 Motorola E398 / Nokia 上用各机型自带小字体），
 * 故无法与某台真机逐像素相同。本实现的目标是：
 *  1. 提供**确定性的度量**（stringWidth/substringWidth/charWidth/getHeight），使游戏的
 *     文本排版与换行算法（依赖这些度量）产生一致、可复现的结果；
 *  2. 以小号像素风清晰渲染（配合离屏缓冲的最近邻放大，呈复古点阵观感）。
 *
 * 度量采用定宽网格（贴合小屏中文设备字体）：CJK 全宽、ASCII 半宽。
 */

// 字面常量（与 J2ME 一致）
export const FACE_SYSTEM = 0;
export const FACE_MONOSPACE = 32;
export const FACE_PROPORTIONAL = 64;
export const STYLE_PLAIN = 0;
export const STYLE_BOLD = 1;
export const STYLE_ITALIC = 2;
export const STYLE_UNDERLINED = 4;
export const SIZE_MEDIUM = 0;
export const SIZE_SMALL = 8;
export const SIZE_LARGE = 16;

/** 各尺寸的像素高度（小屏设备小字体的经验值）。 */
function pxForSize(size: number): number {
  if (size === SIZE_SMALL) return 12;
  if (size === SIZE_LARGE) return 16;
  return 13; // SIZE_MEDIUM / 默认
}

const cache = new Map<number, Font>();

export class Font {
  readonly face: number;
  readonly style: number;
  readonly size: number;
  /** 像素高度。 */
  readonly px: number;
  /** CSS font 字符串（供 Graphics 设置 ctx.font）。 */
  readonly cssFont: string;
  private readonly cjkW: number;
  private readonly asciiW: number;

  private constructor(face: number, style: number, size: number) {
    this.face = face;
    this.style = style;
    this.size = size;
    this.px = pxForSize(size);
    this.cjkW = this.px; // 中文全宽=字高
    this.asciiW = (this.px / 2 + 0.5) | 0; // ASCII 半宽（四舍五入）
    const weight = style & STYLE_BOLD ? "bold " : "";
    const italic = style & STYLE_ITALIC ? "italic " : "";
    // 含中文回退的字体族；小号 + 离屏缓冲最近邻放大 → 点阵观感
    this.cssFont = `${italic}${weight}${this.px}px "PingFang SC","Microsoft YaHei","Heiti SC","Noto Sans CJK SC",sans-serif`;
  }

  /** 对应 Font.getFont(face,style,size)，带缓存。 */
  static getFont(face: number, style: number, size: number): Font {
    const key = (face << 16) | (style << 8) | (size & 0xff);
    let f = cache.get(key);
    if (!f) {
      f = new Font(face, style, size);
      cache.set(key, f);
    }
    return f;
  }

  static getDefaultFont(): Font {
    return Font.getFont(FACE_SYSTEM, STYLE_PLAIN, SIZE_MEDIUM);
  }

  /** 单字符宽度：CJK/全角全宽，ASCII 半宽。 */
  charWidth(ch: number | string): number {
    const code = typeof ch === "string" ? ch.charCodeAt(0) : ch;
    return code <= 0xff ? this.asciiW : this.cjkW;
  }

  stringWidth(str: string): number {
    let w = 0;
    for (let i = 0; i < str.length; i++) w += this.charWidth(str.charCodeAt(i));
    return w;
  }

  substringWidth(str: string, offset: number, len: number): number {
    let w = 0;
    for (let i = 0; i < len; i++) w += this.charWidth(str.charCodeAt(offset + i));
    return w;
  }

  charsWidth(chars: string[] | string, offset: number, len: number): number {
    let w = 0;
    for (let i = 0; i < len; i++) {
      const c = chars[offset + i];
      w += this.charWidth(typeof c === "string" ? c.charCodeAt(0) : (c as unknown as number));
    }
    return w;
  }

  getHeight(): number {
    return this.px + 1; // J2ME getHeight 含行距
  }

  getBaselinePosition(): number {
    return this.px - 2;
  }

  getSize(): number {
    return this.size;
  }
  getStyle(): number {
    return this.style;
  }
  getFace(): number {
    return this.face;
  }
}
