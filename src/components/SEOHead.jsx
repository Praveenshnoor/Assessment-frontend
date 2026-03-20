import { useEffect } from 'react';

/**
 * SEO Head component for managing dynamic meta tags
 * Since this is a SPA without SSR, we use useEffect to update meta tags
 * 
 * @param {Object} props
 * @param {string} props.title - Page title
 * @param {string} props.description - Page description
 * @param {string} props.canonical - Canonical URL
 * @param {string} props.ogImage - Open Graph image URL
 * @param {string} props.ogType - Open Graph type (website, article, etc.)
 */
const SEOHead = ({
  title = 'SHNOOR Assessments - Secure Examination Portal',
  description = 'Secure Examination Portal for SHNOOR Assessments. Access assigned tests, take proctored exams, and track your results.',
  canonical,
  ogImage = '/favicon.png',
  ogType = 'website',
}) => {
  useEffect(() => {
    // Update document title
    document.title = title;

    // Helper to update or create meta tag
    const updateMetaTag = (selector, content, attrName = 'content') => {
      let element = document.querySelector(selector);
      if (element) {
        element.setAttribute(attrName, content);
      }
    };

    // Update meta description
    updateMetaTag('meta[name="description"]', description);
    
    // Update Open Graph tags
    updateMetaTag('meta[property="og:title"]', title);
    updateMetaTag('meta[property="og:description"]', description);
    updateMetaTag('meta[property="og:type"]', ogType);
    updateMetaTag('meta[property="og:image"]', ogImage);
    
    // Update Twitter tags
    updateMetaTag('meta[property="twitter:title"]', title);
    updateMetaTag('meta[property="twitter:description"]', description);
    updateMetaTag('meta[property="twitter:image"]', ogImage);

    // Update canonical URL if provided
    if (canonical) {
      updateMetaTag('meta[property="og:url"]', canonical);
      updateMetaTag('meta[property="twitter:url"]', canonical);
      
      // Update or create canonical link
      let canonicalLink = document.querySelector('link[rel="canonical"]');
      if (canonicalLink) {
        canonicalLink.setAttribute('href', canonical);
      } else {
        canonicalLink = document.createElement('link');
        canonicalLink.rel = 'canonical';
        canonicalLink.href = canonical;
        document.head.appendChild(canonicalLink);
      }
    }

    // Cleanup function to reset title on unmount (optional)
    return () => {
      // Could reset to default title here if needed
    };
  }, [title, description, canonical, ogImage, ogType]);

  // This component doesn't render anything
  return null;
};

export default SEOHead;
