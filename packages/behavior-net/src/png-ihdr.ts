// 从 PNG 字节读 IHDR 宽高（大端）。headless 只需尺寸——游戏逻辑消费图集列数/锚点，从不回读像素。
// 布局：8 字节签名 + [len(4)][ "IHDR"(4) ][ width(4) BE ][ height(4) BE ]，故 width@16 / height@20。
export function parsePngSize(bytes: Uint8Array): { width: number; height: number } {
  const be = (o: number): number => ((bytes[o] << 24) | (bytes[o + 1] << 16) | (bytes[o + 2] << 8) | bytes[o + 3]) >>> 0;
  return { width: be(16), height: be(20) };
}
