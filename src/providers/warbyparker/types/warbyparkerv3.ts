/* eslint-disable @typescript-eslint/no-empty-interface */
export interface WarbyParkerV3 {
  client: Client
  config: WelcomeConfig
  modifiers: Modifiers
  locale: Locale
  location: Location
  requestCookies: RequestCookies
  api: WelcomeAPI
  experiments: Experiments
  user: User
}

interface WelcomeAPI {
  prefetched: Prefetched
  timing: Timing
  errors: Errors
}

interface Errors {}

interface Prefetched {
  '/api/v2/variations/footer': APIV2VariationsFooter
  '/api/v2/variations/smart-banner': APIV2VariationsSmartBanner
  '/api/v2/variations/promo-banner': APIV2VariationsPromoBanner
  '/api/v2/variations/new-nav': APIV2VariationsNewNav
  '/api/v2/variations/content': APIV2VariationsContent
  '/api/v2/configurations/sunglasses/men/percey': APIV2Configurations
  '/api/v2/variations/lens-selection/sunglasses': APIV2VariationsLensSelectionSunglasses
  '/api/v3/products/sunglasses/men/percey': APIV3Products
  '/api/v2/personalization': APIV2Personalization
  '/api/v2/session': APIV2Session
  '/api/v2/experiments/bucket': string
  '/api/v3/cart/promotions': APIV3CartPromotions
  '/api/v2/cart/items': APIV2CartItems
}

interface APIV2CartItems {
  items: APIV2CartItemsItem[]
  analytics_item_counts: OrderCountsAnalytics
  totals: Totals
  applied_promotions: null
  qualified_promotions: null
  qualified_discount_amount: number
}

interface OrderCountsAnalytics {
  hto_frames_count: number
  purchase_frames_count: number
  trial_wp_contact_lens_count: number
  purchase_wp_contact_lens_count: number
  trial_third_party_contact_lens_count: number
  purchase_third_party_contact_lens_count: number
  purchase_other_products_count: number
}

interface APIV2CartItemsItem {
  added_via: string
  amount: number
  amount_cents: number
  applied_promotions_total: number
  applied_item_promotions: null
  assembly_type?: string
  category: string
  color?: string
  cost_details?: CostDetails
  customer_readable_frame_description?: string
  display_frame_family?: string
  display_width?: string
  discount_amount: number
  discounted_amount: null
  gender?: string
  id: string
  image_url: string
  images?: BrownClass
  img_transparent?: string
  in_stock: boolean
  is_photochromic?: boolean
  is_low_bridge_fit?: boolean
  is_demo?: boolean
  label?: string
  lens_color?: null
  name: string
  option_metadata: Errors
  option_type: string
  pc_product_id: number
  pdp_path: string
  product_url: string
  properties?: Properties
  qty: number
  readers_strength?: string
  sku: string
  tax_code: string
  width_slug?: string
  display_name?: string
}

interface CostDetails {
  lens_material: LensMaterial
  lens_selections: LensMaterial
  prescription_type: LensMaterial
}

interface LensMaterial {
  label: string
  slug: string
  amount: number
}

interface BrownClass {
  angle: string
  front: string
  side: string
  base_transp: string
}

interface Properties {
  is_blue_light: boolean
  is_cr_39: boolean
  is_flash: boolean
  is_high_index: boolean
  is_hto: boolean
  is_photochromics: boolean
  is_prism: boolean
  is_progressives: boolean
  is_readers: boolean
  is_rx: boolean
  is_salable_demo: boolean
  is_ultra_high_index: boolean
  is_polarized: boolean
  is_non_polarized: boolean
  is_rx_sun: boolean
  is_suggested_sun_rx_lens_color?: boolean
  lens_color?: LensColor
}

enum LensColor {
  Blue = 'blue',
  Brown = 'brown',
  BrownNonPolarized = 'brown non-polarized',
  FlashMirroredElectricBlue = 'flash mirrored electric blue',
  FlashMirroredRoseGold = 'flash mirrored rose gold',
  FlashMirroredSilver = 'flash mirrored silver',
  Green = 'green',
  GreenNonPolarized = 'green non-polarized',
  Grey = 'grey',
  GreyNonPolarized = 'grey non-polarized',
  Unknown = 'unknown',
}

