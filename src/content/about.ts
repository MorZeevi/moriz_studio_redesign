export type AboutSegment = {
  text: string;
  /** One of the owner's bold phrases. */
  strong?: boolean;
};

/** A trust fact under the bio: a short value with its label. */
export type AboutCredential = {
  value: string;
  label: string;
  /** Muted supporting line under the label. */
  detail?: string;
};
