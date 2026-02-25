let allData = {};
let currentCompetitor = 'all';
let searchQuery = '';
let dataConfig = {};

// 加载数据
async function loadData() {
  try {
    const response = await fetch('/api/competitors');
    const result = await response.json();
    allData = result.competitors;
    dataConfig = result.config;
    
    renderSidebar();
    renderUpdates();
    updateDataInfo();
    document.getElementById('loading').style.display = 'none';
  } catch (error) {
    document.getElementById('loading').textContent = '加载失败，请刷新页面';
  }
}

// 更新数据信息显示
function updateDataInfo() {
  const infoElement = document.getElementById('dataInfo');
  if (!infoElement || !dataConfig.lastUpdated) return;
  
  const lastUpdated = new Date(dataConfig.lastUpdated);
  const now = new Date();
  const diffHours = Math.floor((now - lastUpdated) / (1000 * 60 * 60));
  const diffDays = Math.floor(diffHours / 24);
  
  let timeAgo;
  if (diffHours < 1) {
    timeAgo = '刚刚更新';
  } else if (diffHours < 24) {
    timeAgo = `${diffHours}小时前更新`;
  } else {
    timeAgo = `${diffDays}天前更新`;
  }
  
  infoElement.innerHTML = `
    <span>📅 ${timeAgo}</span>
    <span>·</span>
    <span>保留最近 ${dataConfig.dataRetentionDays} 天</span>
  `;
}

// 渲染左侧边栏
function renderSidebar() {
  const container = document.getElementById('competitorsList');
  container.innerHTML = ''; // 清空容器，避免重复
  
  const competitors = Object.values(allData);
  
  // 计算总更新数
  const totalUpdates = competitors.reduce((sum, c) => sum + c.updates.length, 0);
  document.getElementById('totalCount').textContent = `${competitors.length} 家竞争对手追踪`;
  
  // 全部选项
  const allItem = document.createElement('div');
  allItem.className = `competitor-item ${currentCompetitor === 'all' ? 'active' : ''}`;
  allItem.onclick = () => selectCompetitor('all');
  allItem.innerHTML = `
    <div class="competitor-dot" style="background: #667eea;"></div>
    <div class="competitor-info">
      <div class="competitor-item-name">全部动态</div>
    </div>
    <div class="competitor-count">${totalUpdates}</div>
  `;
  container.appendChild(allItem);
  
  // 各竞品选项
  const colors = ['#ef4444', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#ec4899'];
  competitors.forEach((competitor, index) => {
    const item = document.createElement('div');
    item.className = `competitor-item ${currentCompetitor === competitor.name ? 'active' : ''}`;
    item.onclick = () => selectCompetitor(competitor.name);
    item.innerHTML = `
      <div class="competitor-dot" style="background: ${colors[index % colors.length]};"></div>
      <div class="competitor-info">
        <div class="competitor-item-name">${competitor.name}</div>
      </div>
      <div class="competitor-count">${competitor.updates.length}</div>
    `;
    container.appendChild(item);
  });
}

// 选择竞品
function selectCompetitor(name) {
  currentCompetitor = name;
  
  // 更新标题
  if (name === 'all') {
    document.getElementById('currentTitle').textContent = '全部动态';
    document.getElementById('currentSubtitle').textContent = '实时追踪竞争对手的最新动态';
  } else {
    const competitor = allData[name];
    document.getElementById('currentTitle').textContent = competitor.name;
    document.getElementById('currentSubtitle').textContent = `${competitor.category} · ${competitor.updates.length} 条更新`;
  }
  
  // 重新渲染
  renderSidebar();
  renderUpdates();
}

// 渲染更新列表
function renderUpdates() {
  const container = document.getElementById('updatesList');
  container.innerHTML = '';
  
  // 收集所有更新
  let allUpdates = [];
  if (currentCompetitor === 'all') {
    Object.values(allData).forEach(competitor => {
      competitor.updates.forEach(update => {
        allUpdates.push({
          ...update,
          competitorName: competitor.name,
          competitorCategory: competitor.category
        });
      });
    });
  } else {
    const competitor = allData[currentCompetitor];
    allUpdates = competitor.updates.map(update => ({
      ...update,
      competitorName: competitor.name,
      competitorCategory: competitor.category
    }));
  }
  
  // 搜索过滤
  if (searchQuery) {
    allUpdates = allUpdates.filter(update => 
      update.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (update.summary && update.summary.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  }
  
  // 按日期排序
  allUpdates.sort((a, b) => new Date(b.date) - new Date(a.date));
  
  // 显示结果
  if (allUpdates.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">📭</div>
        <p>暂无更新内容</p>
      </div>
    `;
    return;
  }
  
  // 渲染卡片
  allUpdates.forEach(update => {
    const card = document.createElement('div');
    card.className = 'update-card';
    
    const sourceIcon = update.source === 'Twitter' ? '🐦' : 
                      update.source === 'Blog' ? '📝' : '🌐';
    
    // 来源标签文本
    const sourceText = update.source === 'Twitter' ? 'TWITTER' :
                      update.source === 'Blog' ? 'BLOG' : 'WEBSITE';
    
    card.innerHTML = `
      <div class="update-header">
        <div class="update-icon">${sourceIcon}</div>
        <div class="update-content">
          <span class="update-source">${update.competitorName} · ${sourceText}</span>
          <h3 class="update-title">${update.title}</h3>
          ${update.summary ? `<p class="update-summary">${update.summary}</p>` : ''}
        </div>
      </div>
      <div class="update-footer">
        <span class="update-date">${formatDate(update.date)}</span>
        <a href="${update.link}" target="_blank" class="read-more">
          阅读原文 →
        </a>
      </div>
    `;
    
    container.appendChild(card);
  });
}

// 搜索处理
function handleSearch() {
  searchQuery = document.getElementById('searchInput').value;
  renderUpdates();
}

// 手动刷新
async function refreshData() {
  const btn = document.getElementById('refreshBtn');
  const originalHTML = btn.innerHTML;
  btn.innerHTML = '<span>⏳</span><span>刷新中...</span>';
  btn.disabled = true;
  
  try {
    await fetch('/api/refresh', { method: 'POST' });
    await loadData();
    btn.innerHTML = '<span>✓</span><span>刷新成功</span>';
  } catch (error) {
    btn.innerHTML = '<span>✗</span><span>刷新失败</span>';
  }
  
  setTimeout(() => {
    btn.innerHTML = originalHTML;
    btn.disabled = false;
  }, 2000);
}

// 格式化日期
function formatDate(dateString) {
  const date = new Date(dateString);
  const now = new Date();
  const diff = now - date;
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor(diff / (1000 * 60 * 60));
  
  if (hours < 1) return '刚刚';
  if (hours < 24) return `${hours}小时前`;
  if (days === 1) return '昨天';
  if (days < 7) return `${days}天前`;
  
  return date.toLocaleDateString('zh-CN', { 
    month: 'long', 
    day: 'numeric' 
  });
}

// 页面加载时执行
loadData();
