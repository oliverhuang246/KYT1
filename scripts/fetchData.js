const axios = require('axios');
const cheerio = require('cheerio');
const Parser = require('rss-parser');
const fs = require('fs').promises;
const path = require('path');
const config = require('../config');
const { getAxiosConfig, getProxyAgent } = require('./fetchWithProxy');

// 为 RSS Parser 配置代理
const parser = new Parser({
  requestOptions: getProxyAgent() ? {
    agent: getProxyAgent()
  } : {}
});

// 简单的中文翻译（基于关键词替换）
function translateToChineseSummary(text, maxLength = 200) {
  if (!text || text.length < 10) {
    return '暂无摘要';
  }

  // 提取前几句
  const sentences = text.split(/[.。!！?？\n]+/).filter(s => s.trim().length > 15);
  let summary = sentences.slice(0, 3).join('。 ');

  if (summary.length > maxLength) {
    summary = summary.substring(0, maxLength) + '...';
  }

  // 扩展的关键词翻译词典（200+ 词汇）
  const translations = {
    // 核心概念
    'blockchain': '区块链',
    'cryptocurrency': '加密货币',
    'crypto': '加密货币',
    'bitcoin': '比特币',
    'BTC': '比特币',
    'ethereum': '以太坊',
    'ETH': '以太坊',
    'digital asset': '数字资产',
    'digital assets': '数字资产',
    'token': '代币',
    'NFT': '非同质化代币',
    'DeFi': '去中心化金融',
    'smart contract': '智能合约',
    'stablecoin': '稳定币',
    'altcoin': '山寨币',
    'mining': '挖矿',
    'wallet address': '钱包地址',
    'private key': '私钥',
    'public key': '公钥',
    
    // 犯罪相关
    'ransomware': '勒索软件',
    'darknet': '暗网',
    'dark web': '暗网',
    'fraud': '欺诈',
    'scam': '诈骗',
    'money laundering': '洗钱',
    'illicit': '非法',
    'illegal': '违法',
    'criminal': '犯罪',
    'crime': '犯罪',
    'malware': '恶意软件',
    'phishing': '钓鱼攻击',
    'hacker': '黑客',
    'hack': '黑客攻击',
    'cybercrime': '网络犯罪',
    'cybercriminal': '网络犯罪分子',
    'terrorist financing': '恐怖融资',
    'drug trafficking': '毒品交易',
    'human trafficking': '人口贩卖',
    'extortion': '勒索',
    'theft': '盗窃',
    'stolen': '被盗',
    
    // 执法和调查
    'investigation': '调查',
    'arrest': '逮捕',
    'law enforcement': '执法机构',
    'police': '警方',
    'FBI': '联邦调查局',
    'agency': '机构',
    'agencies': '机构',
    'department': '部门',
    'seizure': '查获',
    'takedown': '摧毁',
    'prosecution': '起诉',
    'indictment': '起诉书',
    'conviction': '定罪',
    'sentence': '判决',
    'authorities': '当局',
    
    // 安全
    'cybersecurity': '网络安全',
    'security': '安全',
    'threat': '威胁',
    'attack': '攻击',
    'breach': '数据泄露',
    'vulnerability': '漏洞',
    'risk': '风险',
    'protection': '保护',
    'defense': '防御',
    'incident': '事件',
    'exploit': '漏洞利用',
    'zero-day': '零日漏洞',
    
    // 金融和交易
    'transaction': '交易',
    'transactions': '交易',
    'wallet': '钱包',
    'exchange': '交易所',
    'market': '市场',
    'trading': '交易',
    'payment': '支付',
    'transfer': '转账',
    'fund': '资金',
    'funds': '资金',
    'financial': '金融',
    'finance': '金融',
    'investment': '投资',
    'investor': '投资者',
    'revenue': '收入',
    'profit': '利润',
    'loss': '损失',
    'volume': '交易量',
    'liquidity': '流动性',
    
    // 合规监管
    'compliance': '合规',
    'compliant': '合规',
    'regulation': '监管',
    'regulatory': '监管',
    'AML': '反洗钱',
    'KYC': '了解你的客户',
    'KYT': '了解你的交易',
    'sanctions': '制裁',
    'audit': '审计',
    'audits': '审计',
    'policy': '政策',
    'framework': '框架',
    'standard': '标准',
    'guidelines': '指南',
    'requirements': '要求',
    
    // 报告和分析
    'report': '报告',
    'analysis': '分析',
    'research': '研究',
    'study': '研究',
    'data': '数据',
    'statistics': '统计',
    'findings': '发现',
    'insight': '洞察',
    'insights': '洞察',
    'trend': '趋势',
    'trends': '趋势',
    'pattern': '模式',
    'patterns': '模式',
    'metrics': '指标',
    
    // 活动和发布
    'conference': '大会',
    'event': '活动',
    'announce': '宣布',
    'announcement': '公告',
    'launch': '推出',
    'release': '发布',
    'introduce': '推出',
    'partnership': '合作',
    'collaboration': '协作',
    'webinar': '网络研讨会',
    'summit': '峰会',
    'speaker': '演讲者',
    'presentation': '演讲',
    'panel': '小组讨论',
    
    // 技术和平台
    'platform': '平台',
    'service': '服务',
    'tool': '工具',
    'software': '软件',
    'system': '系统',
    'network': '网络',
    'technology': '技术',
    'solution': '解决方案',
    'product': '产品',
    'feature': '功能',
    'features': '功能',
    'update': '更新',
    'upgrade': '升级',
    'integration': '集成',
    'API': '应用程序接口',
    'dashboard': '仪表板',
    'interface': '界面',
    
    // 组织和人物
    'company': '公司',
    'organization': '组织',
    'institution': '机构',
    'team': '团队',
    'expert': '专家',
    'professional': '专业人士',
    'customer': '客户',
    'client': '客户',
    'user': '用户',
    'member': '成员',
    'partner': '合作伙伴',
    'executive': '高管',
    'CEO': '首席执行官',
    'founder': '创始人',
    
    // 动作动词
    'achieve': '实现',
    'achieved': '实现了',
    'earn': '获得',
    'earned': '获得了',
    'receive': '获得',
    'received': '获得了',
    'award': '奖项',
    'commitment': '承诺',
    'develop': '开发',
    'developing': '开发',
    'hire': '招聘',
    'hiring': '招聘',
    'retain': '保留',
    'retaining': '保留',
    'expand': '扩展',
    'expanding': '扩展',
    'grow': '增长',
    'growing': '增长',
    'increase': '增加',
    'decrease': '减少',
    'improve': '改进',
    'enhance': '增强',
    'optimize': '优化',
    'detect': '检测',
    'identify': '识别',
    'track': '追踪',
    'trace': '追踪',
    'monitor': '监控',
    'prevent': '预防',
    'combat': '打击',
    'fight': '打击',
    'disrupt': '破坏',
    'investigate': '调查',
    'analyze': '分析',
    'discover': '发现',
    'reveal': '揭示',
    'uncover': '揭露',
    'expose': '曝光',
    
    // 描述词和形容词
    'traceable': '可追踪',
    'transparent': '透明',
    'consecutive': '连续',
    'significant': '重大',
    'major': '主要',
    'critical': '关键',
    'important': '重要',
    'essential': '必要',
    'effective': '有效',
    'efficient': '高效',
    'comprehensive': '全面',
    'advanced': '先进',
    'innovative': '创新',
    'sophisticated': '复杂',
    'complex': '复杂',
    'simple': '简单',
    'easy': '容易',
    'difficult': '困难',
    'challenging': '具有挑战性',
    'successful': '成功',
    'failed': '失败',
    'ongoing': '正在进行',
    'upcoming': '即将到来',
    'recent': '最近',
    'latest': '最新',
    'new': '新',
    'old': '旧',
    'global': '全球',
    'international': '国际',
    'domestic': '国内',
    'local': '本地',
    
    // 时间相关
    'years': '年',
    'year': '年',
    'months': '月',
    'month': '月',
    'weeks': '周',
    'week': '周',
    'days': '天',
    'day': '天',
    'today': '今天',
    'yesterday': '昨天',
    'tomorrow': '明天',
    'recently': '最近',
    'currently': '目前',
    'now': '现在',
    'future': '未来',
    'past': '过去',
    
    // 连接词和介词
    'through': '通过',
    'via': '通过',
    'with': '与',
    'without': '没有',
    'for': '为',
    'from': '从',
    'to': '到',
    'in': '在',
    'on': '在',
    'at': '在',
    'by': '由',
    'about': '关于',
    'regarding': '关于',
    'concerning': '关于',
    
    // 其他常用词
    'process': '流程',
    'processes': '流程',
    'procedure': '程序',
    'method': '方法',
    'approach': '方法',
    'strategy': '策略',
    'plan': '计划',
    'goal': '目标',
    'objective': '目标',
    'purpose': '目的',
    'result': '结果',
    'outcome': '结果',
    'impact': '影响',
    'effect': '影响',
    'benefit': '好处',
    'advantage': '优势',
    'challenge': '挑战',
    'issue': '问题',
    'problem': '问题',
    'concern': '关注',
    'matter': '事项',
    'case': '案例',
    'example': '例子',
    'instance': '实例',
    'clean': '清洁',
    'gold': '金',
    'medallion': '奖章',
    'veteran': '退伍军人',
    'veterans': '退伍军人',
    'labor': '劳工',
    'third': '第三',
    'move': '移动',
    'toward': '朝向',
    'towards': '朝向',
    'beyond': '超越',
    'digital': '数字',
    'footprint': '足迹',
    'defacement': '篡改',
    'defacements': '篡改'
  };

  // 执行翻译（按长度排序，先替换长词组）
  const sortedTranslations = Object.entries(translations).sort((a, b) => b[0].length - a[0].length);
  
  for (const [en, zh] of sortedTranslations) {
    // 使用单词边界匹配，避免部分匹配
    const regex = new RegExp(`\\b${en}\\b`, 'gi');
    summary = summary.replace(regex, zh);
  }

  // 清理多余空格
  summary = summary.replace(/\s+/g, ' ').trim();

  return summary || '暂无摘要';
}

