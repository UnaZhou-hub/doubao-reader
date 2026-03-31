// 本地存储管理
const Storage = {
    // 获取字库
    getWordBank() {
        const data = localStorage.getItem('wordBank');
        return data ? JSON.parse(data) : [];
    },

    // 保存字库
    saveWordBank(wordBank) {
        localStorage.setItem('wordBank', JSON.stringify(wordBank));
    },

    // 添加字
    addWord(word) {
        const wordBank = this.getWordBank();
        const trimmedWord = word.trim();
        if (!trimmedWord) return false;
        if (wordBank.includes(trimmedWord)) return false;

        wordBank.push(trimmedWord);
        this.saveWordBank(wordBank);

        // 添加到今日记录
        const today = this.getToday();
        if (!today.words.includes(trimmedWord)) {
            today.words.push(trimmedWord);
            this.saveToday(today);
        }

        return true;
    },

    // 删除字
    removeWord(word) {
        let wordBank = this.getWordBank();
        wordBank = wordBank.filter(w => w !== word);
        this.saveWordBank(wordBank);
    },

    // 搜索字
    searchWords(keyword) {
        const wordBank = this.getWordBank();
        if (!keyword) return wordBank;
        return wordBank.filter(w => w.includes(keyword));
    },

    // 获取今日记录
    getToday() {
        const today = new Date().toLocaleDateString('zh-CN');
        const data = localStorage.getItem('records');
        const records = data ? JSON.parse(data) : {};
        if (!records[today]) {
            records[today] = { words: [], score: null };
            localStorage.setItem('records', JSON.stringify(records));
        }
        return records[today];
    },

    // 保存今日记录
    saveToday(today) {
        const dateKey = new Date().toLocaleDateString('zh-CN');
        const data = localStorage.getItem('records');
        const records = data ? JSON.parse(data) : {};
        records[dateKey] = today;
        localStorage.setItem('records', JSON.stringify(records));
    },

    // 获取所有记录
    getAllRecords() {
        const data = localStorage.getItem('records');
        return data ? JSON.parse(data) : {};
    },

    // 获取最近学习的字
    getRecentWords(count = 20) {
        const wordBank = this.getWordBank();
        // 返回最后添加的 count 个字
        return wordBank.slice(-count).reverse();
    },

    // 保存测试分数
    saveTestScore(score, total) {
        const today = this.getToday();
        today.score = { score, total, timestamp: Date.now() };
        this.saveToday(today);
    },

    // 获取学习天数
    getStudyDays() {
        const records = this.getAllRecords();
        return Object.keys(records).filter(date => {
            return records[date].words.length > 0;
        }).length;
    },

    // 获取总识字量
    getTotalWords() {
        return this.getWordBank().length;
    },

    // 获取平均每日学习量
    getAvgWordsPerDay() {
        const total = this.getTotalWords();
        const days = this.getStudyDays();
        return days > 0 ? Math.round(total / days) : 0;
    },

    // 获取等级
    getLevel() {
        const count = this.getTotalWords();
        if (count <= 50) return '⚡ 迪迦';
        if (count <= 200) return '🔥 赛罗';
        if (count <= 500) return '⭐ 梦比优斯';
        if (count <= 1000) return '💫 贝利亚';
        return '🌟 奥特之王';
    },

    // 获取本月学习日期
    getLearnedDates() {
        const records = this.getAllRecords();
        return Object.keys(records).filter(date => {
            return records[date].words.length > 0;
        });
    },

    // 清空所有数据
    clearAll() {
        localStorage.removeItem('wordBank');
        localStorage.removeItem('records');
    }
};
