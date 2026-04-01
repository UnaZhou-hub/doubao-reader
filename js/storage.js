// ========== Supabase 云同步配置 ==========
const SUPABASE_URL = 'https://pcrnnhwkbtbspppovxru.supabase.co'
const SUPABASE_KEY = 'sb_publishable_t7dgz22Yqd58Dx1isGi1aQ_FWlIlZJ2'

const { createClient } = supabase
const supabaseClient = createClient(SUPABASE_URL, SUPABASE_KEY)

const FAMILY_ID = 'doubao-family'

async function syncToCloud(data) {
    try {
        const { error } = await supabaseClient.from('doubao_data').upsert({
            device_id: FAMILY_ID,
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
            .eq('device_id', FAMILY_ID)
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

// ========== 存储管理 ==========
const Storage = {
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
    isInitialized: false,

    async init() {
        const cloudData = await loadFromCloud()
        if (cloudData) {
            this.data = {
                wordBank: cloudData.wordBank,
                records: cloudData.records,
                profile: { ...this.data.profile, ...cloudData.profile },
                settings: { ...this.data.settings, ...cloudData.settings }
            }
            console.log('已从云端加载数据')
        }
        this.isInitialized = true
        return true
    },

    async saveAll() {
        await syncToCloud(this.data)
    },

    // ========== 字库操作 ==========

    getWordBank() {
        return this.data.wordBank || []
    },

    saveWordBank(wordBank) {
        this.data.wordBank = wordBank
        this.autoSave()
    },

    addWord(word) {
        const trimmedWord = word.trim()
        if (!trimmedWord) return false
        if (this.data.wordBank.includes(trimmedWord)) return false

        this.data.wordBank.push(trimmedWord)

        const today = this.getToday()
        if (!today.words.includes(trimmedWord)) {
            today.words.push(trimmedWord)
        }

        this.autoSave()
        return true
    },

    removeWord(word) {
        this.data.wordBank = this.data.wordBank.filter(w => w !== word)
        this.autoSave()
    },

    searchWords(keyword) {
        const wordBank = this.getWordBank()
        if (!keyword) return wordBank
        return wordBank.filter(w => w.includes(keyword))
    },

    // ========== 学习记录操作 ==========

    getToday() {
        const now = new Date()
        const today = `${now.getFullYear()}/${now.getMonth() + 1}/${now.getDate()}`
        if (!this.data.records[today]) {
            this.data.records[today] = { words: [], score: null }
        }
        return this.data.records[today]
    },

    getAllRecords() {
        return this.data.records || {}
    },

    saveTestScore(score, total) {
        const today = this.getToday()
        today.score = { score, total, timestamp: Date.now() }
        this.autoSave()
    },

    getRecentWords(count = 20) {
        return this.getWordBank().slice(-count).reverse()
    },

    getLearnedDates() {
        const records = this.getAllRecords()
        return Object.keys(records).filter(date => {
            return records[date].words && records[date].words.length > 0
        })
    },

    // ========== 统计数据 ==========

    getTotalWords() {
        return this.getWordBank().length
    },

    getStudyDays() {
        const records = this.getAllRecords()
        const initialDays = this.data.settings.initialStudyDays || 200
        const activeDays = Object.keys(records).filter(date => {
            return records[date].words && records[date].words.length > 0
        }).length
        return initialDays + activeDays
    },

    getAvgWordsPerDay() {
        const total = this.getTotalWords()
        const days = this.getStudyDays()
        return days > 0 ? Math.round(total / days) : 0
    },

    // ========== 年龄计算 ==========

    getBirthday() {
        return this.data.profile.birthday
    },

    setBirthday(birthday) {
        this.data.profile.birthday = birthday
        this.autoSave()
    },

    getAge() {
        const birthday = new Date(this.data.profile.birthday)
        const today = new Date()
        let age = today.getFullYear() - birthday.getFullYear()
        const monthDiff = today.getMonth() - birthday.getMonth()

        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthday.getDate())) {
            age--
        }

        return age
    },

    getAgeText() {
        const age = this.getAge()
        const birthday = new Date(this.data.profile.birthday)
        const today = new Date()
        const monthDiff = today.getMonth() - birthday.getMonth()
        const dayDiff = today.getDate() - birthday.getDate()

        if (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) {
            return `${age}岁`
        } else {
            const monthsSinceBirthday = monthDiff
            if (monthsSinceBirthday === 0) {
                return `${age}岁`
            }
            return `${age}岁${monthsSinceBirthday}个月`
        }
    },

    // ========== 小学水平评估 ==========

    getPrimaryLevel() {
        const count = this.getTotalWords()

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
        ]

        let currentLevel = levels[0]
        let progress = 0

        for (let i = 0; i < levels.length; i++) {
            const level = levels[i]
            const prevMax = i > 0 ? levels[i - 1].max : 0

            if (count <= level.max) {
                currentLevel = level
                progress = ((count - prevMax) / (level.max - prevMax)) * 100
                break
            }
        }

        return {
            name: currentLevel.name,
            description: currentLevel.description,
            progress: Math.min(100, Math.max(0, progress))
        }
    },

    getPrimaryLevelText() {
        const level = this.getPrimaryLevel()
        const age = this.getAge()
        const ageDiff = age - this.getAgeFromLevelName(level.name)

        let ageComment = ''
        if (ageDiff >= 1) {
            ageComment = `（${ageDiff}岁以上小朋友水平）`
        } else if (ageDiff < -0.5) {
            ageComment = '（超越同龄人！）'
        } else {
            ageComment = '（符合年龄水平）'
        }

        return `${level.name}${ageComment}`
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
        }
        return ageMap[levelName] || 0
    },

    // ========== 奥特曼等级 ==========

    getLevel() {
        const count = this.getTotalWords()
        if (count <= 50) return '⚡ 迪迦'
        if (count <= 200) return '🔥 赛罗'
        if (count <= 500) return '⭐ 梦比优斯'
        if (count <= 1000) return '💫 贝利亚'
        return '🌟 奥特之王'
    },

    // ========== 自动保存 ==========

    autoSave() {
        if (this._saveTimeout) {
            cancelAnimationFrame(this._saveTimeout)
        }
        this._saveTimeout = requestAnimationFrame(() => {
            this.saveAll()
        })
    },

    async beforeUnload() {
        await this.saveAll()
        return true
    },

    // ========== 导出/导入 ==========

    exportData() {
        return JSON.stringify(this.data, null, 2)
    },

    importData(jsonString) {
        try {
            const data = JSON.parse(jsonString)

            if (!data.wordBank || !Array.isArray(data.wordBank)) {
                throw new Error('数据格式错误')
            }

            let mergedCount = 0
            data.wordBank.forEach(word => {
                if (!this.data.wordBank.includes(word)) {
                    this.data.wordBank.push(word)
                    mergedCount++
                }
            })

            if (data.records) {
                for (const [date, record] of Object.entries(data.records)) {
                    if (!this.data.records[date]) {
                        this.data.records[date] = record
                    } else if (record.words) {
                        record.words.forEach(word => {
                            if (!this.data.records[date].words.includes(word)) {
                                this.data.records[date].words.push(word)
                            }
                        })
                    }
                }
            }

            if (data.profile) {
                this.data.profile = { ...this.data.profile, ...data.profile }
            }

            if (data.settings) {
                this.data.settings = { ...this.data.settings, ...data.settings }
            }

            this.autoSave()
            return { success: true, mergedCount }
        } catch (e) {
            console.error('导入失败:', e)
            return { success: false, error: e.message }
        }
    },

    // ========== 清空数据 ==========

    clearAll() {
        this.data.wordBank = []
        this.data.records = {}
        this.autoSave()
    }
}

window.addEventListener('beforeunload', async () => {
    await Storage.beforeUnload()
})

document.addEventListener('visibilitychange', async () => {
    if (document.visibilityState === 'hidden') {
        await Storage.beforeUnload()
    }
})