interface Totals {
  subtotal_cents: number
  promotion_cents: number
  promotion_subtotal_cents: number
  adjustment_cents: number
  discount_cents: number
  shipping_cents: number
  tax_cents: number
  gift_card_cents: number
  balance_cents: number
  insurance_allowance_cents: number
  copay_amount_cents: number
  insurance_amount_cents: number
  balance_after_insurance_cents: number
  total_cents: number
  in_usd: Errors
}

export interface APIV2Configurations {
  products: APIV2ConfigurationsSunglassesMenPerceyProduct[]
}

interface APIV2ConfigurationsSunglassesMenPerceyProduct {
  assembly_type: string
  color_slug: string
  configurations: Configuration[]
  display_color: string
  display_width: string
  display_frame_family: string
  display_frame_style: string
  frame_family_id: string
  frame_family_slug: string
  frame_family_bridge_slug: string
  frame_style_pc_product_id: number
  images: PurpleImages
  is_low_bridge_fit: boolean
  path: string
  pdp_path: string
  pc_product_id: number
  width: number
  width_slug: string
}

interface Configuration {
  config_product_name: string
  pc_product_id: number
  in_stock: boolean
  price_cents: number
  properties: Properties
  slug: Slug
}

enum Slug {
  Hto = 'hto',
  NonRx = 'non_rx',
  Prog = 'prog',
  ProgFlash = 'prog_flash',
  ProgFlashPrism = 'prog_flash_prism',
  ProgHighIndex = 'prog_high_index',
  ProgHighIndexPrism = 'prog_high_index_prism',
  ProgPrism = 'prog_prism',
  Readers = 'readers',
  Rx = 'rx',
  RxFlash = 'rx_flash',
  RxFlashPrism = 'rx_flash_prism',
  RxHighIndex = 'rx_high_index',
  RxHighIndexPrism = 'rx_high_index_prism',
  RxPrism = 'rx_prism',
}

interface PurpleImages {
  grey?: BrownClass
  default: BrownClass
  green?: BrownClass
  brown?: BrownClass
}

interface APIV2Personalization {
  likely_gender: string
  login_type: null
}

interface APIV2Session {
  cart: Cart
  customer: null
  seconds_since_arrival: number
}

interface Cart {
  quantity: number
  hto_quantity: number
  hto_quantity_remaining: number
  hto_limit_reached: boolean
  items: CartItem[]
  cart_type_analytics: string
  applied_promotions: null
  qualified_promotions: null
}

interface CartItem {
  id: string
  pc_product_id: number
}

interface APIV2VariationsContent {
  id: number
  path: string
  revision: number
  created: Date
  updated: Date
  variations: APIV2VariationsContentVariations
}

interface APIV2VariationsContentVariations {
  default: PurpleDefault
}

interface PurpleDefault {
  content: PurpleContent[]
}

interface PurpleContent {
  path: string
  copy: string
}

interface APIV2VariationsFooter {
  id: number
  path: string
  revision: number
  created: Date
  updated: Date
  variations: APIV2VariationsFooterVariations
}

interface APIV2VariationsFooterVariations {
  default: FluffyDefault
}

interface FluffyDefault {
  columns: Column[]
  social: Social
  email_capture: EmailCapture
  legal: Legal
  countries: Countries
  help: Help
}

interface Column {
  categories: Category[]
}

interface Category {
  links: CategoryLink[]
  name: string
}

interface CategoryLink {
  text: string
  href: string
  href_desktop?: null
}

interface Countries {
  links: CountriesLink[]
}

interface CountriesLink {
  title: string
  route: string
  code: string
}

interface EmailCapture {
  success: SuccessClass
  default: SuccessClass
  icon: string
}

interface SuccessClass {
  title: string
}

interface Help {
  copy: string
  title: string
  links: HelpLink[]
}

interface HelpLink {
  title: string
  image: string
  route: string
  quality?: number
}

interface Legal {
  links: LegalLink[]
}

