// 派生文件 · 非权威 · 逻辑逐字节等同 2-decompiled-cfr/tjge/j.java
// 标识符按 reverse/game1/3-readable/SYMBOLS.md 重命名，仅供阅读；任何不一致以 CFR 为准。
/*
 * Decompiled with CFR 0.152.
 */
package tjge;

import java.io.InputStream;
import tjge.GameMIDlet;
import tjge.a;          // GameScreen
import tjge.b;          // TileMap
import tjge.d;          // SpriteDef
import tjge.g;          // ActorBase

public final class LevelLoader {
    // 静态：当前关卡的瓦片地图实例（class b / TileMap）
    public static TileMap tileMap;
    // 静态，长度 30：按精灵类型 id 索引的精灵定义池（class d / SpriteDef），懒加载、未用时置 null
    public static SpriteDef[] spriteDefPool;
    // 静态，长度 30：每个精灵类型的保留标志，true 表示对应 spriteDefPool 条目必须保持加载
    public static boolean[] spriteDefRetained;
    // 静态，长度 30：每个类型 id 的可复用 actor 对象池（class g / ActorBase），内层数组为该类型预分配实例
    public static ActorBase[][] actorPools;
    // 静态：当前激活/已生成的 actor，按 actor 索引存放；生成时置入、移除时置 null
    public static ActorBase[] activeActors;
    // 私有静态，长度 40：streamScreenTransitionTo 中新进入可视块的 actor 索引暂存缓冲，随后用于生成
    private static byte[] spawnDiffBuffer;
    // 实例：屏幕块 → actor 索引表；blockActorIndices[block] 是属于该屏幕块的已排序 actor 索引列表
    public byte[][] blockActorIndices;
    // 实例：摄像机当前所在屏幕块的索引
    public int currentBlock;
    // 实例：每个 actor 的初始生成 X 坐标（按 actor 索引）
    public short[] actorSpawnX;
    // 实例：每个 actor 的初始生成 Y 坐标（按 actor 索引）
    public short[] actorSpawnY;
    // 实例：每个 actor 索引 → 其精灵/池类型 id 的映射（spawnActor 中用于选池）
    public int[] actorTypeId;
    // 实例：每个 actor 的“已生成”标志，传入 actor init；activateScreenAt 起始处复位
    public boolean[] actorSpawned;
    // 实例：每个 actor 的附加/参数字节负载，传给 actor 初始化（空时可能为 null）
    public byte[][] actorExtraData;
    // 私有实例：屏幕块总数 = (mapHeight/blockHeight)*(mapWidth/blockWidth)
    private int blockCount;
    // 私有实例：屏幕块宽度（像素，置 176）
    private int blockWidth;
    // 私有实例：屏幕块高度（像素，置 176）
    private int blockHeight;
    // 私有实例：流式 diff 时标记块 actor 索引列表中空/跳过槽位的哨兵值（0）
    private int emptySlotMarker;

    private LevelLoader() {
    }

    // 原 j.a(II)V —— activateScreenAt：跳转加载世界像素 (n,n2) 所在屏幕块
    public final void activateScreenAt(int n, int n2) {
        int n3;
        this.emptySlotMarker = 0;
        int n4 = n2 / this.blockHeight * (tileMap.getPixelWidth() / this.blockWidth) + n / this.blockWidth;
        int n5 = 0;
        while (n5 < this.actorSpawned.length) {
            this.actorSpawned[n5] = false;
            ++n5;
        }
        int n6 = 0;
        while (n6 < actorPools.length) {
            if (actorPools[n6] != null) {
                n3 = 0;
                while (n3 < actorPools[n6].length) {
                    tjge.LevelLoader.actorPools[n6][n3].active = false;
                    ++n3;
                }
            }
            ++n6;
        }
        n3 = 0;
        while (n3 < this.blockActorIndices[n4].length) {
            byte by = this.blockActorIndices[n4][n3];
            tjge.LevelLoader.activeActors[by] = this.spawnActor(by);
            ++n3;
        }
        this.currentBlock = n4;
    }

