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
import { ActorType } from "./constants.ts";

/**
 * 关卡加载器 / 屏块流式管理（CFR 基准：reverse/game1/2-decompiled-cfr/tjge/j.java）。
 *
 * 角色：游戏 1「红魔特种兵」的关卡装填中枢。从 /res/s.bin 的第 n 个条目解析出
 *   关卡头、敌人/精灵类型表、逐演员布置表（类型/初始 x/y/附加数据）与「屏块→演员索引」表，
 *   据此构建瓦片地图（{@link TileMap}）并产出一个填充完毕的 LevelLoader 实例。运行期再按
 *   摄像机所处的 176×176 屏块逐帧把演员（{@link ActorBase}）装入/卸出激活数组，
 *   同时通过引用计数管理精灵定义（{@link SpriteDef}）与底层图集的常驻/释放。
 *
 * 关键字段：
 *   - 静态资源池：{@link LevelLoader.tileMap}（当前地图）、{@link LevelLoader.spriteDefPool}（30 槽精灵定义池）、
 *     {@link LevelLoader.spriteDefRetained}（精灵定义常驻标志）、{@link LevelLoader.actorPools}（30 类演员对象池）、
 *     {@link LevelLoader.activeActors}（当前激活演员，按演员索引寻址）。
 *   - 实例布置表：{@link blockActorIndices}（屏块→演员索引）、{@link actorSpawnX}/{@link actorSpawnY}（初始坐标）、
 *     {@link actorTypeId}（演员→类型）、{@link actorSpawned}（已生成标志）、{@link actorExtraData}（附加字节）、
 *     {@link currentBlock}（摄像机当前屏块）。
 *
 * 协作者：被主 Canvas（{@link GameScreen}）的分步关卡加载状态机（loadLevelStep）调用；
 *   通过 {@link GameScreen.createActor} 实例化演员、{@link GameScreen.isScrollLevel} 决定常驻策略；
 *   读流原语来自 {@link GameMIDlet}（openArchiveEntryStream / readU16Le）。
 *
 * 注：releaseUnusedSpriteDefs 原 CFR 末尾的 System.gc() 按移植规约删除（见 docs/05-移植规约.md）。
 */
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

  /** 私有构造：仅由静态工厂 {@link LevelLoader.loadLevel} 创建，外部不可直接 new。 */
  private constructor() {
  }

  /**
   * 跳转式装载世界像素 (n, n2) 所在屏块（CFR j.a(int,int)）。
   * 重置全部 actorSpawned 标志、把所有演员池槽位标记为空闲，再把该屏块清单里的每个演员
   * 生成进 {@link LevelLoader.activeActors}，并记录为当前屏块。用于关卡开始/瞬移等非平滑切屏。
   */
  public activateScreenAt(pixelX: number, pixelY: number): void {
    let j: number;
    this.emptySlotMarker = 0;
    const blockIndex = ((pixelY / this.blockHeight) | 0) * (((LevelLoader.tileMap!.getPixelWidth() / this.blockWidth) | 0)) + ((pixelX / this.blockWidth) | 0);
    let i = 0;
    while (i < this.actorSpawned.length) {
      this.actorSpawned[i] = false;
      ++i;
    }
    let poolIndex = 0;
    while (poolIndex < LevelLoader.actorPools.length) {
      if (LevelLoader.actorPools[poolIndex] != null) {
        j = 0;
        while (j < LevelLoader.actorPools[poolIndex]!.length) {
          LevelLoader.actorPools[poolIndex]![j].active = false;
          ++j;
        }
      }
      ++poolIndex;
    }
    j = 0;
    while (j < this.blockActorIndices[blockIndex]!.length) {
      const actorId = this.blockActorIndices[blockIndex]![j];
      LevelLoader.activeActors[actorId] = this.spawnActor(actorId);
      ++j;
    }
    this.currentBlock = blockIndex;
  }

  /**
   * 平滑滚动时增量切换到世界像素 (pixelX, pixelY) 所在屏块（CFR j.b(int,int)）。
   * 将当前屏块演员清单与新屏块清单做归并 diff：离开视野的演员 deactivate 并卸出，
   * 新进入的演员索引先收集进 {@link LevelLoader.spawnDiffBuffer} 再统一生成；目标屏块未变则直接返回。
   */
  public streamScreenTransitionTo(pixelX: number, pixelY: number): void {
    let currentId: number;
    const blockIndex = ((pixelY / this.blockHeight) | 0) * (((LevelLoader.tileMap!.getPixelWidth() / this.blockWidth) | 0)) + ((pixelX / this.blockWidth) | 0);
    if (blockIndex === this.currentBlock) {
      return;
    }
    let i = 0;
    let j = 0;
    let diffCount = 0;
    while (i < this.blockActorIndices[this.currentBlock]!.length && j < this.blockActorIndices[blockIndex]!.length) {
      currentId = this.blockActorIndices[this.currentBlock]![i];
      const newId = this.blockActorIndices[blockIndex]![j];
      if (currentId === this.emptySlotMarker) {
        ++i;
        continue;
      }
      if (newId === this.emptySlotMarker) {
        ++j;
        continue;
      }
      if (currentId < newId) {
        if (LevelLoader.activeActors[currentId] != null) {
          LevelLoader.activeActors[currentId]!.deactivate();
          LevelLoader.activeActors[currentId] = null;
        }
        ++i;
        continue;
      }
      if (currentId > newId) {
        LevelLoader.spawnDiffBuffer[diffCount++] = this.blockActorIndices[blockIndex]![j++];
        continue;
      }
      ++i;
      ++j;
      if (LevelLoader.activeActors[currentId] == null || LevelLoader.activeActors[currentId]!.active) continue;
      LevelLoader.activeActors[currentId] = null;
    }
    while (i < this.blockActorIndices[this.currentBlock]!.length) {
      if (LevelLoader.activeActors[this.blockActorIndices[this.currentBlock]![i]] != null) {
        LevelLoader.activeActors[this.blockActorIndices[this.currentBlock]![i]]!.deactivate();
        LevelLoader.activeActors[this.blockActorIndices[this.currentBlock]![i]] = null;
      }
      ++i;
    }
    while (j < this.blockActorIndices[blockIndex]!.length) {
      if (this.blockActorIndices[blockIndex]![j] !== 0) {
        LevelLoader.spawnDiffBuffer[diffCount++] = this.blockActorIndices[blockIndex]![j];
      }
      ++j;
    }
    currentId = 0;
    while (currentId < diffCount) {
      LevelLoader.activeActors[LevelLoader.spawnDiffBuffer[currentId]] = this.spawnActor(LevelLoader.spawnDiffBuffer[currentId]);
      ++currentId;
    }
    this.currentBlock = blockIndex;
  }

  /**
   * 生成第 actorId 号演员（CFR j.a(int)）。按 {@link actorTypeId}[actorId] 选定类型池，找到首个空闲实例，
   * 写入其 id（extra=n），用该演员的 x/y/附加数据/已生成标志初始化（spawnAt），置 active 后返回；
   * 找不到空闲实例或初始化失败返回 null。
   */
  public spawnActor(actorId: number): ActorBase | null {
    const typeId = this.actorTypeId[actorId];
    let i = 0;
    while (i < LevelLoader.actorPools[typeId]!.length) {
      const actor = LevelLoader.actorPools[typeId]![i];
      if (actorId === 0 || !actor.active) {
        actor.extra = actorId;
        if (!actor.spawnAt(0, this.actorSpawnX[actorId], this.actorSpawnY[actorId], this.actorExtraData[actorId]!, this.actorSpawned[actorId])) {
          return null;
        }
        actor.active = true;
        return actor;
      }
      ++i;
    }
    return null;
  }

  /**
   * 构建类型 typeId 的演员对象池（CFR j.a(a,int,int) 静态）。请 {@link GameScreen} 用精灵定义
   * spriteDefPool[typeId] 实例化 count 个演员填入 {@link LevelLoader.actorPools}[n]；若该池已建则跳过。
   */
  public static buildActorPool(screen: GameScreen, typeId: number, count: number): void {
    if (LevelLoader.actorPools[typeId] != null) {
      return;
    }
    LevelLoader.actorPools[typeId] = new Array<ActorBase>(count);
    let i = 0;
    while (i < count) {
      LevelLoader.actorPools[typeId]![i] = screen.createActor(typeId, LevelLoader.spriteDefPool[typeId]!);
      ++i;
    }
  }

  /**
   * 释放未常驻的精灵定义（CFR j.a() 静态）。遍历 1..29，对 spriteDefRetained=false 的槽位
   * 调用 dispose 并置空。原 CFR 末尾的 System.gc() 按移植规约删除。
   */
  public static releaseUnusedSpriteDefs(): void {
    let i = 1;
    while (i < 30) {
      if (!LevelLoader.spriteDefRetained[i]) {
        if (LevelLoader.spriteDefPool[i] != null) {
          LevelLoader.spriteDefPool[i]!.dispose();
        }
        LevelLoader.spriteDefPool[i] = null;
      }
      ++i;
    }
    // System.gc(); —— 按规约删除（无意义）
  }

  /**
   * 重算精灵定义常驻标志（CFR j.b() 静态）。对 1..29 按 {@link GameScreen.isScrollLevel} 重置
   * spriteDefRetained，随后触发 {@link SpriteDef.refreshLoadedAtlasFlags} 清理图集已加载标志。
   */
  public static refreshRetainFlags(): void {
    let i = 1;
    while (i < 30) {
      LevelLoader.spriteDefRetained[i] = GameScreen.isScrollLevel(i);
      ++i;
    }
    SpriteDef.refreshLoadedAtlasFlags();
  }

  /**
   * 常驻第 spriteId 号精灵定义（CFR j.b(int) 静态）。若未加载则经 {@link SpriteDef.loadFromBin} 懒加载，
   * 置 spriteDefRetained[n]=true，并在 SpriteDef 静态表中把其底层图集标记为使用中。
   */
  public static retainSpriteDef(spriteId: number): void {
    if (LevelLoader.spriteDefPool[spriteId] == null) {
      LevelLoader.spriteDefPool[spriteId] = SpriteDef.loadFromBin(spriteId);
    }
    LevelLoader.spriteDefRetained[spriteId] = true;
    SpriteDef.atlasLoadedFlags[SpriteDef.resourceToAtlasId[spriteId]] = true;
  }

  /**
   * 拆除整关（CFR j.c()）。dispose 瓦片地图并置空、重算常驻标志，
   * 清空激活演员数组与全部演员池，并释放每演员的屏块/x/y/附加数据/类型表。
   */
  public disposeLevel(): void {
    let k: number;
    LevelLoader.tileMap!.dispose();
    LevelLoader.tileMap = null;
    LevelLoader.refreshRetainFlags();
    let i = 0;
    while (i < LevelLoader.activeActors.length) {
      LevelLoader.activeActors[i] = null;
      ++i;
    }
    LevelLoader.activeActors = null as unknown as (ActorBase | null)[];
    let poolIndex = 1;
    while (poolIndex < LevelLoader.actorPools.length) {
      if (LevelLoader.actorPools[poolIndex] != null) {
        k = 0;
        while (k < LevelLoader.actorPools[poolIndex]!.length) {
          LevelLoader.actorPools[poolIndex]![k] = null as unknown as ActorBase;
          ++k;
        }
      }
      LevelLoader.actorPools[poolIndex] = null;
      ++poolIndex;
    }
    k = 0;
    while (k < this.blockActorIndices.length) {
      this.blockActorIndices[k] = null;
      ++k;
    }
    this.blockActorIndices = null as unknown as (Int8Array | null)[];
    let extraIndex = 0;
    while (extraIndex < this.actorExtraData.length) {
      this.actorExtraData[extraIndex] = null;
      ++extraIndex;
    }
    this.actorExtraData = null as unknown as (Int8Array | null)[];
    this.actorSpawnY = null as unknown as Int16Array;
    this.actorSpawnX = null as unknown as Int16Array;
    this.actorTypeId = null as unknown as Int32Array;
  }

  /**
   * 初始化引导/公共精灵（CFR j.a(a) 静态）。加载精灵定义 0、在 {@link GameScreen} 上建其单实例池，
   * 并常驻精灵定义 8。供引擎启动阶段调用。
   */
  public static initBootSprites(screen: GameScreen): void {
    LevelLoader.spriteDefPool[0] = SpriteDef.loadFromBin(0);
    LevelLoader.buildActorPool(screen, ActorType.Player, 1);
    LevelLoader.retainSpriteDef(8);
  }

  /**
   * 静态工厂：解析 /res/s.bin 第 levelIndex 个条目并构建关卡（CFR j.a(a,int) 静态）。
   * 依次读取关卡头、敌人/精灵类型表、逐演员布置表（类型/x/y/附加数据）与「屏块→演员索引」表，
   * 据此建好 {@link TileMap} 与各演员对象池，返回填充完毕的 LevelLoader；任何解析异常返回 null。
   */
  public static loadLevel(screen: GameScreen, levelIndex: number): LevelLoader | null {
    const loader = new LevelLoader();
    try {
      // n2/n3 为不可约多角色 scratch：n2 先作 extra 数据长度、后作屏块循环索引；n3 先作精灵 id、后作池循环索引（有意保留反编译名）。
      let n2: number;
      let n3: number;
      const inputStream: InputStream = GameMIDlet.openArchiveEntryStream("/res/s.bin", levelIndex)!;
      const headerFlag = inputStream.read1();
      const spriteCount = inputStream.read1();
      const actorCount = inputStream.read1();
      LevelLoader.activeActors = new Array<ActorBase | null>(actorCount).fill(null);
      let bgEntry = 0;
      if (headerFlag === 2) {
        bgEntry = inputStream.read1();
        inputStream.read1();
        inputStream.read1();
      }
      let mapEntry = inputStream.read1();
      inputStream.read1();
      inputStream.read1();
      if (mapEntry > 2) {
        mapEntry -= 2;
      }
      LevelLoader.tileMap = TileMap.loadFromBin(mapEntry, bgEntry, headerFlag);
      const poolSizes = new Int32Array(30);
      let i = 0;
      while (i < 30) {
        poolSizes[i] = 0;
        ++i;
      }
      let j = 0;
      while (j < spriteCount) {
        n3 = inputStream.read1();
        LevelLoader.retainSpriteDef(n3);
        poolSizes[n3] = 1;
        ++j;
      }
      n3 = 0;
      while (n3 < 30) {
        if (poolSizes[n3] === 1) {
          poolSizes[n3] = inputStream.read1();
          LevelLoader.buildActorPool(screen, n3, poolSizes[n3]);
        }
        ++n3;
      }
      loader.actorTypeId = new Int32Array(actorCount);
      loader.actorSpawnX = new Int16Array(actorCount);
      loader.actorSpawnY = new Int16Array(actorCount);
      loader.actorExtraData = new Array<Int8Array | null>(actorCount).fill(null);
      loader.actorSpawned = new Array<boolean>(actorCount).fill(false);
      let actorIndex = 0;
      while (actorIndex < actorCount) {
        loader.actorSpawned[actorIndex] = false;
        loader.actorTypeId[actorIndex] = inputStream.read1();
        loader.actorSpawnX[actorIndex] = GameMIDlet.readU16Le(inputStream);
        loader.actorSpawnY[actorIndex] = GameMIDlet.readU16Le(inputStream);
        n2 = inputStream.read1();
        if (n2 > 0) {
          loader.actorExtraData[actorIndex] = new Int8Array(n2);
          inputStream.read(loader.actorExtraData[actorIndex]!);
        }
        ++actorIndex;
      }
      loader.blockWidth = 176;
      loader.blockHeight = 176;
      loader.blockCount = ((LevelLoader.tileMap!.getPixelHeight() / loader.blockHeight) | 0) * (((LevelLoader.tileMap!.getPixelWidth() / loader.blockWidth) | 0));
      loader.blockActorIndices = new Array<Int8Array | null>(loader.blockCount).fill(null);
      n2 = 0;
      while (n2 < loader.blockCount) {
        const indexCount = inputStream.read1();
        loader.blockActorIndices[n2] = new Int8Array(indexCount);
        inputStream.read(loader.blockActorIndices[n2]!);
        ++n2;
      }
      inputStream.close();
    } catch (exception) {
      return null;
    }
    return loader;
  }

  static {
    LevelLoader.spriteDefPool = new Array<SpriteDef | null>(30).fill(null);
    LevelLoader.spriteDefRetained = new Array<boolean>(30).fill(false);
    LevelLoader.actorPools = new Array<ActorBase[] | null>(30).fill(null);
    LevelLoader.spawnDiffBuffer = new Int8Array(40);
  }
}
