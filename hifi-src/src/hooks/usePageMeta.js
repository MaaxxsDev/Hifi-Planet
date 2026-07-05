import { useEffect } from 'react';

function setMetaTag(name, content, attr = 'name') {
  if (!content) return;
  let tag = document.head.querySelector(`meta[${attr}="${name}"]`);
  if (!tag) {
    tag = document.createElement('meta');
    tag.setAttribute(attr, name);
    document.head.appendChild(tag);
  }
  tag.setAttribute('content', content);
}

function setCanonical(path) {
  let link = document.head.querySelector('link[rel="canonical"]');
  if (!link) {
    link = document.createElement('link');
    link.setAttribute('rel', 'canonical');
    document.head.appendChild(link);
  }
  link.setAttribute('href', `https://hifi-planet.de${path}`);
}

export default function usePageMeta({ title, description, path }) {
  useEffect(() => {
    if (title) {
      document.title = `${title} | HifiPlanet`;
      setMetaTag('og:title', `${title} | HifiPlanet`, 'property');
    }
    if (description) {
      setMetaTag('description', description);
      setMetaTag('og:description', description, 'property');
    }
    if (path) {
      setCanonical(path);
    }
  }, [title, description, path]);
}
