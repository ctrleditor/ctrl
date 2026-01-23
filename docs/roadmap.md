# Ctrl Roadmap & Business Model

## Vision

Ctrl is the AI-native terminal editor for developers who want power without compromise. We're building the editor that Vim users wished existed in the AI era—modal editing meets first-class AI integration.

## Go-to-Market Strategy

### Phase 1: Stealth Build (Weeks 1-2)

**Objective:** Prove the concept works

**What We're Building:**
- ✅ Core editor (buffer, modal system, config)
- ✅ Modal editing (normal, insert, visual, command modes)
- ✅ Buffer text editing (insert, delete, navigate)
- ✅ Config-driven UI styling
- ✅ Command palette
- ✅ Syntax highlighting (per-token colored rendering, TypeScript/JavaScript)
- ✅ Configuration-driven syntax colors (11 token types)
- ✅ Gogh theme integration (50+ color schemes, user themes, auto-detection)
- 🔨 AI chat (streaming) (coming this week)
- ❌ LSP integration (Phase 2)
- ❌ Plugin system (Phase 2)

**Success Criteria:**
- ✅ Working prototype
- ✅ Can edit files with cursor, insert, delete
- ✅ Syntax highlighting with colored tokens
- ✅ Gogh themes integrated (user themes, auto-detection, theme switching)
- 🔨 AI chat works reliably (in progress)
- 🔨 Demo-ready (3-min video) (in progress)

**Audience:** None yet (internal only)

**Timeline:** Jan 22 - Feb 5, 2026
**Status:** Core editing + syntax highlighting + theme system complete

---

### Phase 2: Private Alpha (Month 2)

**Objective:** Gather feedback from 50-100 power users

**What We're Adding:**
- ✅ Inline completions
- ✅ Selection-based AI actions (explain, refactor, fix, test, docs)
- ✅ Diagnostic-driven AI fixes
- ✅ Plugin development docs
- ✅ First community plugins

**Success Criteria:**
- 50+ active testers
- 10+ GitHub issues
- 5+ community plugins
- Avg session length > 30 min
- Net Promoter Score (NPS) > 30

**Audience:**
- Neovim power users (r/neovim, HN)
- OpenCode enthusiasts
- Terminal workflow advocates
- AI-curious developers

**Distribution:**
- Invitation via Twitter/X
- Personal outreach
- Show HN post
- Cross-post on r/neovim, r/vim

**Content:**
- Blog: "Why we built AI-native terminal editor"
- Architecture deep dive
- Demo videos (2-3 min)
- Comparison: Ctrl vs Cursor vs Neovim+AI

**Timeline:** Feb 5 - Mar 5, 2026

---

### Phase 3: Public Beta (Months 3-4)

**Objective:** Scale to 1,000+ users, establish plugin ecosystem

**What We're Adding:**
- ✅ Multiple buffers and splits
- ✅ Advanced LSP features (rename, code actions, workspace symbols)
- ✅ Git integration plugin (blame, diff, gutter signs)
- ✅ File tree plugin
- ✅ Fuzzy finder plugin
- ✅ Command palette
- ✅ More language support (Python, Rust, Go)
- ✅ Plugin marketplace foundation
- ✅ Semantic search (AI)
- ✅ Cost tracking & budgets
- ✅ Onboarding flow

**Success Criteria:**
- 1,000+ GitHub stars
- 500+ weekly active users
- 20+ community plugins
- 100+ Discord members
- Featured in newsletters (TLDR, Console, etc.)

**Audience:** Broader developer community

**Launch Strategy:**
1. **Product Hunt** - Aim for #1 Product of the Day
2. **Hacker News** - Show HN + organic discussion
3. **Twitter/X** - Leverage community
4. **Dev.to / Medium** - Technical blog posts
5. **YouTube** - Demo videos and tutorials

**Content Marketing (Weekly):**
- Week 1: Introducing Ctrl: AI-Native Terminal Editing
- Week 2: How Ctrl's Plugin System Works
- Week 3: Building Your First Ctrl Plugin
- Week 4: Ctrl vs Cursor: Why Terminal Wins
- Week 5: The AI Platform Architecture
- Week 6: Migrating from Neovim to Ctrl
- Week 7: User Interview with Power User
- Week 8: Ctrl's Performance Secrets

**Community Building:**
- Discord server launch
- Weekly community calls
- Plugin development contests ($500-1000 prizes)
- Contributor recognition program
- Documentation bounties

**Timeline:** Mar 5 - May 5, 2026

