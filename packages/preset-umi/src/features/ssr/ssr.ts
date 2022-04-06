import esbuild from '@umijs/bundler-utils/compiled/esbuild';
import { loaders } from '@umijs/bundler-utils/dist/esbuild';
import { DEFAULT_OUTPUT_PATH } from '@umijs/bundler-webpack/dist/constants';
import { EnableBy } from '@umijs/core/dist/types';
import { appendFileSync, existsSync, readFileSync } from 'fs';
import { join, resolve } from 'path';
import type { IApi } from '../../types';
import assetsLoader from './assets-loader';
import cssLoader from './css-loader';
import { lessLoader } from './esbuild-less-plugin';
import svgLoader from './svg-loader';
import {
  absServerBuildPath,
  esbuildIgnorePathPrefixPlugin,
  esbuildUmiPlugin,
} from './utils';

export default (api: IApi) => {
  api.describe({
    key: 'ssr',
    config: {
      schema(Joi) {
        return Joi.object({
          serverBuildPath: Joi.string(),
        });
      },
    },
    enableBy: EnableBy.config,
  });

  api.addBeforeMiddlewares(() => [
    async (req, res, next) => {
      const modulePath = absServerBuildPath(api);
      if (existsSync(modulePath)) {
        (await require(modulePath)).default(req, res, next);
      } else {
        res.end('umi.server.js is compiling ...');
      }
    },
  ]);

  let isCssInjected = false;
  api.onDevCompileDone(async () => {
    await esbuild.build({
      format: 'cjs',
      platform: 'node',
      target: 'esnext',
      bundle: true,
      watch: {
        onRebuild() {
          delete require.cache[absServerBuildPath(api)];
        },
      },
      logLevel: 'silent',
      loader: loaders,
      external: ['umi'],
      entryPoints: [resolve(api.paths.absTmpPath, 'server.ts')],
      plugins: [
        esbuildIgnorePathPrefixPlugin(),
        esbuildUmiPlugin(api),
        lessLoader(),
        svgLoader({}),
        assetsLoader({}),
        {
          name: 'css',
          setup(build) {
            build.onEnd((result) => {
              if (result.errors.length === 0) {
                const css = readFileSync(
                  absServerBuildPath(api).replace(/\.js$/, '.css'),
                );
                isCssInjected = true;
                appendFileSync(
                  absServerBuildPath(api),
                  `
${isCssInjected ? '' : 'let'} SERVER_SIDE_STYLES = \`${css.toString()}\`;
`,
                );
              }
            });
          },
        },
      ],
      outfile: absServerBuildPath(api),
    });
  });

  // 在 webpack 完成打包以后，使用 esbuild 编译 umi.server.js
  api.onBuildComplete(async ({ err }) => {
    if (err) return;

    // the assets manifest generated by webpack
    const manifest = JSON.parse(
      readFileSync(
        join(
          api.cwd,
          api.userConfig.outputPath || DEFAULT_OUTPUT_PATH,
          'asset-manifest.json',
        ),
      ).toString(),
    );

    await esbuild.build({
      format: 'cjs',
      platform: 'node',
      target: 'esnext',
      bundle: true,
      logLevel: 'silent',
      loader: loaders,
      external: ['umi'],
      entryPoints: [resolve(api.paths.absTmpPath, 'server.ts')],
      plugins: [
        esbuildIgnorePathPrefixPlugin(),
        esbuildUmiPlugin(api),
        lessLoader(),
        svgLoader(manifest),
        assetsLoader(manifest),
        cssLoader(api),
      ],
      outfile: absServerBuildPath(api),
    });
  });
};
