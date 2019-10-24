/**
 * Reverse a string
 */
export function reverseString(input: string = 'Hello World!'): string {
  return input
    .split('')
    .reverse()
    .join('');
}