// 缩短标题
function shortenTitle(title, maxLength = 80) {
  if (!title) return '无标题';
  if (title.length <= maxLength) return title;
  return title.substring(0, maxLength) + '...';
}

// 检查是否为转发或回复
function isRetweetOrReply(content, title) {
  if (!content && !title) return false;
  const text = (content + ' ' + title).toLowerCase();
  
  // 检测转发标记
  if (text.includes('rt @') || text.includes('retweeted') || text.startsWith('r to @')) {
    return true;
  }
  
  // 检测回复标记
  if (text.includes('replying to @') || text.includes('in reply to')) {
    return true;
  }
  
  return false;
}

// 检查是否为 thread
function isThread(content) {
  if (!content) return false;
  
  // Thread 通常包含多条推文，用特定分隔符
  const threadIndicators = [
    /\d+\/\d+/,  // 1/5, 2/5 这种格式
    /thread/i,
    /🧵/,
    /\n\n.*\n\n/  // 多个段落分隔
  ];
  
  return threadIndicators.some(pattern => pattern.test(content));
}

// 抓取 RSS 订阅
async function fetchRSS(url) {
  try {
    // 使用 WHATWG URL API 避免 deprecation 警告
    const parsedUrl = new URL(url);
    const feed = await parser.parseURL(parsedUrl.href);
    const items = [];
    
    for (const item of feed.items.slice(0, 5)) {
      const content = item.contentSnippet || item.content || item.summary || item.description || '';
      const summary = translateToChineseSummary(item.title + ' ' + content, 200);
      
      items.push({
        title: shortenTitle(item.title),
        summary,
        link: item.link,
        date: item.pubDate || item.isoDate || new Date().toISOString(),
        source: 'Blog'
      });
    }
    
    return items;
  } catch (error) {
    console.log(`⚠ RSS 抓取失败 ${url}`);
    return [];
  }
}

