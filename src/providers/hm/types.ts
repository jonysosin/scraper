export type TProductHM = {
  alternate: string
  articleCode: string
  baseProductCode: string
  categoryParentKey: string
  productKey: string
  collection: string
  designerCollection: string
  productType: string
  ageGender: string
  presentationTypes: string
  materialDetails: {
    name: string
    description: string
  }[]
} & {
  [productId: string]: {
    name: string
    inStore: boolean
    energyClass: string
    energyClassInterval: string
    energyClassCode: string
    energyClassIntervalCode: string
    colorCode: string
    totalStyleWithArticles: string
    styleWithDefaultArticles: string
    productsWithStyleWith: string
    selection: boolean
    description: string
    images: {
      thumbnail: string
      image: string
      fullscreen: string
      zoom: string
    }[]
    video: any
    sizes: {
      sizeCode: string
      size: string
      name: string
      sizeScaleCode: string
    }[]
    whitePrice: string
    whitePriceValue: string
    redPrice: string
    redPriceValue: string
    promoMarkerIcon: string
    priceClub: null
    concept: string[]
    scenario_1: boolean
    compositions: string[]
    composition: {
      compositionType: string
      materials: {
        name: string
        amount: string
      }[]
    }[]
    careInstructions: string[]
    detailedDescriptions: string[]
    url: string
    productTransparencyEnabled: boolean
    comingSoon: boolean
    suppliersDetailEnabled: boolean
    suppliersSectionDisabledReason: string
    productAttributes: {
      details: string[]
      main: string[]
      values: {
        sleeveLength: string[]
        collarStyle: string[]
        neckLineStyle: string[]
        composition: string[]
        careInstructions: string[]
        detailedDescriptions: string[]
        imported: string
        concepts: string[]
        priceDetails: string
        countryOfProductionMessage: boolean
        countryOfProduction: string
        productTypeName: string
        sizes: {
          XXS: string[]
          XS: string[]
          S: string[]
          M: string[]
          L: string[]
        }
        netQuantity: string
        importedBy: string
        importedDate: string
        manufacturedDate: string
        manufacturedBy: string
        customerCare: string
        disclaimer: string
        articleNumber: string
      }
    }
  }
}
