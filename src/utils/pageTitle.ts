import { getApiBaseUrl } from './config';

// 更新页面标题和描述
export const updatePageTitle = async () => {
  try {
    const apiBaseUrl = await getApiBaseUrl();
    const response = await fetch(`${apiBaseUrl}/api/config`);
    
    if (response.ok) {
      const config = await response.json();
      
      if (config.website) {
        // 更新页面标题
        if (config.website.title) {
          document.title = config.website.title;
        }
        
        // 更新页面描述
        if (config.website.description) {
          let metaDescription = document.querySelector('meta[name="description"]');
          if (!metaDescription) {
            metaDescription = document.createElement('meta');
            metaDescription.setAttribute('name', 'description');
            document.head.appendChild(metaDescription);
          }
          metaDescription.setAttribute('content', config.website.description);
        }
      }
    }
  } catch (error) {
    console.error('Failed to update page title:', error);
  }
};

// 设置默认标题
export const setDefaultTitle = (title: string) => {
  document.title = title;
}; 