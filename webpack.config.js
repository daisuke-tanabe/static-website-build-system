const glob = require('glob');
const path = require('path');
const ExtractTextWebpackPlugin = require('extract-text-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const ImageminPlugin = require('imagemin-webpack-plugin').default;
const autoprefixer = require('autoprefixer');
const postcssImport = require('postcss-import');
const stylelint = require('stylelint');
const LiveReloadPlugin = require('webpack-livereload-plugin');

// 開発モード
const isDev = process.env.NODE_ENV === 'development';

// ディレクトリ変数
const srcDir = path.join(__dirname, 'src');
const buildDir = path.join(__dirname, 'build');
const assetsDir = path.join(__dirname, 'src/assets');

// Scssエントリー
const entryScss = glob.sync('./src/assets/scss/**/*.scss', {
  ignore: './src/assets/scss/_**/*'
}).reduce((previous, current) => {
  const key = current.replace(/scss/g, 'css');
  const keyReplace = key.replace(/^\.\/src\//, '');
  previous[keyReplace] = current.replace(/\/src/, '');
  return previous;
}, {});

// Jsエントリー
const entryJs = glob.sync('./src/assets/**/*.js', {
  ignore: './src/assets/js/common/*'
}).reduce((previous, current) => {
  const keyReplace = current.replace(/^\.\/src\//, '');
  previous[keyReplace] = [current.replace(/\/src/, '')];
  return previous;
}, {});

const entryConfigure = Object.assign({}, entryScss, entryJs);

const moduleConfigure = {
  rules: [
    {
      test: /\.pug$/i,
      use: [
        {
          loader: 'html-loader',
          options: {
            attrs: ['img:src', 'source:srcset']
          }
        },
        {
          loader: 'pug-html-loader',
          options: {
            // 最小化せずにインデントと改行をいれるが廃止予定になっている
            pretty: true,
            // 「assets/pug」をルートにする
            basedir: path.resolve(srcDir, 'assets/pug'),
            data: { isDev }
          }
        }
      ]
    },
    {
      test: /\.scss$/i,
      use: ExtractTextWebpackPlugin.extract({
        fallback: 'style-loader',
        use: [
          {
            loader: 'css-loader'
          },
          {
            loader: 'postcss-loader',
            options: {
              ident: 'postcss',
              plugins: [autoprefixer(), postcssImport(), stylelint()]
            }
          },
          {
            loader: 'resolve-url-loader'
          },
          {
            loader: 'sass-loader',
            options: {
              sourceMap: true,
              sourceMapContents: false
            }
          }
        ]
      })
    },
    {
      test: /\.js$/i,
      exclude: /node_modules/,
      use: ['babel-loader', 'eslint-loader']
    },
    {
      test: /\.(jpe?g|png|gif|svg)$/i,
      use: [
        {
          loader: 'url-loader',
          options: {
            // 20kバイトを超えたらfile-loaderを使用する
            limit: 20480,
            fallback: 'file-loader',

            // 以下はフォールバックのオプションです
            name: '[path][name].[ext]',
            publicPath: path => `/${path}`
          }
        }
      ]
    }
  ]
};

module.exports = {
  mode: process.env.NODE_ENV,

  context: srcDir,

  output: {
    path: buildDir,
    filename: '[name]'
  },

  devServer: {
    // サーバーの起点になるディレクトリを指定する(falseで無効化)
    contentBase: false,
    // バンドルされたファイルをどのディレクトリで利用するか決定する
    publicPath: '/'
  },

  devtool: isDev ? 'source-map' : false,

  entry: entryConfigure,

  module: moduleConfigure,

  resolve: {
    // 波ダッシュとエイリアス名で設定できるようになる
    // url(~assets/hoge/fuga/xxx.jpb)
    alias: {
      assets: assetsDir
    },
    extensions: ['.js', '.jsx', '.json']
  },

  plugins: [
    new LiveReloadPlugin(),

    // pugファイルをエントリーする（./src/pages配下のみ）
    ...glob.sync('./src/pages/**/*.pug').map(filePath => {
      return new HtmlWebpackPlugin({
        filename: filePath
          .replace(/^\.\/src\/pages\//, '')
          .replace(/\.pug$/, '.html'),
        template: filePath.replace(/^\.\/src\//, ''),
        inject: false
      });
    }),

    new ExtractTextWebpackPlugin('[name]'),

    // staticディレクトリをコピーする
    new CopyWebpackPlugin([
      {
        from: 'static',
        to: 'static',
        ignore: isDev ? [] : ['*.map']
      }
    ]),

    // 画像の最適化を行う
    new ImageminPlugin({
      disable: isDev,
      pngquant: {
        quality: 80,
        strip: true
      }
    })
  ]
};