---

### Phase 4: v1.0 Launch (Months 5-6)

**Objective:** Establish as credible Neovim/Cursor alternative

**What We're Adding:**
- ✅ Theme system
- ✅ Complete documentation
- ✅ Performance optimization (< 100ms startup, < 16ms keystroke)
- ✅ Comprehensive testing
- ✅ Hosted sync service (optional)
- ✅ Enterprise features (SSO, audit logs)
- ✅ 50+ plugins in marketplace

**Success Criteria:**
- 10,000+ GitHub stars
- 5,000+ weekly active users
- 50+ plugins in registry
- $5,000+ MRR from services
- Mentioned in "best code editors 2026" articles
- Team of 2-3 people

**Launch Activities:**
- Major version announcement
- Press outreach (TechCrunch, The Verge, etc.)
- Launch Week (new feature daily)
- Livestream coding session
- AMA on Reddit/HN

**Partnerships:**
- Tool integrations (Tailwind, Biome, Prettier)
- Featured in OpenTUI showcase
- Cross-promotion with complementary tools
- Sponsorships from companies

**Monetization Launch:**
- Ctrl Cloud (hosted AI inference at cost)
- Ctrl Sync (settings/plugin sync, $5/month)
- Ctrl Teams (team features, $25/user/month, min 10 users)

**Timeline:** May 5 - Jul 5, 2026

---

## Revenue Model

### 1. Ctrl Cloud (Hosted AI Inference)

