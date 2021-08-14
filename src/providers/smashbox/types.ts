export interface Response {
  products: Products;
}

interface Products {
  items: ProductsItem[];
}

interface ProductsItem {
  default_category:    DefaultCategory;
  description:         string;
  display_name:        DisplayName;
  is_hazmat:           boolean;
  meta:                Meta;
  product_badge:       null | string;
  product_id:          string;
  product_url:         string;
  short_description:   string;
  tags:                FluffyTags;
  skin:                Skin;
  cross_sell:          CrossSell[];
  form:                Coverage[];
  maincat:             Coverage[];
  coverage:            Coverage[];
  product_badge_image: null;
  media:               PurpleMedia;
  reviews:             Reviews;
  sub_header:          null;
  usage_options:       Coverage[];
  shade_groups:        ShadeGroup[] | null;
  skus:                Skus;
}

interface Coverage {
  key:   string;
  value: string;
}

interface CrossSell {
  sku_id:   string;
  sort_key: number;
}

interface DefaultCategory {
  id:    string;
  value: string;
}

enum DisplayName {
  StudioSkin24HourHydraFoundation = "Studio Skin 24 Hour Hydra Foundation",
  StudioSkinFullCoverage24HourFoundation = "Studio Skin Full Coverage 24 Hour Foundation",
}

interface PurpleMedia {
  videos: Video[];
  large:  Large[];
}

interface Large {
  src: string;
  alt: DisplayName;
}

interface Video {
  position: null;
  src:      null;
  provider: string;
  poster:   Poster;
}

interface Poster {
  src:    null | string;
  height: number | null;
  width:  number | null;
  alt?:   DisplayName;
}

interface Meta {
  description: null | string;
}

interface Reviews {
  average_rating:    number;
  number_of_reviews: number;
}

interface ShadeGroup {
  key:      string;
  value:    string;
  position: number;
}

interface Skin {
  type:    Coverage[];
  concern: Coverage[];
}

interface Skus {
  total: number;
  items: SkusItem[];
}

interface SkusItem {
  is_default_sku:         boolean;
  is_discountable:        boolean;
  is_giftwrap:            boolean;
  is_under_weight_hazmat: boolean;
  iln_listing:            string;
  iln_version_number:     string;
  inventory_status:       string;
  material_code:          string;
  prices:                 Price[];
  sizes:                  Size[];
  shades:                 Shade[];
  sku_id:                 string;
  sku_badge:              null | string;
  unit_size_formatted:    null;
  upc:                    string;
  is_replenishable:       boolean;
  perlgem:                Perlgem;
  color_family:           null;
  finish:                 Coverage[];
  sku_badge_image:        null;
  media:                  FluffyMedia;
  iln_formulated_without: null;
  tags:                   PurpleTags;
  vto:                    Vto;
  shade_groups:           null;
}

interface FluffyMedia {
  large:  Poster[];
  medium: Poster[];
  small:  Poster[];
}

interface Perlgem {
  SKU_BASE_ID: number;
}

interface Price {
  currency:      string;
  is_discounted: boolean;
  include_tax:   IncludeTax;
}

interface IncludeTax {
  price:                    number;
  original_price:           number;
  price_per_unit:           null;
  price_formatted:          string;
  original_price_formatted: string;
  price_per_unit_formatted: string;
}

interface Shade {
  name:        string;
  description: string;
  hex_val:     string;
  image:       Poster;
}

interface Size {
  value: string;
  key:   number;
}

interface PurpleTags {
  items: TagsItem[];
}

interface TagsItem {
  id:    string;
  value: string;
  key:   string;
}

interface Vto {
  is_color_experience: boolean;
}

interface FluffyTags {
  total: number;
  items: TagsItem[];
}