interface LegalLink {
  title: string
  route: string
}

interface Social {
  twitter: Facebook
  instagram: Facebook
  facebook: Facebook
  title: string
  youtube: Facebook
}

interface Facebook {
  show: boolean
  link: string
}

interface APIV2VariationsLensSelectionSunglasses {
  id: number
  path: string
  revision: number
  created: Date
  updated: Date
  variations: APIV2VariationsLensSelectionSunglassesVariations
}

interface APIV2VariationsLensSelectionSunglassesVariations {
  default: TentacledDefault
}

interface TentacledDefault {
  steps: Step[]
}

interface Step {
  image_orientation: string
  title: string
  options: Option[]
  label: null | string
  display_conditions: DisplayCondition[]
  key: string
  description?: string
}

interface DisplayCondition {
  value: boolean
  name: string
}

interface Option {
  key: string
  properties: DisplayCondition[]
  title: null | string
  description: null | string
}

interface APIV2VariationsNewNav {
  id: number
  path: string
  revision: number
  created: Date
  updated: Date
  variations: APIV2VariationsNewNavVariations
}

interface APIV2VariationsNewNavVariations {
  crosspromotevisionservices: Contactsdiscoverability
  contactsdiscoverability: Contactsdiscoverability
  default: Contactsdiscoverability
}

interface Contactsdiscoverability {
  PRIMARY_NAV: PrimaryNav
  MOBILE: Mobile
  MESSAGING: Messaging
}

interface Messaging {
  href: string
  copy: string
}

interface Mobile {
  SECONDARY_LINKS: SecondaryLinks
  TILES: Tile[]
}

interface SecondaryLinks {
  LINKS_SIGNED_OUT: LINKSSIGNEDINElement[]
  LINKS_SIGNED_IN: LINKSSIGNEDINElement[]
}

interface LINKSSIGNEDINElement {
  text: string
  href: string
  gaSlug: string
}

interface Tile {
  links: LINKSSIGNEDINElement[]
  id: string
  valueProp: string
  gaSlug: string
  itemTitle: string
}

interface PrimaryNav {
  LINK_ORDER: string[]
  LINKS: Links
  MOBILE_LINK_ORDER_MODIFIER: string
}

interface Links {
  'primary-contacts': Primary
  'primary-exams': Primary
  'primary-sun': Primary
  'primary-hto': Primary
  'primary-rx': Primary
}

interface Primary {
  url: string
  gaSlug: string
  title: string
  genders: GenderElement[]
  copy?: string
}

interface GenderElement {
  url: string
  id: GenderEnum
  title: Title
}

enum GenderEnum {
  Men = 'men',
  Women = 'women',
}

enum Title {
  ShopEyeglasses = 'Shop eyeglasses',
  ShopMen = 'Shop Men',
  ShopSunglasses = 'Shop sunglasses',
  ShopWomen = 'Shop Women',
}

interface APIV2VariationsPromoBanner {
  id: number
  path: string
  revision: number
  created: Date
  updated: Date
  variations: APIV2VariationsPromoBannerVariations
}

interface APIV2VariationsPromoBannerVariations {
  default: StickyDefault
}

interface StickyDefault {
  description_text: null
  showCloseButton: boolean
  cta: Cta
  enabled: boolean
  blacklist: any[]
}

interface Cta {
  url: null
  text: null
}

interface APIV2VariationsSmartBanner {
  id: number
  path: string
  revision: number
  created: Date
  updated: Date
  variations: APIV2VariationsSmartBannerVariations
}

interface APIV2VariationsSmartBannerVariations {
  default: IndigoDefault
}

interface IndigoDefault {
  enabled: boolean
  allowedList: AllowedList[]
  content: FluffyContent[]
}

interface AllowedList {
  reg_ex: string
}

interface FluffyContent {
  regex: string
  cta_text_td: string
  headline_td: string
  icon_image: string
  vto_path: string
  cta_text: null | string
  generic_path?: string
  generic_headline: null | string
}

interface APIV3CartPromotions {
  applied_promotions: null
  qualified_promotions: null
}

export interface APIV3Products {
  products: APIV3ProductsSunglassesMenPerceyProduct[]
}

