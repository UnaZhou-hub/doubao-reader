// ========== Supabase 云同步配置 ==========
const SUPABASE_URL = 'https://pcrnnhwkbtbspppovxru.supabase.co'
const SUPABASE_KEY = 'sb_publishable_t7dgz22Yqd58Dx1isGi1aQ_FWlIlZJ2'

const { createClient } = supabase
const supabaseClient = createClient(SUPABASE_URL, SUPABASE_KEY)

const FAMILY_ID = 'doubao-family'

// ========== 识字卡片数据（识字闯关卡池）==========
const CARD_DATA = {
    skill_father_1: { name: '父之光线',    type: 'skill',  hero: 'father', rarity: 'legendary', desc: '奥特之父最强的光线技能' },
    skill_father_2: { name: '父亲披风',    type: 'skill',  hero: 'father', rarity: 'legendary', desc: '能反弹攻击的神奇披风' },
    skill_father_3: { name: '奥特之角',    type: 'skill',  hero: 'father', rarity: 'epic',      desc: '能吸收能量的双角' },
    skill_father_4: { name: '长老光线',    type: 'skill',  hero: 'father', rarity: 'epic',      desc: '光之国长老的力量' },
    skill_ace_1:    { name: '梅塔利姆光线', type: 'skill', hero: 'ace',    rarity: 'epic',      desc: '艾斯的招牌必杀光线' },
    skill_ace_2:    { name: '奥特断头刀',  type: 'skill',  hero: 'ace',    rarity: 'epic',      desc: '最著名的切割技能' },
    skill_ace_3:    { name: '宇宙五重光',  type: 'skill',  hero: 'ace',    rarity: 'rare',      desc: '五重光线同时发射' },
    skill_ace_4:    { name: '奥特圆盘刃',  type: 'skill',  hero: 'ace',    rarity: 'rare',      desc: '头顶发射的圆盘光刃' },
    skill_ace_5:    { name: '计时器射击',  type: 'skill',  hero: 'ace',    rarity: 'rare',      desc: '从计时器发射的能量' },
    skill_zero_1:   { name: '赛罗头镖',   type: 'skill',   hero: 'zero',   rarity: 'epic',      desc: '头顶的两个头镖武器' },
    skill_zero_2:   { name: '集束射线',   type: 'skill',   hero: 'zero',   rarity: 'rare',      desc: '双手交叉发射的光线' },
    skill_zero_3:   { name: '赛罗双射线', type: 'skill',   hero: 'zero',   rarity: 'rare',      desc: '双重光线攻击' },
    skill_zero_4:   { name: '究极光辉',   type: 'skill',   hero: 'zero',   rarity: 'legendary', desc: '究极形态的强力技能' },
    skill_zero_5:   { name: '赛罗飞踢',   type: 'skill',   hero: 'zero',   rarity: 'rare',      desc: '强力的跳跃飞踢' },
    skill_zero_6:   { name: '究极护盾',   type: 'skill',   hero: 'zero',   rarity: 'epic',      desc: '究极形态的防御反击技能' },
    skill_ginga_1:  { name: '银河光线',   type: 'skill',   hero: 'ginga',  rarity: 'rare',      desc: '银河的基本光线技能' },
    skill_ginga_2:  { name: '银河穿击',   type: 'skill',   hero: 'ginga',  rarity: 'rare',      desc: '穿透力极强的攻击' },
    skill_ginga_3:  { name: '银河雷电击', type: 'skill',   hero: 'ginga',  rarity: 'common',    desc: '雷电属性的攻击' },
    skill_geed_1:   { name: '毁灭爆裂',   type: 'skill',   hero: 'geed',   rarity: 'common',    desc: '捷德的招牌必杀技' },
    skill_geed_2:   { name: '十字冲击波', type: 'skill',   hero: 'geed',   rarity: 'common',    desc: '十字形冲击波' },
    skill_geed_3:   { name: '捷德屏障',   type: 'skill',   hero: 'geed',   rarity: 'common',    desc: '防御型技能' },
    weapon_father_1: { name: '奥特之剑',  type: 'weapon',  hero: 'father', rarity: 'legendary', desc: '光之国的圣剑' },
    weapon_father_2: { name: '父亲权杖',  type: 'weapon',  hero: 'father', rarity: 'legendary', desc: '象征领袖权力的权杖' },
    weapon_ace_1:   { name: '艾斯刀',    type: 'weapon',   hero: 'ace',    rarity: 'epic',      desc: '由光能量形成的刀刃' },
    weapon_ace_2:   { name: '奥特戒指',  type: 'weapon',   hero: 'ace',    rarity: 'epic',      desc: '可变大变小的神奇戒指' },
    weapon_ace_3:   { name: '艾斯屏障',  type: 'weapon',   hero: 'ace',    rarity: 'rare',      desc: '强力防御屏障' },
    weapon_zero_1:  { name: '赛罗头镖',  type: 'weapon',   hero: 'zero',   rarity: 'epic',      desc: '可组合成多种武器' },
    weapon_zero_2:  { name: '究极武装',  type: 'weapon',   hero: 'zero',   rarity: 'legendary', desc: '究极手镯变身武器' },
    weapon_zero_3:  { name: '究极之剑',  type: 'weapon',   hero: 'zero',   rarity: 'epic',      desc: '究极形态的圣剑' },
    weapon_ginga_1: { name: '银河火花',  type: 'weapon',   hero: 'ginga',  rarity: 'rare',      desc: '银河的变身道具' },
    weapon_ginga_2: { name: '银河圣剑',  type: 'weapon',   hero: 'ginga',  rarity: 'rare',      desc: '光能量形成的剑' },
    weapon_geed_1:  { name: '捷德升华器', type: 'weapon',  hero: 'geed',   rarity: 'common',    desc: '捷德的变身道具' },
    weapon_geed_2:  { name: '捷德之爪',  type: 'weapon',   hero: 'geed',   rarity: 'common',    desc: '爪型近战武器' },
}

