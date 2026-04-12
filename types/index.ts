export type AssetType = 'sticker' | 'gif'
export type CategoryType = 'sticker' | 'gif' | 'both'

export interface Category {
  id: string
  name: string
  slug: string
  type: CategoryType
  created_at: string
}

export interface Pack {
  id: string
  title: string
  slug: string
  description: string | null
  type: AssetType
  cover_image_url: string | null
  zip_file_url: string | null
  category_id: string | null
  featured: boolean
  is_published: boolean
  created_at: string
  updated_at: string
  category?: Category
  items?: PackItem[]
  item_count?: number
}

export interface Asset {
  id: string
  title: string
  slug: string
  description: string | null
  type: AssetType
  file_url: string
  thumbnail_url: string | null
  preview_url: string | null
  external_url: string | null
  category_id: string | null
  featured: boolean
  is_published: boolean
  created_at: string
  updated_at: string
  category?: Category
  tags?: AssetTag[]
  download_count?: number
}

export interface AssetTag {
  id: string
  asset_id: string
  tag: string
}

export interface PackItem {
  id: string
  pack_id: string
  asset_id: string
  sort_order: number
  asset?: Asset
}

export interface Download {
  id: string
  asset_id: string | null
  pack_id: string | null
  downloaded_at: string
  type: 'asset' | 'pack'
}

export interface Admin {
  id: string
  email: string
  role: string
  created_at: string
}

// API response shapes
export interface PackWithItems extends Pack {
  items: (PackItem & { asset: Asset })[]
}

export interface SearchFilters {
  query?: string
  type?: AssetType | 'all'
  category?: string
  featured?: boolean
}