**Model:** At-cost pricing (like Anthropic's API but aggregated)

**Value Prop:**
- Best rates through volume
- Multi-provider access (Claude, GPT-4, local models)
- One bill instead of juggling providers

**Pricing:**
```
Claude Sonnet 4:     $X per 1M tokens (vs Anthropic direct)
GPT-4:               $X per 1M tokens (vs OpenAI direct)
Qwen 3 (local):      $0 (self-hosted)
DeepSeek V3:         $X per 1M tokens

Pay-as-you-go, no monthly minimum
Volume discounts automatically applied
```

**Target:** Individuals and small teams

**Margin:** Break-even or minimal (goal is adoption, not profit)

**Year 1 Goal:** 500 users @ avg $2-5/month = $12,000 - $30,000 annual

---

### 2. Ctrl Sync (Settings & Plugin Sync)

**Model:** Freemium SaaS

**Tiers:**
```
Free:      Basic config sync (keybindings, theme)
Pro:       $5/month - Everything + encrypted secrets
Team:      $10/user/month - Shared configs + admin controls
```

**Features:**
- Sync across multiple machines
- Encrypted storage
- Plugin data sync
- Team sharing
- Version history

**Target:** Power users, teams

**Margin:** 70-80% (low infrastructure cost)

**Year 1 Goal:** 200 Pro users @ $5/month = $12,000 annual

---

### 3. Ctrl Teams (Enterprise)

**Model:** Enterprise SaaS

**Pricing:**
```
Enterprise:  $25/user/month (min 10 users)
Includes:    SSO, audit logs, priority support, training
```

**Features:**
- Single sign-on (SAML, OAuth)
- Audit logging (who changed what, when)
- Compliance reports
- Priority support (24h response)
- Custom training

**Target:** Mid-market and enterprise companies

**Margin:** 80%+ (mostly support cost)

**Year 1 Goal:** 2-3 companies @ 50 seats avg = $30,000 - $45,000 annual

---

### 4. Professional Services (Post-v1.0)

**Custom Plugin Development**
- Price: $10k - $50k per plugin
- Target: Large enterprises with specific needs

**Enterprise Training**
- Price: $5k per session
- Target: Teams adopting Ctrl at scale

**Consulting**
- Price: $200-300/hour
- Target: Architecture review, optimization

---

### 5. Sponsorships & Donations

**GitHub Sponsors**
- Open source supporters
- Target: $2k - $5k/month

**Company Sponsorships**
- Logo on website, docs
- Featured in release notes
- Linked in README

---

## Financial Projections

### Year 1 (2026)

**Users:** 10,000 monthly active

**Revenue Breakdown:**
- Ctrl Cloud: 500 users × $3/month avg = $18,000
- Ctrl Sync Pro: 200 users × $5/month = $12,000
- Ctrl Teams: 2 companies × 50 users × $25/month = $30,000
- Sponsorships: $2,000/month = $24,000
- **Total: ~$84,000**

**Costs:**
- Infrastructure: $1,000/month = $12,000
- Hosting/services: $500/month = $6,000
- Solo founder (you): $40,000/year
- **Total: ~$58,000**

**Profit: $26,000** (break-even + healthy margin)

### Year 2 (2027)

**Users:** 50,000 monthly active

**Revenue:**
- Ctrl Cloud: 2,500 × $3 = $90,000
- Ctrl Sync Pro: 1,000 × $5 = $60,000
- Ctrl Teams: 10 companies × 150 users × $25 = $450,000
- Sponsorships: $3,000/month = $36,000
- **Total: ~$636,000**

**Costs:**
- Infrastructure: $5,000/month = $60,000
- Team (1 core dev): $80,000
- Yourself: $100,000
- **Total: ~$240,000**

**Profit: $396,000**

### Year 3 (2028)

**Users:** 200,000 monthly active

**Revenue:**
- Ctrl Cloud: 10,000 × $3 = $360,000
- Ctrl Sync Pro: 5,000 × $5 = $300,000
- Ctrl Teams: 50 companies × 300 users × $25 = $4,500,000
- Professional services: $200,000
- **Total: ~$5,360,000**

**Costs:**
- Infrastructure: $20,000/month = $240,000
- Team (3 people): $300,000
- Yourself: $150,000
- Marketing/ops: $50,000
- **Total: ~$740,000**

**Profit: $4,620,000**

*Note: These are conservative estimates. OpenCode reached 650k MAU in 5 months, suggesting Ctrl could exceed these projections.*

---

## Success Metrics by Phase

### Phase 1 (Prototype)

- ✅ Working demo (edit TypeScript files)
- ✅ AI chat functional
- ✅ Plugin system loads plugins
- ✅ 3-minute demo video

### Phase 2 (Alpha)

- 50+ active testers
- 10+ GitHub issues
- 5+ community plugins
- Avg session > 30 min
- NPS > 30

### Phase 3 (Beta)

- 1,000+ GitHub stars
- 500+ weekly active users
- 20+ community plugins
- 100+ Discord members
- Featured in tech newsletters

### Phase 4 (v1.0)

- 10,000+ GitHub stars
- 5,000+ weekly active users
- 50+ plugins in marketplace
- $5,000+ monthly recurring revenue
- Mentioned in major press

### Year 1

- 10,000+ monthly active users
- $80k+ revenue
- 100+ community plugins
- 500+ Discord members
- Profitability or break-even

---

## Competitive Moats

### 1. OpenTUI Foundation

- Proven framework (used by OpenCode)
- TypeScript + Zig (best of both)
- Active development, backed by Anomaly
- Hard to replicate from scratch

### 2. Plugin Architecture

- TypeScript (lower barrier than Lua/Vimscript)
- Full type safety
- npm distribution (familiar workflow)
- Better DX than competitors

### 3. AI as Platform

- Not bolted on, but foundational
- Multi-provider support
- MCP integration
- Context awareness across editor

### 4. TOML Configuration

- Simpler than Lua, more powerful than JSON
- Validatable, versionable
- AI-friendly
- Hot-reload support

### 5. Community

- Open source (MIT license)
- Plugin ecosystem
- Active Discord
- Transparent roadmap
- User-driven priorities

---

## Risk Mitigation

### Technical Risks

**OpenTUI breaks or abandons project**
- Fork if needed
- Abstract rendering layer
- Maintain upstream relationship

**Performance targets not met**
- Early profiling
- WASM for hot paths
- Aggressive optimization
- Benchmark against Neovim

**AI costs prohibitive**
- Local model support
- Cost tracking + budgets
- User's own API keys
- Ctrl Cloud at-cost pricing

### Market Risks

**No demand for terminal AI editor**
- OpenCode validates demand
- Pivot to related product if needed
- Quick iteration based on feedback

**Cursor/Zed add terminal mode**
- Move fast
- Focus on unique value (plugin ecosystem, TOML, multi-provider)
- Build loyal community

**Neovim AI plugins improve significantly**
- Better plugin DX (TypeScript vs Lua)
- Easier configuration (TOML vs Lua)
- Native AI architecture advantage
- Market differentiation

### Business Risks

**Can't monetize**
- Multiple revenue streams
- Enterprise focus
- Professional services
- Sponsorships

**Solo founder bottleneck**
- Open source contributions
- Hire contractors for specific tasks
- Modo Ventures backing
- Focus on core, plugins extend

---

## Positioning vs Competitors

| Aspect | Ctrl | Cursor | Zed | Neovim+AI | Fresh |
|--------|-----|--------|-----|-----------|-------|
| **Terminal-Native** | ✅ | ❌ (Electron) | ❌ (GUI) | ✅ | ✅ |
| **AI-Native** | ✅ | ✅ | ⚠️ (becoming) | ❌ (plugins) | ❌ |
| **Plugin Ecosystem** | ✅ (TypeScript) | ⚠️ (limited) | ⚠️ (limited) | ✅ (Lua) | ⚠️ (TypeScript, small) |
| **Modal Editing** | ✅ (Vim-like) | ❌ | ❌ | ✅ | ❌ (Vi mode optional) |
| **Multi-Provider AI** | ✅ | ❌ (Anthropic only) | ❌ (Anthropic only) | ⚠️ (plugins) | ❌ (no AI) |
| **TOML Config** | ✅ | ❌ (JSON) | ❌ (TOML) | ❌ (Lua) | ⚠️ (GUI settings) |
| **LSP Support** | 🔨 (planned) | ✅ | ✅ | ✅ (plugins) | ✅ |
| **Handles Large Files** | ✅ (rope) | ✅ | ✅ | ✅ | ✅ (10GB+) |
| **Mouse Support** | ⚠️ (minimal) | ✅ | ✅ | ⚠️ | ✅ |
| **Startup Time** | < 100ms | ~500ms | ~200ms | ~50ms | ~100ms |
| **Open Source** | ✅ (MIT) | ❌ | ✅ (Apache) | ✅ (Neovim core) | ✅ |
| **Learning Curve** | Medium (Vim) | Low | Low | High (Vim) | Very Low |

**Ctrl's Unique Advantage:** The only terminal-native editor that combines **AI-native architecture** (not bolted-on) + **modal editing for power users** + **TypeScript plugins** + **elegant TOML configuration**. Fresh offers great IDE features and accessibility, but lacks AI and modal editing. Neovim + AI plugins are powerful but require juggling separate tools and configuration. Cursor/Zed have better AI but require abandoning the terminal.

---

## Team & Hiring

### Phase 1-2 (Months 1-3)
- **Solo Founder** (You)
  - Product vision
  - Core development
  - Community engagement
  - Backed by Modo Ventures

### Phase 3 (Months 4-6)
- **Core Developer** (Part-time contractor)
  - Plugin system
  - Performance optimization
  - Features

### Phase 4+ (Months 6-12)
- **CTO/Lead Developer** (Full-time)
  - Architecture
  - Technical decisions
- **Developer Advocate** (Full-time)
  - Community
  - Content
  - Partnerships
- **Designer** (Contract)
  - Brand, website, marketing

### Year 1+ (Beyond)
- **Enterprise Sales** (if needed)
- **Customer Support**
- **Product Manager**

---

## What Success Looks Like

**In 6 months (v1.0):**
- Developers choose Ctrl as their daily editor
- Can easily extend it with plugins
- AI feels native, not tacked on
- Thriving Discord community
- Growing plugin ecosystem

**In 1 year:**
- 10,000+ monthly active users
- $80k+ sustainable revenue
- 100+ community plugins
- Profitable or very close
- Mentioned in "best editors 2026" lists

**In 3 years:**
- 200,000+ monthly active users
- $1.8M+ annual revenue
- Market leader in terminal AI editors
- Enterprise customers using Ctrl Teams
- Vibrant plugin ecosystem (500+ plugins)

---

## Next Steps

### This Week
1. ✅ Finalize name and domain (Ctrl / getcap.sh)
2. ✅ Create business plan (this document)
3. Set up GitHub organization
4. Register domain
5. Create basic landing page
6. Begin 2-week prototype sprint

### Week 2 Completion
1. Complete v0.1 prototype
2. Record demo video
3. Write launch blog post
4. Set up Twitter/X account (@ctrleditor)
5. Invite first 10 alpha testers

### Month 2 (Alpha)
1. Iterate based on alpha feedback
2. Build plugin development guides
3. Create documentation site
4. Launch Discord community
5. Start content marketing

### Month 3 (Launch Public Beta)
1. Product Hunt launch
2. Hacker News Show HN
3. Marketing campaign begins
4. First 1,000 users
5. Plugin marketplace foundation

---

**Remember:** We're building the editor that Vim users wished existed in the AI era. Speed, power, and intelligence—without compromise.

The journey starts with a single keystroke.

---

**Document Version:** 1.0
**Last Updated:** January 22, 2026
**Next Review:** After v0.1 prototype completion
