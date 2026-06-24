/**
 * tjge.j —— 关卡加载器 / 屏块流式管理（静态门面 + 实例状态）。
 * 逐行移植自 reverse/game1/2-decompiled-cfr/tjge/j.java（CFR 权威源）。
 * 移植规约见 docs/05-移植规约.md；方法名映射见 reverse/game1/porting-naming/porting-contract.json。
 *
 * 职责：解析 /res/s.bin（敌人类型表 + 精灵布置表 + 屏块表），按摄像机所在屏块逐帧
 *   加载/卸载演员（g 数组），并维护精灵定义（d）与图片资源的引用计数（c）。
 *
 * 字段别名：
 *   a=地图(b 实例,静态) b=精灵定义池 d[](静态) c=精灵定义是否保留 boolean[](静态)
 *   d=各类型演员对象池 g[][](静态) e=当前激活演员 g[](静态) m=屏块差异缓冲 byte[40](静态)
 *   f=屏块->演员索引表 byte[][] g=当前屏块号 h/i=演员初始 x/y short[]
 *   j=演员->类型id映射 int[] k=演员是否已生成 boolean[] l=演员附加数据 byte[][]
 *   n=屏块总数 o/p=屏块像素宽/高 q=空槽标记
 *
 * 跨类调用（按契约目标名）：
 *   this.a（字段,类型 b）.a_()/.b_()/.d_()  = b 实例的 a()/b()/d()
 *   a2（参数,类型 a）.a_ITd(n, b[n])         = a.a(int, d)
 *   tjge.a.d_I(n)                            = a.d(int) 静态
 *   tjge.b.a_III(n8, n7, n4)                 = b.a(int,int,int) 静态工厂
 *   tjge.d.c_()/.b_I(n)                       = d.c()/d.b(int) 静态
 *   tjge.d.b[...]/.c[...]                     = d 的静态字段 b/c
 *   g2.a_IIIAYZ(0,...)/.b_()                  = g.a(int,int,int,byte[],boolean)/g.b()
 *   GameMIDlet.a_SI(path,n)                   = GameMIDlet.a(String,int)
 *   GameMIDlet.a_In(in)                       = GameMIDlet.a(InputStream)
 *
 * 偏差：System.gc()（原 a_ 末尾）按规约删除，仅注释标注原位置。
 */
import { InputStream } from "@red-devil/j2me-shim";
import { GameMIDlet } from "./GameMIDlet.ts";
import { GameScreen } from "./GameScreen.ts";
import { TileMap } from "./TileMap.ts";
import { SpriteDef } from "./SpriteDef.ts";
import { ActorBase } from "./ActorBase.ts";

export class LevelLoader {
  public static tileMap: TileMap | null;
  public static spriteDefPool: (SpriteDef | null)[];
  public static spriteDefRetained: boolean[];
  public static actorPools: (ActorBase[] | null)[];
  public static activeActors: (ActorBase | null)[];
  private static spawnDiffBuffer: Int8Array;
  public blockActorIndices!: (Int8Array | null)[];
  public currentBlock: number = 0;
  public actorSpawnX!: Int16Array;
  public actorSpawnY!: Int16Array;
  public actorTypeId!: Int32Array;
  public actorSpawned!: boolean[];
  public actorExtraData!: (Int8Array | null)[];
  private blockCount: number = 0;
  private blockWidth: number = 0;
  private blockHeight: number = 0;
  private emptySlotMarker: number = 0;

  private constructor() {
  }

  public activateScreenAt(n: number, n2: number): void {
    let n3: number;
    this.emptySlotMarker = 0;
    const n4 = ((n2 / this.blockHeight) | 0) * (((LevelLoader.tileMap!.getPixelWidth() / this.blockWidth) | 0)) + ((n / this.blockWidth) | 0);
    let n5 = 0;
    while (n5 < this.actorSpawned.length) {
      this.actorSpawned[n5] = false;
      ++n5;
    }
    let n6 = 0;
    while (n6 < LevelLoader.actorPools.length) {
      if (LevelLoader.actorPools[n6] != null) {
        n3 = 0;
        while (n3 < LevelLoader.actorPools[n6]!.length) {
          LevelLoader.actorPools[n6]![n3].active = false;
          ++n3;
        }
      }
      ++n6;
    }
    n3 = 0;
    while (n3 < this.blockActorIndices[n4]!.length) {
      const by = this.blockActorIndices[n4]![n3];
      LevelLoader.activeActors[by] = this.spawnActor(by);
      ++n3;
    }
    this.currentBlock = n4;
  }

