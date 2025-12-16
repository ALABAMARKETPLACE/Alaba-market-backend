import { FeaturedRotationState } from "./featured-rotation-state.entity";

export const FeaturedRotationProviders = [
  {
    provide: "FeaturedRotationStateRepository",
    useValue: FeaturedRotationState,
  },
];