// ========== 诗词卡片数据（古诗词闯关卡池）==========
const POEM_CARD_DATA = {
    skill_tiga_1:    { name: '泽佩利光线',   type: 'skill',  hero: 'tiga',   rarity: 'legendary', desc: '迪迦多重形态的最强光线' },
    skill_tiga_2:    { name: '天空形态',     type: 'skill',  hero: 'tiga',   rarity: 'epic',      desc: '速度特化的天空形态变身' },
    skill_tiga_3:    { name: '迪迦飞踢',     type: 'skill',  hero: 'tiga',   rarity: 'rare',      desc: '强力的旋转飞踢' },
    skill_tiga_4:    { name: '迪迦护盾',     type: 'skill',  hero: 'tiga',   rarity: 'common',    desc: '光能量凝聚而成的防护盾' },
    skill_mebius_1:  { name: '凤凰勇士光线', type: 'skill',  hero: 'mebius', rarity: 'legendary', desc: '凤凰勇士形态的究极技能' },
    skill_mebius_2:  { name: '梅比乌斯光线', type: 'skill',  hero: 'mebius', rarity: 'epic',      desc: '梦比优斯的招牌光线技能' },
    skill_mebius_3:  { name: '梦比优斯刀刃', type: 'skill',  hero: 'mebius', rarity: 'rare',      desc: '手臂变形的锋利刀刃' },
    skill_mebius_4:  { name: '勇士防护',     type: 'skill',  hero: 'mebius', rarity: 'common',    desc: '由伙伴友情汇聚的防护盾' },
    weapon_tiga_1:   { name: '迪迦手镯',     type: 'weapon', hero: 'tiga',   rarity: 'epic',      desc: '三种形态变换的神奇手镯' },
    weapon_tiga_2:   { name: '闪光环',       type: 'weapon', hero: 'tiga',   rarity: 'rare',      desc: '从额头射出的光能量环' },
    weapon_mebius_1: { name: '梦比优斯手镯', type: 'weapon', hero: 'mebius', rarity: 'epic',      desc: '变身与强化的核心道具' },
    weapon_mebius_2: { name: '勇士之剑',     type: 'weapon', hero: 'mebius', rarity: 'rare',      desc: '凤凰勇士形态专属圣剑' },
}

