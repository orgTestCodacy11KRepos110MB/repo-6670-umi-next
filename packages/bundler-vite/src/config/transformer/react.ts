import reactPlugin from '@umijs/bundler-vite/compiled/@vitejs/plugin-react';
import type { IConfigProcessor } from '.';

/**
 * enable react plugin & transform umi babel to vite babel
 */
export default (function react(userConfig) {
  const config: ReturnType<IConfigProcessor> = { plugins: [] };

  config.plugins?.push(
    reactPlugin({
      // jsxRuntime: 'automatic',
      include: userConfig.extraBabelIncludes,
      babel: {
        plugins: userConfig.extraBabelPlugins,
        presets: userConfig.extraBabelPresets,
      },
    }),
  );

  return config;
} as IConfigProcessor);
