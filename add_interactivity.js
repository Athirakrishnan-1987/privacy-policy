const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'coderabbit', 'index.html');
let html = fs.readFileSync(filePath, 'utf-8');

const interactiveScript = `
<script>
document.addEventListener('DOMContentLoaded', () => {
  // Hero Tabs interactivity
  const featureButtons = document.querySelectorAll('button[data-feature]');
  
  featureButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      featureButtons.forEach(b => {
        b.setAttribute('data-active', 'false');
        b.setAttribute('aria-pressed', 'false');
        const fill = b.querySelector('.HeroFeatureCards-module__QnOXea__cardProgressFill');
        if (fill) fill.setAttribute('data-paused', 'true');
      });
      btn.setAttribute('data-active', 'true');
      btn.setAttribute('aria-pressed', 'true');
      const activeFill = btn.querySelector('.HeroFeatureCards-module__QnOXea__cardProgressFill');
      if (activeFill) activeFill.removeAttribute('data-paused');
    });
  });

  // Mobile menu / header dropdown toggles
  const triggers = document.querySelectorAll('.site-header-nav-trigger');
  triggers.forEach(trigger => {
    trigger.addEventListener('click', (e) => {
      e.stopPropagation();
      const isExpanded = trigger.getAttribute('aria-expanded') === 'true';
      triggers.forEach(t => t.setAttribute('aria-expanded', 'false'));
      trigger.setAttribute('aria-expanded', (!isExpanded).toString());
    });
  });

  document.addEventListener('click', () => {
    triggers.forEach(t => t.setAttribute('aria-expanded', 'false'));
  });
});
</script>
`;

if (!html.includes('data-feature')) {
  console.log('data-feature not found?');
}

// Inject before </body>
html = html.replace('</body>', `${interactiveScript}</body>`);
fs.writeFileSync(filePath, html, 'utf-8');
console.log('Injected interactive tabs script into coderabbit/index.html successfully!');
