export function cleanDomain(input: string | null | undefined): string | null;
export function findLogo(
  domain: string,
): Promise<{ url: string; buffer: Buffer; contentType: string; source: string } | null>;
export function extFor(contentType: string): string;
