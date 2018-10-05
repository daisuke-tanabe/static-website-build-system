const glob = require('glob');
const path = require('path');
const ExtractTextWebpackPlugin = require('extract-text-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const ImageminPlugin = require('imagemin-webpack-plugin').default;
const autoprefixer = require('autoprefixer');
const postcssImport = require('postcss-import');
const stylelint = require('stylelint');

// ディレクトリ変数
const srcDir = path.join(__dirname, 'src');
const buildDir = path.join(__dirname, 'build');
const assetsDir = path.join(__dirname, 'src/assets');

// 開発モード
const devMode = process.env.NODE_ENV === 'development';

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
            pretty: true,
            // pugのルートパスを「src」に指定して、pugからは「/assets」でincludeできるようにした
            basedir: srcDir
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
              plugins: [
                autoprefixer(),
                postcssImport(),
                stylelint()
              ]
            }
          },
          {
            loader: 'resolve-url-loader'
          },
          {
            loader: 'sass-loader'
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
            // 10kバイトを超えたらfile-loaderを使用する
            limit: 10240,
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
    contentBase: 'www',
  },

  devtool: devMode ? 'source-map' : false,

  entry: entryConfigure,

  module: moduleConfigure,

  resolve: {
    // 波ダッシュとエイリアス名で設定できるようになる
    // url(~assets/hoge/fuga/xxx.jpb)
    alias: {
      assets: assetsDir,
    },
    extensions: ['.js', '.jsx', '.json']
  },

  plugins: [
    // pugファイルをエントリーする（./src/pages配下のみ）
    ...glob.sync('./src/pages/**/*.pug').map(path => {
      return new HtmlWebpackPlugin({
        filename: path.replace(/^\.\/src\/pages\//, '').replace(/\.pug$/, '.html'),
        template: path.replace(/^\.\/src\//, ''),
        inject: false
      });
    }),

    new ExtractTextWebpackPlugin('[name]'),

    // staticディレクトリをコピーする
    new CopyWebpackPlugin([
      {
        from: 'static',
        to: 'static',
        ignore: devMode ? [] : ['*.map']
      }
    ]),

    // 画像の最適化を行う
    new ImageminPlugin({
      disable: devMode,
      pngquant: {
        quality: 80,
        strip: true
      }
    })
  ]
};
