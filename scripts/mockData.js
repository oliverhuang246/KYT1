// 模拟数据生成器（用于测试或无法访问外网时）
const fs = require('fs').promises;
const path = require('path');
const config = require('../config');

function generateMockData() {
  const mockArticles = [
    { 
      title: 'Beyond Defacements: Expanding Digital Threats in Geopolitical Conflicts',
      summary: '本文分析了地缘政治冲突(geopolitical conflicts)中不断扩大的数字威胁(digital threats)。除了传统的网站篡改(defacements)，威胁行为者(threat actor)正在采用更复杂的网络攻击(cyber attack)手段，包括针对关键基础设施(infrastructure)的攻击、数据泄露(data breach)和虚假信息传播。研究(research)显示，国家级(nation-state)黑客(hacker)组织越来越多地利用(exploit)这些手段来实现政治目标。',
      days: 1 
    },
    { 
      title: 'Q4 2025 Crypto Crime Report: Illicit Transaction Volume Reaches New High',
      summary: '最新季度报告(report)显示，加密货币(cryptocurrency)相关犯罪活动激增23%。勒索软件(ransomware)支付和暗网(darknet)市场交易(transaction)是主要驱动因素。调查(investigation)发现了新型洗钱(money laundering)技术，犯罪分子利用混币器(mixer)和去中心化交易所(exchange)来规避检测(detect)。执法(law enforcement)机构正在加强合作以应对这些威胁(threat)。',
      days: 3 
    },
    { 
      title: 'Strategic Partnership: Expanding Global AML Compliance Coverage',
      summary: '宣布(announce)与多家领先金融机构达成战略合作(partnership)，将反洗钱(AML)合规(compliance)监控能力扩展至50多个司法管辖区。新平台(platform)整合了先进的区块链(blockchain)分析(analysis)工具(tool)，可实时识别(identify)可疑交易(transaction)模式，帮助机构满足了解你的客户(KYC)要求并遵守制裁(sanctions)规定。',
      days: 5 
    },
    { 
      title: 'Operation DarkHunter: Inside the Largest Darknet Marketplace Takedown',
      summary: '深度分析(analysis)国际执法(law enforcement)行动如何成功摧毁(takedown)最大的暗网(dark web)市场之一。此次行动导致150余名网络犯罪分子(cybercriminal)被逮捕(arrest)，查获(seize)价值5000万美元的加密货币(crypto)。调查(investigation)揭示了该市场的运作机制，包括使用比特币(bitcoin)混币服务(tumbler)和加密通信工具(tool)来逃避检测(detect)。',
      days: 7 
    },
    { 
      title: 'AI-Powered Threat Intelligence: Next Generation Detection Platform',
      summary: '推出(launch)基于人工智能的威胁情报(threat intelligence)平台(platform)，具备实时威胁(threat)检测(detect)、自动风险评分和预测分析(analysis)功能。新系统可以识别(identify)高级持续性威胁(APT)、零日漏洞(zero-day)利用(exploit)和钓鱼攻击(phishing)活动。该工具(tool)帮助组织预防(prevent)和缓解(mitigate)网络安全(cybersecurity)风险。',
      days: 10 
    }
  ];

  const results = {};
  
  config.competitors.forEach(competitor => {
    const updates = mockArticles.map((article, index) => {
      const date = new Date();
      date.setDate(date.getDate() - article.days);
      
      return {
        title: article.title,
        summary: article.summary,
        link: `${competitor.website}#article-${index}`,
        date: date.toISOString(),
        source: index % 2 === 0 ? 'Blog' : 'Twitter'
      };
    });

    results[competitor.name] = {
      ...competitor,
      updates,
      lastUpdated: new Date().toISOString()
    };
  });

  return results;
}

async function saveMockData() {
  console.log('📝 生成模拟数据...\n');
  
  const data = generateMockData();
  
  const dataDir = path.join(__dirname, '../data');
  await fs.mkdir(dataDir, { recursive: true });
  await fs.writeFile(
    path.join(dataDir, 'competitors.json'),
    JSON.stringify(data, null, 2)
  );
  
  console.log('✅ 模拟数据生成完成！');
  console.log('💡 提示：这是测试数据，实际部署时需要配置代理或使用 RSS 聚合服务\n');
  
  return data;
}

if (require.main === module) {
  saveMockData().catch(console.error);
}

module.exports = { generateMockData, saveMockData };
