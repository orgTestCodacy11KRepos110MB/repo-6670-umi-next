import esbuild from '@umijs/bundler-utils/compiled/esbuild';
import { loaders } from '@umijs/bundler-utils/dist/esbuild';
import { EnableBy } from '@umijs/core/dist/types';
import { existsSync } from 'fs';
import { resolve } from 'path';
import type { IApi } from '../../types';
import assetsLoader from './assets-loader';
import cssLoader from './css-loader';
import { lessLoader } from './esbuild-less-plugin';
import svgLoader from './svg-loader';
import {
  absServerBuildPath,
  esbuildIgnorePathPrefixPlugin,
  esbuildUmiPlugin,
  readAssetsManifestFromCache,
  readCssManifestFromCache,
  saveAssetsManifestToCache,
  saveCssManifestToCache,
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

  let isFirstDevCompileDone = true;
  api.onDevCompileDone(async ({ cssManifest, assetsManifest }) => {
    if (isFirstDevCompileDone) {
      isFirstDevCompileDone = false;
      await readCssManifestFromCache(api, cssManifest);
      await readAssetsManifestFromCache(api, assetsManifest);
      await esbuild.build({
        format: 'cjs',
        platform: 'node',
        target: 'esnext',
        bundle: true,
        watch: {
          onRebuild() {
            saveCssManifestToCache(api, cssManifest);
            saveAssetsManifestToCache(api, assetsManifest);
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
          lessLoader(api, cssManifest),
          cssLoader(api, cssManifest),
          svgLoader(assetsManifest),
          assetsLoader(assetsManifest),
        ],
        outfile: absServerBuildPath(api),
      });
    }
  });

  // 在 webpack 完成打包以后，使用 esbuild 编译 umi.server.js
  api.onBuildComplete(async ({ err, cssManifest, assetsManifest }) => {
    if (err) return;

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
        lessLoader(api, cssManifest),
        cssLoader(api, cssManifest),
        svgLoader(assetsManifest),
        assetsLoader(assetsManifest),
      ],
      outfile: absServerBuildPath(api),
    });
  });
};
