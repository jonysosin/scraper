export type TProviderData = {
  data: {
    product_id: string
    product_title: string
    inventory_tracking: string
    variants: {
      external_id: number
      title: string
      sku: string
      inventory_quantity: number
      availability: boolean
    }[]
  }
  product: {
    id: string
    title: string
    inventory_policy: string
    variants: {
      id: number
      title: string
      available: boolean
      inventory_quantity: number
      is_allow_for_preorder: boolean
    }[]
  }
  BCData: {
    csrf_token: string
    product_attributes: {
      sku: string
      upc: string
      mpn: string
      gtin: null
      weight: null
      base: boolean
      image: null
      price: {
        without_tax: {
          formatted: string
          value: number
          currency: string
        }
        tax_label: string
      }
      out_of_stock_behavior: string
      out_of_stock_message: string
      available_modifier_values: any[]
      in_stock_attributes: any[]
      stock: null
      instock: boolean
      stock_message: null
      purchasable: boolean
      purchasing_message: null
    }
  }
}
