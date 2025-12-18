/**
 * SEO Manager - Dynamic Meta Tags and Structured Data
 * Handles SEO optimization across the Eyes of Azrael website
 */

class SEOManager {
    constructor() {
        this.siteData = {
            name: 'Eyes of Azrael',
            description: 'A comprehensive encyclopedia of world mythologies, magical systems, sacred herbalism, and spiritual traditions spanning 6000+ years of human history',
            url: 'https://eyesofazrael.com',
            logo: 'https://eyesofazrael.com/icons/icon-512x512.png',
            twitterHandle: '@EyesOfAzrael',
            fbAppId: ''
        };
    }

    /**
     * Set page-specific meta tags
     */
    setPageMeta(config) {
        const {
            title,
            description,
            keywords = [],
            image,
            type = 'website',
            author,
            publishedTime,
            modifiedTime,
            section,
            tags = [],
            canonical
        } = config;

        // Title
        this.setTitle(title);

        // Description
        this.setMetaTag('description', description);
        this.setMetaTag('og:description', description);
        this.setMetaTag('twitter:description', description);

        // Keywords
        if (keywords.length > 0) {
            this.setMetaTag('keywords', keywords.join(', '));
        }

        // Canonical URL
        if (canonical) {
            this.setCanonical(canonical);
        } else {
            this.setCanonical(window.location.href);
        }

        // Open Graph tags
        this.setMetaTag('og:title', title);
        this.setMetaTag('og:type', type);
        this.setMetaTag('og:url', canonical || window.location.href);
        this.setMetaTag('og:site_name', this.siteData.name);
        this.setMetaTag('og:locale', 'en_US');

        if (image) {
            this.setMetaTag('og:image', image);
            this.setMetaTag('og:image:alt', title);
            this.setMetaTag('twitter:image', image);
        } else {
            this.setMetaTag('og:image', this.siteData.logo);
            this.setMetaTag('twitter:image', this.siteData.logo);
        }

        // Twitter Card tags
        this.setMetaTag('twitter:card', image ? 'summary_large_image' : 'summary');
        this.setMetaTag('twitter:site', this.siteData.twitterHandle);
        this.setMetaTag('twitter:title', title);

        // Article-specific tags
        if (type === 'article') {
            if (author) this.setMetaTag('article:author', author);
            if (publishedTime) this.setMetaTag('article:published_time', publishedTime);
            if (modifiedTime) this.setMetaTag('article:modified_time', modifiedTime);
            if (section) this.setMetaTag('article:section', section);
            if (tags.length > 0) {
                tags.forEach(tag => this.addMetaTag('article:tag', tag));
            }
        }

        // Facebook App ID
        if (this.siteData.fbAppId) {
            this.setMetaTag('fb:app_id', this.siteData.fbAppId);
        }
    }

    /**
     * Set page title
     */
    setTitle(title) {
        const fullTitle = title === this.siteData.name ? title : `${title} | ${this.siteData.name}`;
        document.title = fullTitle;
        this.setMetaTag('og:title', fullTitle);
        this.setMetaTag('twitter:title', fullTitle);
    }

    /**
     * Set or update a meta tag
     */
    setMetaTag(name, content) {
        if (!content) return;

        const isProperty = name.startsWith('og:') || name.startsWith('fb:') || name.startsWith('article:');
        const attribute = isProperty ? 'property' : 'name';

        let element = document.querySelector(`meta[${attribute}="${name}"]`);

        if (!element) {
            element = document.createElement('meta');
            element.setAttribute(attribute, name);
            document.head.appendChild(element);
        }

        element.setAttribute('content', content);
    }

    /**
     * Add a new meta tag (allows duplicates for tags like article:tag)
     */
    addMetaTag(name, content) {
        if (!content) return;

        const isProperty = name.startsWith('og:') || name.startsWith('fb:') || name.startsWith('article:');
        const attribute = isProperty ? 'property' : 'name';

        const element = document.createElement('meta');
        element.setAttribute(attribute, name);
        element.setAttribute('content', content);
        document.head.appendChild(element);
    }

    /**
     * Set canonical URL
     */
    setCanonical(url) {
        let link = document.querySelector('link[rel="canonical"]');

        if (!link) {
            link = document.createElement('link');
            link.setAttribute('rel', 'canonical');
            document.head.appendChild(link);
        }

        link.setAttribute('href', url);
    }

