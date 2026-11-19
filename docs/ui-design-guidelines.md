# BorrowHer UI guidelines

Keep the campus photographs, cream/blush identity and straightforward student-facing language. Apply these preferences where they improve a screen; avoid introducing components solely to demonstrate an effect.

- Use the semantic OKLCH palette in `frontend/src/theme.css` for both themes. Use alpha-based border tokens so edges blend with their surface. Add `in oklch` to colour gradients.
- Inset elements that follow a container’s edge should use its outer radius minus its padding. Booking cards and segmented controls share radius/padding variables for this purpose. Independent icons and buttons can retain their own shapes.
- Use lighter surfaces for depth in dark mode: canvas, card surface, then raised dialog/selected surface. Check text contrast in both themes.
- Match Lucide stroke weight to adjacent text. The shared rules distinguish headings, normal labels and heavier actions.
- Use `IconSwap` when alternating icons. Keep both icons mounted, fading and blurring the outgoing one. Respect reduced-motion preferences.
- Use `100dvh` for full-height sections and dynamic viewport limits for dialogs.
- Apply `mix-blend-mode: multiply` only to white-background product shots on an isolated, suitably light photo stage. Do not apply it to campus or lifestyle photographs.
- If a carousel is introduced, consider a subtle linear-gradient mask at its edges. Keep navigation and important content outside the fade. The current workflow pages do not contain a carousel.

`ThemeProvider` supplies the shared light/dark state, and `ThemeToggle` is present in the app and authentication headers. The small public `theme-init.js` applies the saved preference before first paint. Without a saved choice, the app follows the system preference; explicit choices persist locally and synchronize between open tabs. Storage failures do not disable the switch. The standalone photo credits page follows the same preference.

After changing shared tokens, review a dashboard, a product detail, a form/dialog and a narrow phone layout in both themes. Keep focus indicators, native input colours and status badges readable.
