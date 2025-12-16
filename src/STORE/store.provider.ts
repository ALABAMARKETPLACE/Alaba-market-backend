import { Store } from "./store.entity";

export const StoreProvider = [{ provide: "StoreRepository", useValue: Store }];
