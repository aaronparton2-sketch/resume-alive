type Img = { buffer: Buffer; contentType: string };
export const ALIASES: Record<string, string>;
export function normalise(name: string): string;
export function fileKey(name: string): string;
export function findIcon(name: string): Promise<{ light: Img; dark: Img | null; invertInDark: boolean; source: string } | null>;
export function extOf(contentType: string): string;
