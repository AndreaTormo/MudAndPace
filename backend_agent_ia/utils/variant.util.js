function slugify(value) {
  if (typeof value !== 'string') return '';
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function resolveVariantName(departure, event) {
  if (!departure || !event) {
    return null;
  }

  const variants = Array.isArray(event.variants) ? event.variants : [];
  const prefix = `${event.slug}-`;
  const slug = typeof departure.slug === 'string' ? departure.slug : '';

  if (slug.startsWith(prefix)) {
    const suffix = slug.slice(prefix.length);
    const sorted = [...variants].sort(
      (left, right) => String(right.name).length - String(left.name).length
    );
    const variant = sorted.find((item) => {
      const variantSlug = slugify(item.name);
      return variantSlug && suffix.startsWith(`${variantSlug}-`);
    });

    if (variant) {
      return variant.name;
    }
  }

  const priced = variants.filter((variant) => Number(variant.price) === Number(departure.price));
  return priced.length === 1 ? priced[0].name : null;
}

module.exports = { slugify, resolveVariantName };
