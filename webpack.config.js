/**
 * Webpack Configuration for Eyes of Azrael
 *
 * FUTURE OPTIMIZATION CONFIG
 * This config is ready for when you want to build optimized bundles
 *
 * FEATURES:
 * - Automatic code splitting by route
 * - Vendor chunk separation
 * - Common chunk for shared code
 * - Content-based hashing for caching
 * - Production optimizations
 *
 * USAGE:
 * 1. Install dependencies:
 *    npm install --save-dev webpack webpack-cli webpack-dev-server
 *    npm install --save-dev html-webpack-plugin clean-webpack-plugin
 *    npm install --save-dev terser-webpack-plugin css-minimizer-webpack-plugin
 *
 * 2. Build for production:
 *    npm run build
 *
 * 3. Start dev server:
 *    npm run dev
 */

const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const TerserPlugin = require('terser-webpack-plugin');
const CssMinimizerPlugin = require('css-minimizer-webpack-plugin');

module.exports = (env, argv) => {
    const isProduction = argv.mode === 'production';

    return {
        // Entry point for the application
        entry: {
            // Main app entry
            app: './js/app-init-simple.js'
        },

        // Output configuration
        output: {
            // Output directory
            path: path.resolve(__dirname, 'dist'),

            // Main bundle naming (includes content hash for caching)
            filename: isProduction ? 'js/[name].[contenthash:8].js' : 'js/[name].js',

            // Chunk naming for code-split bundles
            chunkFilename: isProduction ? 'js/[name].[contenthash:8].chunk.js' : 'js/[name].chunk.js',

            // Public path for assets
            publicPath: '/',

            // Clean output directory before build
            clean: true
        },

        // Module resolution
        resolve: {
            extensions: ['.js', '.json'],
            alias: {
                '@': path.resolve(__dirname, 'js'),
                '@components': path.resolve(__dirname, 'js/components'),
                '@views': path.resolve(__dirname, 'js/views'),
                '@utils': path.resolve(__dirname, 'js/utils')
            }
        },

        // Module rules
        module: {
            rules: [
                // JavaScript/ES6+
                {
                    test: /\.js$/,
                    exclude: /node_modules/,
                    use: {
                        loader: 'babel-loader',
                        options: {
                            presets: [
                                ['@babel/preset-env', {
                                    targets: '> 0.25%, not dead',
                                    useBuiltIns: 'usage',
                                    corejs: 3
                                }]
                            ],
                            plugins: [
                                '@babel/plugin-syntax-dynamic-import'
                            ]
                        }
                    }
                },

                // CSS
                {
                    test: /\.css$/,
                    use: [
                        'style-loader',
                        'css-loader'
                    ]
                },

                // Images
                {
                    test: /\.(png|jpg|jpeg|gif|svg|webp)$/i,
                    type: 'asset/resource',
                    generator: {
                        filename: 'images/[name].[hash:8][ext]'
                    }
                },

                // Fonts
                {
                    test: /\.(woff|woff2|eot|ttf|otf)$/i,
                    type: 'asset/resource',
                    generator: {
                        filename: 'fonts/[name].[hash:8][ext]'
                    }
                }
            ]
        },

        // Optimization configuration
        optimization: {
            // Minimize in production
            minimize: isProduction,

            // Minimizers
            minimizer: [
                new TerserPlugin({
                    terserOptions: {
                        compress: {
                            drop_console: isProduction, // Remove console.log in production
                            drop_debugger: true,
                            pure_funcs: ['console.info', 'console.debug', 'console.warn']
                        },
                        format: {
                            comments: false
                        }
                    },
                    extractComments: false
                }),
                new CssMinimizerPlugin()
            ],

            // Code splitting configuration
            splitChunks: {
                chunks: 'all',
                maxInitialRequests: 25,
                maxAsyncRequests: 25,
                minSize: 20000,
                maxSize: 244000, // Try to keep chunks under 244KB

                cacheGroups: {
                    // Vendor chunk for node_modules
                    vendors: {
                        test: /[\\/]node_modules[\\/]/,
                        name: 'vendors',
                        priority: 10,
                        reuseExistingChunk: true
                    },

                    // Firebase chunk (separate for better caching)
                    firebase: {
                        test: /[\\/]node_modules[\\/](@firebase|firebase)[\\/]/,
                        name: 'firebase',
                        priority: 20,
                        reuseExistingChunk: true
                    },

                    // Common chunk for shared code
                    common: {
                        minChunks: 2,
                        name: 'common',
                        priority: 5,
                        reuseExistingChunk: true,
                        enforce: true
                    },

                    // View chunks (one per view)
                    homeView: {
                        test: /[\\/]js[\\/]views[\\/]home-view\.js$/,
                        name: 'view-home',
                        priority: 15
                    },

                    searchView: {
                        test: /[\\/]js[\\/]components[\\/]search-view-complete\.js$/,
                        name: 'view-search',
                        priority: 15
                    },

                    compareView: {
                        test: /[\\/]js[\\/]components[\\/]compare-view\.js$/,
                        name: 'view-compare',
                        priority: 15
                    },

                    dashboardView: {
                        test: /[\\/]js[\\/]components[\\/]user-dashboard\.js$/,
                        name: 'view-dashboard',
                        priority: 15
                    },

                    // Components chunk
                    components: {
                        test: /[\\/]js[\\/]components[\\/]/,
                        name: 'components',
                        priority: 8,
                        reuseExistingChunk: true
                    }
                }
            },

            // Runtime chunk for webpack runtime
            runtimeChunk: {
                name: 'runtime'
            },

            // Module IDs (deterministic for better caching)
            moduleIds: 'deterministic'
        },

        // Plugins
        plugins: [
            // Clean dist directory
            new CleanWebpackPlugin(),

            // Generate HTML
            new HtmlWebpackPlugin({
                template: './index.html',
                inject: 'body',
                scriptLoading: 'defer',
                minify: isProduction ? {
                    removeComments: true,
                    collapseWhitespace: true,
                    removeRedundantAttributes: true,
                    useShortDoctype: true,
                    removeEmptyAttributes: true,
                    removeStyleLinkTypeAttributes: true,
                    keepClosingSlash: true,
                    minifyJS: true,
                    minifyCSS: true,
                    minifyURLs: true
                } : false
            })
        ],

        // Dev server configuration
        devServer: {
            static: {
                directory: path.join(__dirname, 'dist')
            },
            compress: true,
            port: 8080,
            hot: true,
            open: true,
            historyApiFallback: true,
            client: {
                overlay: {
                    errors: true,
                    warnings: false
                }
            }
        },

        // Source maps
        devtool: isProduction ? 'source-map' : 'eval-source-map',

        // Performance hints
        performance: {
            hints: isProduction ? 'warning' : false,
            maxEntrypointSize: 512000, // 500KB
            maxAssetSize: 512000
        },

        // Stats output
        stats: {
            colors: true,
            modules: false,
            children: false,
            chunks: false,
            chunkModules: false
        }
    };
};
