// router.js — простой SPA-роутер на основе hash

class Router {
  constructor() {
    this.routes = {};
    window.addEventListener('hashchange', () => this.resolve());
  }

  add(path, handler) {
    this.routes[path] = handler;
  }

  navigate(path) {
    window.location.hash = path;
  }

  resolve() {
    const hash = window.location.hash.slice(1) || '/home';
    const app = document.getElementById('app');
    app.innerHTML = '';

    const keys = Object.keys(this.routes);
    for (const pattern of keys) {
      const regex = new RegExp('^' + pattern.replace(/:id/g, '([^/]+)') + '$');
      const match = hash.match(regex);
      if (match) {
        const params = { id: match[1] };
        this.routes[pattern](app, params, hash);
        this.updateNav(hash);
        return;
      }
    }

    // 404
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
