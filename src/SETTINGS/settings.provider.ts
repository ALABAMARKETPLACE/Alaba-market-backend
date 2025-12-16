import { Settings } from "./settings.entity";

export const SettingsProvider = [
  { provide: "SettingsRepository", useValue: Settings },
];
