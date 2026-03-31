// 应用主逻辑
class App {
    constructor() {
        this.currentPage = 'record';
        this.init();
    }

    async init() {
        // 初始化存储（自动从 localStorage 加载旧数据）
        await Storage.init();

        // 检查是否有本地文件句柄
        const hasFileHandle = localStorage.getItem('fileHandle');
        if (!hasFileHandle && Storage.getTotalWords() > 0) {
            // 有数据但没有文件句柄，提示用户设置本地文件
            setTimeout(() => this.setupDataFile(), 1000);
        } else if (hasFileHandle && Storage.fileHandle) {
            this.showToast('已加载本地文件');
        }

        this.bindEvents();
        this.updateUI();
        this.renderAgeInfo();
    }

    async setupDataFile() {
        // 创建模态框让用户选择
        const modal = document.createElement('div');
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.8);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 2000;
        `;

        modal.innerHTML = `
            <div style="
                background: var(--bg-card);
                backdrop-filter: blur(20px);
                padding: 30px;
                border-radius: 25px;
                max-width: 400px;
                text-align: center;
                border: 1px solid rgba(255, 255, 255, 0.1);
                box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
            ">
                <div style="font-size: 48px; margin-bottom: 20px;">📁</div>
                <h2 style="
                    font-family: 'Orbitron', sans-serif;
                    font-size: 20px;
                    margin-bottom: 15px;
                    background: linear-gradient(135deg, #FF2E93 0%, #FF6B6B 100%);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                ">设置本地数据文件</h2>
                <p style="color: var(--text-secondary); margin-bottom: 25px; line-height: 1.6;">
                    选择一个本地文件保存数据，清除浏览器缓存不会丢失。<br>
                    <span style="color: #00D4FF;">⚡ 每次关闭自动保存，打开自动加载</span>
                </p>
                <div style="display: flex; flex-direction: column; gap: 12px;">
                    <button id="select-existing" style="
                        background: linear-gradient(135deg, #00D4FF 0%, #0066FF 100%);
                        color: white;
                        padding: 14px 24px;
                        border: none;
                        border-radius: 15px;
                        font-size: 16px;
                        font-family: 'Fredoka', sans-serif;
                        font-weight: 600;
                        cursor: pointer;
                    ">打开已有数据文件</button>
                    <button id="create-new" style="
                        background: linear-gradient(135deg, #FF2E93 0%, #FF6B6B 100%);
                        color: white;
                        padding: 14px 24px;
                        border: none;
                        border-radius: 15px;
                        font-size: 16px;
                        font-family: 'Fredoka', sans-serif;
                        font-weight: 600;
                        cursor: pointer;
                    ">创建新文件</button>
                    <button id="skip" style="
                        background: rgba(255, 255, 255, 0.1);
                        color: var(--text-secondary);
                        padding: 12px 24px;
                        border: none;
                        border-radius: 15px;
                        font-size: 14px;
                        font-family: 'Fredoka', sans-serif;
                        font-weight: 500;
                        cursor: pointer;
                    ">暂不设置（使用浏览器缓存）</button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        return new Promise((resolve) => {
            document.getElementById('select-existing').onclick = async () => {
                modal.remove();
                const success = await Storage.selectDataFile();
                if (success) {
                    const wordCount = Storage.getTotalWords();
                    const studyDays = Storage.getStudyDays();
                    this.showToast(`已加载 ${wordCount} 个字，${studyDays} 天学习记录`);
                } else {
                    this.showToast('使用浏览器缓存模式');
                }
                resolve();
            };

            document.getElementById('create-new').onclick = async () => {
                modal.remove();
                const success = await Storage.createNewFile();
                if (success) {
                    const wordCount = Storage.getTotalWords();
                    const studyDays = Storage.getStudyDays();
                    if (wordCount > 0 || studyDays > 200) {
                        this.showToast(`已保存 ${wordCount} 个字，${studyDays} 天学习记录`);
                    } else {
                        this.showToast('数据文件已创建');
                    }
                } else {
                    this.showToast('使用浏览器缓存模式');
                }
                resolve();
            };

            document.getElementById('skip').onclick = () => {
                modal.remove();
                this.showToast('使用浏览器缓存模式，数据仅在本地保存');
                resolve();
            };
        });
    }