    // 原 j.b(II)V —— streamScreenTransitionTo：增量滚动到世界像素 (n,n2) 所在屏幕块
    public final void streamScreenTransitionTo(int n, int n2) {
        int n3;
        int n4 = n2 / this.blockHeight * (tileMap.getPixelWidth() / this.blockWidth) + n / this.blockWidth;
        if (n4 == this.currentBlock) {
            return;
        }
        int n5 = 0;
        int n6 = 0;
        int n7 = 0;
        while (n5 < this.blockActorIndices[this.currentBlock].length && n6 < this.blockActorIndices[n4].length) {
            n3 = this.blockActorIndices[this.currentBlock][n5];
            byte by = this.blockActorIndices[n4][n6];
            if (n3 == this.emptySlotMarker) {
                ++n5;
                continue;
            }
            if (by == this.emptySlotMarker) {
                ++n6;
                continue;
            }
            if (n3 < by) {
                if (activeActors[n3] != null) {
                    activeActors[n3].deactivate();
                    tjge.LevelLoader.activeActors[n3] = null;
                }
                ++n5;
                continue;
            }
            if (n3 > by) {
                tjge.LevelLoader.spawnDiffBuffer[n7++] = this.blockActorIndices[n4][n6++];
                continue;
            }
            ++n5;
            ++n6;
            if (activeActors[n3] == null || tjge.LevelLoader.activeActors[n3].active) continue;
            tjge.LevelLoader.activeActors[n3] = null;
        }
        while (n5 < this.blockActorIndices[this.currentBlock].length) {
            if (activeActors[this.blockActorIndices[this.currentBlock][n5]] != null) {
                activeActors[this.blockActorIndices[this.currentBlock][n5]].deactivate();
                tjge.LevelLoader.activeActors[this.blockActorIndices[this.currentBlock][n5]] = null;
            }
            ++n5;
        }
        while (n6 < this.blockActorIndices[n4].length) {
            if (this.blockActorIndices[n4][n6] != 0) {
                tjge.LevelLoader.spawnDiffBuffer[n7++] = this.blockActorIndices[n4][n6];
            }
            ++n6;
        }
        n3 = 0;
        while (n3 < n7) {
            tjge.LevelLoader.activeActors[tjge.LevelLoader.spawnDiffBuffer[n3]] = this.spawnActor(spawnDiffBuffer[n3]);
            ++n3;
        }
        this.currentBlock = n4;
    }

    // 原 j.a(I)Ltjge/g; —— spawnActor：生成 actor 索引 n
    public final ActorBase spawnActor(int n) {
        int n2 = this.actorTypeId[n];
        int n3 = 0;
        while (n3 < actorPools[n2].length) {
            ActorBase g2 = actorPools[n2][n3];
            if (n == 0 || !g2.active) {
                g2.extra = n;
                if (!g2.spawnAt(0, this.actorSpawnX[n], this.actorSpawnY[n], this.actorExtraData[n], this.actorSpawned[n])) {
                    return null;
                }
                g2.active = true;
                return g2;
            }
            ++n3;
        }
        return null;
    }

    // 原 j.a(Ltjge/a;II)V —— buildActorPool：静态，构建类型 n 大小 n2 的 actor 对象池
    public static final void buildActorPool(GameScreen a2, int n, int n2) {
        if (actorPools[n] != null) {
            return;
        }
        tjge.LevelLoader.actorPools[n] = new ActorBase[n2];
        int n3 = 0;
        while (n3 < n2) {
            tjge.LevelLoader.actorPools[n][n3] = a2.createActor(n, spriteDefPool[n]);
            ++n3;
        }
    }

    // 原 j.a()V —— releaseUnusedSpriteDefs：静态，释放 1..29 中未保留的精灵定义
    public static final void releaseUnusedSpriteDefs() {
        int n = 1;
        while (n < 30) {
            if (!spriteDefRetained[n]) {
                if (spriteDefPool[n] != null) {
                    spriteDefPool[n].b();
                }
                tjge.LevelLoader.spriteDefPool[n] = null;
            }
            ++n;
        }
        System.gc();
    }

    // 原 j.b()V —— refreshRetainFlags：静态，依 GameScreen.isScrollLevel 重算 1..29 保留标志
    public static final void refreshRetainFlags() {
        int n = 1;
        while (n < 30) {
            tjge.LevelLoader.spriteDefRetained[n] = tjge.GameScreen.isScrollLevel(n);
            ++n;
        }
        tjge.SpriteDef.refreshLoadedAtlasFlags();
    }

    // 原 j.b(I)V —— retainSpriteDef：静态，确保精灵定义 n 已加载并标记保留
    public static final void retainSpriteDef(int n) {
        if (spriteDefPool[n] == null) {
            tjge.LevelLoader.spriteDefPool[n] = tjge.SpriteDef.loadFromBin(n);
        }
        tjge.LevelLoader.spriteDefRetained[n] = true;
        tjge.SpriteDef.atlasLoadedFlags[tjge.SpriteDef.resourceToAtlasId[n]] = true;
    }