// 抓取网站新闻
async function fetchWebsite(url, selectors = {}) {
  try {
    const { data } = await axios.get(url, getAxiosConfig());
    const $ = cheerio.load(data);
    
    const articleSelector = selectors.article || 'article, .post, .news-item, .blog-post, [class*="article"]';
    const titleSelector = selectors.title || 'h2, h3, .title, [class*="title"]';
    const linkSelector = selectors.link || 'a';
    
    const articles = [];
    const elements = $(articleSelector).slice(0, 5);
    
    for (let i = 0; i < elements.length; i++) {
      const $elem = $(elements[i]);
      const title = $elem.find(titleSelector).first().text().trim();
      let link = $elem.find(linkSelector).first().attr('href');
      
      if (title && link) {
        if (!link.startsWith('http')) {
          const baseUrl = new URL(url);
          link = link.startsWith('/') ? `${baseUrl.origin}${link}` : `${url}/${link}`;
        }
        
        const excerpt = $elem.find('p, .excerpt, .summary, .description').first().text().trim();
        const summary = translateToChineseSummary(title + ' ' + excerpt, 200);
        
        articles.push({
          title: shortenTitle(title),
          summary,
          link,
          date: new Date().toISOString(),
          source: 'Website'
        });
      }
    }
    
    return articles;
  } catch (error) {
    console.log(`⚠ 网站抓取失败 ${url}`);
    return [];
  }
}

