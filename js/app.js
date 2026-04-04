// 应用主逻辑
class App {
    constructor() {
        this.currentPage = 'record'
        this.recordTab = 'words'
        this.bankTab = 'chars'
        this.testType = 'word'

        // 识字闯关状态
        this.testWords = []
        this.currentQuestion = 0
        this.score = 0

        // 古诗词闯关状态
        this.poemQuestions = []   // [{ poemId, promptLine, direction }]
        this.poemScore = 0

        this._cardQueue = []
        this.editingPoemId = null   // 当前正在编辑的诗词 ID，null 表示新增模式
        this.init()
    }

    async init() {
        await Storage.init()
        this.bindEvents()
        this.updateUI()
    }

    bindEvents() {
        // 底部导航
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', (e) => {
                this.switchPage(e.currentTarget.dataset.page)
            })
        })

        // 识字添加
        document.getElementById('add-btn').addEventListener('click', () => this.addWords())
        document.getElementById('word-input').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.addWords()
        })

        // 古诗词添加
        document.getElementById('add-poem-btn').addEventListener('click', () => this.addPoem())

        // 百宝箱 - 汉字搜索
        document.getElementById('search-input').addEventListener('input', (e) => {
            this.renderWordBank(e.target.value)
        })
        // 百宝箱 - 诗词搜索
        document.getElementById('poem-search-input').addEventListener('input', (e) => {
            this.renderPoemBank(e.target.value)
        })

        // 导出/导入
        document.getElementById('export-btn').addEventListener('click', () => this.exportData())
        document.getElementById('import-btn').addEventListener('click', () => {
            document.getElementById('import-file').click()
        })
        document.getElementById('import-file').addEventListener('change', (e) => this.importData(e))

        // 识字闯关
        document.getElementById('start-test').addEventListener('click', () => this.startWordTest())
        document.getElementById('restart-test').addEventListener('click', () => this.resetTest())

        // 古诗词闯关
        document.getElementById('start-poem-test').addEventListener('click', () => this.startPoemTest())

        // 卡片弹窗
        document.getElementById('card-modal-close').addEventListener('click', () => this._closeCardModal())
        document.getElementById('card-detail-close').addEventListener('click', () => {
            document.getElementById('card-detail-overlay').style.display = 'none'
        })
        document.getElementById('card-detail-overlay').addEventListener('click', (e) => {
            if (e.target === document.getElementById('card-detail-overlay')) {
                document.getElementById('card-detail-overlay').style.display = 'none'
            }
        })

        // 徽章详情弹窗
        document.getElementById('badge-detail-close').addEventListener('click', () => {
            document.getElementById('badge-detail-overlay').style.display = 'none'
        })
        document.getElementById('badge-detail-overlay').addEventListener('click', (e) => {
            if (e.target === document.getElementById('badge-detail-overlay')) {
                document.getElementById('badge-detail-overlay').style.display = 'none'
            }
        })

        // 诗词详情弹窗：点击遮罩关闭
        document.getElementById('poem-detail-overlay').addEventListener('click', (e) => {
            if (e.target === document.getElementById('poem-detail-overlay')) {
                document.getElementById('poem-detail-overlay').style.display = 'none'
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
        if (page === 'wordbank') {
            if (this.bankTab === 'chars') this.renderWordBank()
            else this.renderPoemBank()
        }
        if (page === 'achievement') this.renderAchievement()
    }

    updateUI() {
        // 根据当前 tab 决定显示什么
        const totalCountEl = document.getElementById('total-count')
        const recordUnitEl = document.getElementById('record-unit')

        if (this.recordTab === 'words') {
            const total = Storage.getTotalWords()
            totalCountEl.textContent = total
            recordUnitEl.textContent = '个字'
        } else {
            const poemCount = Storage.getMemorizedPoemCount()
            totalCountEl.textContent = poemCount
            recordUnitEl.textContent = '首诗'
        }

        document.getElementById('bank-count').textContent = Storage.getTotalWords()
        this.renderMiniAvatar()
        this.renderRecentWords()
        this.renderRecentPoems()
    }

    // ========== Tab 切换 ==========

    switchRecordTab(tab) {
        this.recordTab = tab
        document.querySelectorAll('#page-record .tab-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tab === tab)
        })
        document.getElementById('tab-words').style.display = tab === 'words' ? 'block' : 'none'
        document.getElementById('tab-poems').style.display = tab === 'poems' ? 'block' : 'none'

        // 更新状态显示
        const totalCountEl = document.getElementById('total-count')
        const recordUnitEl = document.getElementById('record-unit')
        if (tab === 'words') {
            totalCountEl.textContent = Storage.getTotalWords()
            recordUnitEl.textContent = '个字'
        } else {
            totalCountEl.textContent = Storage.getMemorizedPoemCount()
            recordUnitEl.textContent = '首诗'
        }
    }

    switchBankTab(tab) {
        this.bankTab = tab
        document.querySelectorAll('#page-wordbank .tab-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tab === tab)
        })
        document.getElementById('tab-chars').style.display = tab === 'chars' ? 'block' : 'none'
        document.getElementById('tab-poembank').style.display = tab === 'poembank' ? 'block' : 'none'
        if (tab === 'poembank') this.renderPoemBank()
        else this.renderWordBank()
    }

    switchTestType(type) {
        this.testType = type
        document.querySelectorAll('#test-type-tabs .tab-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.type === type)
        })
        document.getElementById('word-test-setup').style.display = type === 'word' ? 'block' : 'none'
        document.getElementById('poem-test-setup').style.display = type === 'poem' ? 'block' : 'none'
        document.getElementById('test-area').style.display = 'none'
        document.getElementById('test-result').style.display = 'none'
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

        if (levelUp) {
            this._showLevelUp(levelUp.to, () => {
                this.switchPage('achievement')
                if (milestoneCard) this._queueCard(milestoneCard)
                this._drainCardQueue()
            })
        } else {
            if (milestoneCard) this._queueCard(milestoneCard)
            this._drainCardQueue()
        }
    }

    // ========== 添加诗词 ==========

    addPoem() {
        const title = document.getElementById('poem-title').value.trim()
        const author = document.getElementById('poem-author').value.trim()
        const dynasty = document.getElementById('poem-dynasty').value.trim()
        const content = document.getElementById('poem-content').value.trim()

        if (!title) { this.showToast('请输入诗名'); return }
        if (!content) { this.showToast('请输入诗词内容'); return }

        if (this.editingPoemId) {
            // 编辑模式
            const result = Storage.updatePoem(this.editingPoemId, { title, author, dynasty, content })
            if (!result.updated) {
                this.showToast(result.error || '保存失败，诗词至少需要两句')
                return
            }
            this._clearPoemForm()
            this.showToast(`《${title}》已保存！`)
            this.renderRecentPoems()
            this.renderPoemBank()
        } else {
            // 新增模式
            const result = Storage.addPoem({ title, author, dynasty, content })
            if (!result.added) {
                this.showToast(result.error || '添加失败，诗词至少需要两句')
                return
            }
            this._clearPoemForm()
            this.showToast(`《${title}》已添加！`)
            this.renderRecentPoems()
            this.updateUI()
            if (result.levelUp) {
                this._showLevelUp(result.levelUp.to, () => this.switchPage('achievement'))
            }
        }
    }

    editPoem(poemId) {
        const poem = Storage.getPoems().find(p => p.id === poemId)
        if (!poem) return

        // 关闭详情弹窗
        document.getElementById('poem-detail-overlay').style.display = 'none'

        // 切换到训练基地 > 古诗词 tab
        this.switchPage('record')
        this.switchRecordTab('poems')

        // 填入表单
        document.getElementById('poem-title').value = poem.title
        document.getElementById('poem-author').value = poem.author || ''
        document.getElementById('poem-dynasty').value = poem.dynasty || ''
        document.getElementById('poem-content').value = poem.lines.join('\n')

        // 进入编辑模式
        this.editingPoemId = poemId
        document.getElementById('add-poem-btn').textContent = '保存修改'
        document.getElementById('poem-title').focus()
    }

    _clearPoemForm() {
        document.getElementById('poem-title').value = ''
        document.getElementById('poem-author').value = ''
        document.getElementById('poem-dynasty').value = ''
        document.getElementById('poem-content').value = ''
        this.editingPoemId = null
        document.getElementById('add-poem-btn').textContent = '添加诗词'
    }

    // ========== 识字闯关 ==========

    startWordTest() {
        const words = Storage.getWordBank()
        const count = parseInt(document.getElementById('test-count').value)

        if (words.length < count) {
            this.showToast('字库字数不够，先多学几个字吧！')
            return
        }

        this.testWords = this._shuffleArray([...words]).slice(0, count)
        this.currentQuestion = 0
        this.score = 0

        document.getElementById('word-test-setup').style.display = 'none'
        document.getElementById('test-area').style.display = 'block'
        document.getElementById('test-word').style.display = 'block'
        document.getElementById('test-poem-question').style.display = 'none'
        document.getElementById('total-questions').textContent = count
        this.showWordQuestion()
    }

    showWordQuestion() {
        const word = this.testWords[this.currentQuestion]
        document.getElementById('current-question').textContent = this.currentQuestion + 1
        document.getElementById('test-word').textContent = word
        this._renderAnswerButtons(
            'app.checkWordAnswer(true)',
            'app.checkWordAnswer(false)'
        )
    }

    checkWordAnswer(isCorrect) {
        this._lockAnswerButtons(isCorrect)
        if (isCorrect) this.score++
        setTimeout(() => {
            this.currentQuestion++
            if (this.currentQuestion >= this.testWords.length) {
                this.showWordTestResult()
            } else {
                this.showWordQuestion()
            }
        }, 600)
    }

    showWordTestResult() {
        const total = this.testWords.length
        document.getElementById('test-area').style.display = 'none'
        document.getElementById('test-result').style.display = 'block'
        document.getElementById('final-score').textContent = this.score
        document.getElementById('total-score').textContent = total

        const result = Storage.saveTestScore(this.score, total)
        const level = Storage.getUltramanLevel()
        const heroName = HERO_CONFIG[level] ? HERO_CONFIG[level].name : '奥特曼'

        const pct = Math.round(this.score / total * 100)
        let message = ''
        if (pct === 100) message = `⚡ 豆包变身！全对！${heroName}为你喝彩！`
        else if (pct >= 80) message = `🔥 好样的！${heroName}之力觉醒！`
        else if (pct >= 60) message = `⭐ 继续加油！${heroName}与你同在！`
        else message = '📚 多复习一下，能量快充满了！'

        document.getElementById('result-message').textContent = message
        this.updateUI()

        if (result.isPerfect && result.cardAwarded) {
            this._queueCard(result.cardAwarded)
            this._drainCardQueue()
        } else if (result.isPerfect && !result.cardAwarded) {
            this.showToast('今日识字卡片已获取，明天再来！')
        }
    }

    // ========== 古诗词闯关 ==========

    startPoemTest() {
        const poems = Storage.getPoems()
        if (poems.length === 0) {
            this.showToast('还没有诗词，先去训练基地添加吧！')
            return
        }

        const count = parseInt(document.getElementById('poem-test-count').value)
        this.poemQuestions = this._buildPoemQuestions(poems, count)
        this.currentQuestion = 0
        this.poemScore = 0

        document.getElementById('poem-test-setup').style.display = 'none'
        document.getElementById('test-area').style.display = 'block'
        document.getElementById('test-word').style.display = 'none'
        document.getElementById('test-poem-question').style.display = 'block'
        document.getElementById('total-questions').textContent = this.poemQuestions.length
        this.showPoemQuestion()
    }

    // 生成诗词题目：每个（诗，行，方向）唯一，同一行的 next/prev 不同时出现
    _buildPoemQuestions(poems, count) {
        // 先生成每个相邻行对的候选（next 和 prev 视为同一行对，随机选一个方向）
        const linePairs = []
        poems.forEach(poem => {
            if (poem.lines.length < 2) return
            for (let i = 0; i < poem.lines.length - 1; i++) {
                linePairs.push({ poem, i })
            }
        })

        if (linePairs.length === 0) return []

        // 打乱行对顺序，避免每次都从同一首诗开始
        const shuffled = this._shuffleArray([...linePairs])

        // 取前 count 个行对，每对随机决定方向
        const selected = shuffled.slice(0, count)
        return selected.map(({ poem, i }) => {
            const useNext = Math.random() < 0.5
            return useNext
                ? { poemId: poem.id, poemTitle: poem.title, direction: 'next', promptLine: poem.lines[i],     answerLine: poem.lines[i + 1] }
                : { poemId: poem.id, poemTitle: poem.title, direction: 'prev', promptLine: poem.lines[i + 1], answerLine: poem.lines[i] }
        })
    }

    showPoemQuestion() {
        const q = this.poemQuestions[this.currentQuestion]
        document.getElementById('current-question').textContent = this.currentQuestion + 1

        const dirText = q.direction === 'next' ? '接下一句是？' : '上一句是？'
        document.getElementById('test-poem-question').innerHTML = `
            <div class="poem-q-title">《${q.poemTitle}》</div>
            <div class="poem-q-prompt">${q.promptLine}</div>
            <div class="poem-q-dir">${dirText}</div>
        `
        this._renderAnswerButtons(
            'app.checkPoemAnswer(true)',
            'app.checkPoemAnswer(false)'
        )
    }

    checkPoemAnswer(isCorrect) {
        this._lockAnswerButtons(isCorrect)
        if (isCorrect) this.poemScore++
        setTimeout(() => {
            this.currentQuestion++
            if (this.currentQuestion >= this.poemQuestions.length) {
                this.showPoemTestResult()
            } else {
                this.showPoemQuestion()
            }
        }, 600)
    }

    showPoemTestResult() {
        const total = this.poemQuestions.length
        document.getElementById('test-area').style.display = 'none'
        document.getElementById('test-result').style.display = 'block'
        document.getElementById('final-score').textContent = this.poemScore
        document.getElementById('total-score').textContent = total

        // 收集本次测试涉及的诗词 ID
        const result = Storage.savePoemTestScore(this.poemScore, total)

        const level = Storage.getUltramanLevel()
        const heroName = HERO_CONFIG[level] ? HERO_CONFIG[level].name : '奥特曼'

        const pct = Math.round(this.poemScore / total * 100)
        let message = ''
        if (pct === 100) message = `⚡ 太厉害了！全对！${heroName}被你感动了！`
        else if (pct >= 80) message = `🔥 好样的！古诗词能量觉醒！`
        else if (pct >= 60) message = `⭐ 继续背！光之力在成长！`
        else message = '📜 多多诵读，诗词能量快充满了！'

        document.getElementById('result-message').textContent = message
        this.updateUI()

        if (result.levelUp) {
            this._showLevelUp(result.levelUp.to, () => {
                this.switchPage('achievement')
                if (result.cardAwarded) this._queueCard(result.cardAwarded)
                this._drainCardQueue()
            })
        } else if (result.isPerfect && result.cardAwarded) {
            this._queueCard(result.cardAwarded)
            this._drainCardQueue()
        } else if (result.isPerfect && !result.cardAwarded) {
            this.showToast('今日诗词卡片已获取，明天再来！')
        }
    }

    resetTest() {
        document.getElementById('test-result').style.display = 'none'
        if (this.testType === 'word') {
            document.getElementById('word-test-setup').style.display = 'block'
        } else {
            document.getElementById('poem-test-setup').style.display = 'block'
        }
    }

    // ========== 共用答题按钮 ==========

    _renderAnswerButtons(correctFnName, wrongFnName) {
        const container = document.getElementById('test-options')
        container.innerHTML = `
            <div class="test-actions">
                <button class="test-btn test-btn-correct" onclick="${correctFnName}">
                    <span class="test-btn-icon">✓</span>
                    <span class="test-btn-text">会</span>
                </button>
                <button class="test-btn test-btn-wrong" onclick="${wrongFnName}">
                    <span class="test-btn-icon">✗</span>
                    <span class="test-btn-text">不会</span>
                </button>
            </div>
        `
    }

    _lockAnswerButtons(isCorrect) {
        const btns = document.querySelectorAll('.test-btn')
        btns.forEach(btn => btn.onclick = null)
        if (isCorrect) {
            document.querySelector('.test-btn-correct').classList.add('selected-correct')
        } else {
            document.querySelector('.test-btn-wrong').classList.add('selected-wrong')
        }
    }

    // ========== 荣耀殿 ==========

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
        const poemCount = Storage.getMemorizedPoemCount()
        const avatarEl = document.getElementById('hero-avatar-main')
        const nameEl = document.getElementById('hero-name')
        const wordCountEl = document.getElementById('hero-word-count')
        const poemCountEl = document.getElementById('hero-poem-count')
        const fillEl = document.getElementById('hero-progress-fill')
        const textEl = document.getElementById('hero-progress-text')
        const card = document.getElementById('hero-card')

        wordCountEl.textContent = wordCount
        poemCountEl.textContent = poemCount

        const hero = HERO_CONFIG[level]
        avatarEl.innerHTML = this._buildAvatar(level, 80)
        nameEl.textContent = `${hero.name} · ${hero.title}`
        card.style.setProperty('--hero-color', hero.color)

        const nextInfo = Storage.getNextLevelInfo()
        if (nextInfo) {
            const wordPct = Math.min(100, (wordCount / nextInfo.targetWords) * 100)
            const poemPct = Math.min(100, (poemCount / nextInfo.targetPoems) * 100)
            const pct = Math.min(wordPct, poemPct)
            fillEl.style.width = `${pct}%`

            const parts = []
            if (nextInfo.neededWords > 0) parts.push(`再识 ${nextInfo.neededWords} 字`)
            if (nextInfo.neededPoems > 0) parts.push(`再背 ${nextInfo.neededPoems} 首诗`)
            if (parts.length > 0) {
                textEl.textContent = `距升级：${parts.join('，')}`
            } else {
                textEl.textContent = '即将升级！'
            }
        } else {
            fillEl.style.width = '100%'
            textEl.textContent = '🏆 已达最高等级！'
        }
    }

    _renderTodayStatus() {
        const todayStr = getTodayStr()
        const hasWordCard = Storage.data.profile.lastWordCardDate === todayStr
        const hasPoemCard = Storage.data.profile.lastPoemCardDate === todayStr

        const wordEl = document.getElementById('today-word-card-status')
        const poemEl = document.getElementById('today-poem-card-status')

        wordEl.textContent = hasWordCard ? '✓ 已获取' : '可获取'
        wordEl.className = 'card-status-tag ' + (hasWordCard ? 'card-status-done' : 'card-status-open')

        poemEl.textContent = hasPoemCard ? '✓ 已获取' : '可获取'
        poemEl.className = 'card-status-tag ' + (hasPoemCard ? 'card-status-done' : 'card-status-open')

        document.getElementById('streak-days').textContent = Storage.data.profile.streakDays || 0
    }

    _renderPrimaryLevel() {
        const lvl = Storage.getPrimaryLevel()
        document.getElementById('primary-level-name').textContent = lvl.name
        document.getElementById('primary-level-desc').textContent = lvl.description
        document.getElementById('primary-progress-fill').style.width = `${lvl.progress}%`
    }

    _renderCardGrids() {
        const totalUnique = Storage.getTotalUniqueCards()
        document.getElementById('card-count-label').textContent = `(${totalUnique}/55)`

        // 合并两个卡池，按类型分组
        const allCards = { ...CARD_DATA, ...POEM_CARD_DATA }
        const skillIds = Object.keys(allCards).filter(id => allCards[id].type === 'skill')
        const weaponIds = Object.keys(allCards).filter(id => allCards[id].type === 'weapon')

        document.getElementById('skill-cards-grid').innerHTML =
            skillIds.map(id => this._buildCardCell(id, allCards)).join('')
        document.getElementById('weapon-cards-grid').innerHTML =
            weaponIds.map(id => this._buildCardCell(id, allCards)).join('')
    }

    _buildCardCell(cardId, cardPool) {
        const collected = Storage.getCollectedCard(cardId)
        const card = cardPool[cardId]
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
        document.getElementById('badge-count-label').textContent = `${unlockedIds.length}/13`

        document.getElementById('badge-grid').innerHTML = BADGE_DATA.map(badge => {
            const isUnlocked = unlockedIds.includes(badge.id)
            const rarity = RARITY_CONFIG[badge.rarity]
            if (isUnlocked) {
                const record = unlocked.find(b => b.id === badge.id)
                return `<div class="badge-cell badge-unlocked" style="--rarity-color:${rarity.color};--rarity-glow:${rarity.glow}"
                             onclick="app.showBadgeDetail('${badge.id}')">
                    <div class="badge-emoji">${badge.emoji}</div>
                    <div class="badge-name">${badge.name}</div>
                    <div class="badge-date">${record.unlockedAt}</div>
                </div>`
            } else {
                const prog = Storage.getBadgeProgress(badge)
                return `<div class="badge-cell badge-locked" onclick="app.showBadgeDetail('${badge.id}')">
                    <div class="badge-emoji locked-emoji">🔒</div>
                    <div class="badge-name">${badge.name}</div>
                    <div class="badge-progress">${prog.current}/${prog.total}</div>
                </div>`
            }
        }).join('')
    }

    showBadgeDetail(badgeId) {
        const badge = BADGE_DATA.find(b => b.id === badgeId)
        if (!badge) return
        const unlocked = Storage.data.profile.unlockedBadges || []
        const record = unlocked.find(b => b.id === badgeId)
        const rarity = RARITY_CONFIG[badge.rarity]
        const prog = Storage.getBadgeProgress(badge)
        const conditionText = this._badgeConditionText(badge)

        document.getElementById('badge-detail-content').innerHTML = `
            <div class="badge-detail-emoji">${badge.emoji}</div>
            <div class="badge-detail-name" style="color:${rarity.color}">${badge.name}</div>
            <div class="badge-detail-rarity" style="color:${rarity.color}">${rarity.name} ${rarity.stars}</div>
            <div class="badge-detail-desc">${badge.desc}</div>
            <div class="badge-detail-condition">🎯 ${conditionText}</div>
            ${record
                ? `<div class="badge-detail-unlocked">✓ 已于 ${record.unlockedAt} 解锁</div>`
                : `<div class="badge-detail-progress">当前进度：${prog.current} / ${prog.total}</div>`
            }
        `
        document.getElementById('badge-detail-overlay').style.display = 'flex'
    }

    _badgeConditionText(badge) {
        const { type, count } = badge.condition
        if (type === 'words')   return `认识 ${count} 个字`
        if (type === 'perfect') return `测试满分 ${count} 次`
        if (type === 'tests')   return `累计测试 ${count} 次`
        if (type === 'streak')  return `连续学习 ${count} 天`
        if (type === 'cards')   return `累计收集 ${count} 张卡片`
        if (type === 'poems')   return `背诵 ${count} 首古诗词`
        return ''
    }

    showCardDetail(cardId) {
        const card = Storage.getCardData(cardId)
        if (!card) return
        const collected = Storage.getCollectedCard(cardId)
        const rarity = RARITY_CONFIG[card.rarity]
        const hero = HERO_CONFIG[card.hero]

        document.getElementById('card-detail-card').innerHTML =
            this._buildCardDisplay(cardId, card, rarity, hero)

        const typeLabel = card.type === 'skill' ? '技能卡片' : '武器卡片'
        const pool = POEM_CARD_DATA[cardId] ? '诗词卡池' : '识字卡池'
        document.getElementById('card-detail-info').innerHTML = `
            <div class="detail-row"><span>类型</span><span>${typeLabel}</span></div>
            <div class="detail-row"><span>所属</span><span>${hero.name}</span></div>
            <div class="detail-row"><span>稀有度</span><span style="color:${rarity.color}">${rarity.name} ${rarity.stars}</span></div>
            <div class="detail-row"><span>卡池</span><span>${pool}</span></div>
            <div class="detail-row desc-row">${card.desc}</div>
            <div class="detail-row"><span>📅 首次获得</span><span>${collected.firstObtainedAt}</span></div>
            <div class="detail-row"><span>📦 获得次数</span><span>${collected.count} 次</span></div>
        `
        document.getElementById('card-detail-overlay').style.display = 'flex'
    }

    // ========== 诗词渲染 ==========

    renderRecentPoems() {
        const poems = Storage.getRecentPoems(5)
        const container = document.getElementById('recent-poem-list')
        if (!container) return
        if (poems.length === 0) {
            container.innerHTML = '<div class="empty">还没有添加诗词，快去添加吧！</div>'
            return
        }
        container.innerHTML = poems.map(poem => this._buildPoemItem(poem)).join('')
    }

    renderPoemBank(keyword = '') {
        const poems = Storage.searchPoems(keyword)
        const container = document.getElementById('poem-bank-list')
        if (!container) return
        if (poems.length === 0) {
            container.innerHTML = `<div class="empty">${keyword ? '没有找到相关诗词' : '还没有诗词，去训练基地添加吧！'}</div>`
            return
        }
        container.innerHTML = [...poems].reverse().map(poem => this._buildPoemItem(poem, true)).join('')
    }

    _buildPoemItem(poem, showDelete = false) {
        const meta = [poem.dynasty, poem.author].filter(Boolean).join(' · ')
        const actionBtns = showDelete ? `
            <div class="poem-action-btns">
                <button class="poem-action-btn" onclick="event.stopPropagation();app.editPoem('${poem.id}')">✏️ 编辑</button>
                <button class="poem-action-btn poem-action-btn--danger" onclick="event.stopPropagation();app.deletePoem('${poem.id}')">🗑 删除</button>
            </div>` : ''
        return `<div class="poem-item" onclick="app.showPoemDetail('${poem.id}')">
            <div class="poem-item-header">
                <span class="poem-item-title">📜 ${poem.title}</span>
            </div>
            ${meta ? `<div class="poem-item-meta">${meta}</div>` : ''}
            <div class="poem-item-preview">${poem.lines.slice(0, 2).map(l => l.replace(/[，。！？、；：,.!?;:]+$/, '')).join('，')}${poem.lines.length > 2 ? '…' : ''}</div>
            ${actionBtns}
        </div>`
    }

    showPoemDetail(poemId) {
        const poem = Storage.getPoems().find(p => p.id === poemId)
        if (!poem) return
        const meta = [poem.dynasty, poem.author].filter(Boolean).join(' · ')
        document.getElementById('poem-detail-content').innerHTML = `
            <div class="poem-detail-header">
                <div class="poem-detail-title">${poem.title}</div>
                ${meta ? `<div class="poem-detail-meta">${meta}</div>` : ''}
            </div>
            <div class="poem-detail-lines">
                ${poem.lines.map(line => `<div class="poem-detail-line">${line}</div>`).join('')}
            </div>
            <div class="poem-detail-date">录入于 ${poem.addedAt}</div>
            <div class="poem-detail-btns">
                <button class="poem-detail-btn poem-detail-btn--edit" onclick="app.editPoem('${poem.id}')">✏️ 编辑</button>
                <button class="poem-detail-btn poem-detail-btn--close" onclick="document.getElementById('poem-detail-overlay').style.display='none'">关闭</button>
            </div>
        `
        document.getElementById('poem-detail-overlay').style.display = 'flex'
    }

    deletePoem(poemId) {
        const poem = Storage.getPoems().find(p => p.id === poemId)
        if (!poem) return
        if (confirm(`确定删除《${poem.title}》吗？`)) {
            Storage.deletePoem(poemId)
            this.renderPoemBank()
            this.showToast('已删除')
        }
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
        const card = Storage.getCardData(cardId)
        if (!card) return
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

    _buildAvatar(levelKey, size) {
        const LEVEL_ICONS = {
            geed:   { icon: '🌱', color: '#E53E3E' },
            ginga:  { icon: '⭐', color: '#C0C0C0' },
            zero:   { icon: '💥', color: '#2563EB' },
            ace:    { icon: '⚡', color: '#DC2626' },
            father: { icon: '👑', color: '#D97706' },
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

    _buildCardDisplay(cardId, card, rarity, hero) {
        return `<div class="card-display-inner" style="background:${rarity.bg};border-color:${rarity.color};box-shadow:0 0 24px ${rarity.glow}">
            <div class="card-top-label" style="color:${rarity.color}">${rarity.name}</div>
            <div class="card-center-icon" style="color:${hero.color}">${hero.symbol}</div>
            <div class="card-hero-name" style="color:${hero.color}">${hero.name}</div>
            <div class="card-title">${card.name}</div>
            <div class="card-stars" style="color:${rarity.color}">${rarity.stars}</div>
        </div>`
    }

    // ========== 百宝箱 - 汉字 ==========

    renderWordBank(keyword = '') {
        const words = Storage.searchWords(keyword)
        const container = document.getElementById('wordbank-list')
        if (words.length === 0) {
            container.innerHTML = '<div class="empty">字库空空如也，去训练基地添加吧！</div>'
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
        a.download = `豆包学习数据_${new Date().toLocaleDateString('zh-CN')}.json`
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
