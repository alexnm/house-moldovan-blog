const { DateTime } = require('luxon')
const path = require('path')
const fs = require('fs')
const pluginRss = require('@11ty/eleventy-plugin-rss')
const pluginNavigation = require('@11ty/eleventy-navigation')
const markdownIt = require('markdown-it')
const markdownItAnchor = require('markdown-it-anchor')
const markdownItLinkAttributes = require('markdown-it-link-attributes')
const pluginReadingTime = require('eleventy-plugin-reading-time')
const pluginSVG = require('eleventy-plugin-svg-contents')
const pluginTOC = require('eleventy-plugin-toc')
const pluginLazyImages = require('eleventy-plugin-lazyimages')
const postcss = require('postcss')
const autoprefixer = require('autoprefixer')
const cssnano = require('cssnano')

module.exports = function(eleventyConfig) {
  eleventyConfig.addPlugin(pluginRss)
  eleventyConfig.addPlugin(pluginNavigation)
  eleventyConfig.addPlugin(pluginReadingTime)
  eleventyConfig.addPlugin(pluginSVG)
  eleventyConfig.addPlugin(pluginTOC)
  eleventyConfig.addPlugin(pluginLazyImages)

  eleventyConfig.addFilter('readableDate', dateObj => {
    return DateTime.fromJSDate(dateObj, { zone: 'utc' }).toFormat('dd LLL yyyy')
  })

  // https://html.spec.whatwg.org/multipage/common-microsyntaxes.html#valid-date-string
  eleventyConfig.addFilter('htmlDateString', dateObj => {
    return DateTime.fromJSDate(dateObj, { zone: 'utc' }).toFormat('yyyy-LL-dd')
  })

  // Get the first `n` elements of a collection.
  eleventyConfig.addFilter('head', (array, n) => {
    if (n < 0) {
      return array.slice(n)
    }

    return array.slice(0, n)
  })

  eleventyConfig.addPairedAsyncShortcode('postcss', async code => {
    const filepath = path.join(__dirname, 'src/_includes/css/index.css')
    return await postcss([autoprefixer, cssnano])
      .process(code, { from: filepath })
      .then(result => result.css)
  })

  eleventyConfig.addCollection('tagList', require('./src/_11ty/getTagList'))

  eleventyConfig.addPassthroughCopy('img')

  eleventyConfig.addWatchTarget('src/css')

  /* Markdown Overrides */
  let markdownLibrary = markdownIt({
    html: true,
    breaks: true,
    linkify: true
  })
    .use(markdownItAnchor, {
      // permalink: true,
      permalinkClass: 'direct-link',
      permalinkBefore: true,
      permalinkSymbol: '🔗'
    })
    .use(markdownItLinkAttributes, {
      attrs: {
        target: '_blank',
        rel: 'noopener noreferrer'
      }
    })
  eleventyConfig.setLibrary('md', markdownLibrary)
  eleventyConfig.setDataDeepMerge(true)

  // Browsersync Overrides
  eleventyConfig.setBrowserSyncConfig({
    callbacks: {
      ready: function(err, browserSync) {
        const content_404 = fs.readFileSync('dist/404.html')

        browserSync.addMiddleware('*', (req, res) => {
          // Provides the 404 content without redirect.
          res.write(content_404)
          res.end()
        })
      }
    },
    ui: false,
    ghostMode: false
  })

  return {
    templateFormats: ['md', 'njk', 'html', 'liquid', 'css'],

    // If your site lives in a different subdirectory, change this.
    // Leading or trailing slashes are all normalized away, so don’t worry about those.

    // If you don’t have a subdirectory, use "" or "/" (they do the same thing)
    // This is only used for link URLs (it does not affect your file structure)
    // Best paired with the `url` filter: https://www.11ty.io/docs/filters/url/

    // You can also pass this in on the command line using `--pathprefix`
    // pathPrefix: "/",

    markdownTemplateEngine: 'liquid',
    htmlTemplateEngine: 'njk',
    dataTemplateEngine: 'njk',

    // These are all optional, defaults are shown:
    dir: {
      input: 'src',
      includes: '_includes',
      data: '_data',
      output: 'dist'
    }
  }
}
