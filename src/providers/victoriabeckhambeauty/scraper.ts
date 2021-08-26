import { getSelectorOuterHtml } from "../../providerHelpers/getSelectorOuterHtml";
import { DESCRIPTION_PLACEMENT } from "../../interfaces/outputProduct";
import { getProductOptions } from "../shopify/helpers";
import shopifyScraper from "../shopify/scraper";
import {
  IVictoriaBeckhamBeautyCustomProduct,
  TVictoriaBeckhamBeautyExtraData,
} from "./types";

export default shopifyScraper(
  {
    urls: (url) => {
      const parsedUrl = new URL(url);
      return {
        jsonUrl: `https://shop.victoriabeckhambeauty.com${parsedUrl.pathname}`,
        htmlUrl: `https://victoriabeckhambeauty.com${parsedUrl.pathname}`,
      };
    },
    productFn: async (_request, page, providerProduct) => {
      const url = new URL(_request.pageUrl);

      // Remove promotion popups
      await page.setCookie({
        url: `${url.protocol}//${url.host}/`,
        name: "vbb_newsletter_popup_seen",
        value: "true",
      });

      // Set USA variant
      await page.evaluate(() =>
        localStorage.setItem(
          "vbb:geoip",
          JSON.stringify({ country: "EN", currency: "USD" })
        )
      );

      // Reload to apply changes
      await page.reload();

      const extraData: TVictoriaBeckhamBeautyExtraData = {};

      /**
       * Get the breadcrumbs
       */
      extraData.breadcrumbs = await page.evaluate(() => {
        return Array.from(
          document.querySelectorAll(
            ".breadcrumb > a, .breadcrumb > span:not(.breadcrumb__spacer)"
          )
        )
          .map((e) => e.textContent?.trim() || "")
          .filter((e) => e !== "");
      });

      /**
       * Get additional descriptions and information
       */
      extraData.keyValuePairs = await page.evaluate(() => {
        // Get a list of titles
        const keys = Array.from(
          document.querySelectorAll(".product-description-wrapper > ul > li")
        );

        // Get a list of content for the titles above
        const values = Array.from(
          document.querySelectorAll(".product-description-wrapper > div")
        );

        // Join the two arrays in a key value object
        return values.reduce((acc: Record<string, string>, value, i) => {
          acc[keys[i].textContent?.trim() || `key_${i}`] =
            value.outerHTML?.trim() || "";
          return acc;
        }, {});
      });

      /**
       * This site differs from the others and has a particular description included in the HTML (not the JSON)
       */
      const description = await page.evaluate(() => {
        return document
          .querySelector(".product-details__tab-content__description")
          ?.outerHTML?.trim();
      });

      /**
       * Get additional descriptions and information
       */
      const additionalSections = await page.evaluate(
        (DESCRIPTION_PLACEMENT) => {
          //Get titles from descriptions
          const keys = Array.from(
            document.querySelectorAll(".content-block-container__block")
          )
            .map((e) => e.querySelector("h2, h1"))
            .map((e) => e?.textContent?.trim());
          // Get a list of content for the titles above
          const values = Array.from(
            document.querySelectorAll(".content-block-container__block")
          )
            .map((e) => e?.outerHTML?.trim())
            .map((e) => e.replace(/(<h2>.*<\/h2>)/gm, "")); //Cut title from content

          const sections = values.map((value, i) => {
            return {
              name: keys[i] || `keys${i}`,
              content: value,
              description_placement: ["What It Is:", "WHAT IT IS"].includes(
                keys[i] || ""
              )
                ? DESCRIPTION_PLACEMENT.ADJACENT
                : DESCRIPTION_PLACEMENT.DISTANT,
            };
          });
          return sections;
        },
        DESCRIPTION_PLACEMENT
      );

      /**
       * This page has custom data per variant
       */
      const customDataFile = await page.goto(
        `https://www.victoriabeckhambeauty.com/assets/data/products/${providerProduct.handle}/index.json`
      );

      const customData: IVictoriaBeckhamBeautyCustomProduct =
        await customDataFile.json();
      const customProduct = customData.data.product;

      if (description) {
        extraData.additionalSections = [
          {
            name: "Description",
            content: description,
            description_placement: DESCRIPTION_PLACEMENT.MAIN,
          },
        ];
      }

      if (customProduct.contentful.howTo) {
        extraData.additionalSections?.push({
          name: "In Motion",
          content: "<p>" + customProduct.contentful.howTo.text + "<p>",
          description_placement: DESCRIPTION_PLACEMENT.ADJACENT,
        });
      }

      if (customProduct.contentful.ingredientTechnology) {
        extraData.additionalSections?.push({
          name: "ingredientTechnology",
          content:
            "<p>" + customProduct.contentful.ingredientTechnology + "<p>",
          description_placement: DESCRIPTION_PLACEMENT.ADJACENT,
        });
      }

      if (additionalSections) {
        extraData.additionalSections?.push(...additionalSections);
      }

      extraData.videos = await page.$$eval(
        ".content-block-container__block video",
        (videos) => videos.map((video) => (video as HTMLVideoElement).src!)
      );

      extraData.images = await page.$$eval(
        ".content-block-container__block img",
        (imgs) => imgs.map((img) => (img as HTMLImageElement).src!)
      );

      /**
       * Get Size Chart HTML
       */
      extraData.sizeChartHtml = await getSelectorOuterHtml(
        page,
        "div[data-remodal-id=size-chart]"
      );

      if (customProduct.contentful?.howTo?.videoWithPoster?.poster) {
        extraData.images = [
          ...extraData.images,
          `https://${url.hostname}${customProduct.contentful.howTo.videoWithPoster.poster.src}`,
        ];
      }

      if (customProduct.contentful?.howTo?.videoWithPoster?.video) {
        extraData.videos = [
          ...extraData.videos,
          `https://${url.hostname}${customProduct.contentful.howTo.videoWithPoster.video.src}`,
        ];
      }

      const variants = customProduct.variants.map((variant) => {
        const variantUrl = new URL(url.toString());
        variantUrl.pathname = customProduct.path;
        variantUrl.search =
          "?" +
          new URLSearchParams({ variant: variant.legacyId.USD }).toString();
        return {
          ...variant,
          url: variantUrl.toString(),
        };
      });

      extraData.variants = Object.fromEntries(
        variants.map((variant) => [variant.legacyId.USD, variant])
      );

      return extraData;
    },
    variantFn: async (
      _request,
      page,
      product,
      providerProduct,
      providerVariant,
      _extraData: TVictoriaBeckhamBeautyExtraData
    ) => {
      const url = new URL(_request.pageUrl);
      const customVariant = (_extraData.variants || {})[providerVariant.id];

      if (customVariant) {
        product.url = customVariant.url;
        product.sku = customVariant.sku;
        product.realPrice = customVariant.price.USD;
        product.higherPrice =
          customVariant.compareAtPrice.USD || customVariant.price.USD;

        if (customVariant.contentful) {
          product.images = [
            ...customVariant.contentful.images
              .filter((image) => image.type === "image")
              .map((image) => `https://${url.hostname}${image.src}`),
          ];

          product.videos = [
            ...product.videos,
            ...customVariant.contentful.images
              .filter((image) => image.type === "video")
              .map((image) => `https://${url.hostname}${image.src}`),
          ];
        }

        product.availability = customVariant.availableForSale;

        if (customVariant.contentful) {
          product.subTitle = customVariant.contentful.subtitle;
        }
      }

      /**
       * Get the list of options for the variants of this provider
       * (6) ["Color", "Title", "Size", "Shade", "+ Sharpener", "Palette"]
       */
      const optionsObj = getProductOptions(providerProduct, providerVariant);
      if (optionsObj.Color || optionsObj.Shade || optionsObj.Palette) {
        product.color =
          optionsObj.Color || optionsObj.Shade || optionsObj.Palette;
      }

      if (optionsObj.Size) {
        product.size = optionsObj.Size;
      }

      await page.goto(product.url);

      /**
       * Get all images of distant description
       */
      const distantImages = await page.evaluate(() => {
        const images = Array.from(
          document.querySelectorAll(
            ".content-block-container .aspect-ratio-box img"
          )
        ).map((e) => e.getAttribute("src"));

        const img = images.map((img) => {
          return `https://www.victoriabeckhambeauty.com${img}`;
        });

        return img.map((e) => e.replace(/(w=.*)/gm, ""));
      });

      if (distantImages) {
        product.images = [...product.images, ...distantImages];
      }

      /**
       * Get all images of distant description
       */
      const distantVideos = await page.evaluate(() => {
        const videos = Array.from(
          document.querySelectorAll(
            ".content-section-hero__video-wrapper video source"
          )
        ).map((e) => e.getAttribute("src"));

        const video = videos.map((video) => {
          return `https://www.victoriabeckhambeauty.com${video}`;
        });

        return video;
      });

      /**
       * Get all images of distant description
       */
      const adjacentVideos = await page.evaluate(() => {
        const videos = Array.from(
          document.querySelectorAll(
            ".content-section-beauty-in-motion__container video"
          )
        ).map((e) => e.getAttribute("src"));

        const video = videos.map((video) => {
          return `https:${video}` || "";
        });

        video.filter((e) => e !== "");

        return video;
      });

      product.videos = [...product.videos, ...distantVideos, ...adjacentVideos];

      /**
       * Cut the first element to array, this page use another main description different comes from json
       */
      if (customVariant.contentful.description) {
        product.additionalSections.shift();
      }
    },
  },
  {}
);
