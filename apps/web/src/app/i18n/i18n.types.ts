export interface TranslatableMessage {
  readonly key: string;
  readonly params?: Readonly<Record<string, string | number>>;
}
