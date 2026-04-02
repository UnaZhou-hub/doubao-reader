// 应用主逻辑
class App {
    constructor() {
        this.currentPage = 'record'
        this.testWords = []
        this.currentQuestion = 0
        this.score = 0
        this._cardQueue = [] // 待展示的卡片队列
        this.init()
    }

    async init() {
        await Storage.init()
        this.bindEvents()
        this.updateUI()
    }

    bindEvents() {
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', (e) => {
                this.switchPage(e.currentTarget.dataset.page)
            })
        })

        document.getElementById('add-btn').addEventListener('click', () => this.addWords())
        document.getElementById('word-input').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.addWords()
        })

        document.getElementById('search-input').addEventListener('input', (e) => {
            this.renderWordBank(e.target.value)
        })

        document.getElementById('export-btn').addEventListener('click', () => this.exportData())
        document.getElementById('import-btn').addEventListener('click', () => {
            document.getElementById('import-file').click()
        })
        document.getElementById('import-file').addEventListener('change', (e) => this.importData(e))

        document.getElementById('start-test').addEventListener('click', () => this.startTest())
        document.getElementById('restart-test').addEventListener('click', () => {
            document.getElementById('test-result').style.display = 'none'
            document.getElementById('start-test').style.display = 'block'
        })

        document.getElementById('card-modal-close').addEventListener('click', () => this._closeCardModal())
        document.getElementById('card-detail-close').addEventListener('click', () => {
            document.getElementById('card-detail-overlay').style.display = 'none'
        })
        document.getElementById('card-detail-overlay').addEventListener('click', (e) => {
            if (e.target === document.getElementById('card-detail-overlay')) {
                document.getElementById('card-detail-overlay').style.display = 'none'
            }
        })
    }

    switchPage(page) {
        this.currentPage = page
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.toggle('active', item.dataset.page === page)
        })
        document.querySelectorAll('.page').forEach(p => {
            p.classList.toggle('active', p.id === `page-${page}`)
        })
        if (page === 'wordbank') this.renderWordBank()
        if (page === 'achievement') this.renderAchievement()
    }

    updateUI() {
        const total = Storage.getTotalWords()
        document.getElementById('total-count').textContent = total
        document.getElementById('bank-count').textContent = total
        this.renderMiniAvatar()
        this.renderRecentWords()
    }

    // ========== 主页迷你头像 ==========

    renderMiniAvatar() {
        const level = Storage.getUltramanLevel()
        const el = document.getElementById('hero-avatar-mini')
        if (!el) return
        el.innerHTML = this._buildAvatar(level, 28)
    }

    // ========== 添加字 ==========

    addWords() {
        const input = document.getElementById('word-input')
        const words = input.value.split(/[\s,，、]+/).filter(w => w.trim())

        if (words.length === 0) {
            this.showToast('请输入汉字')
            return
        }

        let addedCount = 0
        let levelUp = null
        let milestoneCard = null
        let newBadges = []

        words.forEach(word => {
            const result = Storage.addWord(word)
            if (result.added) {
                addedCount++
                if (result.levelUp) levelUp = result.levelUp
                if (result.milestoneCard) milestoneCard = result.milestoneCard
                newBadges = [...newBadges, ...result.newBadges]
            }
        })

        input.value = ''
        this.updateUI()

        if (addedCount > 0) {
            this.showToast(`成功添加 ${addedCount} 个字`)
        } else {
            this.showToast('这些字已经学过啦')
            return
        }

        // 升级动画 → 跳转成就页 → 发卡
        if (levelUp) {
            this._showLevelUp(levelUp.to, () => {
                this.switchPage('achievement')
                if (milestoneCard) this._queueCard(milestoneCard)
                else this._drainCardQueue()
            })
        } else {
            if (milestoneCard) this._queueCard(milestoneCard)
            this._drainCardQueue()
        }
    }

    // ========== 测试 ==========

    startTest() {
        const words = Storage.getWordBank()
        const count = parseInt(document.getElementById('test-count').value)

        if (words.length < count) {
            this.showToast('字库字数不够，先多学几个字吧！')
            return
        }

        this.testWords = this._shuffleArray([...words]).slice(0, count)
        this.currentQuestion = 0
        this.score = 0

        document.getElementById('start-test').style.display = 'none'
        document.getElementById('test-area').style.display = 'block'
        document.getElementById('total-questions').textContent = count
        this.showQuestion()
    }

    showQuestion() {
        const word = this.testWords[this.currentQuestion]
        document.getElementById('current-question').textContent = this.currentQuestion + 1
        document.getElementById('test-word').textContent = word

        const container = document.getElementById('test-options')
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
        `
    }

    checkAnswer(isCorrect) {
        const btns = document.querySelectorAll('.test-btn')
        btns.forEach(btn => btn.onclick = null)

        if (isCorrect) {
            document.querySelector('.test-btn-correct').classList.add('selected-correct')
            this.score++
        } else {
            document.querySelector('.test-btn-wrong').classList.add('selected-wrong')
        }

        setTimeout(() => {
            this.currentQuestion++
            if (this.currentQuestion >= this.testWords.length) {
                this.showTestResult()
            } else {
                this.showQuestion()
            }
        }, 600)
    }

    showTestResult() {
        const total = this.testWords.length
        const percentage = Math.round(this.score / total * 100)

        document.getElementById('test-area').style.display = 'none'
        document.getElementById('test-result').style.display = 'block'
        document.getElementById('final-score').textContent = this.score
        document.getElementById('total-score').textContent = total

        const result = Storage.saveTestScore(this.score, total)

        const level = Storage.getUltramanLevel()
        const heroName = level ? HERO_CONFIG[level].name : '奥特曼'
        let message = ''
        if (percentage === 100) message = `⚡ 豆包变身！全对！${heroName}为你喝彩！`
        else if (percentage >= 80) message = `🔥 好样的！${heroName}之力觉醒！`
        else if (percentage >= 60) message = `⭐ 继续加油！${heroName}与你同在！`
        else message = '📚 多复习一下，能量快充满了！'

        document.getElementById('result-message').textContent = message
        this.updateUI()

        if (result.isPerfect && result.cardAwarded) {
            this._queueCard(result.cardAwarded)
            this._drainCardQueue()
        } else if (result.isPerfect && !result.cardAwarded) {
            this.showToast('今日卡片已获取，明天再来！')
        }
    }

    // ========== 成就页 ==========

    renderAchievement() {
        this._renderHeroCard()
        this._renderTodayStatus()
        this._renderPrimaryLevel()
        this._renderCardGrids()
        this._renderBadges()
    }

    _renderHeroCard() {
        const level = Storage.getUltramanLevel()
        const wordCount = Storage.getTotalWords()
        const avatarEl = document.getElementById('hero-avatar-main')
        const nameEl = document.getElementById('hero-name')
        const countEl = document.getElementById('hero-word-count')
        const fillEl = document.getElementById('hero-progress-fill')
        const textEl = document.getElementById('hero-progress-text')
        const card = document.getElementById('hero-card')

        countEl.textContent = wordCount

        if (!level) {
            avatarEl.innerHTML = this._buildAvatar(null, 80)
            nameEl.textContent = '光之国学员'
            fillEl.style.width = `${(wordCount / 200) * 100}%`
            textEl.textContent = `还需 ${200 - wordCount} 字解锁捷德`
            card.style.setProperty('--hero-color', '#A0A0C0')
            return
        }

        const hero = HERO_CONFIG[level]
        avatarEl.innerHTML = this._buildAvatar(level, 80)
        nameEl.textContent = `${hero.name} · ${hero.title}`
        card.style.setProperty('--hero-color', hero.color)

        const nextInfo = Storage.getNextLevelInfo()
        if (nextInfo) {
            const thresholds = [200, 300, 400, 600, 800]
            const idx = thresholds.indexOf(nextInfo.target)
            const prev = idx > 0 ? thresholds[idx - 1] : 0
            const pct = ((wordCount - prev) / (nextInfo.target - prev)) * 100
            fillEl.style.width = `${Math.min(100, pct)}%`
            textEl.textContent = `还需 ${nextInfo.needed} 字升级`
        } else {
            fillEl.style.width = '100%'
            textEl.textContent = '🏆 已达最高等级！'
        }
    }

    _renderTodayStatus() {
        const records = Storage.getAllRecords()
        const now = new Date()
        const todayKey = `${now.getFullYear()}/${now.getMonth() + 1}/${now.getDate()}`
        const todayRecord = records[todayKey]
        let todayTests = 0
        if (todayRecord && todayRecord.score) todayTests = 1

        document.getElementById('today-tests').textContent = todayTests
        document.getElementById('streak-days').textContent = Storage.data.profile.streakDays || 0

        const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
        const hasCard = Storage.data.profile.lastCardDate === todayStr
        document.getElementById('today-card-status').textContent = hasCard
            ? '今日卡片：✓ 已获取'
            : '今日卡片：可获取'
    }

    _renderPrimaryLevel() {
        const lvl = Storage.getPrimaryLevel()
        document.getElementById('primary-level-name').textContent = lvl.name
        document.getElementById('primary-level-desc').textContent = lvl.description
        document.getElementById('primary-progress-fill').style.width = `${lvl.progress}%`
    }

    _renderCardGrids() {
        const totalUnique = Storage.getTotalUniqueCards()
        document.getElementById('card-count-label').textContent = `(${totalUnique}/43)`

        const skillIds = Object.keys(CARD_DATA).filter(id => CARD_DATA[id].type === 'skill')
        const weaponIds = Object.keys(CARD_DATA).filter(id => CARD_DATA[id].type === 'weapon')

        document.getElementById('skill-cards-grid').innerHTML =
            skillIds.map(id => this._buildCardCell(id)).join('')
        document.getElementById('weapon-cards-grid').innerHTML =
            weaponIds.map(id => this._buildCardCell(id)).join('')
    }

    _buildCardCell(cardId) {
        const collected = Storage.getCollectedCard(cardId)
        const card = CARD_DATA[cardId]
        const rarity = RARITY_CONFIG[card.rarity]
        const hero = HERO_CONFIG[card.hero]

        if (!collected) {
            return `<div class="card-cell card-cell-locked">
                <div class="card-cell-lock">🔒</div>
                <div class="card-cell-name">未解锁</div>
            </div>`
        }

        const badge = collected.count > 1 ? `<div class="card-count-badge">×${collected.count}</div>` : ''
        return `<div class="card-cell card-cell-owned" data-rarity="${card.rarity}"
                     style="--rarity-color:${rarity.color};--rarity-glow:${rarity.glow};--hero-color:${hero.color}"
                     onclick="app.showCardDetail('${cardId}')">
            ${badge}
            <div class="card-cell-icon">${hero.symbol}</div>
            <div class="card-cell-name">${card.name}</div>
            <div class="card-cell-rarity" style="color:${rarity.color}">${rarity.stars}</div>
        </div>`
    }

    _renderBadges() {
        const unlocked = Storage.data.profile.unlockedBadges || []
        const unlockedIds = unlocked.map(b => b.id)
        document.getElementById('badge-count-label').textContent =
            `${unlockedIds.length}/10`

        document.getElementById('badge-grid').innerHTML = BADGE_DATA.map(badge => {
            const isUnlocked = unlockedIds.includes(badge.id)
            const rarity = RARITY_CONFIG[badge.rarity]
            if (isUnlocked) {
                const record = unlocked.find(b => b.id === badge.id)
                return `<div class="badge-cell badge-unlocked" style="--rarity-color:${rarity.color};--rarity-glow:${rarity.glow}">
                    <div class="badge-emoji">${badge.emoji}</div>
                    <div class="badge-name">${badge.name}</div>
                    <div class="badge-date">${record.unlockedAt}</div>
                </div>`
            } else {
                const prog = Storage.getBadgeProgress(badge)
                return `<div class="badge-cell badge-locked">
                    <div class="badge-emoji locked-emoji">🔒</div>
                    <div class="badge-name">${badge.name}</div>
                    <div class="badge-progress">${prog.current}/${prog.total}</div>
                </div>`
            }
        }).join('')
    }

    showCardDetail(cardId) {
        const card = CARD_DATA[cardId]
        const collected = Storage.getCollectedCard(cardId)
        const rarity = RARITY_CONFIG[card.rarity]
        const hero = HERO_CONFIG[card.hero]

        document.getElementById('card-detail-card').innerHTML =
            this._buildCardDisplay(cardId, card, rarity, hero)

        const typeLabel = card.type === 'skill' ? '技能卡片' : '武器卡片'
        document.getElementById('card-detail-info').innerHTML = `
            <div class="detail-row"><span>类型</span><span>${typeLabel}</span></div>
            <div class="detail-row"><span>所属</span><span>${hero.name}</span></div>
            <div class="detail-row"><span>稀有度</span><span style="color:${rarity.color}">${rarity.name} ${rarity.stars}</span></div>
            <div class="detail-row desc-row">${card.desc}</div>
            <div class="detail-row"><span>📅 首次获得</span><span>${collected.firstObtainedAt}</span></div>
            <div class="detail-row"><span>📦 获得次数</span><span>${collected.count} 次</span></div>
        `
        document.getElementById('card-detail-overlay').style.display = 'flex'
    }

    // ========== 升级动画 ==========

    _showLevelUp(levelKey, callback) {
        const hero = HERO_CONFIG[levelKey]
        const overlay = document.getElementById('levelup-overlay')
        const avatarEl = document.getElementById('levelup-avatar')
        const nameEl = document.getElementById('levelup-name')
        const subtitleEl = document.getElementById('levelup-subtitle')

        avatarEl.innerHTML = this._buildAvatar(levelKey, 120)
        nameEl.textContent = hero.name
        subtitleEl.textContent = hero.title
        overlay.style.setProperty('--hero-color', hero.color)
        overlay.style.display = 'flex'

        // 光芒射线
        const rays = document.getElementById('levelup-rays')
        rays.innerHTML = Array.from({ length: 12 }, (_, i) =>
            `<div class="levelup-ray" style="--angle:${i * 30}deg"></div>`
        ).join('')

        setTimeout(() => {
            overlay.style.display = 'none'
            rays.innerHTML = ''
            if (callback) callback()
        }, 2800)
    }

    // ========== 卡片弹窗队列 ==========

    _queueCard(cardId) {
        this._cardQueue.push(cardId)
    }

    _drainCardQueue() {
        if (this._cardQueue.length === 0) return
        const cardId = this._cardQueue.shift()
        this._showCardModal(cardId, () => this._drainCardQueue())
    }

    _showCardModal(cardId, onClose) {
        const card = CARD_DATA[cardId]
        const rarity = RARITY_CONFIG[card.rarity]
        const hero = HERO_CONFIG[card.hero]

        document.getElementById('card-modal-card').innerHTML =
            this._buildCardDisplay(cardId, card, rarity, hero)

        const overlay = document.getElementById('card-modal-overlay')
        overlay.style.display = 'flex'
        this._cardModalCallback = onClose
    }

    _closeCardModal() {
        document.getElementById('card-modal-overlay').style.display = 'none'
        const cb = this._cardModalCallback
        this._cardModalCallback = null
        if (cb) cb()
    }

    // ========== SVG 构建 ==========

    // levelKey: 'geed'|'ginga'|'zero'|'ace'|'father'|null
    _buildAvatar(levelKey, size) {
        const LEVEL_ICONS = {
            geed:   { icon: '🌱', label: 'Lv.1', color: '#E53E3E' },
            ginga:  { icon: '⭐', label: 'Lv.2', color: '#C0C0C0' },
            zero:   { icon: '💥', label: 'Lv.3', color: '#2563EB' },
            ace:    { icon: '⚡', label: 'Lv.4', color: '#DC2626' },
            father: { icon: '👑', label: 'Lv.5', color: '#D97706' },
        }

        const badgeSize = Math.round(size * 0.42)
        const badge = levelKey && LEVEL_ICONS[levelKey]
        const hero = levelKey && HERO_CONFIG[levelKey]
        const borderColor = hero ? hero.color : '#A0A0C0'

        const badgeHtml = badge ? `
            <div class="avatar-badge" style="
                width:${badgeSize}px;height:${badgeSize}px;
                font-size:${Math.round(badgeSize * 0.55)}px;
                border-color:${badge.color};
                box-shadow:0 0 8px ${badge.color};
            " title="${hero.name}">${badge.icon}</div>` : ''

        return `<div class="avatar-wrap" style="width:${size}px;height:${size}px;">
            <img src="doubao.png" class="avatar-img"
                 style="width:${size}px;height:${size}px;border-color:${borderColor};box-shadow:0 0 14px ${borderColor}55;"
                 alt="豆包"/>
            ${badgeHtml}
        </div>`
    }

    _buildAvatarSVG(hero, size) {
        const svgs = {
            geed: `
              <!-- 捷德：红黑配色，圆形头盔，圆形头镖 -->
              <circle cx="50" cy="52" r="44" fill="#1A1A2E"/>
              <ellipse cx="50" cy="56" rx="32" ry="34" fill="#CC2222"/>
              <ellipse cx="50" cy="50" rx="24" ry="22" fill="#E8E8E8"/>
              <!-- 头顶圆形头镖 -->
              <circle cx="50" cy="16" r="10" fill="#CC2222" stroke="#1A1A2E" stroke-width="2"/>
              <circle cx="50" cy="16" r="5" fill="#FF4444"/>
              <rect x="46" y="24" width="8" height="14" rx="2" fill="#CC2222"/>
              <!-- 奥特曼眼睛（扁长六边形） -->
              <ellipse cx="36" cy="46" rx="11" ry="6" fill="#FF4444" transform="rotate(-8,36,46)"/>
              <ellipse cx="64" cy="46" rx="11" ry="6" fill="#FF4444" transform="rotate(8,64,46)"/>
              <ellipse cx="36" cy="46" rx="7" ry="3.5" fill="#FF8888" transform="rotate(-8,36,46)"/>
              <ellipse cx="64" cy="46" rx="7" ry="3.5" fill="#FF8888" transform="rotate(8,64,46)"/>
              <!-- 计时器 -->
              <ellipse cx="50" cy="64" rx="7" ry="4" fill="#FF4444" stroke="#CC0000" stroke-width="1"/>
              <ellipse cx="50" cy="64" rx="4" ry="2.5" fill="#FF8888"/>
              <!-- 脸部纹路 -->
              <line x1="50" y1="38" x2="50" y2="62" stroke="#CC2222" stroke-width="1.5" opacity="0.4"/>`,

            ginga: `
              <!-- 银河：银蓝配色，尖角，纤细感 -->
              <circle cx="50" cy="52" r="44" fill="#1E3A8A"/>
              <ellipse cx="50" cy="56" rx="30" ry="32" fill="#C0C0C0"/>
              <ellipse cx="50" cy="50" rx="22" ry="20" fill="#E8E8E8"/>
              <!-- 尖角 -->
              <polygon points="50,4 44,22 56,22" fill="#C0C0C0"/>
              <polygon points="50,8 46,20 54,20" fill="#E0E0E0"/>
              <!-- 侧翼装饰 -->
              <polygon points="18,38 30,42 24,55" fill="#C0C0C0" opacity="0.8"/>
              <polygon points="82,38 70,42 76,55" fill="#C0C0C0" opacity="0.8"/>
              <!-- 眼睛 -->
              <ellipse cx="37" cy="46" rx="10" ry="5.5" fill="#3B82F6" transform="rotate(-6,37,46)"/>
              <ellipse cx="63" cy="46" rx="10" ry="5.5" fill="#3B82F6" transform="rotate(6,63,46)"/>
              <ellipse cx="37" cy="46" rx="6" ry="3" fill="#93C5FD" transform="rotate(-6,37,46)"/>
              <ellipse cx="63" cy="46" rx="6" ry="3" fill="#93C5FD" transform="rotate(6,63,46)"/>
              <!-- 计时器 -->
              <ellipse cx="50" cy="64" rx="7" ry="4" fill="#3B82F6" stroke="#1D4ED8" stroke-width="1"/>
              <ellipse cx="50" cy="64" rx="4" ry="2.5" fill="#93C5FD"/>`,

            zero: `
              <!-- 赛罗：蓝紫配色，双刃头饰 -->
              <circle cx="50" cy="52" r="44" fill="#1E1B4B"/>
              <ellipse cx="50" cy="56" rx="32" ry="34" fill="#2563EB"/>
              <ellipse cx="50" cy="50" rx="24" ry="22" fill="#E8E8E8"/>
              <!-- 双刃头饰 -->
              <polygon points="38,24 33,6 43,20" fill="#2563EB"/>
              <polygon points="62,24 67,6 57,20" fill="#2563EB"/>
              <polygon points="38,24 34,10 42,21" fill="#60A5FA"/>
              <polygon points="62,24 66,10 58,21" fill="#60A5FA"/>
              <!-- 眼睛（赛罗的眼睛更大更有神） -->
              <ellipse cx="36" cy="45" rx="12" ry="7" fill="#1D4ED8" transform="rotate(-10,36,45)"/>
              <ellipse cx="64" cy="45" rx="12" ry="7" fill="#1D4ED8" transform="rotate(10,64,45)"/>
              <ellipse cx="36" cy="44" rx="7" ry="4" fill="#60A5FA" transform="rotate(-10,36,44)"/>
              <ellipse cx="64" cy="44" rx="7" ry="4" fill="#60A5FA" transform="rotate(10,64,44)"/>
              <!-- 鼻梁分隔线 -->
              <line x1="50" y1="36" x2="50" y2="56" stroke="#1E3A8A" stroke-width="2" opacity="0.4"/>
              <!-- 计时器 -->
              <ellipse cx="50" cy="65" rx="7" ry="4" fill="#2563EB" stroke="#1D4ED8" stroke-width="1"/>
              <ellipse cx="50" cy="65" rx="4" ry="2.5" fill="#93C5FD"/>`,

            ace: `
              <!-- 艾斯：红蓝配色，M型头冠 -->
              <circle cx="50" cy="52" r="44" fill="#1E3A5F"/>
              <ellipse cx="50" cy="56" rx="32" ry="34" fill="#DC2626"/>
              <ellipse cx="50" cy="50" rx="24" ry="22" fill="#E8E8E8"/>
              <!-- M型头冠 -->
              <path d="M28,30 L36,12 L44,24 L50,10 L56,24 L64,12 L72,30" fill="none" stroke="#DC2626" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>
              <path d="M28,30 L36,14 L44,24 L50,12 L56,24 L64,14 L72,30" fill="none" stroke="#F87171" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
              <!-- 眼睛 -->
              <ellipse cx="36" cy="46" rx="11" ry="6" fill="#DC2626" transform="rotate(-8,36,46)"/>
              <ellipse cx="64" cy="46" rx="11" ry="6" fill="#DC2626" transform="rotate(8,64,46)"/>
              <ellipse cx="36" cy="46" rx="7" ry="3.5" fill="#FCA5A5" transform="rotate(-8,36,46)"/>
              <ellipse cx="64" cy="46" rx="7" ry="3.5" fill="#FCA5A5" transform="rotate(8,64,46)"/>
              <!-- 计时器 -->
              <ellipse cx="50" cy="65" rx="7" ry="4" fill="#DC2626" stroke="#991B1B" stroke-width="1"/>
              <ellipse cx="50" cy="65" rx="4" ry="2.5" fill="#FCA5A5"/>`,

            father: `
              <!-- 奥特之父：金色，王冠，威严感 -->
              <circle cx="50" cy="52" r="44" fill="#1C1917"/>
              <ellipse cx="50" cy="56" rx="32" ry="34" fill="#B45309"/>
              <ellipse cx="50" cy="50" rx="24" ry="22" fill="#E8E8E8"/>
              <!-- 王冠 -->
              <rect x="30" y="22" width="40" height="10" rx="2" fill="#D97706"/>
              <polygon points="30,22 34,10 38,22" fill="#D97706"/>
              <polygon points="46,22 50,8  54,22" fill="#D97706"/>
              <polygon points="62,22 66,10 70,22" fill="#D97706"/>
              <rect x="30" y="22" width="40" height="10" rx="2" fill="none" stroke="#FCD34D" stroke-width="1.5"/>
              <!-- 宝石点缀 -->
              <circle cx="34" cy="14" r="3" fill="#FCD34D"/>
              <circle cx="50" cy="11" r="4" fill="#FCD34D"/>
              <circle cx="66" cy="14" r="3" fill="#FCD34D"/>
              <!-- 眼睛（金色，更有威严） -->
              <ellipse cx="36" cy="46" rx="11" ry="6" fill="#D97706" transform="rotate(-6,36,46)"/>
              <ellipse cx="64" cy="46" rx="11" ry="6" fill="#D97706" transform="rotate(6,64,46)"/>
              <ellipse cx="36" cy="46" rx="7" ry="3.5" fill="#FCD34D" transform="rotate(-6,36,46)"/>
              <ellipse cx="64" cy="46" rx="7" ry="3.5" fill="#FCD34D" transform="rotate(6,64,46)"/>
              <!-- 胡须暗示 -->
              <line x1="26" y1="60" x2="42" y2="58" stroke="#D97706" stroke-width="1.5" opacity="0.5"/>
              <line x1="74" y1="60" x2="58" y2="58" stroke="#D97706" stroke-width="1.5" opacity="0.5"/>
              <!-- 计时器（金色） -->
              <ellipse cx="50" cy="65" rx="7" ry="4" fill="#D97706" stroke="#92400E" stroke-width="1"/>
              <ellipse cx="50" cy="65" rx="4" ry="2.5" fill="#FCD34D"/>`,
        }

        const key = hero._key || ''
        const body = svgs[key] || ''
        return `<svg width="${size}" height="${size}" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">${body}</svg>`
    }

    _buildPreHeroSVG() {
        // 已不使用，保留备用
        return this._buildAvatar(null, 80)
    }

    _buildCardDisplay(cardId, card, rarity, hero) {
        return `<div class="card-display-inner" style="background:${rarity.bg};border-color:${rarity.color};box-shadow:0 0 24px ${rarity.glow}">
            <div class="card-top-label" style="color:${rarity.color}">${rarity.name}</div>
            <div class="card-center-icon" style="color:${hero.color}">${hero.symbol}</div>
            <div class="card-hero-name" style="color:${hero.color}">${hero.name}</div>
            <div class="card-title">${card.name}</div>
            <div class="card-stars" style="color:${rarity.color}">${rarity.stars}</div>
        </div>`
    }

    // ========== 字库 ==========

    renderWordBank(keyword = '') {
        const words = Storage.searchWords(keyword)
        const container = document.getElementById('wordbank-list')
        if (words.length === 0) {
            container.innerHTML = '<div class="empty">字库空空如也，去识字记录页添加吧！</div>'
            return
        }
        container.innerHTML = words.map(word =>
            `<div class="word-item" onclick="app.deleteWord('${word}')">${word}</div>`
        ).join('')
    }

    renderRecentWords() {
        const recentWords = Storage.getRecentWords(30)
        const container = document.getElementById('recent-list')
        if (recentWords.length === 0) {
            container.innerHTML = '<div class="empty">还没有学习记录，开始添加认识的字吧！</div>'
            return
        }
        container.innerHTML = recentWords.map(word =>
            `<div class="word-item">${word}</div>`
        ).join('')
    }

    deleteWord(word) {
        if (confirm(`确定要删除"${word}"吗？`)) {
            Storage.removeWord(word)
            this.renderWordBank()
            this.updateUI()
            this.showToast('已删除')
        }
    }

    // ========== 导出/导入 ==========

    exportData() {
        const jsonString = Storage.exportData()
        const blob = new Blob([jsonString], { type: 'application/json' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `豆包识字数据_${new Date().toLocaleDateString('zh-CN')}.json`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
        this.showToast('导出成功！')
    }

    importData(event) {
        const file = event.target.files[0]
        if (!file) return
        const reader = new FileReader()
        reader.onload = (e) => {
            const result = Storage.importData(e.target.result)
            if (result.success) {
                this.updateUI()
                this.showToast(`导入成功！新增 ${result.mergedCount} 个字`)
            } else {
                this.showToast('导入失败：文件格式错误')
            }
        }
        reader.readAsText(file)
        event.target.value = ''
    }

    // ========== 工具 ==========

    _shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]]
        }
        return array
    }

    showToast(message) {
        const existing = document.querySelector('.toast')
        if (existing) existing.remove()
        const toast = document.createElement('div')
        toast.className = 'toast'
        toast.textContent = message
        document.body.appendChild(toast)
        setTimeout(() => {
            toast.classList.add('hide')
            setTimeout(() => toast.remove(), 300)
        }, 2000)
    }
}

const app = new App()
