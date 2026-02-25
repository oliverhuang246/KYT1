// 竞品配置
module.exports = {
  competitors: [
    {
      name: 'Flashpoint',
      website: 'https://flashpoint.io/blog',
      // RSS feed 可能被保护，主要依赖 Twitter 和网站抓取
      rss: null,  // 暂时禁用 RSS
      twitter: 'FlashpointIntel',
      // 添加备用数据源：通过搜索引擎获取最新文章
      alternativeSource: 'https://flashpoint.io/blog',
      category: '威胁情报',
      selectors: {
        article: '.blog-post, article, .post-item, [class*="blog"], [class*="post"]',
        title: 'h1, h2, h3, h4, .title, [class*="title"]',
        link: 'a',
        excerpt: 'p, .excerpt, .summary, [class*="excerpt"]'
      }
    },
    {
      name: 'DarkBlue Intelligence',
      website: 'https://www.caci.com/news',
      twitter: 'CACIIntl',
      category: 'OSINT'
    },
    {
      name: 'StealthMole',
      website: 'https://www.stealthmole.com/blog',
      // 使用 Atom feed 格式
      rss: 'https://stealthmole-intelligence-hub.blogspot.com/feeds/posts/default',
      twitter: 'StealthMole',
      category: '暗网监测',
      selectors: {
        article: '.blog-item, article, .post',
        title: 'h2, h3, .blog-title',
        link: 'a'
      }
    },
    {
      name: 'Chainalysis',
      website: 'https://www.chainalysis.com/blog',
      rss: 'https://blog.chainalysis.com/feed/',
      twitter: 'chainalysis',
      category: '区块链分析'
    },
    {
      name: 'Elliptic',
      website: 'https://www.elliptic.co/blog',
      rss: 'https://www.elliptic.co/blog/rss.xml',
      twitter: 'elliptic',
      category: '区块链分析'
    },
    {
      name: 'TRM Labs',
      website: 'https://www.trmlabs.com/blog',
      rss: 'https://www.trmlabs.com/post/rss.xml',
      twitter: 'trmlabs',
      category: '区块链分析'
    }
  ],
  
  // 更新频率：每天早上8点（UTC+8）
  // Cron 格式：分 时 日 月 周
  // 0 0 * * * = UTC 时间每天 00:00 = 北京时间 08:00
  updateInterval: '0 0 * * *',
  
  // 数据保留天数：显示最近7天的消息
  dataRetentionDays: 7
};
