/**
 * Utility functions for handling Google Forms URLs
 */

/**
 * Converts a Google Form URL to a public embeddable URL
 * This helps avoid 401 authentication errors when embedding forms in iframes
 */
export function getPublicFormUrl(formUrl: string): string {
  if (!formUrl) return '';
  
  try {
    // Handle different Google Forms URL formats
    const url = new URL(formUrl);
    
    // Check if it's a Google Forms URL
    if (!url.hostname.includes('docs.google.com') || !url.pathname.includes('/forms/')) {
      return formUrl; // Return original if not a Google Form
    }
    
    // Extract form ID from various URL patterns
    const formIdMatch = url.pathname.match(/\/forms\/d\/e\/([^\/]+)/);
    if (!formIdMatch) {
      return formUrl; // Return original if we can't extract form ID
    }
    
    const formId = formIdMatch[1];
    
    // Create public embeddable URL
    // Using the /viewform endpoint with public parameters
    const publicUrl = `https://docs.google.com/forms/d/e/${formId}/viewform?embedded=true&usp=pp_url`;
    
    return publicUrl;
  } catch (error) {
    console.error('Error converting form URL to public URL:', error);
    return formUrl; // Return original URL if conversion fails
  }
}

/**
 * Checks if a URL is a Google Form URL
 */
export function isGoogleFormUrl(url: string): boolean {
  if (!url) return false;
  
  try {
    const urlObj = new URL(url);
    return urlObj.hostname.includes('docs.google.com') && 
           urlObj.pathname.includes('/forms/');
  } catch {
    return false;
  }
}

/**
 * Extracts form ID from a Google Form URL
 */
export function extractFormId(formUrl: string): string | null {
  if (!formUrl) return null;
  
  try {
    const url = new URL(formUrl);
    const formIdMatch = url.pathname.match(/\/forms\/d\/e\/([^\/]+)/);
    return formIdMatch ? formIdMatch[1] : null;
  } catch {
    return null;
  }
}

/**
 * Creates a public Google Form URL from a form ID
 */
export function createPublicFormUrl(formId: string): string {
  return `https://docs.google.com/forms/d/e/${formId}/viewform?embedded=true&usp=pp_url`;
}