// 抓取 Twitter
async function fetchTwitter(username) {
  const mirrors = [
    'https://nitter.poast.org',
    'https://nitter.privacydev.net',
    'https://nitter.net'
  ];
  
  for (const mirror of mirrors) {
    try {
      const url = `${mirror}/${username}/rss`;
      const feed = await parser.parseURL(url);
      const items = [];
      
      for (const item of feed.items.slice(0, 10)) {
        const content = item.contentSnippet || item.content || '';
        const title = item.title || '';
        
        // 跳过转发和回复
        if (isRetweetOrReply(content, title)) {
          continue;
        }
        
        // 跳过 thread
        if (isThread(content)) {
          continue;
        }
        
        // 只提取第一条推文内容
        const firstTweet = content.split(/\n\n/)[0].trim();
        const summary = translateToChineseSummary(firstTweet, 150);
        
        items.push({
          title: shortenTitle(title || firstTweet.substring(0, 80)),
          summary,
          link: item.link.replace(mirror, 'https://twitter.com'),
          date: item.pubDate || item.isoDate || new Date().toISOString(),
          source: 'Twitter'
        });
        
        // 只取前5条有效推文
        if (items.length >= 5) break;
      }
      
      return items;
    } catch (error) {
      continue;
    }
  }
  
  console.log(`⚠ Twitter 抓取失败 @${username}`);
  return [];
}

// 主抓取函数
async function fetchAllData() {
  console.log('🔄 开始抓取竞品数据...\n');
  const results = {};
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - config.dataRetentionDays);
  
  for (const competitor of config.competitors) {
    console.log(`📡 抓取 ${competitor.name}...`);
    const data = [];
    
    // 抓取 RSS
    if (competitor.rss) {
      const rssData = await fetchRSS(competitor.rss);
      if (rssData.length > 0) {
        data.push(...rssData);
        console.log(`  ✓ RSS: ${rssData.length} 条`);
      }
    }
    
    // 抓取 Twitter
    if (competitor.twitter) {
      const twitterData = await fetchTwitter(competitor.twitter);
      if (twitterData.length > 0) {
        data.push(...twitterData);
        console.log(`  ✓ Twitter: ${twitterData.length} 条`);
      }
    }
    
    // 如果没有数据，尝试抓取网站
    if (data.length === 0 && competitor.website) {
      const webData = await fetchWebsite(competitor.website, competitor.selectors);
      if (webData.length > 0) {
        data.push(...webData);
        console.log(`  ✓ 网站: ${webData.length} 条`);
      }
    }
    
    // 去重
    const uniqueData = Array.from(
      new Map(data.map(item => [item.link, item])).values()
    );
    
    // 过滤掉超过保留天数的数据
    const filteredData = uniqueData.filter(item => {
      const itemDate = new Date(item.date);
      return itemDate >= cutoffDate;
    });
    
    results[competitor.name] = {
      ...competitor,
      updates: filteredData.sort((a, b) => new Date(b.date) - new Date(a.date)),
      lastUpdated: new Date().toISOString()
    };
    
    console.log(`  📊 总计: ${filteredData.length} 条更新（最近${config.dataRetentionDays}天）\n`);
  }
  
  // 保存数据
  const dataDir = path.join(__dirname, '../data');
  await fs.mkdir(dataDir, { recursive: true });
  await fs.writeFile(
    path.join(dataDir, 'competitors.json'),
    JSON.stringify(results, null, 2)
  );
  
  const totalUpdates = Object.values(results).reduce((sum, c) => sum + c.updates.length, 0);
  console.log(`✅ 数据抓取完成！共获取 ${totalUpdates} 条更新（最近${config.dataRetentionDays}天）\n`);
  return results;
}

// 如果直接运行此脚本
if (require.main === module) {
  fetchAllData().catch(console.error);
}

module.exports = { fetchAllData };