const BADGE_DATA = [
    { id: 'badge_1',  name: '初次胜利', emoji: '🏆', rarity: 'common',    desc: '开启英雄之路',   condition: { type: 'perfect', count: 1 } },
    { id: 'badge_2',  name: '小小英雄', emoji: '🌟', rarity: 'common',    desc: '卡片收藏家',     condition: { type: 'cards',   count: 5 } },
    { id: 'badge_3',  name: '字海启航', emoji: '⭐', rarity: 'common',    desc: '向着远方出发',   condition: { type: 'words',   count: 350 } },
    { id: 'badge_4',  name: '星光闪耀', emoji: '🌠', rarity: 'rare',      desc: '开始发光',       condition: { type: 'words',   count: 450 } },
    { id: 'badge_5',  name: '披荆斩棘', emoji: '🌙', rarity: 'rare',      desc: '坚持不懈',       condition: { type: 'streak',  count: 7 } },
    { id: 'badge_6',  name: '光芒万丈', emoji: '☀️', rarity: 'epic',      desc: '光芒四射',       condition: { type: 'words',   count: 600 } },
    { id: 'badge_7',  name: '完美主义', emoji: '💎', rarity: 'epic',      desc: '追求完美',       condition: { type: 'perfect', count: 10 } },
    { id: 'badge_8',  name: '热血战士', emoji: '🔥', rarity: 'rare',      desc: '勇往直前',       condition: { type: 'tests',   count: 50 } },
    { id: 'badge_9',  name: '宇宙英雄', emoji: '🌌', rarity: 'epic',      desc: '真正的英雄',     condition: { type: 'words',   count: 800 } },
    { id: 'badge_10', name: '传奇之路', emoji: '👑', rarity: 'legendary', desc: '传奇收藏家',     condition: { type: 'cards',   count: 30 } },
    { id: 'badge_11', name: '诗词初探', emoji: '📜', rarity: 'common',    desc: '踏上诗词之路',   condition: { type: 'poems',   count: 1 } },
    { id: 'badge_12', name: '诗词达人', emoji: '🎋', rarity: 'rare',      desc: '诗词信手拈来',   condition: { type: 'poems',   count: 10 } },
    { id: 'badge_13', name: '诗仙弟子', emoji: '🌸', rarity: 'epic',      desc: '光之国诗词传承者', condition: { type: 'poems',   count: 20 } },
]

const HERO_CONFIG = {
    geed:   { _key: 'geed',   name: '捷德',     color: '#E53E3E', subColor: '#1A1A2E', symbol: '○', title: '新生代英雄' },
    ginga:  { _key: 'ginga',  name: '银河',     color: '#C0C0C0', subColor: '#1E3A8A', symbol: '△', title: '未来之光' },
    zero:   { _key: 'zero',   name: '赛罗',     color: '#2563EB', subColor: '#1E1B4B', symbol: '◇', title: '最强战士' },
    ace:    { _key: 'ace',    name: '艾斯',     color: '#DC2626', subColor: '#1E3A5F', symbol: '⌐', title: '光线王' },
    father: { _key: 'father', name: '奥特之父', color: '#D97706', subColor: '#1C1917', symbol: '♛', title: '光之国最高领袖' },
    tiga:   { _key: 'tiga',   name: '迪迦',     color: '#9B59B6', subColor: '#2C1654', symbol: '▽', title: '多重形态英雄' },
    mebius: { _key: 'mebius', name: '梦比优斯', color: '#E67E22', subColor: '#7D1F00', symbol: '❧', title: '凤凰勇士' },
}

const RARITY_CONFIG = {
    common:    { name: '普通', color: '#9CA3AF', bg: 'linear-gradient(135deg, #374151, #1F2937)', stars: '★',    glow: 'rgba(156,163,175,0.4)' },
    rare:      { name: '稀有', color: '#3B82F6', bg: 'linear-gradient(135deg, #1D4ED8, #1E3A8A)', stars: '★★',   glow: 'rgba(59,130,246,0.5)' },
    epic:      { name: '史诗', color: '#A855F7', bg: 'linear-gradient(135deg, #7C3AED, #4C1D95)', stars: '★★★',  glow: 'rgba(168,85,247,0.6)' },
    legendary: { name: '传说', color: '#F59E0B', bg: 'linear-gradient(135deg, #D97706, #92400E)', stars: '★★★★', glow: 'rgba(245,158,11,0.7)' },
}

// ========== 工具函数 ==========