  public streamScreenTransitionTo(n: number, n2: number): void {
    let n3: number;
    const n4 = ((n2 / this.blockHeight) | 0) * (((LevelLoader.tileMap!.getPixelWidth() / this.blockWidth) | 0)) + ((n / this.blockWidth) | 0);
    if (n4 === this.currentBlock) {
      return;
    }
    let n5 = 0;
    let n6 = 0;
    let n7 = 0;
    while (n5 < this.blockActorIndices[this.currentBlock]!.length && n6 < this.blockActorIndices[n4]!.length) {
      n3 = this.blockActorIndices[this.currentBlock]![n5];
      const by = this.blockActorIndices[n4]![n6];
      if (n3 === this.emptySlotMarker) {
        ++n5;
        continue;
      }
      if (by === this.emptySlotMarker) {
        ++n6;
        continue;
      }
      if (n3 < by) {
        if (LevelLoader.activeActors[n3] != null) {
          LevelLoader.activeActors[n3]!.deactivate();
          LevelLoader.activeActors[n3] = null;
        }
        ++n5;
        continue;
      }
      if (n3 > by) {
        LevelLoader.spawnDiffBuffer[n7++] = this.blockActorIndices[n4]![n6++];
        continue;
      }
      ++n5;
      ++n6;
      if (LevelLoader.activeActors[n3] == null || LevelLoader.activeActors[n3]!.active) continue;
      LevelLoader.activeActors[n3] = null;
    }
    while (n5 < this.blockActorIndices[this.currentBlock]!.length) {
      if (LevelLoader.activeActors[this.blockActorIndices[this.currentBlock]![n5]] != null) {
        LevelLoader.activeActors[this.blockActorIndices[this.currentBlock]![n5]]!.deactivate();
        LevelLoader.activeActors[this.blockActorIndices[this.currentBlock]![n5]] = null;
      }
      ++n5;
    }
    while (n6 < this.blockActorIndices[n4]!.length) {
      if (this.blockActorIndices[n4]![n6] !== 0) {
        LevelLoader.spawnDiffBuffer[n7++] = this.blockActorIndices[n4]![n6];
      }
      ++n6;
    }
    n3 = 0;
    while (n3 < n7) {
      LevelLoader.activeActors[LevelLoader.spawnDiffBuffer[n3]] = this.spawnActor(LevelLoader.spawnDiffBuffer[n3]);
      ++n3;
    }
    this.currentBlock = n4;
  }

  public spawnActor(n: number): ActorBase | null {
    const n2 = this.actorTypeId[n];
    let n3 = 0;
    while (n3 < LevelLoader.actorPools[n2]!.length) {
      const g2 = LevelLoader.actorPools[n2]![n3];
      if (n === 0 || !g2.active) {
        g2.extra = n;
        if (!g2.spawnAt(0, this.actorSpawnX[n], this.actorSpawnY[n], this.actorExtraData[n]!, this.actorSpawned[n])) {
          return null;
        }
        g2.active = true;
        return g2;
      }
      ++n3;
    }
    return null;
  }

  public static buildActorPool(a2: GameScreen, n: number, n2: number): void {
    if (LevelLoader.actorPools[n] != null) {
      return;
    }
    LevelLoader.actorPools[n] = new Array<ActorBase>(n2);
    let n3 = 0;
    while (n3 < n2) {
      LevelLoader.actorPools[n]![n3] = a2.createActor(n, LevelLoader.spriteDefPool[n]!);
      ++n3;
    }
  }

  public static releaseUnusedSpriteDefs(): void {
    let n = 1;
    while (n < 30) {
      if (!LevelLoader.spriteDefRetained[n]) {
        if (LevelLoader.spriteDefPool[n] != null) {
          LevelLoader.spriteDefPool[n]!.dispose();
        }
        LevelLoader.spriteDefPool[n] = null;
      }
      ++n;
    }
    // System.gc(); —— 按规约删除（无意义）
  }

  public static refreshRetainFlags(): void {
    let n = 1;
    while (n < 30) {
      LevelLoader.spriteDefRetained[n] = GameScreen.isScrollLevel(n);
      ++n;
    }
    SpriteDef.refreshLoadedAtlasFlags();
  }

  public static retainSpriteDef(n: number): void {
    if (LevelLoader.spriteDefPool[n] == null) {
      LevelLoader.spriteDefPool[n] = SpriteDef.loadFromBin(n);
    }
    LevelLoader.spriteDefRetained[n] = true;
    SpriteDef.atlasLoadedFlags[SpriteDef.resourceToAtlasId[n]] = true;
  }

