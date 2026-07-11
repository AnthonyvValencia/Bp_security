module.exports = function (api) {
  api.cache(true);

  return {
    presets: ['babel-preset-expo'],
    // laravel-echo usa "static class blocks" (sintaxis reciente de JS) que el
    // preset de Expo no transforma por defecto.
    plugins: ['@babel/plugin-transform-class-static-block'],
  };
};