interface APIV3ProductsSunglassesMenPerceyProduct {
  id: number
  pc_product_id: number
  assembly_type: string
  collections: string[]
  color: string
  color_id: string
  color_slug: string
  description: string
  description_callout: string
  details_bullet_points: string[]
  display_frame_family: string
  display_name: string
  display_shape: string
  display_width: string
  frame_family_id: string
  frame_family_slug: string
  frame_family_width_slug: string
  frame_style_pc_product_id: number
  gender: string
  hto_assortment_test: boolean
  hto_available: boolean
  image: string
  images: FluffyImages
  is_low_bridge_fit: boolean
  is_sun: boolean
  lens_color: null
  measurements: Measurements
  path: string
  pdp_path: string
  pdp_details_cms_identifier: string
  polarized_lenses: boolean
  product_category: string
  recommendations: Recommendation[]
  seo_description: string
  sku: string
  swatch_url: string
  visible: boolean
  width_group: string
  width_slug: string
}

interface FluffyImages {
  default: ImagesDefault
}

interface ImagesDefault {
  front: string
  side: string
  angle: string
  base_transparent: string
  model?: string
}

interface Measurements {
  lens_width: number
  bridge_width: number
  temple_length: number
  overall_frame_width: number
}

interface Recommendation {
  color: string
  display_name: string
  image: string
  path: string
  pc_product_id: number
}

interface Timing {
  '/api/v2/meta?path=%2Fsunglasses%2Fmen%2Fpercey%2Fpacific-crystal': string
  '/api/v2/variations/footer': string
  '/api/v2/experiments': string
  '/api/v2/session': string
  '/api/v2/personalization': string
  '/api/v2/variations/smart-banner': string
  '/api/v2/variations/promo-banner': string
  '/api/v2/variations/new-nav': string
  '/api/v2/variations/content': string
  '/api/v2/experiments/bucket': string
  '/api/v2/configurations/sunglasses/men/percey': string
  '/api/v2/variations/lens-selection/sunglasses': string
  '/api/v3/products/sunglasses/men/percey': string
  '/api/v3/cart/promotions': string
  '/api/v2/cart/items': string
}

interface Client {
  ua: string
  browser: ClientBrowser
  engine: Engine
  os: Engine
  device: Errors
  cpu: Errors
  isApplePayCapable: boolean
  isNativeAppCapable: boolean
  isUnsupportedBrowser: boolean
}

interface ClientBrowser {
  name: string
  version: string
  major: string
}

interface Engine {
  name: string
  version: string
}

interface WelcomeConfig {
  sentry: Sentry
  wapi: Pmp
  environment: Environment
  google: Google
  affirm: Affirm
  affirm_split_pay: Affirm
  pmp: Pmp
  mvd: Mvd
  stripe: Stripe
  gladly: Gladly
  scripts: Scripts
  server: Server
  isProduction: boolean
  revision: string
  debug: boolean
  isDev: boolean
  isLocalDev: boolean
}

interface Affirm {
  public_api_key: string
  script: string
}

interface Environment {
  name: string
  debug: boolean
  revision: string
  server: boolean
  browser: boolean
  test: boolean
  production: boolean
}

interface Gladly {
  sidekick: Sidekick
  help_center: HelpCenter
}

interface HelpCenter {
  US: HelpCenterCA
  CA: HelpCenterCA
}

interface HelpCenterCA {
  api: string
  orgId: string
  brandId: string
  cdn: string
  selector: string
}

interface Sidekick {
  US: SidekickCA
  CA: SidekickCA
}

interface SidekickCA {
  app_id: string
}

interface Google {
  api_key: string
  analytics_key: string
}

interface Mvd {
  domain: string
}

interface Pmp {
  url: string
}

interface Scripts {
  stripe_v3: string
}

interface Sentry {
  browser: ServerClass
  server: ServerClass
}

interface ServerClass {
  dsn: string
  release: string
}

