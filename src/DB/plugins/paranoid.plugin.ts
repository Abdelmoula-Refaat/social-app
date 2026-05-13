import { Schema, Query } from "mongoose";

/**
 * Soft-delete: default queries exclude documents where `deletedAt` is set.
 * Pass `{ paranoid: false }` in query options to include deleted rows.
 * Legacy: `{ paranoid: false }` inside the filter object is stripped and disables the guard.
 */
export function applyParanoidPlugin(schema: Schema): void {
  const withParanoid = function (this: Query<unknown, unknown>) {
    const opts = (this as Query<unknown, unknown> & { options?: { paranoid?: boolean } }).options;
    if (opts?.paranoid === false) {
      return;
    }

    const filter = this.getFilter() as Record<string, unknown> & { paranoid?: boolean };
    if (filter?.paranoid === false) {
      const { paranoid: _p, ...rest } = filter;
      this.setQuery(rest);
      return;
    }

    if (filter && Object.prototype.hasOwnProperty.call(filter, "deletedAt")) {
      return;
    }

    this.where({ deletedAt: { $exists: false } });
  };

  const hooks = [
    "find",
    "findOne",
    "findOneAndUpdate",
    "findOneAndDelete",
    "countDocuments",
    "estimatedDocumentCount",
  ] as const;

  for (const h of hooks) {
    schema.pre(h, withParanoid);
  }
}
