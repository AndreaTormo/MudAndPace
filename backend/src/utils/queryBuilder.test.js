const { escapeRegex, prefixRegexOr, regexOr } = require('./queryBuilder');

describe('queryBuilder', () => {
  test('prefixRegexOr ancla el prefijo solo en los campos indicados', () => {
    const clause = prefixRegexOr(['name', 'slug'], 't');

    expect(clause.$or).toHaveLength(2);
    expect(clause.$or[0].name).toBeInstanceOf(RegExp);
    expect(clause.$or[0].name.source).toBe('^t');
    expect(clause.$or[0].name.flags).toBe('i');
    expect(clause.$or[1].slug.source).toBe('^t');
    expect('Trail Cadí-Moixeró 2027').toMatch(clause.$or[0].name);
    expect('Ultra Trail Vall de Boí 2027').not.toMatch(clause.$or[0].name);
  });

  test('prefixRegexOr escapa metacaracteres', () => {
    const clause = prefixRegexOr(['name'], '.*');

    expect(clause.$or[0].name.source).toBe('^\\.\\*');
    expect('cualquier texto').not.toMatch(clause.$or[0].name);
    expect('.* prueba').toMatch(clause.$or[0].name);
  });

  test('regexOr mantiene la búsqueda substring para otros módulos', () => {
    const clause = regexOr(['city'], 'mont');

    expect(clause.$or[0].city.source).toBe('mont');
    expect('Mont Blanc').toMatch(clause.$or[0].city);
    expect(escapeRegex('a+b')).toBe('a\\+b');
  });
});
