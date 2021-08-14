/* eslint-disable @typescript-eslint/no-empty-interface */
export interface WarbyParkerV2 {
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
  '/api/v2/products/accessories/geometric-case/walnut': APIV2Products
  '/api/v2/variations/editions-details': APIV2VariationsEditionsDetails
  '/api/v2/personalization': APIV2Personalization
  '/api/v2/session': APIV2Session
  '/api/v2/experiments/bucket': string
}

interface APIV2Personalization {
  likely_gender: string
  login_type: null
}

export interface APIV2Products {
  group: Group
  products: Product[]
}

interface Group {
  id: string
  name: string
}

interface Product {
  path: string
  id: number
  pc_product_id: number
  class_key: string
  description: string
  display_name: string
  subtitle: string
  author: null
  in_stock: boolean
  price_cents: number
  images: Images
  swatch_url: string
  color: string
  sized_headturn_image_set: SizedHeadturnImageSet
  recommendations: any[]
}

interface Images {
  front: string
  side: string
  angle: string
}

interface SizedHeadturnImageSet {
  s: L | null
  m: L | null
  l: L
}

interface L {
  modes: Modes
  images: string[]
}

interface Modes {
  clear_fill: ClearFill
  clip: Clip
  fill: Fill
  pad: Pad
}

enum ClearFill {
  IWarbycdnCOMSL = '//i.warbycdn.com/s/l',
}

enum Clip {
  IWarbycdnCOMSC = '//i.warbycdn.com/s/c',
}

enum Fill {
  IWarbycdnCOMSF = '//i.warbycdn.com/s/f',
}

enum Pad {
  IWarbycdnCOMSP = '//i.warbycdn.com/s/p',
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
  items: Item[]
  cart_type_analytics: string
  applied_promotions: null
  qualified_promotions: null
}

interface Item {
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
  copy: string
  path: string
}

interface APIV2VariationsEditionsDetails {
  id: number
  path: string
  revision: number
  created: Date
  updated: Date
  variations: APIV2VariationsEditionsDetailsVariations
}

interface APIV2VariationsEditionsDetailsVariations {
  default: DefaultElement[]
}

interface DefaultElement {
  details: string[]
  path: string
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
  social: Social
  columns: Column[]
  help: Help
  countries: Countries
  legal: Legal
  email_capture: EmailCapture
}

interface Column {
  categories: Category[]
}

interface Category {
  name: string
  links: CategoryLink[]
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
  code: string
  route: string
}

interface EmailCapture {
  icon: string
  success: SuccessClass
  default: SuccessClass
}

interface SuccessClass {
  title: string
}

interface Help {
  title: string
  copy: string
  links: HelpLink[]
}

interface HelpLink {
  title: string
  route: string
  image: string
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
  instagram: Facebook
  youtube: Facebook
  facebook: Facebook
  twitter: Facebook
  title: string
}

interface Facebook {
  show: boolean
  link: string
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
  genders: Gender[]
  copy?: string
}

interface Gender {
  url: string
  id: ID
  title: Title
}

enum ID {
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
  default: TentacledDefault
}

interface TentacledDefault {
  cta: Cta
  enabled: boolean
  showCloseButton: boolean
  blacklist: any[]
  description_text: null
}

interface Cta {
  text: null
  url: null
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
  default: StickyDefault
}

interface StickyDefault {
  enabled: boolean
  allowedList: AllowedList[]
  content: FluffyContent[]
}

interface AllowedList {
  reg_ex: string
}

interface FluffyContent {
  icon_image: string
  headline_td: string
  cta_text: null | string
  regex: string
  generic_headline: null | string
  cta_text_td: string
  generic_path?: string
  vto_path: string
}

interface Timing {
  '/api/v2/meta?path=%2Faccessories%2Fgeometric-case%2Fwalnut': string
  '/api/v2/variations/footer': string
  '/api/v2/experiments': string
  '/api/v2/session': string
  '/api/v2/personalization': string
  '/api/v2/variations/smart-banner': string
  '/api/v2/variations/promo-banner': string
  '/api/v2/variations/new-nav': string
  '/api/v2/variations/content': string
  '/api/v2/experiments/bucket': string
  '/api/v2/products/accessories/geometric-case/walnut': string
  '/api/v2/variations/editions-details': string
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
  product_name: string
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
  isFirstCustomerOrder: null
}
