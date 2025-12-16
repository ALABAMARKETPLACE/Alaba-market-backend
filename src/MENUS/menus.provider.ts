import { Menus } from "./menus.entity";
export const MenusProviders = [{ provide: "MenusRepository", useValue: Menus }];
