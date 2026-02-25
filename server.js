require('dotenv').config();
const express = require('express');
const path = require('path');
const fs = require('fs').promises;
const cron = require('node-cron');
const { fetchAllData } = require('./scripts/fetchData');
const { saveMockData } = require('./scripts/mockData');
const config = require('./config');

const app = express();
const PORT = process.env.PORT || 3000;

// 使用模拟数据模式
const USE_MOCK_DATA = process.env.USE_MOCK_DATA !== 'false';

app.use(express.static('public'));
app.use(express.json());

// API: 获取所有竞品数据
app.get('/api/competitors', async (req, res) => {
  try {
    const dataPath = path.join(__dirname, 'data', 'competitors.json');
    const data = await fs.readFile(dataPath, 'utf-8');
    const competitors = JSON.parse(data);
    
    // 添加配置信息
    const response = {
      competitors,
      config: {
        dataRetentionDays: config.dataRetentionDays,
        lastUpdated: competitors[Object.keys(competitors)[0]]?.lastUpdated || new Date().toISOString()
      }
    };
    
    res.json(response);
  } catch (error) {
    res.status(500).json({ error: '数据读取失败' });
  }
});

// API: 手动触发更新
app.post('/api/refresh', async (req, res) => {
  try {
    console.log('\n🔄 手动触发更新...');
    const data = USE_MOCK_DATA ? await saveMockData() : await fetchAllData();
    res.json({ success: true, data });
  } catch (error) {
    console.error('更新失败:', error);
    res.status(500).json({ error: '更新失败' });
  }
});

// 定时任务：每天早上8点（UTC 00:00 = 北京时间 08:00）
cron.schedule(config.updateInterval, () => {
  console.log('\n⏰ 定时更新触发 (每天早上8点)');
  if (USE_MOCK_DATA) {
    saveMockData().catch(console.error);
  } else {
    fetchAllData().catch(console.error);
  }
});

// 启动时执行一次数据抓取（如果数据文件不存在）
async function initializeData() {
  try {
    const dataPath = path.join(__dirname, 'data', 'competitors.json');
    await fs.access(dataPath);
    console.log('✓ 使用现有数据');
  } catch {
    console.log('⚠️  数据文件不存在，执行首次抓取...');
    if (USE_MOCK_DATA) {
      await saveMockData();
    } else {
      const proxy = process.env.HTTPS_PROXY || process.env.HTTP_PROXY;
      if (proxy) {
        console.log(`🔒 使用代理: ${proxy}\n`);
      }
      await fetchAllData();
    }
  }
}

initializeData().catch(console.error);

app.listen(PORT, '0.0.0.0', () => {
  console.log(`\n🚀 竞品监控平台运行中:`);
  console.log(`   本地访问: http://localhost:${PORT}`);
  console.log(`   局域网访问: http://你的IP地址:${PORT}`);
  console.log(`📊 自动更新: 每天早上 8:00 (UTC+8)`);
  console.log(`📅 数据保留: 最近 ${config.dataRetentionDays} 天`);
  console.log(`🌐 数据模式: ${USE_MOCK_DATA ? '模拟数据' : '真实抓取'}`);
  console.log(`💡 提示: 也可点击网页"刷新动态"按钮手动更新\n`);
});
