import fs from 'fs';
import path from 'path';

// 地理信息接口
export interface LocationInfo {
  country?: string;
  region?: string;
  city?: string;
  countryCode?: string;
  regionCode?: string;
  timezone?: string;
  isp?: string;
}

// 缓存接口
interface LocationCache {
  [ip: string]: {
    location: LocationInfo;
    timestamp: number;
  };
}

// 缓存文件路径
const cacheFilePath = path.join(process.cwd(), 'data', 'location-cache.json');

// 确保数据目录存在
const ensureDataDir = (): void => {
  const dataDir = path.join(process.cwd(), 'data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
};

// 读取缓存
const readCache = (): LocationCache => {
  try {
    if (fs.existsSync(cacheFilePath)) {
      const data = fs.readFileSync(cacheFilePath, 'utf8');
      return JSON.parse(data);
    }
    return {};
  } catch (error) {
    console.error('Failed to read location cache:', error);
    return {};
  }
};

// 保存缓存
const saveCache = (cache: LocationCache): void => {
  try {
    ensureDataDir();
    fs.writeFileSync(cacheFilePath, JSON.stringify(cache, null, 2));
  } catch (error) {
    console.error('Failed to save location cache:', error);
  }
};

// 清理过期缓存
const cleanExpiredCache = (cache: LocationCache, cacheDuration: number): LocationCache => {
  const now = Date.now();
  const cleanedCache: LocationCache = {};
  
  for (const [ip, data] of Object.entries(cache)) {
    if (now - data.timestamp < cacheDuration * 1000) {
      cleanedCache[ip] = data;
    }
  }
  
  return cleanedCache;
};

// IP-API.com 查询（免费，无需API密钥）
const queryIpApi = async (ip: string): Promise<LocationInfo | null> => {
  try {
    const response = await fetch(`http://ip-api.com/json/${ip}?fields=status,message,country,regionName,city,countryCode,region,timezone,isp`);
    const data = await response.json();
    
    if (data.status === 'success') {
      return {
        country: data.country,
        region: data.regionName,
        city: data.city,
        countryCode: data.countryCode,
        regionCode: data.region,
        timezone: data.timezone,
        isp: data.isp
      };
    }
    
    console.warn(`IP-API query failed for ${ip}:`, data.message);
    return null;
  } catch (error) {
    console.error(`IP-API query error for ${ip}:`, error);
    return null;
  }
};

// IPStack 查询（需要API密钥）
const queryIpStack = async (ip: string, apiKey: string): Promise<LocationInfo | null> => {
  try {
    const response = await fetch(`http://api.ipstack.com/${ip}?access_key=${apiKey}`);
    const data = await response.json();
    
    if (data.country_name) {
      return {
        country: data.country_name,
        region: data.region_name,
        city: data.city,
        countryCode: data.country_code,
        regionCode: data.region_code,
        timezone: data.time_zone?.id,
        isp: data.connection?.isp
      };
    }
    
    console.warn(`IPStack query failed for ${ip}:`, data.error?.info || 'Unknown error');
    return null;
  } catch (error) {
    console.error(`IPStack query error for ${ip}:`, error);
    return null;
  }
};

// IPGeolocation 查询（需要API密钥）
const queryIpGeolocation = async (ip: string, apiKey: string): Promise<LocationInfo | null> => {
  try {
    const response = await fetch(`https://api.ipgeolocation.io/ipgeo?apiKey=${apiKey}&ip=${ip}`);
    const data = await response.json();
    
    if (data.country_name) {
      return {
        country: data.country_name,
        region: data.state_prov,
        city: data.city,
        countryCode: data.country_code2,
        regionCode: data.state_code,
        timezone: data.time_zone?.name,
        isp: data.isp
      };
    }
    
    console.warn(`IPGeolocation query failed for ${ip}:`, data.message || 'Unknown error');
    return null;
  } catch (error) {
    console.error(`IPGeolocation query error for ${ip}:`, error);
    return null;
  }
};

// IP2Location 查询（需要API密钥）
const queryIp2Location = async (ip: string, apiKey: string): Promise<LocationInfo | null> => {
  try {
    const response = await fetch(`https://api.ip2location.io/?key=${apiKey}&ip=${ip}&format=json`);
    const data = await response.json();
    
    if (data.country_name) {
      return {
        country: data.country_name,
        region: data.region_name,
        city: data.city_name,
        countryCode: data.country_code,
        regionCode: data.region_name, // IP2Location没有单独的region code
        timezone: data.time_zone,
        isp: data.as // 使用AS信息作为ISP
      };
    }
    
    console.warn(`IP2Location query failed for ${ip}:`, data.error?.error_message || 'Unknown error');
    return null;
  } catch (error) {
    console.error(`IP2Location query error for ${ip}:`, error);
    return null;
  }
};

// 主要的地理信息查询函数
export const getLocationInfo = async (
  ip: string,
  config: {
    enabled: boolean;
    api_provider: string;
    api_key?: string;
    cache_duration: number;
  }
): Promise<LocationInfo | null> => {
  // 如果未启用地理信息查询
  if (!config.enabled) {
    return null;
  }
  
  // 跳过本地IP地址
  if (ip === 'unknown' || ip.startsWith('127.') || ip.startsWith('192.168.') || ip.startsWith('10.') || ip === '::1') {
    return null;
  }
  
  // 检查缓存
  let cache = readCache();
  cache = cleanExpiredCache(cache, config.cache_duration);
  
  if (cache[ip]) {
    return cache[ip].location;
  }
  
  let location: LocationInfo | null = null;
  
  // 根据配置的API提供商查询
  switch (config.api_provider) {
    case 'ipapi':
      location = await queryIpApi(ip);
      break;
    case 'ipstack':
      if (config.api_key) {
        location = await queryIpStack(ip, config.api_key);
      } else {
        console.warn('IPStack requires API key');
      }
      break;
    case 'ipgeolocation':
      if (config.api_key) {
        location = await queryIpGeolocation(ip, config.api_key);
      } else {
        console.warn('IPGeolocation requires API key');
      }
      break;
    case 'ip2location':
      if (config.api_key) {
        location = await queryIp2Location(ip, config.api_key);
      } else {
        console.warn('IP2Location requires API key');
      }
      break;
    default:
      console.warn(`Unknown API provider: ${config.api_provider}`);
  }
  
  // 保存到缓存
  if (location) {
    cache[ip] = {
      location,
      timestamp: Date.now()
    };
    saveCache(cache);
  }
  
  return location;
};

// 批量查询地理信息（用于历史记录）
export const batchGetLocationInfo = async (
  ips: string[],
  config: {
    enabled: boolean;
    api_provider: string;
    api_key?: string;
    cache_duration: number;
  }
): Promise<{ [ip: string]: LocationInfo | null }> => {
  const results: { [ip: string]: LocationInfo | null } = {};
  
  if (!config.enabled) {
    return results;
  }
  
  // 去重IP列表
  const uniqueIps = [...new Set(ips)];
  
  // 并发查询，但限制并发数量以避免API限制
  const batchSize = 5;
  for (let i = 0; i < uniqueIps.length; i += batchSize) {
    const batch = uniqueIps.slice(i, i + batchSize);
    const batchPromises = batch.map(ip => 
      getLocationInfo(ip, config).then(location => ({ ip, location }))
    );
    
    const batchResults = await Promise.all(batchPromises);
    batchResults.forEach(({ ip, location }) => {
      results[ip] = location;
    });
    
    // 在批次之间添加小延迟，避免API限制
    if (i + batchSize < uniqueIps.length) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }
  
  return results;
}; 