    bindEvents() {
        // 导航切换
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', (e) => {
                this.switchPage(e.target.dataset.page);
            });
        });

        // 添加字
        document.getElementById('add-btn').addEventListener('click', () => this.addWords());
        document.getElementById('word-input').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.addWords();
        });

        // 搜索字
        document.getElementById('search-input').addEventListener('input', (e) => {
            this.renderWordBank(e.target.value);
        });

        // 导出/导入
        document.getElementById('export-btn').addEventListener('click', () => this.exportData());
        document.getElementById('import-btn').addEventListener('click', () => {
            document.getElementById('import-file').click();
        });
        document.getElementById('import-file').addEventListener('change', (e) => this.importData(e));

        // 开始测试
        document.getElementById('start-test').addEventListener('click', () => this.startTest());

        // 重新测试
        document.getElementById('restart-test').addEventListener('click', () => {
            document.getElementById('test-result').style.display = 'none';
            document.getElementById('start-test').style.display = 'block';
        });
    }

    switchPage(page) {
        this.currentPage = page;

        // 更新导航样式
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.toggle('active', item.dataset.page === page);
        });

        // 切换页面
        document.querySelectorAll('.page').forEach(p => {
            p.classList.toggle('active', p.id === `page-${page}`);
        });

        // 更新对应页面数据
        if (page === 'wordbank') this.renderWordBank();
        if (page === 'report') this.renderReport();
    }

    updateUI() {
        // 更新统计
        document.getElementById('total-count').textContent = Storage.getTotalWords();
        document.getElementById('bank-count').textContent = Storage.getTotalWords();

        // 更新最近学习
        this.renderRecentWords();
    }

    renderRecentWords() {
        const recentWords = Storage.getRecentWords(30);
        const container = document.getElementById('recent-list');

        if (recentWords.length === 0) {
            container.innerHTML = '<div class="empty">还没有学习记录，开始添加认识的字吧！</div>';
            return;
        }

        container.innerHTML = recentWords.map(word =>
            `<div class="word-item">${word}</div>`
        ).join('');
    }

    addWords() {
        const input = document.getElementById('word-input');
        const words = input.value.split(/[\s,，、]+/).filter(w => w.trim());

        if (words.length === 0) {
            this.showToast('请输入汉字');
            return;
        }

        let addedCount = 0;
        words.forEach(word => {
            if (Storage.addWord(word)) {
                addedCount++;
            }
        });

        input.value = '';
        this.updateUI();

        if (addedCount > 0) {
            this.showToast(`成功添加 ${addedCount} 个字`);
        } else {
            this.showToast('这些字已经学过啦');
        }
    }

    renderWordBank(keyword = '') {
        const words = Storage.searchWords(keyword);
        const container = document.getElementById('wordbank-list');

        if (words.length === 0) {
            container.innerHTML = '<div class="empty">字库空空如也，去识字记录页添加吧！</div>';
            return;
        }

        container.innerHTML = words.map(word =>
            `<div class="word-item" onclick="app.deleteWord('${word}')">${word}</div>`
        ).join('');
    }

    deleteWord(word) {
        if (confirm(`确定要删除"${word}"吗？`)) {
            Storage.removeWord(word);
            this.renderWordBank();
            this.updateUI();
            this.showToast('已删除');
        }
    }

    // 渲染年龄信息
    renderAgeInfo() {
        const ageText = Storage.getAgeText();

        // 更新识字记录页的统计信息
        const statsElement = document.getElementById('record-stats');
        if (statsElement) {
            statsElement.innerHTML = `已学 <span id="total-count">${Storage.getTotalWords()}</span> 个字 · ${ageText}`;
        }
    }

    // 测试功能
    startTest() {
        const words = Storage.getWordBank();
        const count = parseInt(document.getElementById('test-count').value);

        if (words.length < count) {
            this.showToast('字库字数不够，先多学几个字吧！');
            return;
        }

        // 随机选择题目
        this.testWords = this.shuffleArray([...words]).slice(0, count);
        this.currentQuestion = 0;
        this.score = 0;

        document.getElementById('start-test').style.display = 'none';
        document.getElementById('test-area').style.display = 'block';
        document.getElementById('total-questions').textContent = count;

        this.showQuestion();
    }

    showQuestion() {
        const word = this.testWords[this.currentQuestion];
        document.getElementById('current-question').textContent = this.currentQuestion + 1;
        document.getElementById('test-word').textContent = word;

        // 显示勾和叉按钮
        const container = document.getElementById('test-options');
        container.innerHTML = `
            <div class="test-actions">
                <button class="test-btn test-btn-correct" onclick="app.checkAnswer(true)">
                    <span class="test-btn-icon">✓</span>
                    <span class="test-btn-text">认识</span>
                </button>
                <button class="test-btn test-btn-wrong" onclick="app.checkAnswer(false)">
                    <span class="test-btn-icon">✗</span>
                    <span class="test-btn-text">不认识</span>
                </button>
            </div>
        `;
    }

    checkAnswer(isCorrect) {
        const btns = document.querySelectorAll('.test-btn');
        btns.forEach(btn => btn.onclick = null);

        if (isCorrect) {
            document.querySelector('.test-btn-correct').classList.add('selected-correct');
            this.score++;
        } else {
            document.querySelector('.test-btn-wrong').classList.add('selected-wrong');
        }

        setTimeout(() => {
            this.currentQuestion++;
            if (this.currentQuestion >= this.testWords.length) {
                this.showTestResult();
            } else {
                this.showQuestion();
            }
        }, 600);
    }

    showTestResult() {
        const total = this.testWords.length;
        const percentage = Math.round(this.score / total * 100);

        document.getElementById('test-area').style.display = 'none';
        document.getElementById('test-result').style.display = 'block';
        document.getElementById('final-score').textContent = this.score;
        document.getElementById('total-score').textContent = total;

        let message = '';
        if (percentage === 100) message = '⚡ 豆包变身！全对！迪迦之光闪耀！';
        else if (percentage >= 80) message = '🔥 好样的！赛罗之力觉醒！';
        else if (percentage >= 60) message = '⭐ 继续加油！奥特曼与你同在！';
        else message = '📚 多复习一下，能量快充满了！';

        document.getElementById('result-message').textContent = message;

        // 保存成绩
        Storage.saveTestScore(this.score, total);
    }

    renderReport() {
        document.getElementById('report-count').textContent = Storage.getTotalWords();
        document.getElementById('report-level').textContent = Storage.getLevel();
        document.getElementById('report-days').textContent = Storage.getStudyDays();
        document.getElementById('report-avg').textContent = Storage.getAvgWordsPerDay();

        // 添加小学水平显示
        const primaryLevel = Storage.getPrimaryLevel();
        const primaryLevelText = Storage.getPrimaryLevelText();

        // 在等级评定卡片下方添加小学水平卡片
        const reportContainer = document.getElementById('page-report');
        let primaryCard = document.getElementById('primary-level-card');

        if (!primaryCard) {
            primaryCard = document.createElement('div');
            primaryCard.id = 'primary-level-card';
            primaryCard.className = 'report-card';
            primaryCard.style.cssText = `
                display: block;
                background: var(--bg-card);
                backdrop-filter: blur(10px);
                -webkit-backdrop-filter: blur(10px);
                padding: 22px;
                border-radius: 20px;
                margin-bottom: 16px;
                border: 1px solid rgba(255, 255, 255, 0.1);
                box-shadow: 0 10px 40px rgba(0, 0, 0, 0.4);
            `;

            const levelGuide = document.querySelector('.level-guide');
            reportContainer.insertBefore(primaryCard, levelGuide);
        }

        primaryCard.innerHTML = `
            <div class="report-title" style="font-size: 15px; font-weight: 600; color: var(--text-secondary);">📚 小学水平</div>
            <div class="report-value" style="font-family: 'Orbitron', sans-serif; font-size: 24px; font-weight: 700; background: linear-gradient(135deg, #00D4FF 0%, #0066FF 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">${primaryLevel.name}</div>
            <div style="font-size: 14px; color: var(--text-secondary); margin-top: 8px;">${primaryLevel.description}</div>
            <div style="font-size: 13px; color: #FFD93D; margin-top: 6px;">${primaryLevelText}</div>
            <div style="margin-top: 12px; height: 4px; background: rgba(255, 255, 255, 0.1); border-radius: 2px; overflow: hidden;">
                <div style="height: 100%; background: linear-gradient(90deg, #FF2E93, #00D4FF); width: ${primaryLevel.progress}%; transition: width 0.5s;"></div>
            </div>
            <div style="font-size: 12px; color: var(--text-secondary); margin-top: 4px; text-align: right;">进度: ${Math.round(primaryLevel.progress)}%</div>
        `;

        // 添加年龄信息
        let ageCard = document.getElementById('age-info-card');
        if (!ageCard) {
            ageCard = document.createElement('div');
            ageCard.id = 'age-info-card';
            ageCard.className = 'report-card';
            ageCard.style.cssText = `
                display: flex;
                justify-content: space-between;
                align-items: center;
                background: var(--bg-card);
                backdrop-filter: blur(10px);
                -webkit-backdrop-filter: blur(10px);
                padding: 22px;
                border-radius: 20px;
                margin-bottom: 16px;
                border: 1px solid rgba(255, 255, 255, 0.1);
                box-shadow: 0 10px 40px rgba(0, 0, 0, 0.4);
            `;

            const levelGuide = document.querySelector('.level-guide');
            reportContainer.insertBefore(ageCard, levelGuide);
        }

        const ageText = Storage.getAgeText();
        const birthday = Storage.getBirthday();
        const birthdayDate = new Date(birthday);
        const birthdayText = `${birthdayDate.getFullYear()}年${birthdayDate.getMonth() + 1}月${birthdayDate.getDate()}日`;

        ageCard.innerHTML = `
            <div>
                <div class="report-title" style="font-size: 15px; font-weight: 600; color: var(--text-secondary);">👶 豆包年龄</div>
                <div style="font-size: 13px; color: var(--text-secondary); margin-top: 4px;">🎂 生日: ${birthdayText}</div>
            </div>
            <div class="report-value" style="font-family: 'Orbitron', sans-serif; font-size: 28px; font-weight: 700; background: linear-gradient(135deg, #FFD93D 0%, #FF9500 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">${ageText}</div>
        `;
    }

    // 导出数据
    exportData() {
        const jsonString = Storage.exportData();
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `豆包识字数据_${new Date().toLocaleDateString('zh-CN')}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        this.showToast('导出成功！');
    }

    // 导入数据
    importData(event) {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            const result = Storage.importData(e.target.result);

            if (result.success) {
                this.updateUI();
                        this.showToast(`导入成功！新增 ${result.mergedCount} 个字`);
            } else {
                this.showToast('导入失败：文件格式错误');
            }
        };
        reader.readAsText(file);

        // 清空文件输入
        event.target.value = '';
    }

    // 工具函数
    shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }

    showToast(message) {
        const existing = document.querySelector('.toast');
        if (existing) existing.remove();

        const toast = document.createElement('div');
        toast.className = 'toast';
        toast.textContent = message;
        document.body.appendChild(toast);

        setTimeout(() => {
            toast.classList.add('hide');
            setTimeout(() => toast.remove(), 300);
        }, 2000);
    }
}

// 初始化应用
const app = new App();
