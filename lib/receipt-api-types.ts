export type ReceiptItemExtracted = {
  id?: string;
  raw_text: string;
  item_name: string;
  catalog_item_id: string | null;
  category: string;
  quantity: number;
  unit: string;
  confidence: number;
};

export type ScanReceiptResponse = {
  scan_id: string;
  image_url: string;
  items: ReceiptItemExtracted[];
};

export type ConfirmReceiptItemInput = {
  item_name: string;
  catalog_item_id?: string;
  category?: string;
  quantity: number;
  unit: string;
};

export type ConfirmReceiptRequest = {
  scan_id: string;
  confirmed_items: ConfirmReceiptItemInput[];
};

export type ConfirmReceiptResponse = {
  success: boolean;
  added_items_count: number;
};
