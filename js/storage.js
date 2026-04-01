// ========== Supabase 云同步配置 ==========
const SUPABASE_URL = 'https://pcrnnhwkbtbspppovxru.supabase.co'
const SUPABASE_KEY = 'sb_publishable_t7dgz22Yqd58Dx1isGi1aQ_FWlIlZJ2'

const { createClient } = supabase
const supabaseClient = createClient(SUPABASE_URL, SUPABASE_KEY)

function getDeviceId() {
    let id = localStorage.getItem('device_id')
    if (!id) {
        id = crypto.randomUUID()
        localStorage.setItem('device_id', id)
    }
    return id
}

async function syncToCloud(data) {
    try {
        const { error } = await supabaseClient.from('doubao_data').upsert({
            device_id: getDeviceId(),
            word_bank: data.wordBank,
            records: data.records,
            profile: data.profile,
            settings: data.settings,
            updated_at: new Date().toISOString()
        }, { onConflict: 'device_id' })
        if (error) console.error('云同步失败:', error)
        else console.log('已同步到云端')
    } catch (e) {
        console.error('云同步异常:', e)
    }
}

async function loadFromCloud() {
    try {
        const { data, error } = await supabaseClient
            .from('doubao_data')
            .select('*')
            .eq('device_id', getDeviceId())
            .single()
        if (error || !data) return null
        return {
            wordBank: data.word_bank || [],
            records: data.records || {},
            profile: data.profile || {},
            settings: data.settings || {}
        }
    } catch (e) {
        console.error('从云端加载失败:', e)
        return null
    }
}