  public disposeLevel(): void {
    let n: number;
    LevelLoader.tileMap!.dispose();
    LevelLoader.tileMap = null;
    LevelLoader.refreshRetainFlags();
    let n2 = 0;
    while (n2 < LevelLoader.activeActors.length) {
      LevelLoader.activeActors[n2] = null;
      ++n2;
    }
    LevelLoader.activeActors = null as unknown as (ActorBase | null)[];
    let n3 = 1;
    while (n3 < LevelLoader.actorPools.length) {
      if (LevelLoader.actorPools[n3] != null) {
        n = 0;
        while (n < LevelLoader.actorPools[n3]!.length) {
          LevelLoader.actorPools[n3]![n] = null as unknown as ActorBase;
          ++n;
        }
      }
      LevelLoader.actorPools[n3] = null;
      ++n3;
    }
    n = 0;
    while (n < this.blockActorIndices.length) {
      this.blockActorIndices[n] = null;
      ++n;
    }
    this.blockActorIndices = null as unknown as (Int8Array | null)[];
    let n4 = 0;
    while (n4 < this.actorExtraData.length) {
      this.actorExtraData[n4] = null;
      ++n4;
    }
    this.actorExtraData = null as unknown as (Int8Array | null)[];
    this.actorSpawnY = null as unknown as Int16Array;
    this.actorSpawnX = null as unknown as Int16Array;
    this.actorTypeId = null as unknown as Int32Array;
  }

  public static initBootSprites(a2: GameScreen): void {
    LevelLoader.spriteDefPool[0] = SpriteDef.loadFromBin(0);
    LevelLoader.buildActorPool(a2, 0, 1);
    LevelLoader.retainSpriteDef(8);
  }

  public static loadLevel(a2: GameScreen, n: number): LevelLoader | null {
    const j2 = new LevelLoader();
    try {
      let n2: number;
      let n3: number;
      const inputStream: InputStream = GameMIDlet.openArchiveEntryStream("/res/s.bin", n)!;
      const n4 = inputStream.read1();
      const n5 = inputStream.read1();
      const n6 = inputStream.read1();
      LevelLoader.activeActors = new Array<ActorBase | null>(n6).fill(null);
      let n7 = 0;
      if (n4 === 2) {
        n7 = inputStream.read1();
        inputStream.read1();
        inputStream.read1();
      }
      let n8 = inputStream.read1();
      inputStream.read1();
      inputStream.read1();
      if (n8 > 2) {
        n8 -= 2;
      }
      LevelLoader.tileMap = TileMap.loadFromBin(n8, n7, n4);
      const nArray = new Int32Array(30);
      let n9 = 0;
      while (n9 < 30) {
        nArray[n9] = 0;
        ++n9;
      }
      let n10 = 0;
      while (n10 < n5) {
        n3 = inputStream.read1();
        LevelLoader.retainSpriteDef(n3);
        nArray[n3] = 1;
        ++n10;
      }
      n3 = 0;
      while (n3 < 30) {
        if (nArray[n3] === 1) {
          nArray[n3] = inputStream.read1();
          LevelLoader.buildActorPool(a2, n3, nArray[n3]);
        }
        ++n3;
      }
      j2.actorTypeId = new Int32Array(n6);
      j2.actorSpawnX = new Int16Array(n6);
      j2.actorSpawnY = new Int16Array(n6);
      j2.actorExtraData = new Array<Int8Array | null>(n6).fill(null);
      j2.actorSpawned = new Array<boolean>(n6).fill(false);
      let n11 = 0;
      while (n11 < n6) {
        j2.actorSpawned[n11] = false;
        j2.actorTypeId[n11] = inputStream.read1();
        j2.actorSpawnX[n11] = GameMIDlet.readU16Le(inputStream);
        j2.actorSpawnY[n11] = GameMIDlet.readU16Le(inputStream);
        n2 = inputStream.read1();
        if (n2 > 0) {
          j2.actorExtraData[n11] = new Int8Array(n2);
          inputStream.read(j2.actorExtraData[n11]!);
        }
        ++n11;
      }
      j2.blockWidth = 176;
      j2.blockHeight = 176;
      j2.blockCount = ((LevelLoader.tileMap!.getPixelHeight() / j2.blockHeight) | 0) * (((LevelLoader.tileMap!.getPixelWidth() / j2.blockWidth) | 0));
      j2.blockActorIndices = new Array<Int8Array | null>(j2.blockCount).fill(null);
      n2 = 0;
      while (n2 < j2.blockCount) {
        const n12 = inputStream.read1();
        j2.blockActorIndices[n2] = new Int8Array(n12);
        inputStream.read(j2.blockActorIndices[n2]!);
        ++n2;
      }
      inputStream.close();
    } catch (exception) {
      return null;
    }
    return j2;
  }

  static {
    LevelLoader.spriteDefPool = new Array<SpriteDef | null>(30).fill(null);
    LevelLoader.spriteDefRetained = new Array<boolean>(30).fill(false);
    LevelLoader.actorPools = new Array<ActorBase[] | null>(30).fill(null);
    LevelLoader.spawnDiffBuffer = new Int8Array(40);
  }
}
