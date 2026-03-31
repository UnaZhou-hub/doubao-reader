// 应用主逻辑
class App {
    constructor() {
        this.currentPage = 'record';
        this.init();
    }

    init() {
        this.bindEvents();
        this.updateUI();
        this.renderCalendar();
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
        this.renderCalendar();

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

    // 日历渲染
    renderCalendar() {
        const learnedDates = Storage.getLearnedDates();
        const container = document.getElementById('calendar');
        const today = new Date();
        const currentMonth = today.getMonth();
        const currentYear = today.getFullYear();
        const todayStr = today.toLocaleDateString('zh-CN');

        // 获取当月第一天和最后一天
        const firstDay = new Date(currentYear, currentMonth, 1);
        const lastDay = new Date(currentYear, currentMonth + 1, 0);
        const startDay = firstDay.getDay(); // 0-6, 0是周日

        let html = '';

        // 填充空白天
        for (let i = 0; i < startDay; i++) {
            html += '<div class="calendar-day empty"></div>';
        }

        // 填充日期
        for (let day = 1; day <= lastDay.getDate(); day++) {
            const date = new Date(currentYear, currentMonth, day);
            const dateStr = date.toLocaleDateString('zh-CN');
            const isLearned = learnedDates.includes(dateStr);
            const isToday = dateStr === todayStr;

            let classes = 'calendar-day';
            if (isLearned) classes += ' learned';
            if (isToday) classes += ' today';

            html += `<div class="${classes}">${day}</div>`;
        }

        container.innerHTML = html;
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

        // 生成选项（1个正确答案 + 3个干扰项）
        const allWords = Storage.getWordBank();
        let options = [word];

        while (options.length < 4 && allWords.length >= 4) {
            const random = allWords[Math.floor(Math.random() * allWords.length)];
            if (!options.includes(random)) {
                options.push(random);
            }
        }

        options = this.shuffleArray(options);

        const container = document.getElementById('test-options');
        container.innerHTML = options.map(opt =>
            `<div class="test-option" onclick="app.checkAnswer('${opt}', '${word}')">${opt}</div>`
        ).join('');
    }

    checkAnswer(selected, correct) {
        const options = document.querySelectorAll('.test-option');
        options.forEach(opt => {
            opt.onclick = null;
            if (opt.textContent === correct) {
                opt.classList.add('correct');
            } else if (opt.textContent === selected) {
                opt.classList.add('wrong');
            }
        });

        if (selected === correct) {
            this.score++;
        }

        setTimeout(() => {
            this.currentQuestion++;
            if (this.currentQuestion >= this.testWords.length) {
                this.showTestResult();
            } else {
                this.showQuestion();
            }
        }, 500);
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
    }

    // 导出数据
    exportData() {
        const data = {
            wordBank: Storage.getWordBank(),
            records: Storage.getAllRecords(),
            exportDate: new Date().toISOString(),
            version: '1.0'
        };

        const jsonString = JSON.stringify(data, null, 2);
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
            try {
                const data = JSON.parse(e.target.result);

                // 验证数据格式
                if (!data.wordBank || !Array.isArray(data.wordBank)) {
                    throw new Error('数据格式错误');
                }

                // 询问是否覆盖
                if (!confirm(`导入将合并数据，当前字库有 ${Storage.getTotalWords()} 个字，导入文件有 ${data.wordBank.length} 个字。确定吗？`)) {
                    return;
                }

                // 合并数据
                let mergedCount = 0;
                data.wordBank.forEach(word => {
                    if (Storage.addWord(word)) {
                        mergedCount++;
                    }
                });

                // 合并记录
                if (data.records) {
                    const currentRecords = Storage.getAllRecords();
                    for (const [date, record] of Object.entries(data.records)) {
                        if (!currentRecords[date]) {
                            currentRecords[date] = record;
                        }
                    }
                    localStorage.setItem('records', JSON.stringify(currentRecords));
                }

                this.updateUI();
                this.renderCalendar();
                this.showToast(`导入成功！新增 ${mergedCount} 个字`);

            } catch (err) {
                this.showToast('导入失败：文件格式错误');
                console.error(err);
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

        setTimeout(() => toast.remove(), 2000);
    }
}

// 初始化应用
const app = new App();
