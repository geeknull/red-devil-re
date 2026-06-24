/**
 * LevelScene（原 j 类）的延迟绑定引用 —— 打破 ESM 循环依赖。
 *
 * 背景：Actor 基类 h 在方法体内用到场景类 j 的若干静态成员（j.e/f/g/h/a）。
 * 若 h 直接静态 import j，会形成 h→j→(子类)→extends h 的环，导致子类在 h 类
 * 定义完成前执行 `extends h` 而报 "Cannot access 'h' before initialization"。
 * 本叶子模块仅持类型引用（运行时被擦除），由 LevelScene.ts 在类定义后调用 setJ(j) 注入；
 * h 通过 jref() 延迟取用（其方法执行时 j 必已加载）。运行时语义与直接引用 j 完全一致。
 */
import type { LevelScene } from "./LevelScene.ts";

let _j: typeof LevelScene | null = null;

export function setJ(cls: typeof LevelScene): void {
  _j = cls;
}

export function jref(): typeof LevelScene {
  return _j!;
}
