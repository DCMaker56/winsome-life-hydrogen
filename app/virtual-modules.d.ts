/** Photo URL → srcset of its smaller copies (vite/responsive-images.ts). */
declare module 'virtual:responsive-images' {
  const srcSets: Record<string, string>;
  export default srcSets;
}
