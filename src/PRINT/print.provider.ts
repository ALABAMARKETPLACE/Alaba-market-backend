import { Print } from "./print.entity";

export const PrintProvider = [{ provide: "PrintRepository", useValue: Print }];