// 升级需要识字量和古诗词背诵量同时满足
function getUltramanLevel(wordCount, poemCount = 0) {
    if (wordCount >= 600 && poemCount >= 20) return 'father'
    if (wordCount >= 400 && poemCount >= 15) return 'ace'
    if (wordCount >= 300 && poemCount >= 10) return 'zero'
    if (wordCount >= 200 && poemCount >= 5)  return 'ginga'
    return 'geed'
}

function getTodayStr() {
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
}

// ========== 云同步 ==========
async function syncToCloud(data) {
    try {
        const { error } = await supabaseClient.from('doubao_data').upsert({
            device_id: FAMILY_ID,
            word_bank: data.wordBank,
            records: data.records,
            profile: data.profile,
            settings: data.settings,
            poems: data.poems,
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
            settings: data.settings || {},
            poems: data.poems || [],
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
        poems: [],
        profile: {
            name: '豆包',
            birthday: '2021-06-22',
            currentLevel: 'geed',
            levelUnlockedAt: null,
            collectedCards: [],
            lastWordCardDate: null,
            lastPoemCardDate: null,
            totalTests: 0,
            perfectCount: 0,
            streakDays: 0,
            lastStudyDate: null,
            totalCardsCollected: 0,
            wordMilestones: [],
            unlockedBadges: [],
        },
        settings: {
            initialStudyDays: 200
        }
    },
    isInitialized: false,

    async init() {
        const cloudData = await loadFromCloud()
        if (cloudData) {
            const defaultProfile = { ...this.data.profile }
            this.data = {
                wordBank: cloudData.wordBank,
                records: cloudData.records,
                poems: cloudData.poems || [],
                profile: { ...defaultProfile, ...cloudData.profile },
                settings: { ...this.data.settings, ...cloudData.settings }
            }
            // 迁移旧的 lastCardDate 字段
            if (this.data.profile.lastCardDate && !this.data.profile.lastWordCardDate) {
                this.data.profile.lastWordCardDate = this.data.profile.lastCardDate
                delete this.data.profile.lastCardDate
            }
            console.log('已从云端加载数据')
        }
        // 始终根据识字量和古诗词数量重新计算等级
        const poemCount = this._getMemorizedPoemCount()
        this.data.profile.currentLevel = getUltramanLevel(this.data.wordBank.length, poemCount)
        this.isInitialized = true
        return true
    },

    async saveAll() {
        await syncToCloud(this.data)
    },

    autoSave() {
        this.saveAll()
    },

    // ========== 字库操作 ==========

    getWordBank() {
        return this.data.wordBank || []
    },

    saveWordBank(wordBank) {
        this.data.wordBank = wordBank
        this.autoSave()
    },

    // 返回 { added, levelUp, milestoneCard, newBadges }
    addWord(word) {
        const trimmedWord = word.trim()
        if (!trimmedWord) return { added: false }
        if (this.data.wordBank.includes(trimmedWord)) return { added: false }

        const prevCount = this.data.wordBank.length
        this.data.wordBank.push(trimmedWord)

        const today = this.getToday()
        if (!today.words.includes(trimmedWord)) {
            today.words.push(trimmedWord)
        }

        const newCount = this.data.wordBank.length
        this._updateStreak()

        const poemCount = this._getMemorizedPoemCount()
        const prevLevel = this.data.profile.currentLevel
        const newLevel = getUltramanLevel(newCount, poemCount)
        let levelUp = null
        if (newLevel !== prevLevel) {
            this.data.profile.currentLevel = newLevel
            this.data.profile.levelUnlockedAt = getTodayStr()
            levelUp = { from: prevLevel, to: newLevel }
        }

        // 检查识字量里程碑（每100字，从200开始）
        let milestoneCard = null
        const milestones = this.data.profile.wordMilestones || []
        const milestone = Math.floor(newCount / 100) * 100
        if (milestone >= 200 && !milestones.includes(milestone) && newCount >= milestone && prevCount < milestone) {
            milestones.push(milestone)
            this.data.profile.wordMilestones = milestones
            milestoneCard = this._drawAndAddCard('word')
        }

        const newBadges = this._checkBadges()
        this.autoSave()
        return { added: true, levelUp, milestoneCard, newBadges }
    },

    removeWord(word) {
        this.data.wordBank = this.data.wordBank.filter(w => w !== word)
        const poemCount = this._getMemorizedPoemCount()
        this.data.profile.currentLevel = getUltramanLevel(this.data.wordBank.length, poemCount)
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

    // 识字闯关结果，返回 { isPerfect, cardAwarded, newBadges }
    saveTestScore(score, total) {
        const today = this.getToday()
        today.score = { score, total, timestamp: Date.now() }

        this.data.profile.totalTests = (this.data.profile.totalTests || 0) + 1
        const isPerfect = score === total
        this._updateStreak()

        let cardAwarded = null
        if (isPerfect) {
            this.data.profile.perfectCount = (this.data.profile.perfectCount || 0) + 1
            const todayStr = getTodayStr()
            if (this.data.profile.lastWordCardDate !== todayStr) {
                this.data.profile.lastWordCardDate = todayStr
                cardAwarded = this._drawAndAddCard('word')
            }
        }

        const newBadges = this._checkBadges()
        this.autoSave()
        return { isPerfect, cardAwarded, newBadges }
    },

    // 古诗词闯关结果，返回 { isPerfect, cardAwarded, newBadges }
    savePoemTestScore(score, total) {
        this.data.profile.totalTests = (this.data.profile.totalTests || 0) + 1
        const isPerfect = score === total
        this._updateStreak()

        let cardAwarded = null
        if (isPerfect) {
            this.data.profile.perfectCount = (this.data.profile.perfectCount || 0) + 1
            const todayStr = getTodayStr()
            if (this.data.profile.lastPoemCardDate !== todayStr) {
                this.data.profile.lastPoemCardDate = todayStr
                cardAwarded = this._drawAndAddCard('poem')
            }
        }

        const newBadges = this._checkBadges()
        this.autoSave()
        return { isPerfect, cardAwarded, newBadges }
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

    // ========== 诗词操作 ==========

    getPoems() {
        return this.data.poems || []
    },

    searchPoems(keyword) {
        const poems = this.getPoems()
        if (!keyword) return poems
        return poems.filter(p =>
            p.title.includes(keyword) ||
            (p.author && p.author.includes(keyword)) ||
            p.lines.some(l => l.includes(keyword))
        )
    },

    addPoem(poemData) {
        const { title, author, dynasty, content } = poemData
        if (!title || !content) return { added: false }

        const lines = content.split(/\n/).map(l => l.trim()).filter(l => l.length > 0)
        if (lines.length < 2) return { added: false, error: '诗词至少需要两句' }

        const poem = {
            id: Date.now().toString(),
            title: title.trim(),
            author: author ? author.trim() : '',
            dynasty: dynasty ? dynasty.trim() : '',
            lines,
            addedAt: getTodayStr(),
        }
        const prevLevel = this.data.profile.currentLevel
        this.data.poems.push(poem)
        this._updateStreak()

        // 检查是否因诗词数量增加而升级
        const newLevel = getUltramanLevel(this.data.wordBank.length, this._getMemorizedPoemCount())
        let levelUp = null
        if (newLevel !== prevLevel) {
            this.data.profile.currentLevel = newLevel
            this.data.profile.levelUnlockedAt = getTodayStr()
            levelUp = { from: prevLevel, to: newLevel }
        }

        const newBadges = this._checkBadges()
        this.autoSave()
        return { added: true, poem, levelUp, newBadges }
    },

    updatePoem(id, poemData) {
        const poem = this.data.poems.find(p => p.id === id)
        if (!poem) return { updated: false }
        const { title, author, dynasty, content } = poemData
        if (!title || !content) return { updated: false }
        const lines = content.split(/\n/).map(l => l.trim()).filter(l => l.length > 0)
        if (lines.length < 2) return { updated: false, error: '诗词至少需要两句' }
        poem.title = title.trim()
        poem.author = author ? author.trim() : ''
        poem.dynasty = dynasty ? dynasty.trim() : ''
        poem.lines = lines
        this.autoSave()
        return { updated: true }
    },

    deletePoem(id) {
        this.data.poems = this.data.poems.filter(p => p.id !== id)
        // 重新计算等级（可能因诗词减少而降级）
        const poemCount = this._getMemorizedPoemCount()
        this.data.profile.currentLevel = getUltramanLevel(this.data.wordBank.length, poemCount)
        this.autoSave()
    },

    getRecentPoems(count = 5) {
        return [...this.getPoems()].reverse().slice(0, count)
    },

    _getMemorizedPoemCount() {
        return (this.data.poems || []).length
    },

    getMemorizedPoemCount() {
        return this._getMemorizedPoemCount()
    },

    // ========== 卡片操作 ==========

    // pool: 'word' | 'poem'
    _drawAndAddCard(pool = 'word') {
        const roll = Math.random() * 100
        let rarity
        if (roll < 5) rarity = 'legendary'
        else if (roll < 20) rarity = 'epic'
        else if (roll < 50) rarity = 'rare'
        else rarity = 'common'

        const source = pool === 'poem' ? POEM_CARD_DATA : CARD_DATA
        const candidates = Object.keys(source).filter(id => source[id].rarity === rarity)
        if (candidates.length === 0) return null
        const cardId = candidates[Math.floor(Math.random() * candidates.length)]
        this._addCollectedCard(cardId)
        return cardId
    },

    _addCollectedCard(cardId) {
        const today = getTodayStr()
        if (!this.data.profile.collectedCards) this.data.profile.collectedCards = []
        const existing = this.data.profile.collectedCards.find(c => c.id === cardId)
        if (existing) {
            existing.count++
            existing.lastObtainedAt = today
        } else {
            this.data.profile.collectedCards.push({
                id: cardId, count: 1,
                firstObtainedAt: today, lastObtainedAt: today
            })
        }
        this.data.profile.totalCardsCollected = (this.data.profile.totalCardsCollected || 0) + 1
    },

    getCollectedCard(cardId) {
        return (this.data.profile.collectedCards || []).find(c => c.id === cardId) || null
    },

    getTotalUniqueCards() {
        return (this.data.profile.collectedCards || []).length
    },

    // 根据 cardId 找卡片数据（同时查两个卡池）
    getCardData(cardId) {
        return CARD_DATA[cardId] || POEM_CARD_DATA[cardId] || null
    },

    // ========== 徽章检查 ==========

    _checkBadges() {
        const unlocked = this.data.profile.unlockedBadges || []
        const newBadges = []
        const profile = this.data.profile
        const wordCount = this.data.wordBank.length
        const today = getTodayStr()

        for (const badge of BADGE_DATA) {
            if (unlocked.find(b => b.id === badge.id)) continue
            const { type, count } = badge.condition
            let met = false
            if (type === 'words')   met = wordCount >= count
            if (type === 'perfect') met = (profile.perfectCount || 0) >= count
            if (type === 'tests')   met = (profile.totalTests || 0) >= count
            if (type === 'streak')  met = (profile.streakDays || 0) >= count
            if (type === 'cards')   met = (profile.totalCardsCollected || 0) >= count
            if (type === 'poems')   met = this._getMemorizedPoemCount() >= count
            if (met) {
                unlocked.push({ id: badge.id, unlockedAt: today })
                newBadges.push(badge.id)
            }
        }
        this.data.profile.unlockedBadges = unlocked
        return newBadges
    },

    getBadgeProgress(badge) {
        const { type, count } = badge.condition
        const profile = this.data.profile
        let current = 0
        if (type === 'words')   current = this.data.wordBank.length
        if (type === 'perfect') current = profile.perfectCount || 0
        if (type === 'tests')   current = profile.totalTests || 0
        if (type === 'streak')  current = profile.streakDays || 0
        if (type === 'cards')   current = profile.totalCardsCollected || 0
        if (type === 'poems')   current = this._getMemorizedPoemCount()
        return { current: Math.min(current, count), total: count }
    },

    // ========== Streak 更新 ==========

    _updateStreak() {
        const today = getTodayStr()
        const last = this.data.profile.lastStudyDate
        if (last === today) return

        if (last) {
            const lastDate = new Date(last)
            const todayDate = new Date(today)
            const diff = (todayDate - lastDate) / (1000 * 60 * 60 * 24)
            if (diff === 1) {
                this.data.profile.streakDays = (this.data.profile.streakDays || 0) + 1
            } else {
                this.data.profile.streakDays = 1
            }
        } else {
            this.data.profile.streakDays = 1
        }
        this.data.profile.lastStudyDate = today
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

    // ========== 奥特曼等级 ==========

    getUltramanLevel() {
        return this.data.profile.currentLevel
    },

    // 下一个等级需要的进度信息
    getNextLevelInfo() {
        const wordCount = this.getTotalWords()
        const poemCount = this._getMemorizedPoemCount()

        // 等级列表（按从低到高排序）
        const levels = [
            { key: 'geed',   minWords: 0,   minPoems: 0 },
            { key: 'ginga',  minWords: 200, minPoems: 5 },
            { key: 'zero',   minWords: 300, minPoems: 10 },
            { key: 'ace',    minWords: 400, minPoems: 15 },
            { key: 'father', minWords: 600, minPoems: 20 },
        ]

        // 先找到当前等级
        let currentLevelIndex = 0
        for (let i = levels.length - 1; i >= 0; i--) {
            const lvl = levels[i]
            if (wordCount >= lvl.minWords && poemCount >= lvl.minPoems) {
                currentLevelIndex = i
                break
            }
        }

        // 下一个等级
        const nextIndex = currentLevelIndex + 1
        if (nextIndex >= levels.length) {
            return null // 满级
        }

        const next = levels[nextIndex]
        return {
            targetKey: next.key,
            neededWords: Math.max(0, next.minWords - wordCount),
            neededPoems: Math.max(0, next.minPoems - poemCount),
            targetWords: next.minWords,
            targetPoems: next.minPoems,
        }
    },

    // ========== 年龄计算 ==========

    getBirthday() {
        return this.data.profile.birthday
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

    // ========== 小学水平评估 ==========

    getPrimaryLevel() {
        const count = this.getTotalWords()
        const levels = [
            { name: '学前阶段',     max: 300,      description: '认识常用字' },
            { name: '小学一年级上', max: 500,      description: '认识常用字400个左右' },
            { name: '小学一年级下', max: 800,      description: '累计认识常用字700个左右' },
            { name: '小学二年级上', max: 1200,     description: '累计认识常用字1000个左右' },
            { name: '小学二年级下', max: 1600,     description: '累计认识常用字1600个左右' },
            { name: '小学三年级上', max: 2000,     description: '累计认识常用字2000个左右' },
            { name: '小学三年级下', max: 2500,     description: '累计认识常用字2500个左右' },
            { name: '小学四年级',   max: 3000,     description: '累计认识常用字3000个左右' },
            { name: '小学五年级',   max: 3500,     description: '累计认识常用字3500个左右' },
            { name: '小学六年级',   max: 4000,     description: '累计认识常用字4000个左右' },
            { name: '初中以上',     max: Infinity, description: '已达到小学毕业水平' },
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
        return { name: currentLevel.name, description: currentLevel.description, progress: Math.min(100, Math.max(0, progress)) }
    },

    // ========== 导出/导入 ==========

    exportData() {
        return JSON.stringify(this.data, null, 2)
    },

    importData(jsonString) {
        try {
            const data = JSON.parse(jsonString)
            if (!data.wordBank || !Array.isArray(data.wordBank)) throw new Error('数据格式错误')
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
            if (data.poems && Array.isArray(data.poems)) {
                data.poems.forEach(poem => {
                    if (!this.data.poems.find(p => p.id === poem.id)) {
                        this.data.poems.push(poem)
                    }
                })
            }
            if (data.profile) this.data.profile = { ...this.data.profile, ...data.profile }
            if (data.settings) this.data.settings = { ...this.data.settings, ...data.settings }
            const poemCount = this._getMemorizedPoemCount()
            this.data.profile.currentLevel = getUltramanLevel(this.data.wordBank.length, poemCount)
            this.autoSave()
            return { success: true, mergedCount }
        } catch (e) {
            console.error('导入失败:', e)
            return { success: false, error: e.message }
        }
    },

    clearAll() {
        this.data.wordBank = []
        this.data.records = {}
        this.data.poems = []
        this.autoSave()
    },

    async beforeUnload() {
        await this.saveAll()
        return true
    }
}

window.addEventListener('beforeunload', async () => { await Storage.beforeUnload() })
document.addEventListener('visibilitychange', async () => {
    if (document.visibilityState === 'hidden') await Storage.beforeUnload()
})