    // 原 j.c()V —— disposeLevel：拆除整个关卡
    public final void disposeLevel() {
        int n;
        tileMap.dispose();
        tileMap = null;
        tjge.LevelLoader.refreshRetainFlags();
        int n2 = 0;
        while (n2 < activeActors.length) {
            tjge.LevelLoader.activeActors[n2] = null;
            ++n2;
        }
        activeActors = null;
        int n3 = 1;
        while (n3 < actorPools.length) {
            if (actorPools[n3] != null) {
                n = 0;
                while (n < actorPools[n3].length) {
                    tjge.LevelLoader.actorPools[n3][n] = null;
                    ++n;
                }
            }
            tjge.LevelLoader.actorPools[n3] = null;
            ++n3;
        }
        n = 0;
        while (n < this.blockActorIndices.length) {
            this.blockActorIndices[n] = null;
            ++n;
        }
        this.blockActorIndices = null;
        int n4 = 0;
        while (n4 < this.actorExtraData.length) {
            this.actorExtraData[n4] = null;
            ++n4;
        }
        this.actorExtraData = null;
        this.actorSpawnY = null;
        this.actorSpawnX = null;
        this.actorTypeId = null;
    }

    // 原 j.a(Ltjge/a;)V —— initBootSprites：静态，引导加载启动/通用精灵
    public static final void initBootSprites(GameScreen a2) {
        tjge.LevelLoader.spriteDefPool[0] = tjge.SpriteDef.loadFromBin(0);
        tjge.LevelLoader.buildActorPool(a2, 0, 1);
        tjge.LevelLoader.retainSpriteDef(8);
    }

    // 原 j.a(Ltjge/a;I)Ltjge/j; —— loadLevel：静态工厂，解析 /res/s.bin 第 n 条目
    public static final LevelLoader loadLevel(GameScreen a2, int n) {
        LevelLoader j2 = new LevelLoader();
        try {
            int n2;
            int n3;
            InputStream inputStream = GameMIDlet.openArchiveEntryStream("/res/s.bin", n);
            int n4 = inputStream.read();
            int n5 = inputStream.read();
            int n6 = inputStream.read();
            activeActors = new ActorBase[n6];
            int n7 = 0;
            if (n4 == 2) {
                n7 = inputStream.read();
                inputStream.read();
                inputStream.read();
            }
            int n8 = inputStream.read();
            inputStream.read();
            inputStream.read();
            if (n8 > 2) {
                n8 -= 2;
            }
            tileMap = tjge.TileMap.loadFromBin(n8, n7, n4);
            int[] nArray = new int[30];
            int n9 = 0;
            while (n9 < 30) {
                nArray[n9] = 0;
                ++n9;
            }
            int n10 = 0;
            while (n10 < n5) {
                n3 = inputStream.read();
                tjge.LevelLoader.retainSpriteDef(n3);
                nArray[n3] = 1;
                ++n10;
            }
            n3 = 0;
            while (n3 < 30) {
                if (nArray[n3] == 1) {
                    nArray[n3] = inputStream.read();
                    tjge.LevelLoader.buildActorPool(a2, n3, nArray[n3]);
                }
                ++n3;
            }
            j2.actorTypeId = new int[n6];
            j2.actorSpawnX = new short[n6];
            j2.actorSpawnY = new short[n6];
            j2.actorExtraData = new byte[n6][];
            j2.actorSpawned = new boolean[n6];
            int n11 = 0;
            while (n11 < n6) {
                j2.actorSpawned[n11] = false;
                j2.actorTypeId[n11] = inputStream.read();
                j2.actorSpawnX[n11] = GameMIDlet.readU16Le(inputStream);
                j2.actorSpawnY[n11] = GameMIDlet.readU16Le(inputStream);
                n2 = inputStream.read();
                if (n2 > 0) {
                    j2.actorExtraData[n11] = new byte[n2];
                    inputStream.read(j2.actorExtraData[n11]);
                }
                ++n11;
            }
            j2.blockWidth = 176;
            j2.blockHeight = 176;
            j2.blockCount = tileMap.getPixelHeight() / j2.blockHeight * (tileMap.getPixelWidth() / j2.blockWidth);
            j2.blockActorIndices = new byte[j2.blockCount][];
            n2 = 0;
            while (n2 < j2.blockCount) {
                int n12 = inputStream.read();
                j2.blockActorIndices[n2] = new byte[n12];
                inputStream.read(j2.blockActorIndices[n2]);
                ++n2;
            }
            inputStream.close();
        }
        catch (Exception exception) {
            return null;
        }
        return j2;
    }

    static {
        spriteDefPool = new SpriteDef[30];
        spriteDefRetained = new boolean[30];
        actorPools = new ActorBase[30][];
        spawnDiffBuffer = new byte[40];
    }
}
