export function requireElement<T extends Element>(
  selector: string,
  root: ParentNode = document,
): T {
  const el = root.querySelector<T>(selector);
  if (!el) {
    throw new Error(`Missing required element: ${selector}`);
  }
  return el;
}