// ========== 本地文件存储管理 - 使用 File System Access API ==========
const Storage = {
    // 数据结构
    data: {
        wordBank: [],
        records: {},
        profile: {
            name: '豆包',
            birthday: '2021-06-22'
        },
        settings: {
            initialStudyDays: 200
        }
    },
    fileHandle: null,
    isInitialized: false,

    // 初始化存储
    async init() {
        // 先从 localStorage 加载旧数据（保证数据不丢失）
        await this.loadFromLocalStorage();

        // 尝试获取持久化的文件句柄
        const handleData = localStorage.getItem('fileHandle');
        if (handleData) {
            try {
                // 尝试通过文件名获取持久化句柄
                // 注意：File System Access API 的持久化是通过 ID 来实现的
                const handleInfo = JSON.parse(handleData);
                this.fileHandle = handleInfo.handle;

                if (this.fileHandle) {
                    await this.loadFromFile();
                    console.log('已从本地文件加载');
                }
            } catch (e) {
                console.log('文件句柄已失效或不存在');
            }
        }

        // 从云端加载数据（云端数据优先，字库取最多的那份）
        const cloudData = await loadFromCloud()
        if (cloudData) {
            // 合并字库（取字数更多的）
            if (cloudData.wordBank.length >= this.data.wordBank.length) {
                this.data.wordBank = cloudData.wordBank
            }
            // 合并记录（云端有的本地没有的补进来）
            for (const [date, record] of Object.entries(cloudData.records)) {
                if (!this.data.records[date]) {
                    this.data.records[date] = record
                }
            }
            if (cloudData.profile && cloudData.profile.birthday) {
                this.data.profile = { ...this.data.profile, ...cloudData.profile }
            }
            console.log('已从云端加载数据')
        }

        this.isInitialized = true;
        return true;
    },

    // 标准化日期格式（需要在 loadFromLocalStorage 之前定义）
    normalizeDate(dateStr) {
        try {
            // 处理中文日期格式：2026年4月1日
            if (dateStr.includes('年') && dateStr.includes('月') && dateStr.includes('日')) {
                const match = dateStr.match(/(\d+)年(\d+)月(\d+)日/);
                if (match) {
                    const [, year, month, day] = match;
                    return `${year}/${parseInt(month)}/${parseInt(day)}`;
                }
            }

            // 处理斜杠格式：2026/4/1 或 2026/04/01
            const date = new Date(dateStr);
            if (isNaN(date.getTime())) {
                return dateStr; // 无法解析，返回原值
            }
            return `${date.getFullYear()}/${date.getMonth() + 1}/${date.getDate()}`;
        } catch (e) {
            return dateStr; // 解析失败，返回原值
        }
    },

    // 从 localStorage 加载旧数据
    async loadFromLocalStorage() {
        try {
            const oldWordBank = localStorage.getItem('wordBank');
            const oldRecords = localStorage.getItem('records');

            // 迁移字库
            if (oldWordBank) {
                const words = JSON.parse(oldWordBank);
                if (Array.isArray(words)) {
                    this.data.wordBank = words;
                    console.log(`从 localStorage 加载了 ${words.length} 个字`);
                }
            }

            // 迁移学习记录
            if (oldRecords) {
                const records = JSON.parse(oldRecords);
                // 迁移并转换旧格式日期
                for (const [oldDate, record] of Object.entries(records)) {
                    const newDate = this.normalizeDate(oldDate);
                    if (!this.data.records[newDate]) {
                        this.data.records[newDate] = record;
                    } else if (record.words) {
                        // 合并当天学习的字
                        record.words.forEach(word => {
                            if (!this.data.records[newDate].words.includes(word)) {
                                this.data.records[newDate].words.push(word);
                            }
                        });
                    }
                }
                console.log(`从 localStorage 加载了 ${Object.keys(records).length} 条学习记录`);
            }
        } catch (e) {
            console.error('从 localStorage 加载失败:', e);
        }
    },

    // 选择文件夹/文件
    async selectDataFile() {
        try {
            // 检查浏览器是否支持 File System Access API
            if (!window.showSaveFilePicker && !window.showOpenFilePicker) {
                alert('您的浏览器不支持本地文件存储功能，将使用浏览器缓存。');
                return false;
            }

            // 尝试打开现有文件
            try {
                const [handle] = await window.showOpenFilePicker({
                    types: [{
                        description: '豆包识字数据',
                        accept: { 'application/json': ['.json'] }
                    }],
                    multiple: false,
                    startIn: 'documents'
                });

                // 请求持久化权限
                const permission = await handle.requestPermission({ mode: 'readwrite' });
                if (permission !== 'granted') {
                    alert('需要文件读写权限才能保存数据');
                    return false;
                }

                this.fileHandle = handle;
                await this.saveFileHandle();
                await this.loadFromFile();
                return true;
            } catch (e) {
                if (e.name === 'AbortError') {
                    // 用户取消，创建新文件
                    return await this.createNewFile();
                }
                throw e;
            }
        } catch (e) {
            console.error('文件选择失败:', e);
            return false;
        }
    },

    // 创建新文件
    async createNewFile() {
        try {
            const handle = await window.showSaveFilePicker({
                suggestedName: '豆包识字数据.json',
                types: [{
                    description: '豆包识字数据',
                    accept: { 'application/json': ['.json'] }
                }],
                startIn: 'documents'
            });

            this.fileHandle = handle;
            await this.saveFileHandle();
            await this.saveToFile();

            return true;
        } catch (e) {
            if (e.name !== 'AbortError') {
                console.error('创建文件失败:', e);
            }
            return false;
        }
    },

    // 保存文件句柄到 localStorage
    async saveFileHandle() {
        // File System Access API 会自动持久化已授权的句柄
        // 我们保存一些元信息以便下次可以识别
        if (this.fileHandle) {
            try {
                // 尝试获取持久化 ID（如果浏览器支持）
                if (this.fileHandle.queryPermission) {
                    const permission = await this.fileHandle.queryPermission({ mode: 'readwrite' });
                    if (permission === 'granted') {
                        localStorage.setItem('fileHandle', JSON.stringify({
                            name: this.fileHandle.name,
                            timestamp: Date.now(),
                            handle: true // 标记有持久化句柄
                        }));
                    }
                }
            } catch (e) {
                console.log('无法保存文件句柄信息:', e);
            }
        }
    },

    // 从文件加载数据
    async loadFromFile() {
        if (!this.fileHandle) return false;

        try {
            const file = await this.fileHandle.getFile();
            const content = await file.text();
            const loadedData = JSON.parse(content);

            // 合并数据，保留现有数据结构
            this.data = {
                wordBank: loadedData.wordBank || [],
                records: loadedData.records || {},
                profile: loadedData.profile || this.data.profile,
                settings: loadedData.settings || this.data.settings
            };

            console.log('数据已从文件加载');
            return true;
        } catch (e) {
            console.error('加载文件失败:', e);
            return false;
        }
    },

    // 保存数据到文件
    async saveToFile() {
        if (!this.fileHandle) return false;

        try {
            const writable = await this.fileHandle.createWritable();
            await writable.write(JSON.stringify(this.data, null, 2));
            await writable.close();
            console.log('数据已保存到文件');
            return true;
        } catch (e) {
            console.error('保存文件失败:', e);
            return false;
        }
    },

    // 同时保存到文件、localStorage 和云端
    async saveAll() {
        // 保存到文件
        if (this.fileHandle) {
            await this.saveToFile();
        }

        // 同时保存到 localStorage 作为备份
        localStorage.setItem('wordBank', JSON.stringify(this.data.wordBank));
        localStorage.setItem('records', JSON.stringify(this.data.records));

        // 同步到云端
        await syncToCloud(this.data)
    },

    // ========== 字库操作 ==========

    getWordBank() {
        return this.data.wordBank || [];
    },

    saveWordBank(wordBank) {
        this.data.wordBank = wordBank;
        this.autoSave();
    },

    addWord(word) {
        const trimmedWord = word.trim();
        if (!trimmedWord) return false;
        if (this.data.wordBank.includes(trimmedWord)) return false;

        this.data.wordBank.push(trimmedWord);

        // 添加到今日记录
        const today = this.getToday();
        if (!today.words.includes(trimmedWord)) {
            today.words.push(trimmedWord);
        }

        this.autoSave();
        return true;
    },

    removeWord(word) {
        this.data.wordBank = this.data.wordBank.filter(w => w !== word);
        this.autoSave();
    },

    searchWords(keyword) {
        const wordBank = this.getWordBank();
        if (!keyword) return wordBank;
        return wordBank.filter(w => w.includes(keyword));
    },

    // ========== 学习记录操作 ==========

    getToday() {
        const now = new Date();
        const today = `${now.getFullYear()}/${now.getMonth() + 1}/${now.getDate()}`;
        if (!this.data.records[today]) {
            this.data.records[today] = { words: [], score: null };
        }
        return this.data.records[today];
    },

    getAllRecords() {
        return this.data.records || {};
    },

    saveTestScore(score, total) {
        const today = this.getToday();
        today.score = { score, total, timestamp: Date.now() };
        this.autoSave();
    },

    getRecentWords(count = 20) {
        return this.getWordBank().slice(-count).reverse();
    },

    getLearnedDates() {
        const records = this.getAllRecords();
        return Object.keys(records).filter(date => {
            return records[date].words && records[date].words.length > 0;
        });
    },

    // ========== 统计数据 ==========

    getTotalWords() {
        return this.getWordBank().length;
    },

    getStudyDays() {
        const records = this.getAllRecords();
        const initialDays = this.data.settings.initialStudyDays || 200;
        const activeDays = Object.keys(records).filter(date => {
            return records[date].words && records[date].words.length > 0;
        }).length;
        return initialDays + activeDays;
    },

    getAvgWordsPerDay() {
        const total = this.getTotalWords();
        const days = this.getStudyDays();
        return days > 0 ? Math.round(total / days) : 0;
    },

    // ========== 年龄计算 ==========

    getBirthday() {
        return this.data.profile.birthday;
    },

    setBirthday(birthday) {
        this.data.profile.birthday = birthday;
        this.autoSave();
    },

    getAge() {
        const birthday = new Date(this.data.profile.birthday);
        const today = new Date();
        let age = today.getFullYear() - birthday.getFullYear();
        const monthDiff = today.getMonth() - birthday.getMonth();

        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthday.getDate())) {
            age--;
        }

        return age;
    },

    getAgeText() {
        const age = this.getAge();
        const birthday = new Date(this.data.profile.birthday);
        const today = new Date();
        const monthDiff = today.getMonth() - birthday.getMonth();
        const dayDiff = today.getDate() - birthday.getDate();

        if (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) {
            // 还没过今年的生日
            return `${age}岁`;
        } else {
            // 已经过了这个月的生日
            const monthsSinceBirthday = monthDiff;
            if (monthsSinceBirthday === 0) {
                return `${age}岁`;
            }
            return `${age}岁${monthsSinceBirthday}个月`;
        }
    },

    // ========== 小学水平评估 ==========

    // 根据《义务教育语文课程标准》的识字要求
    getPrimaryLevel() {
        const count = this.getTotalWords();
        const age = this.getAge();

        const levels = [
            { name: '学前阶段', max: 300, description: '认识常用字' },
            { name: '小学一年级上', max: 500, description: '认识常用字400个左右' },
            { name: '小学一年级下', max: 800, description: '累计认识常用字700个左右' },
            { name: '小学二年级上', max: 1200, description: '累计认识常用字1000个左右' },
            { name: '小学二年级下', max: 1600, description: '累计认识常用字1600个左右' },
            { name: '小学三年级上', max: 2000, description: '累计认识常用字2000个左右' },
            { name: '小学三年级下', max: 2500, description: '累计认识常用字2500个左右' },
            { name: '小学四年级', max: 3000, description: '累计认识常用字3000个左右' },
            { name: '小学五年级', max: 3500, description: '累计认识常用字3500个左右' },
            { name: '小学六年级', max: 4000, description: '累计认识常用字4000个左右' },
            { name: '初中以上', max: Infinity, description: '已达到小学毕业水平' }
        ];

        let currentLevel = levels[0];
        let progress = 0;

        for (let i = 0; i < levels.length; i++) {
            const level = levels[i];
            const prevMax = i > 0 ? levels[i - 1].max : 0;

            if (count <= level.max) {
                currentLevel = level;
                progress = ((count - prevMax) / (level.max - prevMax)) * 100;
                break;
            }
        }

        return {
            name: currentLevel.name,
            description: currentLevel.description,
            progress: Math.min(100, Math.max(0, progress))
        };
    },

    getPrimaryLevelText() {
        const level = this.getPrimaryLevel();
        const age = this.getAge();
        const ageDiff = age - this.getAgeFromLevelName(level.name);

        let ageComment = '';
        if (ageDiff >= 1) {
            ageComment = `（${ageDiff}岁以上小朋友水平）`;
        } else if (ageDiff < -0.5) {
            ageComment = '（超越同龄人！）';
        } else {
            ageComment = '（符合年龄水平）';
        }

        return `${level.name}${ageComment}`;
    },

    getAgeFromLevelName(levelName) {
        const ageMap = {
            '学前阶段': 5,
            '小学一年级上': 6.5,
            '小学一年级下': 7,
            '小学二年级上': 7.5,
            '小学二年级下': 8,
            '小学三年级上': 8.5,
            '小学三年级下': 9,
            '小学四年级': 10,
            '小学五年级': 11,
            '小学六年级': 12
        };
        return ageMap[levelName] || 0;
    },

    // ========== 奥特曼等级 ==========

    getLevel() {
        const count = this.getTotalWords();
        if (count <= 50) return '⚡ 迪迦';
        if (count <= 200) return '🔥 赛罗';
        if (count <= 500) return '⭐ 梦比优斯';
        if (count <= 1000) return '💫 贝利亚';
        return '🌟 奥特之王';
    },

    // ========== 自动保存 ==========

    autoSave() {
        // 使用 requestAnimationFrame 防抖，避免频繁保存
        if (this._saveTimeout) {
            cancelAnimationFrame(this._saveTimeout);
        }
        this._saveTimeout = requestAnimationFrame(() => {
            this.saveAll();
        });
    },

    // 页面关闭前保存
    async beforeUnload() {
        console.log('页面即将关闭，保存数据...');
        await this.saveAll();
        return true;
    },

    // ========== 兼容 localStorage 的导出/导入 ==========

    exportData() {
        return JSON.stringify(this.data, null, 2);
    },

    importData(jsonString) {
        try {
            const data = JSON.parse(jsonString);

            if (!data.wordBank || !Array.isArray(data.wordBank)) {
                throw new Error('数据格式错误');
            }

            // 合并数据
            let mergedCount = 0;
            data.wordBank.forEach(word => {
                if (!this.data.wordBank.includes(word)) {
                    this.data.wordBank.push(word);
                    mergedCount++;
                }
            });

            // 合并记录
            if (data.records) {
                for (const [date, record] of Object.entries(data.records)) {
                    if (!this.data.records[date]) {
                        this.data.records[date] = record;
                    } else if (record.words) {
                        // 合并当天学习的字
                        record.words.forEach(word => {
                            if (!this.data.records[date].words.includes(word)) {
                                this.data.records[date].words.push(word);
                            }
                        });
                    }
                }
            }

            // 合并个人信息
            if (data.profile) {
                this.data.profile = { ...this.data.profile, ...data.profile };
            }

            if (data.settings) {
                this.data.settings = { ...this.data.settings, ...data.settings };
            }

            this.autoSave();
            return { success: true, mergedCount };
        } catch (e) {
            console.error('导入失败:', e);
            return { success: false, error: e.message };
        }
    },

    // ========== 清空数据 ==========

    clearAll() {
        this.data.wordBank = [];
        this.data.records = {};
        this.autoSave();
    }
};

// 页面关闭前自动保存
window.addEventListener('beforeunload', async (e) => {
    await Storage.beforeUnload();
});

// 页面隐藏时也保存（移动端常用）
document.addEventListener('visibilitychange', async () => {
    if (document.visibilityState === 'hidden') {
        await Storage.beforeUnload();
    }
});