interface Server {
  config: ServerConfig
  locales: Locales
  button_io: ButtonIo
  datadog: Datadog
  lux: Lux
  pre_react: Lux
  process: Process
  memory: Memory
  logging: Logging
  statsd: Statsd
  api: ServerAPI
  gtm: Gtm
  optimizely: Optimizely
  circuit_breaker: CircuitBreaker
  typekit: Typekit
}

interface ServerAPI {
  servers: Servers
  timeout: number
}

interface Servers {
  us: CAClass
  ca: CAClass
}

interface CAClass {
  protocol: string
  inventory: string
  host: string
  port: string
}

interface ButtonIo {
  enabled: boolean
  id: string
}

interface CircuitBreaker {
  redis_open: boolean
  redis_closed: boolean
  frontend_store_open: boolean
  frontend_store_closed: boolean
}

interface ServerConfig {
  address: string
  cookie_domain: string
  inventory: string
  port: string
  hostname: string
}

interface Datadog {
  browser_enabled: boolean
  client_token: string
}

interface Gtm {
  enabled: boolean
  container_id: string
}

interface Locales {
  ca: Locale
  us: Locale
}

interface Locale {
  host: string
  offline_host: string
  country: string
  currency: string
  stripe_public_key: string
  lang: string
  features: Features
  cookie_prefix: string
  alternates: Alternate[]
}

interface Alternate {
  host: string
  lang: string
  country: string
}

interface Features {
  basePriceCents: number
  callDoctor: boolean
  freeReturns: boolean
  freeShipping: boolean
  giftCards: boolean
  homeTryOn: boolean
  taxesAndDuties: boolean
  insurance: boolean
  receipt: boolean
  giftReceipt: boolean
  retailEvents?: boolean
}

interface Logging {
  metrics: boolean
}

interface Lux {
  enabled: boolean
}

interface Memory {
  enforce: boolean
  limit: number
  polling_interval: number
}

interface Optimizely {
  enabled: boolean
  project_id: string
}

interface Process {
  watch_mode: boolean
  num_forks: number
}

interface Statsd {
  host: string
  port: string
  prefix: string
  enabled: boolean
}

interface Typekit {
  css_enabled: boolean
  host: string
  project_id: string
}

interface Stripe {
  public_key: string
}

interface Experiments {
  active: { [key: string]: Active }
  nameMapId: NameMapID
  seed: string
  groups: Errors
}

interface Active {
  name: string
  all_variants: string[]
  attributes: Attributes
  traffic: number
  state: State
}

interface Attributes {
  hosts: string[]
  buckets: string[]
  session_data: any[]
  cache_variants: string[]
  experiment_groups: any[]
  content_variations: string[]
}

interface State {
  bucketed: boolean
  forced: boolean
  participant: boolean
  traffic_slot: number
  variant: string
  variant_slot: number
}

interface NameMapID {
  bundles: string
  accessibleBlueV2: string
  addGetAPrescriptionToNav: string
  affirmSplitPayPDP: string
  contactsPromoCartAlert: string
  covidStoreClosures: string
  emptyCartContactsCta: string
  homepageAAtest2: string
  homepageBundlesMessagingVariants: string
  newContactsCustomerPromoPdp: string
  storeVisitByAppt: string
  targetedBundlesPriceMessaging: string
  visionServicesJuly12: string
  visionServicesJuly19: string
}

interface Location {
  hash: null
  host: string
  hostname: string
  href: string
  pathname: string
  port: null
  protocol: string
  search: null
  domain: string
  query: Errors
  description: string
  route: string
  method: string
  params: Params
  visibleBeforeMount: boolean
  renderToStaticMarkup: boolean
  bundle: null
  bundleFile: string
  component: string
  layout: string
  stores: string[]
  title: string
}

interface Params {
  frame_name: string
  frame_color: string
  assembly_type: string
  gender: GenderEnum
}

interface Modifiers {
  isMobileAppRequest: boolean
}

interface RequestCookies {
  wp_id: string
}

interface User {
  isLoggedIn: boolean
  loginType: null
  likelyGender: string
  hasUnconvertedHto: boolean
  unconvertedHtoItems: any[]
  cartTypeAnalytics: string
  orderCountsAnalytics: OrderCountsAnalytics
  isFirstCustomerOrder: null
}
