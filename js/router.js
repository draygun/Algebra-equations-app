// router.js — простой SPA-роутер на основе hash

class Router {
  constructor() {
    this.routes = [];
    window.addEventListener('hashchange', () => this.resolve());
  }

  add(pattern, handler) {
    this.routes.push({ pattern, handler });
  }

  navigate(path) {
    window.location.hash = path;
  }

  resolve() {
    const hash = window.location.hash.slice(1) || '/home';
    const app = document.getElementById('app');
    app.innerHTML = '';

    for (const { pattern, handler } of this.routes) {
      const paramNames = [];
      const regexStr = pattern.replace(/:(\w+)/g, (_, name) => {
        paramNames.push(name);
        return '([^/]+)';
      });
      const regex = new RegExp('^' + regexStr + '$');
      const match = hash.match(regex);
      if (match) {
        const params = {};
        paramNames.forEach((name, i) => { params[name] = match[i + 1]; });
        handler(app, params, hash);
        this.updateNav(hash);
        return;
      }
    }

    app.innerHTML = '<h2>Страница не найдена</h2>';
  }

  updateNav(hash) {
    document.querySelectorAll('.nav-link').forEach(link => {
      const href = link.getAttribute('href');
      link.classList.toggle('active', hash.startsWith(href));
    });
  }
}

const router = new Router();
