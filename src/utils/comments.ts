/**
 * Optional free-text explanation a user can attach to a rule's options, or to a single
 * configured entry, to explain what the rule or the exception is for. It is appended to
 * the messages the rule reports, so the reason reaches whoever reads the lint output.
 */
export const commentSchema = { type: "string" } as const;

export interface Commented {
  comment?: string;
}

/** a configured range, optionally with the reason it is configured */
export type CommentedRange = string | (Commented & { range: string });

export const resolveCommentedRange = (
  value: CommentedRange,
): Commented & { range: string } =>
  typeof value === "string" ? { range: value } : value;

/**
 * Removes "comment" from a configured entry whose other keys are iterated as dependency
 * types or dependency names, where it would otherwise be read as one of them.
 */
export const omitComment = <T extends Commented>({
  comment,
  ...entry
}: T): Omit<T, "comment"> => entry;
