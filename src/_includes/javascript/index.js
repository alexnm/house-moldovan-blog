const themes = {
  light: {
    accent: '#ffc946',
    accentSecondary: '#ff9f8c',
    backgroundAccent: '#ffc946',
    backgroundAccentSecondary: '#ff9f8c',
    background: '#fffffe',
    textColor: '#2a2a2a'
  },
  dark: {
    accent: '#ef9900',
    accentSecondary: '#e54670',
    backgroundAccent: '#af5900',
    backgroundAccentSecondary: '#b51640',
    background: '#0f0e17',
    textColor: '#fffffe'
  }
}

const themeKeys = Object.keys(themes)

function switchTheme() {
  let newTheme = window.currentThemeIndex || 0;

  if (newTheme === themeKeys.length - 1) {
    newTheme = 0;
  } else {
    newTheme++
  }

  applyTheme(newTheme)
}

function applyTheme(themeIndex) {
  const values = themes[themeKeys[themeIndex]];

  document.documentElement.style.setProperty('--accent', values.accent);
  document.documentElement.style.setProperty('--accent-secondary', values.accentSecondary);
  document.documentElement.style.setProperty('--background-accent', values.backgroundAccent);
  document.documentElement.style.setProperty('--background-accent-secondary', values.backgroundAccentSecondary);
  document.documentElement.style.setProperty('--background', values.background);
  document.documentElement.style.setProperty('--text-color', values.textColor);
  document.body.setAttribute('data-theme', themeKeys[themeIndex]);

  window.currentThemeIndex = themeIndex;
  localStorage.setItem('currentThemeIndex', themeIndex);
}

function handleColorSchemeChange(e) {
  if (e.matches) {
    applyTheme(1)
  } else {
    applyTheme(0)
  }
}

const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
mediaQuery.addListener(handleColorSchemeChange);

const storedThemeIndex = localStorage.getItem('currentThemeIndex')
if (storedThemeIndex) {
  applyTheme(parseInt(storedThemeIndex, 10));
} else {
  handleColorSchemeChange(mediaQuery);
}