import slugify from "slugify";

export const SlugifyProvider = [
  {
    provide: "Slugify",
    useFactory: () => (slug: string) => {
      return slugify(slug, {
        lower: true,
        strict: true,
        locale: "vi",
        trim: true,
      });
    },
  },
];
