interface IConfig {
  GLUCK: boolean;
  M14: boolean;
  GrenadeLauncherErgo: boolean;
  GrenadeLauncherErgoValue: number;
  PistolScopes: boolean;
  UMPDrum: boolean;
  UMPDrumVector: boolean;
  UMPDrumAddToTraders: boolean;
  keyDurability: boolean;
  namelister: boolean;
  IAmAScumAndWantToRemoveSupporterNames: boolean;
  namesToAdd: string[];
  zeroToHeroPouch: boolean;
  ragfairLevelOverride: boolean;
  ragFairMinUserLevel: number;
  AK12Muzzles: boolean;
  fuckfakevodka: boolean;
  botRangeAdjustment: boolean;
  levelRanges: LevelRange[];
  rpdmods: boolean;
  scavgingynerf: boolean;
  enableFenceBlacklist: boolean;
  fenceBlacklist: string[];
  memeUSP45: boolean;
  enableTraderRefreshAdjustment: boolean;
  traderRefreshTimeAdjustmentMin: number;
  traderRefreshTimeAdjustmentMax: number;
  traderRefreshTimeAdjustmentLimit: number;
  enableSuppressorErgoAdjustment: boolean;
  suppressorErgoAdjustment: number;
  m700Barrel: boolean;
  flareSpecial: boolean;
  debug: boolean;
  shturmanKeyBuff: boolean;
}

interface LevelRange {
  min: number;
  max: number;
}