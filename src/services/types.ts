export interface ExpenseFilters<
  D extends string | Date = string,
  CD extends string | Date = string,
> {
  amount?: {
    min?: number;
    max?: number;
  };
  date?: {
    from?: D;
    to?: D;
  };
  additionalNote?: string;
  category?: number[];
  creationDate?: {
    from?: CD;
    to?: CD;
  };
}

export interface CategoryFilters {
  name?: string;
}
