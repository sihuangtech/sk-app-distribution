// 用户代理解析工具
export interface BrowserInfo {
  browser: string;
  os: string;
}

/**
 * 解析用户代理字符串，获取详细的浏览器和系统信息
 * @param userAgent 用户代理字符串
 * @returns 包含浏览器和操作系统信息的对象
 */
export const parseBrowserInfo = (userAgent: string): BrowserInfo => {
  if (!userAgent || userAgent === 'unknown') {
    return { browser: '未知', os: '未知' };
  }
  
  let browser = '其他';
  let browserVersion = '';
  let os = '未知';
  let osVersion = '';
  
  // 解析操作系统信息
  if (userAgent.includes('Windows NT')) {
    os = 'Windows';
    const winMatch = userAgent.match(/Windows NT ([\d.]+)/);
    if (winMatch) {
      const ntVersion = winMatch[1];
      const winVersionMap: { [key: string]: string } = {
        '10.0': '10/11',
        '6.3': '8.1',
        '6.2': '8',
        '6.1': '7',
        '6.0': 'Vista',
        '5.1': 'XP',
        '5.0': '2000'
      };
      osVersion = winVersionMap[ntVersion] || ntVersion;
    }
  } else if (userAgent.includes('Mac OS X')) {
    os = 'macOS';
    const macMatch = userAgent.match(/Mac OS X ([\d_]+)/);
    if (macMatch) {
      osVersion = macMatch[1].replace(/_/g, '.');
    }
  } else if (userAgent.includes('Linux')) {
    os = 'Linux';
    if (userAgent.includes('Ubuntu')) osVersion = 'Ubuntu';
    else if (userAgent.includes('CentOS')) osVersion = 'CentOS';
    else if (userAgent.includes('Debian')) osVersion = 'Debian';
    else if (userAgent.includes('Fedora')) osVersion = 'Fedora';
  } else if (userAgent.includes('Android')) {
    os = 'Android';
    const androidMatch = userAgent.match(/Android ([\d.]+)/);
    if (androidMatch) {
      osVersion = androidMatch[1];
    }
  } else if (userAgent.includes('iPhone OS') || userAgent.includes('OS ')) {
    os = 'iOS';
    const iosMatch = userAgent.match(/OS ([\d_]+)/);
    if (iosMatch) {
      osVersion = iosMatch[1].replace(/_/g, '.');
    }
  }
  
  // 首先检查是否为爬虫或自动化工具
  if (userAgent.includes('Baiduspider')) {
    browser = '百度爬虫';
    const baiduMatch = userAgent.match(/Baiduspider\/([\d.]+)/);
    if (baiduMatch) browserVersion = baiduMatch[1];
    os = '爬虫';
  } else if (userAgent.includes('Googlebot')) {
    browser = 'Google爬虫';
    const googleMatch = userAgent.match(/Googlebot\/([\d.]+)/);
    if (googleMatch) browserVersion = googleMatch[1];
    os = '爬虫';
  } else if (userAgent.includes('bingbot') || userAgent.includes('BingBot')) {
    browser = 'Bing爬虫';
    const bingMatch = userAgent.match(/bingbot\/([\d.]+)/i);
    if (bingMatch) browserVersion = bingMatch[1];
    os = '爬虫';
  } else if (userAgent.includes('Slurp')) {
    browser = '雅虎爬虫';
    const yahooMatch = userAgent.match(/Slurp\/([\d.]+)/);
    if (yahooMatch) browserVersion = yahooMatch[1];
    os = '爬虫';
  } else if (userAgent.includes('Sogou')) {
    browser = '搜狗爬虫';
    const sogouMatch = userAgent.match(/Sogou[^\/]*\/([\d.]+)/);
    if (sogouMatch) browserVersion = sogouMatch[1];
    os = '爬虫';
  } else if (userAgent.includes('360Spider')) {
    browser = '360爬虫';
    const spider360Match = userAgent.match(/360Spider[^\/]*\/([\d.]+)/);
    if (spider360Match) browserVersion = spider360Match[1];
    os = '爬虫';
  } else if (userAgent.includes('YisouSpider')) {
    browser = '神马爬虫';
    const yisouMatch = userAgent.match(/YisouSpider\/([\d.]+)/);
    if (yisouMatch) browserVersion = yisouMatch[1];
    os = '爬虫';
  } else if (userAgent.includes('facebookexternalhit')) {
    browser = 'Facebook爬虫';
    const fbMatch = userAgent.match(/facebookexternalhit\/([\d.]+)/);
    if (fbMatch) browserVersion = fbMatch[1];
    os = '爬虫';
  } else if (userAgent.includes('Twitterbot')) {
    browser = 'Twitter爬虫';
    const twitterMatch = userAgent.match(/Twitterbot\/([\d.]+)/);
    if (twitterMatch) browserVersion = twitterMatch[1];
    os = '爬虫';
  } else if (userAgent.includes('LinkedInBot')) {
    browser = 'LinkedIn爬虫';
    const linkedinMatch = userAgent.match(/LinkedInBot\/([\d.]+)/);
    if (linkedinMatch) browserVersion = linkedinMatch[1];
    os = '爬虫';
  } else if (userAgent.includes('ClaudeBot')) {
    browser = 'Claude爬虫';
    const claudeMatch = userAgent.match(/ClaudeBot\/([\d.]+)/);
    if (claudeMatch) browserVersion = claudeMatch[1];
    os = '爬虫';
  } else if (userAgent.includes('GPTBot')) {
    browser = 'GPT爬虫';
    const gptMatch = userAgent.match(/GPTBot\/([\d.]+)/);
    if (gptMatch) browserVersion = gptMatch[1];
    os = '爬虫';
  } else if (userAgent.includes('ChatGPT-User')) {
    browser = 'ChatGPT用户代理';
    os = '爬虫';
  } else if (userAgent.includes('CCBot')) {
    browser = 'CommonCrawl爬虫';
    const ccMatch = userAgent.match(/CCBot\/([\d.]+)/);
    if (ccMatch) browserVersion = ccMatch[1];
    os = '爬虫';
  } else if (userAgent.includes('DuckDuckBot')) {
    browser = 'DuckDuckGo爬虫';
    const duckMatch = userAgent.match(/DuckDuckBot\/([\d.]+)/);
    if (duckMatch) browserVersion = duckMatch[1];
    os = '爬虫';
  } else if (userAgent.includes('YandexBot')) {
    browser = 'Yandex爬虫';
    const yandexMatch = userAgent.match(/YandexBot\/([\d.]+)/);
    if (yandexMatch) browserVersion = yandexMatch[1];
    os = '爬虫';
  } else if (userAgent.includes('AppleBot')) {
    browser = 'Apple爬虫';
    const appleMatch = userAgent.match(/AppleBot\/([\d.]+)/);
    if (appleMatch) browserVersion = appleMatch[1];
    os = '爬虫';
  } else if (userAgent.includes('WP-URLDetails')) {
    browser = 'WordPress链接检测';
    const wpMatch = userAgent.match(/WP-URLDetails\/([\d.]+)/);
    if (wpMatch) browserVersion = wpMatch[1];
    os = '自动化工具';
  } else if (userAgent.includes('curl/')) {
    browser = 'cURL';
    const curlMatch = userAgent.match(/curl\/([\d.]+)/);
    if (curlMatch) browserVersion = curlMatch[1];
    os = '命令行工具';
  } else if (userAgent.includes('wget/')) {
    browser = 'Wget';
    const wgetMatch = userAgent.match(/wget\/([\d.]+)/);
    if (wgetMatch) browserVersion = wgetMatch[1];
    os = '命令行工具';
  } else if (userAgent.includes('Postman')) {
    browser = 'Postman';
    const postmanMatch = userAgent.match(/Postman\/([\d.]+)/);
    if (postmanMatch) browserVersion = postmanMatch[1];
    os = 'API测试工具';
  } else if (userAgent.includes('spider') || userAgent.includes('crawler') || userAgent.includes('bot')) {
    // 通用爬虫检测
    if (userAgent.includes('spider')) {
      browser = '网络爬虫';
    } else if (userAgent.includes('crawler')) {
      browser = '网络爬虫';
    } else {
      browser = '机器人';
    }
    os = '爬虫';
  }
  // 解析浏览器信息
  // Edge 需要先判断，因为Edge也包含Chrome字符串
  else if (userAgent.includes('Edg/')) {
    browser = 'Edge';
    const edgeMatch = userAgent.match(/Edg\/([\d.]+)/);
    if (edgeMatch) browserVersion = edgeMatch[1];
  } else if (userAgent.includes('Edge/')) {
    browser = 'Edge Legacy';
    const edgeMatch = userAgent.match(/Edge\/([\d.]+)/);
    if (edgeMatch) browserVersion = edgeMatch[1];
  } 
  // Chrome 系列
  else if (userAgent.includes('Chrome/')) {
    if (userAgent.includes('OPR/')) {
      browser = 'Opera';
      const operaMatch = userAgent.match(/OPR\/([\d.]+)/);
      if (operaMatch) browserVersion = operaMatch[1];
    } else if (userAgent.includes('Brave/')) {
      browser = 'Brave';
      const braveMatch = userAgent.match(/Brave\/([\d.]+)/);
      if (braveMatch) browserVersion = braveMatch[1];
    } else {
      browser = 'Chrome';
      const chromeMatch = userAgent.match(/Chrome\/([\d.]+)/);
      if (chromeMatch) browserVersion = chromeMatch[1];
    }
  }
  // Firefox
  else if (userAgent.includes('Firefox/')) {
    browser = 'Firefox';
    const firefoxMatch = userAgent.match(/Firefox\/([\d.]+)/);
    if (firefoxMatch) browserVersion = firefoxMatch[1];
  }
  // Safari (需要排除Chrome，因为Chrome也包含Safari字符串)
  else if (userAgent.includes('Safari/') && !userAgent.includes('Chrome/')) {
    browser = 'Safari';
    const safariMatch = userAgent.match(/Version\/([\d.]+)/);
    if (safariMatch) browserVersion = safariMatch[1];
  }
  // 其他常见浏览器
  else if (userAgent.includes('Trident/')) {
    browser = 'Internet Explorer';
    const ieMatch = userAgent.match(/rv:([\d.]+)/);
    if (ieMatch) browserVersion = ieMatch[1];
  }
  
  // 移动端特殊处理
  if (userAgent.includes('Mobile')) {
    if (os === 'iOS') {
      browser = browser === 'Safari' ? 'Safari Mobile' : browser + ' Mobile';
    } else if (os === 'Android') {
      browser = browser === 'Chrome' ? 'Chrome Mobile' : browser + ' Mobile';
    }
  }
  
  return {
    browser: browserVersion ? `${browser} ${browserVersion}` : browser,
    os: osVersion ? `${os} ${osVersion}` : os
  };
};

/**
 * 获取操作系统的简化名称
 * @param userAgent 用户代理字符串
 * @returns 操作系统名称
 */
export const getOSName = (userAgent: string): string => {
  const { os } = parseBrowserInfo(userAgent);
  return os.split(' ')[0]; // 只返回操作系统名称，不包含版本号
};

/**
 * 获取浏览器的简化名称
 * @param userAgent 用户代理字符串
 * @returns 浏览器名称
 */
export const getBrowserName = (userAgent: string): string => {
  const { browser } = parseBrowserInfo(userAgent);
  return browser.split(' ')[0]; // 只返回浏览器名称，不包含版本号
};

/**
 * 检查是否为移动设备
 * @param userAgent 用户代理字符串
 * @returns 是否为移动设备
 */
export const isMobile = (userAgent: string): boolean => {
  return /Mobile|Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
};

/**
 * 检查是否为爬虫或自动化工具
 * @param userAgent 用户代理字符串
 * @returns 是否为爬虫或自动化工具
 */
export const isBot = (userAgent: string): boolean => {
  return /bot|crawler|spider|crawling|curl|wget|postman/i.test(userAgent);
}; 