export type ProductionDocStatus = "draft" | "in_progress" | "completed";

export interface ProductionDocImageGroup {
  heading: string;
  headingColor: "red" | "black";
  imageUrls: string[];
  orderIndex?: number;
}

export interface ProductionDocSection {
  id?: string;
  sectionCode?: string;
  title: string;
  content: string | null;
  imageUrls?: string[];
  imageGroups?: ProductionDocImageGroup[];
  orderIndex?: number;
  isFixed?: boolean;
}

export interface ProductionDocSizeRow {
  id?: string;
  sizeLabel: string;
  measurementName: string;
  measurementValue: string | null;
  tolerance: string | null;
  imageUrl?: string | null;
  orderIndex?: number;
}

export interface ProductionDocAttachment {
  documentId: string;
  documentCode: string | null;
  title: string;
  purpose: string;
  linkedAt: string;
}

export interface StyleProductionDocDetail {
  id: string;
  styleId: string | null;
  name: string;
  description: string | null;
  status: ProductionDocStatus;
  section1Description: string | null;
  section1ImageUrl: string | null;
  section2Accessories: string | null;
  section3Notes: string | null;
  section4CustomerFeedback: string | null;
  sizeData: unknown;
  copiedFromStyleId: string | null;
  copiedAt: string | null;
  createdAt: string;
  updatedAt: string;
  sections: ProductionDocSection[];
  sizeRows: ProductionDocSizeRow[];
  attachments: ProductionDocAttachment[];
}

export interface CreateStyleProductionDocInput {
  name: string;
  description?: string | null;
  status?: ProductionDocStatus;
  section1Description?: string | null;
  section1ImageUrl?: string | null;
  section2Accessories?: string | null;
  section3Notes?: string | null;
  section4CustomerFeedback?: string | null;
  sizeData?: unknown;
  sections?: ProductionDocSection[];
  sizeRows?: ProductionDocSizeRow[];
  attachmentIds?: string[];
}

export interface UpdateStyleProductionDocInput {
  name?: string;
  description?: string | null;
  status?: ProductionDocStatus;
  section1Description?: string | null;
  section1ImageUrl?: string | null;
  section2Accessories?: string | null;
  section3Notes?: string | null;
  section4CustomerFeedback?: string | null;
  sizeData?: unknown;
  sections?: ProductionDocSection[];
  sizeRows?: ProductionDocSizeRow[];
}

export type CopyMode = "FULL" | "EXCLUDE";

export interface CopyProductionDocInput {
  targetStyleId: string;
  mode: CopyMode;
  excludeSections?: string[];
  confirmOverwrite?: boolean;
}

export interface ResyncProductionDocInput {
  sections?: ("section1" | "section2")[];
  confirmOverwrite?: boolean;
}