    /**
     * Add JSON-LD structured data
     */
    addStructuredData(data) {
        const script = document.createElement('script');
        script.type = 'application/ld+json';
        script.textContent = JSON.stringify(data);
        document.head.appendChild(script);
    }

    /**
     * Generate Website schema
     */
    generateWebsiteSchema() {
        return {
            '@context': 'https://schema.org',
            '@type': 'WebSite',
            'name': this.siteData.name,
            'description': this.siteData.description,
            'url': this.siteData.url,
            'potentialAction': {
                '@type': 'SearchAction',
                'target': {
                    '@type': 'EntryPoint',
                    'urlTemplate': `${this.siteData.url}/search?q={search_term_string}`
                },
                'query-input': 'required name=search_term_string'
            }
        };
    }

    /**
     * Generate Organization schema
     */
    generateOrganizationSchema() {
        return {
            '@context': 'https://schema.org',
            '@type': 'Organization',
            'name': this.siteData.name,
            'url': this.siteData.url,
            'logo': this.siteData.logo,
            'sameAs': [
                // Add social media links here when available
            ]
        };
    }

    /**
     * Generate Article schema
     */
    generateArticleSchema(config) {
        const {
            headline,
            description,
            image,
            datePublished,
            dateModified,
            author = 'Eyes of Azrael',
            section
        } = config;

        return {
            '@context': 'https://schema.org',
            '@type': 'Article',
            'headline': headline,
            'description': description,
            'image': image || this.siteData.logo,
            'datePublished': datePublished,
            'dateModified': dateModified || datePublished,
            'author': {
                '@type': 'Organization',
                'name': author
            },
            'publisher': {
                '@type': 'Organization',
                'name': this.siteData.name,
                'logo': {
                    '@type': 'ImageObject',
                    'url': this.siteData.logo
                }
            },
            'mainEntityOfPage': {
                '@type': 'WebPage',
                '@id': window.location.href
            },
            'articleSection': section
        };
    }

    /**
     * Generate Breadcrumb schema
     */
    generateBreadcrumbSchema(items) {
        return {
            '@context': 'https://schema.org',
            '@type': 'BreadcrumbList',
            'itemListElement': items.map((item, index) => ({
                '@type': 'ListItem',
                'position': index + 1,
                'name': item.name,
                'item': item.url
            }))
        };
    }

    /**
     * Generate Person schema (for deity/entity pages)
     */
    generatePersonSchema(config) {
        const {
            name,
            description,
            image,
            sameAs = [],
            additionalType
        } = config;

        return {
            '@context': 'https://schema.org',
            '@type': 'Person',
            'name': name,
            'description': description,
            'image': image,
            'sameAs': sameAs,
            'additionalType': additionalType || 'https://schema.org/MythicalCreature'
        };
    }

    /**
     * Auto-detect and set meta tags from page content
     */
    autoDetectMeta() {
        const h1 = document.querySelector('h1');
        const description = document.querySelector('meta[name="description"]')?.content ||
                          document.querySelector('p')?.textContent.substring(0, 160);

        if (h1 && !document.querySelector('meta[property="og:title"]')) {
            this.setPageMeta({
                title: h1.textContent,
                description: description || this.siteData.description
            });
        }
    }

    /**
     * Initialize SEO for current page type
     */
    init(pageType = 'default', config = {}) {
        // Auto-detect if no config provided
        if (Object.keys(config).length === 0) {
            this.autoDetectMeta();
        } else {
            this.setPageMeta(config);
        }

        // Add structured data based on page type
        switch (pageType) {
            case 'home':
                this.addStructuredData(this.generateWebsiteSchema());
                this.addStructuredData(this.generateOrganizationSchema());
                break;

            case 'deity':
            case 'entity':
                if (config.entity) {
                    this.addStructuredData(this.generatePersonSchema(config.entity));
                }
                break;

            case 'article':
                if (config.article) {
                    this.addStructuredData(this.generateArticleSchema(config.article));
                }
                break;

            case 'breadcrumb':
                if (config.breadcrumbs) {
                    this.addStructuredData(this.generateBreadcrumbSchema(config.breadcrumbs));
                }
                break;
        }
    }
}

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SEOManager;
}
