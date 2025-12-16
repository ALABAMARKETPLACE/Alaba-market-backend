import { Banner } from "./banner.entity";

export const BannerProviders = [
	{ provide: "BannerRepository", useValue: Banner },
];
