const { DateTime } = require("luxon");
const path = require("path");
const fs = require("fs");
const pluginRss = require("@11ty/eleventy-plugin-rss");
const pluginNavigation = require("@11ty/eleventy-navigation");
const markdownIt = require("markdown-it");
const markdownItAnchor = require("markdown-it-anchor");
const markdownItLinkAttributes = require("markdown-it-link-attributes");
const pluginReadingTime = require("eleventy-plugin-reading-time");
const pluginSVG = require("eleventy-plugin-svg-contents");
const pluginTOC = require("eleventy-plugin-toc");
const pluginLazyImages = require("eleventy-plugin-lazyimages");
const pluginSvgContents = require("eleventy-plugin-svg-contents");

const postcss = require("postcss");
const autoprefixer = require("autoprefixer");
const cssnano = require("cssnano");
const { minify } = require("terser");

const romanianMarkings = require("./src/_data/romanian-markings");

module.exports = function (eleventyConfig) {
  eleventyConfig.addPlugin(pluginRss);
  eleventyConfig.addPlugin(pluginNavigation);
  eleventyConfig.addPlugin(pluginReadingTime);
  eleventyConfig.addPlugin(pluginSVG);
  eleventyConfig.addPlugin(pluginTOC);
  eleventyConfig.addPlugin(pluginLazyImages);
  eleventyConfig.addPlugin(pluginSvgContents);

  eleventyConfig.addFilter("readableDate", (dateObj) => {
    return DateTime.fromJSDate(dateObj, { zone: "utc" }).toFormat(
      "dd LLL yyyy"
    );
  });

  // https://html.spec.whatwg.org/multipage/common-microsyntaxes.html#valid-date-string
  eleventyConfig.addFilter("htmlDateString", (dateObj) => {
    return DateTime.fromJSDate(dateObj, { zone: "utc" }).toFormat("yyyy-LL-dd");
  });

  // Get the first `n` elements of a collection.
  eleventyConfig.addFilter("head", (array, n, currentUrl) => {
    let allPosts = array;
    if (currentUrl) {
      allPosts = allPosts.filter((post) => post.url !== currentUrl);
    }

    if (n < 0) {
      return allPosts.slice(n);
    }

    return allPosts.slice(0, n);
  });

  // Update dynamic function for footer year
  eleventyConfig.addShortcode("currentYear", () =>
    new Date().getFullYear().toString()
  );

  eleventyConfig.addFilter("fullImageURL", (path) => {
    if (path[0] === "/") {
      return path;
    }

    return `https://res.cloudinary.com/house-moldovan/image/upload/v1591633244/${path}`;
  });

  eleventyConfig.addShortcode("responsiveImage", (path, alt, caption) => {
    return `
<figure>
  <picture>
    <source srcset="https://res.cloudinary.com/house-moldovan/image/upload/w_600/${path}.webp"
            media="(max-width: 768px)">
    <source srcset="https://res.cloudinary.com/house-moldovan/image/upload/v1591633244/${path}.webp">
    <img src="https://res.cloudinary.com/house-moldovan/image/upload/v1591633244/${path}.jpg" alt="${alt}" />
  </picture>
  <figcaption>${caption}.</figcaption>
</figure>`;
  });

  // we can have at most 3 types of markings on the same track
  eleventyConfig.addShortcode("paths", (...paths) => {
    if (paths[0] === "nemarcat") {
      return `<span>Nemarcat</span>`;
    }

    return paths
      .map((path) => {
        if (!romanianMarkings[path]) {
          throw new Error(`Invalid path "${path}" exists`);
        }

        let relativeFilePath = romanianMarkings[path];

        let data = fs.readFileSync(relativeFilePath, function (err, contents) {
          if (err) return err;
          return contents;
        });

        const svg = data.toString("utf8");
        return svg;
      })
      .join("");
  });

  eleventyConfig.addPairedShortcode(
    "trackDetails",
    (paths, length, levelDifference, time) => {
      return `
<div class="track-details">
    <div>
      <span>Lungime</span>
      <span>${length}</span>
    </div>
    <div>
      <span>Diferență de nivel</span>
      <span>${levelDifference}</span>
    </div>
    <div>
      <span>Timp</span>
      <span>${time}</span>
    </div>
    <div>
      <span>Marcaj</span>
      <span class="paths-icons">${paths}</span>
    </div>
</div>`;
    }
  );

  // Add postcss block declaration
  eleventyConfig.addPairedAsyncShortcode("postcss", async (code) => {
    const filepath = path.join(__dirname, "src/_includes/css/index.css");
    return await postcss([autoprefixer, cssnano])
      .process(code, { from: filepath })
      .then((result) => result.css);
  });

  eleventyConfig.addNunjucksAsyncFilter(
    "jsmin",
    async function (code, callback) {
      try {
        const minified = await minify(code);
        callback(null, minified.code);
      } catch (err) {
        console.error("Terser error: ", err);
        // Fail gracefully.
        callback(null, code);
      }
    }
  );

  eleventyConfig.addCollection("tagList", require("./src/_11ty/getTagList"));

  eleventyConfig.addPassthroughCopy("img");
  eleventyConfig.addPassthroughCopy("src/robots.txt");

  eleventyConfig.addWatchTarget("src/css");

  /* Markdown Overrides */
  let markdownLibrary = markdownIt({
    html: true,
    breaks: true,
    linkify: true,
  })
    .use(markdownItAnchor, {
      // permalink: true,
      permalinkClass: "direct-link",
      permalinkBefore: false,
      permalinkSymbol: "#",
    })
    .use(markdownItLinkAttributes, {
      pattern: /^http/,
      attrs: {
        target: "_blank",
        rel: "noopener noreferrer",
      },
    });
  eleventyConfig.setLibrary("md", markdownLibrary);
  eleventyConfig.setDataDeepMerge(true);

  // Browsersync Overrides
  eleventyConfig.setBrowserSyncConfig({
    callbacks: {
      ready: function (err, browserSync) {
        const content_404 = fs.readFileSync("dist/404.html");

        browserSync.addMiddleware("*", (req, res) => {
          // Provides the 404 content without redirect.
          res.write(content_404);
          res.end();
        });
      },
    },
    ui: false,
    ghostMode: false,
  });

  return {
    templateFormats: ["md", "njk", "html", "liquid", "css"],

    // If your site lives in a different subdirectory, change this.
    // Leading or trailing slashes are all normalized away, so don’t worry about those.

    // If you don’t have a subdirectory, use "" or "/" (they do the same thing)
    // This is only used for link URLs (it does not affect your file structure)
    // Best paired with the `url` filter: https://www.11ty.io/docs/filters/url/

    // You can also pass this in on the command line using `--pathprefix`
    // pathPrefix: "/",

    markdownTemplateEngine: "liquid",
    htmlTemplateEngine: "njk",
    dataTemplateEngine: "njk",

    // These are all optional, defaults are shown:
    dir: {
      input: "src",
      includes: "_includes",
      data: "_data",
      output: "dist",
    },
  };
};
