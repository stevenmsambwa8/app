// Runs before paint to set the theme attribute from localStorage,
// so there's no flash of the wrong theme on load. Defaults to light.
export default function ThemeScript() {
  const code = `
    (function() {
      try {
        var saved = localStorage.getItem('advat-theme');
        if (saved === 'dark') {
          document.documentElement.setAttribute('data-theme', 'dark');
        }
      } catch (e) {}
    })();
  `;
  return <script dangerouslySetInnerHTML={{ __html: code }} />;
}
